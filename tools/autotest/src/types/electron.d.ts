import type { BrowserState, ResolvedAutotestConfig, TreeNode } from '../../runner/types'

export interface ElectronAPI {
  startRunner: (project: ResolvedAutotestConfig | string, auto_advance?: boolean) => Promise<{ success: boolean; error?: string; cdpEndpoint?: string }>
  stopRunner: () => Promise<{ success: boolean; error?: string }>
  resetSession: () => Promise<{ success: boolean; project?: ResolvedAutotestConfig; cases?: any[]; error?: string }>
  sendControl: (message: any) => Promise<{ success: boolean; error?: string }>

  browserBack: () => Promise<void>
  browserForward: () => Promise<void>
  browserReload: () => Promise<void>
  browserForceReload: () => Promise<void>
  browserNavigate: (url: string) => Promise<void>
  browserGetState: () => Promise<BrowserState>
  devtoolsToggle: () => Promise<void>

  scanDir: (path?: string) => Promise<{ success: boolean; tree: TreeNode[]; error?: string }>
  searchFileSystem: (query: string) => Promise<{ success: boolean; tree: TreeNode[]; error?: string }>
  selectProject: (path: string) => Promise<{ success: boolean; project?: ResolvedAutotestConfig; cases?: any[]; error?: string }>
  loadConfig: (configPath: string) => Promise<{ success: boolean; config?: ResolvedAutotestConfig; cases?: any[]; error?: string }>

  openFileDialog: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
  saveReportDialog: (report_data: string) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>

  onRunnerEvent: (callback: (data: any) => void) => void
  onRunnerError: (callback: (data: any) => void) => void
  onRunnerExit: (callback: (data: any) => void) => void
  onBrowserConsole: (callback: (data: any) => void) => void
  onBrowserState: (callback: (data: BrowserState) => void) => void

  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
