/**
 * TestEngine - Core Playwright test executor
 *
 * Handles test case loading, step-by-step execution, dual execution modes,
 * IPC event broadcasting, and pause/resume/stop control flow.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { expect } from '@playwright/test';
import { resolve } from './locator.js';
import { ipcServer } from './ipc.js';
import type {
  TestCase,
  TestStep,
  AutotestConfig,
  StepResult,
  CaseResult,
  CaseStatus,
  ControlMessage,
  AssertCheck,
  StepStatus,
} from './types.js';

/**
 * Main test execution engine
 */
export class TestEngine {
  private config: AutotestConfig;
  private browser: Browser | null = null;
  private activePage: Page | null = null;
  private mode: 'case-confirm' | 'full-auto' = 'case-confirm';
  private stepMode: boolean = false;
  private stopRequested: boolean = false;
  private _results: CaseResult[] = [];
  private pauseResolve: (() => void) | null = null;
  private confirmResolveMap: Map<
    string,
    (result: { result: 'pass' | 'fail' | 'skip'; note?: string }) => void
  > = new Map();
  private cdpEndpoint?: string;

  constructor(config: AutotestConfig, cdpEndpoint?: string) {
    this.config = config;
    this.cdpEndpoint = cdpEndpoint;
    console.log('[Engine] Initialized with config:', config.name);
    if (cdpEndpoint) {
      console.log('[Engine] Using CDP endpoint:', cdpEndpoint);
    }
  }

  /**
   * Set the execution mode
   */
  setStepMode(enabled: boolean): void {
    this.stepMode = enabled;
    console.log('[Engine] Step mode:', enabled ? 'ON' : 'OFF');
  }

  setMode(mode: 'case-confirm' | 'full-auto'): void {
    this.mode = mode;
    console.log('[Engine] Mode set to:', mode);
    ipcServer.send({
      type: 'log',
      level: 'info',
      message: `Execution mode changed to: ${mode}`,
    });
  }

  /**
   * Handle control messages from the frontend
   */
  handleControl(msg: ControlMessage): void {
    switch (msg.type) {
      case 'resume':
      case 'next-step':
        if (this.pauseResolve) {
          this.pauseResolve();
          this.pauseResolve = null;
        }
        break;
      case 'stop':
        this.stopRequested = true;
        if (this.pauseResolve) {
          this.pauseResolve();
          this.pauseResolve = null;
        }
        break;
      case 'set-mode':
        this.setMode(msg.mode);
        break;
      case 'confirm':
        // Handle case confirmation
        const resolve = this.confirmResolveMap.get(msg.caseId);
        if (resolve) {
          resolve({ result: msg.result, note: msg.note });
          this.confirmResolveMap.delete(msg.caseId);
        }
        break;
    }
  }

  /**
   * Wait for resume/next-step signal
   */
  private waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      this.pauseResolve = resolve;
    });
  }

  /**
   * Wait for human confirmation of a test case result
   */
  private waitForConfirm(
    caseId: string
  ): Promise<{ result: 'pass' | 'fail' | 'skip'; note?: string }> {
    return new Promise((resolve) => {
      this.confirmResolveMap.set(caseId, resolve);
    });
  }

  /**
   * Launch the browser instance or connect to existing one via CDP
   */
  private async launchBrowser(): Promise<void> {
    if (this.cdpEndpoint) {
      // Connect to existing browser via CDP
      console.log('[Engine] Connecting to browser via CDP:', this.cdpEndpoint);
      try {
        this.browser = await chromium.connectOverCDP(this.cdpEndpoint);
        console.log('[Engine] Connected to browser via CDP');
        
        // Use existing page or create new one
        const contexts = this.browser.contexts();
        if (contexts.length > 0) {
          const pages = contexts[0].pages();
          if (pages.length > 0) {
            this.activePage = pages[0];
            console.log('[Engine] Using existing page');
            return;
          }
        }
        
        // Create new page if none exists
        const context = this.browser.contexts()[0] || await this.browser.newContext();
        this.activePage = await context.newPage();
        console.log('[Engine] Created new page in existing browser');
      } catch (err) {
        console.error('[Engine] Failed to connect via CDP:', err);
        throw err;
      }
    } else {
      // Launch new browser instance
      console.log('[Engine] Launching new browser...');
      this.browser = await chromium.launch({
        headless: false,
        args: [
          '--window-position=0,50',
          '--window-size=960,960',
          '--disable-infobars',
          '--no-default-browser-check',
        ],
      });
      console.log('[Engine] Browser launched');
    }
  }

  /**
   * Execute a single test step
   */
  private async executeStep(
    page: Page,
    step: TestStep,
    caseId: string,
    config: AutotestConfig
  ): Promise<StepResult> {
    const startTime = Date.now();
    const stepTimeout = config.step_timeout ?? 30000;

    // Set default timeout for page operations
    page.setDefaultTimeout(stepTimeout);

    // Send step-start event
    ipcServer.send({
      type: 'step-start',
      caseId,
      stepId: step.id,
      desc: step.desc,
    });

    let screenshot: string | undefined;

    try {
      // Execute the step action
      switch (step.action) {
        case 'navigate':
          await page.goto(config.base_url + step.to, { waitUntil: 'networkidle' });
          break;

        case 'click':
          await resolve(page, step.locator).click();
          break;

        case 'fill':
          await resolve(page, step.locator).fill(step.value);
          break;

        case 'select':
          await resolve(page, step.locator).selectOption(step.value);
          break;

        case 'check':
          await resolve(page, step.locator).check();
          break;

        case 'uncheck':
          await resolve(page, step.locator).uncheck();
          break;

        case 'wait':
          await page.waitForTimeout(step.ms);
          break;

        case 'wait_for':
          await resolve(page, step.locator).waitFor({
            state: 'visible',
            timeout: stepTimeout,
          });
          break;

        case 'screenshot':
          const buf = await page.screenshot();
          screenshot = buf.toString('base64');
          break;

        case 'assert':
          await this.executeAssert(page, step.check);
          break;

        case 'api_call':
          const url = config.base_url + step.endpoint;
          const response = await fetch(url, {
            method: step.method,
            headers: { 'Content-Type': 'application/json' },
            body: step.body ? JSON.stringify(step.body) : undefined,
          });
          // We don't throw on non-OK status, just let it pass
          console.log(`[Engine] API call to ${url}: ${response.status}`);
          break;

        case 'parallel':
          if (!this.browser) {
            throw new Error('Browser not available for parallel execution');
          }
          // Execute parallel contexts
          await Promise.all(
            step.contexts.map(async (contextSteps, idx) => {
              const context = await this.browser!.newContext();
              const ctxPage = await context.newPage();
              try {
                for (const ctxStep of contextSteps) {
                  if (this.stopRequested) break;
                  await this.executeStep(ctxPage, ctxStep, `${caseId}-parallel-${idx}`, config);
                }
              } finally {
                await context.close();
              }
            })
          );
          break;

        case 'rapid':
          for (let i = 0; i < step.repeat; i++) {
            if (this.stopRequested) break;
            await this.executeStep(page, step.step, caseId, config);
            if (i < step.repeat - 1) {
              await page.waitForTimeout(step.interval);
            }
          }
          break;

        default:
          throw new Error(`Unknown step action: ${(step as any).action}`);
      }

      // Take screenshot after step (except for wait action)
      if (step.action !== 'wait' && config.screenshot_on_step !== false && !screenshot) {
        const buf = await page.screenshot();
        screenshot = buf.toString('base64');
      }

      const durationMs = Date.now() - startTime;

      return {
        stepId: step.id,
        status: 'pass' as StepStatus,
        durationMs,
        screenshot,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(`[Engine] Step ${step.id} failed:`, errorMsg);

      // Try to capture screenshot on error
      try {
        const buf = await page.screenshot();
        screenshot = buf.toString('base64');
      } catch {
        // Ignore screenshot errors
      }

      return {
        stepId: step.id,
        status: 'fail' as StepStatus,
        error: errorMsg,
        durationMs,
        screenshot,
      };
    }
  }

  /**
   * Execute an assertion check
   */
  private async executeAssert(page: Page, check: AssertCheck): Promise<void> {
    switch (check.type) {
      case 'url_contains':
        const url = page.url();
        if (!url.includes(check.value)) {
          throw new Error(`Expected URL to contain "${check.value}" but got "${url}"`);
        }
        break;

      case 'url_equals':
        const currentUrl = page.url();
        if (currentUrl !== check.value) {
          throw new Error(`Expected URL "${check.value}" but got "${currentUrl}"`);
        }
        break;

      case 'text_visible':
        await expect(page.getByText(check.value)).toBeVisible();
        break;

      case 'text_absent':
        await expect(page.getByText(check.value)).not.toBeVisible();
        break;

      case 'element_visible':
        await expect(resolve(page, check.locator)).toBeVisible();
        break;

      case 'element_hidden':
        await expect(resolve(page, check.locator)).not.toBeVisible();
        break;

      case 'toast_contains':
        // Wait up to 5s for toast element with matching text
        await page
          .getByText(check.value)
          .waitFor({ state: 'visible', timeout: 5000 });
        break;

      case 'http_status':
        // Not directly testable from page - log warning
        console.warn('[Engine] http_status assertion not supported in page context');
        ipcServer.send({
          type: 'log',
          level: 'warn',
          message: 'http_status assertion skipped - not testable from page context',
        });
        break;

      case 'title_contains':
        const title = await page.title();
        if (!title.includes(check.value)) {
          throw new Error(`Expected title to contain "${check.value}" but got "${title}"`);
        }
        break;

      default:
        throw new Error(`Unknown assertion type: ${(check as any).type}`);
    }
  }

  /**
   * Run all test cases
   */
  async run(cases: TestCase[]): Promise<void> {
    console.log('[Engine] Starting test run with', cases.length, 'cases');

    // Launch browser
    await this.launchBrowser();

    if (!this.browser) {
      throw new Error('Failed to launch browser');
    }

    // Create main context and page only if not using CDP (CDP mode already set activePage)
    if (!this.cdpEndpoint) {
      const context = await this.browser.newContext();
      this.activePage = await context.newPage();
    }

    // Notify frontend about loaded test cases
    ipcServer.send({
      type: 'cases-loaded' as const,
      cases: cases.map(c => ({
        id: c.id,
        title: c.title,
        module: c.module,
        priority: c.priority,
        tags: c.tags,
        steps: c.steps.map(s => ({ id: s.id, desc: s.desc, action: s.action })),
      })),
    });

    this._results = [];
    const results = this._results;

    for (const testCase of cases) {
      if (this.stopRequested) {
        console.log('[Engine] Stop requested, breaking case loop');
        break;
      }

      console.log(`[Engine] Starting case: ${testCase.id} - ${testCase.title}`);

      // Log case start
      ipcServer.send({
        type: 'log',
        level: 'info',
        message: `Starting case: ${testCase.id} - ${testCase.title}`,
      });

      // Initialize case result
      const caseResult: CaseResult = {
        caseId: testCase.id,
        status: 'running',
        steps: [],
        startedAt: Date.now(),
      };

      let hasFailedStep = false;

      // Execute steps sequentially
      for (const step of testCase.steps) {
        if (this.stopRequested) {
          console.log('[Engine] Stop requested during step execution');
          break;
        }

        if (!this.activePage) {
          throw new Error('Active page is not available');
        }

        const stepResult = await this.executeStep(
          this.activePage,
          step,
          testCase.id,
          this.config
        );

        caseResult.steps.push(stepResult);

        // Send step-done event
        ipcServer.send({
          type: 'step-done',
          caseId: testCase.id,
          stepId: step.id,
          status: stepResult.status,
          error: stepResult.error,
          screenshot: stepResult.screenshot,
          durationMs: stepResult.durationMs,
        });

        if (stepResult.status === 'fail') {
          hasFailedStep = true;
          // In case-confirm mode, continue to case-done instead of stopping
          if (this.mode === 'full-auto') {
            console.log(`[Engine] Step failed in full-auto mode, continuing...`);
          }
        }

        // Step mode: pause after every individual step for debugging
        if (this.stepMode && !this.stopRequested) {
          await this.waitForResume();
        }
      }

      caseResult.finishedAt = Date.now();

      // Determine auto status
      const autoStatus: 'pass' | 'fail' = hasFailedStep ? 'fail' : 'pass';
      const needConfirm = this.mode === 'case-confirm';

      // Update case status
      caseResult.status = needConfirm ? 'waiting_confirm' : autoStatus;

      // Send case-done event
      ipcServer.send({
        type: 'case-done',
        caseId: testCase.id,
        autoStatus,
        needConfirm,
      });

      // Wait for human confirmation in case-confirm mode
      if (needConfirm && !this.stopRequested) {
        console.log(`[Engine] Waiting for human confirmation of case ${testCase.id}`);
        const humanVerdict = await this.waitForConfirm(testCase.id);
        caseResult.humanResult = humanVerdict.result;
        caseResult.humanNote = humanVerdict.note;
        caseResult.status = humanVerdict.result;
        console.log(`[Engine] Human verdict for ${testCase.id}: ${humanVerdict.result}`);
      }

      results.push(caseResult);
    }

    // Calculate summary
    const summary = {
      total: results.length,
      pass: results.filter((r) => r.status === 'pass').length,
      fail: results.filter((r) => r.status === 'fail').length,
      skip: results.filter((r) => r.status === 'skip').length,
    };

    console.log('[Engine] Test run complete:', summary);

    // Send all-done event
    ipcServer.send({
      type: 'all-done',
      summary,
    });

    // Close browser
    await this.stop();
  }

  /**
   * Stop the test execution
   */
  /** Expose results for report generation */
  getResults(): CaseResult[] {
    return this._results;
  }

  async stop(): Promise<void> {
    console.log('[Engine] Stopping test execution...');
    this.stopRequested = true;

    if (this.pauseResolve) {
      this.pauseResolve();
      this.pauseResolve = null;
    }

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.activePage = null;
      console.log('[Engine] Browser closed');
    }
  }
}
