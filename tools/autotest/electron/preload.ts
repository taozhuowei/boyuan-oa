import { contextBridge, ipcRenderer } from 'electron'

// 暴露给 Vue 的 API
const electronAPI = {
  // Runner 控制
  startRunner: (casesDir: string, baseUrl: string) => 
    ipcRenderer.invoke('start-runner', casesDir, baseUrl),
  stopRunner: () => ipcRenderer.invoke('stop-runner'),
  sendControl: (message: any) => ipcRenderer.invoke('send-control', message),
  
  // 浏览器控制
  navigateBrowser: (url: string) => ipcRenderer.invoke('navigate-browser', url),
  browserBack: () => ipcRenderer.invoke('browser-back'),
  browserForward: () => ipcRenderer.invoke('browser-forward'),
  browserReload: () => ipcRenderer.invoke('browser-reload'),
  browserNavigate: (url: string) => ipcRenderer.invoke('browser-navigate', url),

  // DevTools
  devtoolsToggle: () => ipcRenderer.invoke('devtools-toggle'),
  
  // 配置加载 + 用例扫描
  loadConfig: (configPath: string) => ipcRenderer.invoke('load-config', configPath),
  scanDir: (path: string) => ipcRenderer.invoke('scan-dir', path),
  scanCases: (dirPaths: string[]) => ipcRenderer.invoke('scan-cases', dirPaths),

  // 文件对话框
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveReportDialog: (reportData: string) => ipcRenderer.invoke('save-report-dialog', reportData),
  
  // 事件监听
  onRunnerEvent: (callback: (data: any) => void) => 
    ipcRenderer.on('runner-event', (_, data) => callback(data)),
  onRunnerError: (callback: (data: any) => void) => 
    ipcRenderer.on('runner-error', (_, data) => callback(data)),
  onRunnerExit: (callback: (data: any) => void) => 
    ipcRenderer.on('runner-exit', (_, data) => callback(data)),
  onBrowserConsole: (callback: (data: any) => void) => 
    ipcRenderer.on('browser-console', (_, data) => callback(data)),
  
  // 移除监听
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

declare global {
  interface Window {
    electronAPI: typeof electronAPI
  }
}
