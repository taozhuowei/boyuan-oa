/**
 * Electron API type definitions
 */

export interface ElectronAPI {
  // Runner control
  startRunner: (casesDir: string, baseUrl: string) => Promise<{ success: boolean; error?: string; cdpEndpoint?: string }>
  stopRunner: () => Promise<{ success: boolean }>
  sendControl: (message: any) => Promise<{ success: boolean; error?: string }>

  // Browser control
  navigateBrowser: (url: string) => Promise<void>
  browserBack: () => Promise<void>
  browserForward: () => Promise<void>
  browserReload: () => Promise<void>
  browserNavigate: (url: string) => Promise<void>
  devtoolsToggle: () => Promise<void>

  // Config loading
  loadConfig: (configPath: string) => Promise<{ success: boolean; config?: any; cases?: any[]; error?: string }>

  // File dialogs
  openFileDialog: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
  saveReportDialog: (reportData: string) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>

  // Directory scanning
  scanDir: (path: string) => Promise<TreeNode[]>
  scanCases: (dirPaths: string[]) => Promise<{ id: string; title: string; description: string; module: string; priority: 'P0' | 'P1' | 'P2'; roles?: string[]; tags?: string[]; steps: Array<{ id: number; desc: string; action: string }> }[]>

  // Event listeners
  onRunnerEvent: (callback: (data: any) => void) => void
  onRunnerError: (callback: (data: any) => void) => void
  onRunnerExit: (callback: (data: any) => void) => void
  onBrowserConsole: (callback: (data: any) => void) => void

  // Remove listeners
  removeAllListeners: (channel: string) => void
}

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: TreeNode[]
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
