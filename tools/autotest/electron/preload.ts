import { contextBridge, ipcRenderer } from 'electron'

const electron_api = {
  startRunner: (project: any, auto_advance?: boolean) => ipcRenderer.invoke('start-runner', project, auto_advance),
  stopRunner: () => ipcRenderer.invoke('stop-runner'),
  resetSession: () => ipcRenderer.invoke('reset-session'),
  sendControl: (message: any) => ipcRenderer.invoke('send-control', message),

  browserBack: () => ipcRenderer.invoke('browser-back'),
  browserForward: () => ipcRenderer.invoke('browser-forward'),
  browserReload: () => ipcRenderer.invoke('browser-reload'),
  browserForceReload: () => ipcRenderer.invoke('browser-force-reload'),
  browserNavigate: (url: string) => ipcRenderer.invoke('browser-navigate', url),
  browserGetState: () => ipcRenderer.invoke('browser-get-state'),
  devtoolsToggle: () => ipcRenderer.invoke('devtools-toggle'),

  scanDir: (path?: string) => ipcRenderer.invoke('scan-dir', path),
  searchFileSystem: (query: string) => ipcRenderer.invoke('search-file-system', query),
  selectProject: (path: string) => ipcRenderer.invoke('select-project', path),
  loadConfig: (configPath: string) => ipcRenderer.invoke('load-config', configPath),

  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveReportDialog: (report_data: string) => ipcRenderer.invoke('save-report-dialog', report_data),

  onRunnerEvent: (callback: (data: any) => void) => ipcRenderer.on('runner-event', (_, data) => callback(data)),
  onRunnerError: (callback: (data: any) => void) => ipcRenderer.on('runner-error', (_, data) => callback(data)),
  onRunnerExit: (callback: (data: any) => void) => ipcRenderer.on('runner-exit', (_, data) => callback(data)),
  onBrowserConsole: (callback: (data: any) => void) => ipcRenderer.on('browser-console', (_, data) => callback(data)),
  onBrowserState: (callback: (data: any) => void) => ipcRenderer.on('browser-state', (_, data) => callback(data)),

  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
}

contextBridge.exposeInMainWorld('electronAPI', electron_api)

declare global {
  interface Window {
    electronAPI: typeof electron_api
  }
}
