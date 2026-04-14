import { defineStore } from 'pinia'
import type { BrowserState, ResolvedAutotestConfig, RunnerEvent } from '../../runner/types'
import { useResultsStore } from './results'

export type RunnerMode = 'auto' | 'manual'
export type RunnerStatus = 'idle' | 'preparing' | 'running' | 'waiting_confirm' | 'stopped' | 'done'

export interface LogEntry {
  level: string
  message: string
  timestamp: number
}

export const useRunnerStore = defineStore('runner', {
  state: () => ({
    project: null as ResolvedAutotestConfig | null,
    mode: 'auto' as RunnerMode,
    status: 'idle' as RunnerStatus,
    activeCaseId: null as string | null,
    activeStepId: null as number | null,
    browser: {
      current_url: '',
      title: '',
      can_go_back: false,
      can_go_forward: false,
      is_loading: false,
      devtools_open: true,
    } as BrowserState,
    log: [] as LogEntry[],
    confirmNote: '',
    latestReportPaths: null as null | { json?: string; html?: string; markdown?: string },
  }),

  getters: {
    projectName: (state) => state.project?.name || 'AutoTest',
    configPath: (state) => state.project?.config_path || '',
    projectRoot: (state) => state.project?.project_root || '',
    isRunning: (state) => state.status === 'running' || state.status === 'preparing',
    isWaitingConfirm: (state) => state.status === 'waiting_confirm',
    canStart: (state) => Boolean(state.project) && ['idle', 'stopped', 'done'].includes(state.status),
  },

  actions: {
    setStatus(status: RunnerStatus): void {
      this.status = status
    },

    setMode(mode: RunnerMode): void {
      this.mode = mode
      if (this.project) {
        this.project.execution.auto_advance = mode === 'auto'
      }
      this.sendControl({ type: 'set-mode', mode })
    },

    toggleMode(): void {
      this.setMode(this.mode === 'auto' ? 'manual' : 'auto')
    },

    setConfirmNote(note: string): void {
      this.confirmNote = note
    },

    addLogEntry(level: string, message: string): void {
      this.log.push({
        level,
        message,
        timestamp: Date.now(),
      })
      if (this.log.length > 400) {
        this.log.shift()
      }
    },

    clearLog(): void {
      this.log = []
    },

    async selectProject(dir_path: string): Promise<boolean> {
      if (!window.electronAPI?.selectProject) {
        return false
      }

      this.status = 'preparing'
      this.addLogEntry('info', `Loading project from ${dir_path}`)

      const result = await window.electronAPI.selectProject(dir_path)
      if (!result.success || !result.project || !result.cases) {
        this.addLogEntry('error', result.error || 'Failed to inspect project')
        this.status = 'idle'
        return false
      }

      this.project = result.project
      this.mode = result.project.execution.auto_advance ? 'auto' : 'manual'
      this.latestReportPaths = null

      const results_store = useResultsStore()
      results_store.setCases(result.cases.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        module: item.module,
        priority: item.priority,
        roles: item.roles,
        tags: item.tags || [],
        steps: (item.steps || []) as any,
        expect: { result: 'pass' as const },
      })))

      this.browser = await window.electronAPI.browserGetState()
      this.status = 'idle'
      this.addLogEntry('info', `Loaded ${result.cases.length} cases from ${result.project.name}`)
      return true
    },

    async startOrContinue(): Promise<void> {
      if (!this.project) {
        this.addLogEntry('warn', 'Please select a project first')
        return
      }

      if (this.status === 'waiting_confirm') {
        this.sendControl({ type: 'resume' })
        this.status = 'running'
        return
      }

      if (!window.electronAPI?.startRunner) {
        return
      }

      const result = await window.electronAPI.startRunner(this.project, this.mode === 'auto')
      if (!result.success) {
        this.addLogEntry('error', result.error || 'Failed to start runner')
        return
      }

      this.status = 'running'
      this.latestReportPaths = null
      useResultsStore().clearResults()
      this.addLogEntry('info', 'Runner started')
    },

    async stop(): Promise<void> {
      await window.electronAPI?.stopRunner()
      this.status = 'stopped'
      this.addLogEntry('info', 'Runner stopped')
    },

    async reset(): Promise<void> {
      if (!window.electronAPI?.resetSession) {
        return
      }

      this.status = 'preparing'
      const result = await window.electronAPI.resetSession()
      if (!result.success) {
        this.addLogEntry('error', result.error || 'Reset failed')
        this.status = 'stopped'
        return
      }

      if (result.project) {
        this.project = result.project
      }

      if (result.cases) {
        useResultsStore().setCases(result.cases.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description || '',
          module: item.module,
          priority: item.priority,
          roles: item.roles,
          tags: item.tags || [],
          steps: (item.steps || []) as any,
          expect: { result: 'pass' as const },
        })))
      } else {
        useResultsStore().clearResults()
      }

      this.browser = await window.electronAPI.browserGetState()
      this.latestReportPaths = null
      this.status = 'idle'
      this.addLogEntry('info', 'Session reset')
    },

    confirmSelectedCase(result: 'pass' | 'fail'): void {
      const results_store = useResultsStore()
      const case_id = results_store.selectedCaseId
      if (!case_id) {
        return
      }

      results_store.confirmCase(case_id, result, this.confirmNote || undefined)
      this.sendControl({
        type: 'confirm',
        caseId: case_id,
        result,
        note: this.confirmNote || undefined,
      })
      this.confirmNote = ''
      this.status = this.mode === 'auto' ? 'running' : 'waiting_confirm'
    },

    sendControl(message: any): void {
      void window.electronAPI?.sendControl(message)
    },

    setupElectronListeners(): void {
      if (!window.electronAPI) {
        return
      }

      window.electronAPI.onRunnerEvent((event: RunnerEvent) => {
        this.handleEvent(event)
      })

      window.electronAPI.onRunnerError((data: any) => {
        this.addLogEntry('error', data.error || 'Runner error')
      })

      window.electronAPI.onRunnerExit((data: any) => {
        this.addLogEntry('info', `Runner exited with code ${data.code}`)
      })

      window.electronAPI.onBrowserConsole((data: any) => {
        this.addLogEntry(data.level || 'info', `[browser] ${data.message}`)
      })

      window.electronAPI.onBrowserState((state: BrowserState) => {
        this.browser = state
      })
    },

    cleanupElectronListeners(): void {
      if (!window.electronAPI) {
        return
      }

      window.electronAPI.removeAllListeners('runner-event')
      window.electronAPI.removeAllListeners('runner-error')
      window.electronAPI.removeAllListeners('runner-exit')
      window.electronAPI.removeAllListeners('browser-console')
      window.electronAPI.removeAllListeners('browser-state')
    },

    handleEvent(event: RunnerEvent): void {
      const results_store = useResultsStore()

      switch (event.type) {
        case 'step-start':
          this.activeCaseId = event.caseId
          this.activeStepId = event.stepId
          this.status = 'running'
          results_store.selectCase(event.caseId)
          results_store.updateCaseStatus(event.caseId, 'running')
          break
        case 'step-done':
          results_store.updateStepResult(event.caseId, {
            stepId: event.stepId,
            status: event.status,
            error: event.error,
            errorStack: event.errorStack,
            screenshot: event.screenshot,
            durationMs: event.durationMs,
            pageUrl: event.pageUrl,
            pageTitle: event.pageTitle,
            locator: event.locator,
            consoleTail: event.consoleTail,
            networkTail: event.networkTail,
          })
          this.activeStepId = null
          break
        case 'case-done':
          results_store.updateCaseStatus(event.caseId, 'waiting_confirm', event.autoStatus)
          results_store.selectCase(event.caseId)
          this.status = 'waiting_confirm'
          break
        case 'cases-loaded':
          results_store.setCases(event.cases.map((item) => ({
            id: item.id,
            title: item.title,
            description: item.description || '',
            module: item.module,
            priority: item.priority,
            roles: item.roles,
            tags: item.tags || [],
            steps: (item.steps || []) as any,
            expect: { result: 'pass' as const },
          })))
          break
        case 'all-done':
          this.latestReportPaths = event.reportPaths || null
          this.status = 'done'
          this.activeCaseId = null
          this.activeStepId = null
          if (event.reportPaths?.json) {
            this.addLogEntry('info', `Report written: ${event.reportPaths.json}`)
          }
          break
        case 'log':
          this.addLogEntry(event.level, event.message)
          break
        default:
          break
      }
    },
  },
})
