import { defineStore } from 'pinia'
import type { RunnerEvent, AutotestConfig } from '../../runner/types.js'
import { useResultsStore } from './results'

export type RunnerMode = 'case-confirm' | 'full-auto'
export type RunnerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface LogEntry {
  level: string
  message: string
  timestamp: number
}

export interface RunnerState {
  config: AutotestConfig | null
  mode: RunnerMode
  status: RunnerStatus
  activeCaseId: string | null
  activeStepId: number | null
  log: LogEntry[]
  ws: WebSocket | null
}

export const useRunnerStore = defineStore('runner', {
  state: (): RunnerState => ({
    config: null,
    mode: 'case-confirm',
    status: 'idle',
    activeCaseId: null,
    activeStepId: null,
    log: [],
    ws: null
  }),

  getters: {
    projectName: (state): string => {
      return state.config?.name ?? ''
    },

    isIdle: (state): boolean => {
      return state.status === 'idle'
    },

    isRunning: (state): boolean => {
      return state.status === 'running'
    },

    isPaused: (state): boolean => {
      return state.status === 'paused'
    },

    currentCaseId: (state): string | null => {
      return state.activeCaseId
    },

    currentStepId: (state): number | null => {
      return state.activeStepId
    }
  },

  actions: {
    setConfig(config: AutotestConfig): void {
      this.config = config
    },

    setStatus(status: RunnerStatus): void {
      this.status = status
    },

    setMode(mode: RunnerMode): void {
      this.mode = mode
    },

    toggleMode(): void {
      this.mode = this.mode === 'case-confirm' ? 'full-auto' : 'case-confirm'
    },

    addLogEntry(level: string, message: string): void {
      const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now()
      }
      this.log.push(entry)
      // Keep max 500 entries
      if (this.log.length > 500) {
        this.log.shift()
      }
    },

    clearLog(): void {
      this.log = []
    },

    stop(): void {
      this.sendControl({ type: 'stop' })
      this.status = 'idle'
    },

    resume(): void {
      this.sendControl({ type: 'resume' })
      this.status = 'running'
    },

    sendControl(msg: object): void {
      // Use Electron IPC if available, fallback to WebSocket
      if (typeof window !== 'undefined' && window.electronAPI) {
        window.electronAPI.sendControl(msg)
      } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(msg))
      } else {
        this.addLogEntry('warn', 'Not connected, control message not sent')
      }
    },

    setupElectronListeners(): void {
      if (typeof window === 'undefined' || !window.electronAPI) return

      window.electronAPI.onRunnerEvent((data: RunnerEvent) => {
        this.handleEvent(data)
      })

      window.electronAPI.onRunnerError((data: any) => {
        this.addLogEntry('error', `Runner error: ${data.error}`)
      })

      window.electronAPI.onRunnerExit((data: any) => {
        this.addLogEntry('info', `Runner exited with code ${data.code}`)
        this.status = 'idle'
      })

      window.electronAPI.onBrowserConsole((data: any) => {
        this.addLogEntry(data.level, `[Browser] ${data.message}`)
      })
    },

    cleanupElectronListeners(): void {
      if (typeof window === 'undefined' || !window.electronAPI) return
      
      window.electronAPI.removeAllListeners('runner-event')
      window.electronAPI.removeAllListeners('runner-error')
      window.electronAPI.removeAllListeners('runner-exit')
      window.electronAPI.removeAllListeners('browser-console')
    },

    handleEvent(event: RunnerEvent): void {
      switch (event.type) {
        case 'step-start':
          this.activeCaseId = event.caseId
          this.activeStepId = event.stepId
          this.status = 'running'
          break

        case 'step-done': {
          this.activeStepId = null
          const resultsStore = useResultsStore()
          resultsStore.updateStepResult(event.caseId, {
            stepId: event.stepId,
            status: event.status,
            error: event.error,
            screenshot: event.screenshot,
            durationMs: event.durationMs,
          })
          break
        }

        case 'case-done': {
          const resultsStore = useResultsStore()
          const autoStatus = event.needConfirm ? 'waiting_confirm' : event.autoStatus
          resultsStore.updateCaseStatus(event.caseId, autoStatus)
          if (event.needConfirm) {
            this.status = 'paused'
          }
          break
        }

        case 'cases-loaded': {
          const resultsStore = useResultsStore()
          // Convert lightweight case data to TestCase format for the results store
          const testCases = event.cases.map((c: any) => ({
            id: c.id,
            title: c.title,
            module: c.module,
            priority: c.priority,
            tags: c.tags || [],
            steps: c.steps || [],
            expect: { result: 'pass' as const },
          }))
          resultsStore.setCases(testCases)
          this.addLogEntry('info', 'Loaded ' + event.cases.length + ' test cases')
          break
        }

        case 'all-done':
          this.status = 'done'
          this.activeCaseId = null
          this.activeStepId = null
          break

        case 'log':
          this.addLogEntry(event.level, event.message)
          break

        default: {
          // Unknown event type - ignore
          break
        }
      }
    }
  }
})
