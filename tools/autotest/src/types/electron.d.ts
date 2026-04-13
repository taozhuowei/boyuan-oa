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

  // File dialogs
  openFileDialog: () => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>
  saveReportDialog: (reportData: string) => Promise<{ success: boolean; filePath?: string; cancelled?: boolean; error?: string }>

  // Event listeners
  onRunnerEvent: (callback: (data: any) => void) => void
  onRunnerError: (callback: (data: any) => void) => void
  onRunnerExit: (callback: (data: any) => void) => void
  onBrowserConsole: (callback: (data: any) => void) => void

  // Remove listeners
  removeAllListeners: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
