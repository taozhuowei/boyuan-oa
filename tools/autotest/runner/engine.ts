/**
 * Test engine.
 * Purpose: execute cases in Chromium, pause for human confirmation, and capture rich failure context.
 */

import { mkdirSync } from 'fs'
import { chromium, Browser, Page, Request } from 'playwright'
import { expect } from '@playwright/test'
import { resolve as resolveLocator } from './locator.js'
import { ipcServer } from './ipc.js'
import { writeReports } from './reporter.js'
import type {
  AssertCheck,
  CaseResult,
  ConsoleEntry,
  ControlMessage,
  LocatorDef,
  NetworkRequest,
  ResolvedAutotestConfig,
  RunnerMode,
  StepResult,
  StepStatus,
  TestCase,
  TestStep,
} from './types.js'

function locatorFromStep(step: TestStep): LocatorDef | undefined {
  if ('locator' in step) {
    return step.locator
  }

  if ('check' in step && 'locator' in step.check) {
    return step.check.locator
  }

  return undefined
}

export class TestEngine {
  private readonly config: ResolvedAutotestConfig
  private readonly cdpEndpoint?: string
  private browser: Browser | null = null
  private activePage: Page | null = null
  private mode: RunnerMode = 'auto'
  private stopRequested = false
  private pauseResolve: (() => void) | null = null
  private confirmResolveMap = new Map<string, (result: { result: 'pass' | 'fail' | 'skip'; note?: string }) => void>()
  private readonly consoleEntries: ConsoleEntry[] = []
  private readonly networkEntries: NetworkRequest[] = []
  private readonly requestStartMap = new Map<Request, number>()
  private readonly results: CaseResult[] = []

  constructor(config: ResolvedAutotestConfig, cdpEndpoint?: string) {
    this.config = config
    this.cdpEndpoint = cdpEndpoint
  }

  setMode(mode: RunnerMode): void {
    this.mode = mode
    ipcServer.log('info', `Runner mode set to ${mode}`)
  }

  handleControl(message: ControlMessage): void {
    switch (message.type) {
      case 'resume':
        if (this.pauseResolve) {
          this.pauseResolve()
          this.pauseResolve = null
        }
        break
      case 'stop':
        this.stopRequested = true
        if (this.pauseResolve) {
          this.pauseResolve()
          this.pauseResolve = null
        }
        break
      case 'set-mode':
        this.setMode(message.mode)
        break
      case 'confirm': {
        const resolve = this.confirmResolveMap.get(message.caseId)
        if (resolve) {
          resolve({ result: message.result, note: message.note })
          this.confirmResolveMap.delete(message.caseId)
        }
        break
      }
      default:
        break
    }
  }

  private waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      this.pauseResolve = resolve
    })
  }

  private waitForConfirm(case_id: string): Promise<{ result: 'pass' | 'fail' | 'skip'; note?: string }> {
    return new Promise((resolve) => {
      this.confirmResolveMap.set(case_id, resolve)
    })
  }

  private pushConsoleEntry(entry: ConsoleEntry): void {
    this.consoleEntries.push(entry)
    if (this.consoleEntries.length > 200) {
      this.consoleEntries.shift()
    }
  }

  private pushNetworkEntry(entry: NetworkRequest): void {
    this.networkEntries.push(entry)
    if (this.networkEntries.length > 200) {
      this.networkEntries.shift()
    }
  }

  private getConsoleTail(limit = 20): ConsoleEntry[] {
    return this.consoleEntries.slice(-limit)
  }

  private getNetworkTail(limit = 20): NetworkRequest[] {
    return this.networkEntries.slice(-limit)
  }

  private attachPageObservers(page: Page): void {
    page.on('console', (message) => {
      this.pushConsoleEntry({
        level: message.type(),
        ts: new Date().toISOString(),
        message: message.text(),
      })
    })

    page.on('pageerror', (error) => {
      this.pushConsoleEntry({
        level: 'pageerror',
        ts: new Date().toISOString(),
        message: error.message,
      })
    })

    page.on('request', (request) => {
      this.requestStartMap.set(request, Date.now())
    })

    page.on('requestfinished', async (request) => {
      const started_at = this.requestStartMap.get(request)
      this.requestStartMap.delete(request)
      const response = await request.response()

      this.pushNetworkEntry({
        method: request.method(),
        url: request.url(),
        status: response?.status() ?? null,
        duration_ms: started_at ? Date.now() - started_at : null,
        resource_type: request.resourceType(),
      })
    })

    page.on('requestfailed', (request) => {
      const started_at = this.requestStartMap.get(request)
      this.requestStartMap.delete(request)

      this.pushNetworkEntry({
        method: request.method(),
        url: request.url(),
        status: null,
        duration_ms: started_at ? Date.now() - started_at : null,
        resource_type: request.resourceType(),
      })
    })
  }

  private async launchBrowser(): Promise<void> {
    if (this.cdpEndpoint) {
      this.browser = await chromium.connectOverCDP(this.cdpEndpoint)
      const context = this.browser.contexts()[0] || await this.browser.newContext()
      const pages = context.pages()
      this.activePage = pages[0] || await context.newPage()
      this.attachPageObservers(this.activePage)
      return
    }

    this.browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-infobars',
        '--no-default-browser-check',
      ],
    })

    const context = await this.browser.newContext()
    this.activePage = await context.newPage()
    this.attachPageObservers(this.activePage)
  }

  private async executeAssert(page: Page, check: AssertCheck): Promise<void> {
    switch (check.type) {
      case 'url_contains':
        if (!page.url().includes(check.value)) {
          throw new Error(`Expected URL to contain "${check.value}" but got "${page.url()}"`)
        }
        break
      case 'url_equals':
        if (page.url() !== check.value) {
          throw new Error(`Expected URL "${check.value}" but got "${page.url()}"`)
        }
        break
      case 'text_visible':
        await expect(page.getByText(check.value)).toBeVisible()
        break
      case 'text_absent':
        await expect(page.getByText(check.value)).not.toBeVisible()
        break
      case 'element_visible':
        await expect(resolveLocator(page, check.locator)).toBeVisible()
        break
      case 'element_hidden':
        await expect(resolveLocator(page, check.locator)).not.toBeVisible()
        break
      case 'toast_contains':
        await page.getByText(check.value).waitFor({ state: 'visible', timeout: 5000 })
        break
      case 'http_status':
        ipcServer.log('warn', 'http_status assertion is not supported in page context and was skipped')
        break
      case 'title_contains': {
        const title = await page.title()
        if (!title.includes(check.value)) {
          throw new Error(`Expected title to contain "${check.value}" but got "${title}"`)
        }
        break
      }
      default:
        throw new Error(`Unknown assertion type: ${(check as { type: string }).type}`)
    }
  }

  private async buildStepContext(page: Page, step: TestStep): Promise<Pick<StepResult, 'pageUrl' | 'pageTitle' | 'locator' | 'consoleTail' | 'networkTail'>> {
    let page_title = ''
    try {
      page_title = await page.title()
    } catch {
      page_title = ''
    }

    return {
      pageUrl: page.url(),
      pageTitle: page_title,
      locator: locatorFromStep(step),
      consoleTail: this.getConsoleTail(),
      networkTail: this.getNetworkTail(),
    }
  }

  private async executeStep(page: Page, step: TestStep, case_id: string): Promise<StepResult> {
    const started_at = Date.now()
    page.setDefaultTimeout(this.config.execution.step_timeout)

    ipcServer.send({
      type: 'step-start',
      caseId: case_id,
      stepId: step.id,
      desc: step.desc,
    })

    let screenshot: string | undefined

    try {
      switch (step.action) {
        case 'navigate':
          await page.goto(new URL(step.to, this.config.preview.base_url).toString(), {
            waitUntil: 'networkidle',
          })
          break
        case 'click':
          await resolveLocator(page, step.locator).click()
          break
        case 'fill':
          await resolveLocator(page, step.locator).fill(step.value)
          break
        case 'select':
          await resolveLocator(page, step.locator).selectOption(step.value)
          break
        case 'check':
          await resolveLocator(page, step.locator).check()
          break
        case 'uncheck':
          await resolveLocator(page, step.locator).uncheck()
          break
        case 'wait':
          await page.waitForTimeout(step.ms)
          break
        case 'wait_for':
          await resolveLocator(page, step.locator).waitFor({ state: 'visible' })
          break
        case 'assert':
          await this.executeAssert(page, step.check)
          break
        case 'screenshot': {
          const buffer = await page.screenshot()
          screenshot = buffer.toString('base64')
          break
        }
        case 'upload':
          await resolveLocator(page, step.locator).setInputFiles(step.value)
          break
        case 'api_call': {
          const response = await fetch(new URL(step.endpoint, this.config.preview.base_url), {
            method: step.method,
            headers: { 'Content-Type': 'application/json' },
            body: step.body ? JSON.stringify(step.body) : undefined,
          })
          ipcServer.log('info', `API ${step.method} ${step.endpoint} -> ${response.status}`)
          break
        }
        case 'parallel':
          if (!this.browser) {
            throw new Error('Parallel step requires an active browser')
          }
          await Promise.all(
            step.contexts.map(async (context_steps, index) => {
              const context = await this.browser!.newContext()
              const parallel_page = await context.newPage()
              this.attachPageObservers(parallel_page)
              try {
                for (const child_step of context_steps) {
                  if (this.stopRequested) {
                    break
                  }
                  await this.executeStep(parallel_page, child_step, `${case_id}-parallel-${index}`)
                }
              } finally {
                await context.close()
              }
            })
          )
          break
        case 'rapid':
          for (let repeat_index = 0; repeat_index < step.repeat; repeat_index += 1) {
            if (this.stopRequested) {
              break
            }
            await this.executeStep(page, step.step, case_id)
            if (repeat_index < step.repeat - 1) {
              await page.waitForTimeout(step.interval)
            }
          }
          break
        default:
          throw new Error(`Unknown step action: ${(step as { action: string }).action}`)
      }

      if (!screenshot && step.action !== 'wait' && this.config.execution.screenshot_on_step) {
        screenshot = (await page.screenshot()).toString('base64')
      }

      return {
        stepId: step.id,
        status: 'pass',
        durationMs: Date.now() - started_at,
        screenshot,
        ...(await this.buildStepContext(page, step)),
      }
    } catch (error) {
      try {
        screenshot = (await page.screenshot()).toString('base64')
      } catch {
        screenshot = undefined
      }

      const error_message = error instanceof Error ? error.message : String(error)
      const error_stack = error instanceof Error ? error.stack : undefined

      return {
        stepId: step.id,
        status: 'fail',
        error: error_message,
        errorStack: error_stack,
        durationMs: Date.now() - started_at,
        screenshot,
        ...(await this.buildStepContext(page, step)),
      }
    }
  }

  async run(cases: TestCase[]): Promise<void> {
    mkdirSync(this.config.report.output_dir, { recursive: true })
    await this.launchBrowser()

    if (!this.activePage) {
      throw new Error('Active page is not available')
    }

    ipcServer.send({
      type: 'cases-loaded',
      cases: cases.map((test_case) => ({
        id: test_case.id,
        title: test_case.title,
        description: test_case.description,
        module: test_case.module,
        priority: test_case.priority,
        roles: test_case.roles,
        tags: test_case.tags,
        steps: test_case.steps.map((step) => ({
          id: step.id,
          desc: step.desc,
          action: step.action,
        })),
      })),
    })

    this.results.length = 0

    for (const test_case of cases) {
      if (this.stopRequested) {
        break
      }

      ipcServer.log('info', `Running ${test_case.id} ${test_case.title}`)

      const case_result: CaseResult = {
        caseId: test_case.id,
        status: 'running',
        steps: [],
        startedAt: Date.now(),
      }

      let has_failed_step = false

      for (const step of test_case.steps) {
        if (this.stopRequested) {
          break
        }

        const step_result = await this.executeStep(this.activePage, step, test_case.id)
        case_result.steps.push(step_result)

        ipcServer.send({
          type: 'step-done',
          caseId: test_case.id,
          stepId: step.id,
          status: step_result.status,
          error: step_result.error,
          errorStack: step_result.errorStack,
          screenshot: step_result.screenshot,
          durationMs: step_result.durationMs,
          pageUrl: step_result.pageUrl,
          pageTitle: step_result.pageTitle,
          locator: step_result.locator,
          consoleTail: step_result.consoleTail,
          networkTail: step_result.networkTail,
        })

        if (step_result.status === 'fail') {
          has_failed_step = true
        }
      }

      case_result.autoStatus = has_failed_step ? 'fail' : 'pass'
      case_result.status = 'waiting_confirm'
      case_result.finishedAt = Date.now()

      ipcServer.send({
        type: 'case-done',
        caseId: test_case.id,
        autoStatus: case_result.autoStatus,
        needConfirm: true,
      })

      if (!this.stopRequested) {
        const human_verdict = await this.waitForConfirm(test_case.id)
        case_result.humanResult = human_verdict.result
        case_result.humanNote = human_verdict.note
        case_result.status = human_verdict.result

        if (this.mode === 'manual' && !this.stopRequested) {
          await this.waitForResume()
        }
      }

      this.results.push(case_result)
    }

    const summary = {
      total: this.results.length,
      pass: this.results.filter((result) => (result.humanResult ?? result.status) === 'pass').length,
      fail: this.results.filter((result) => (result.humanResult ?? result.status) === 'fail').length,
      skip: this.results.filter((result) => (result.humanResult ?? result.status) === 'skip').length,
    }

    const report_paths = writeReports({
      config: this.config,
      cases,
      results: this.results,
    })

    ipcServer.send({
      type: 'all-done',
      summary,
      reportPaths: report_paths,
    })

    await this.stop()
  }

  getResults(): CaseResult[] {
    return this.results
  }

  async stop(): Promise<void> {
    this.stopRequested = true

    if (this.pauseResolve) {
      this.pauseResolve()
      this.pauseResolve = null
    }

    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.activePage = null
    }
  }
}
