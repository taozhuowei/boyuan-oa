import { contextBridge, ipcRenderer } from "electron";
const electronAPI = {
  // Runner 控制
  startRunner: (casesDir, baseUrl) => ipcRenderer.invoke("start-runner", casesDir, baseUrl),
  stopRunner: () => ipcRenderer.invoke("stop-runner"),
  sendControl: (message) => ipcRenderer.invoke("send-control", message),
  // 浏览器控制
  navigateBrowser: (url) => ipcRenderer.invoke("navigate-browser", url),
  browserBack: () => ipcRenderer.invoke("browser-back"),
  browserForward: () => ipcRenderer.invoke("browser-forward"),
  browserReload: () => ipcRenderer.invoke("browser-reload"),
  browserNavigate: (url) => ipcRenderer.invoke("browser-navigate", url),
  // DevTools
  devtoolsToggle: () => ipcRenderer.invoke("devtools-toggle"),
  // 配置加载 + 用例扫描
  loadConfig: (configPath) => ipcRenderer.invoke("load-config", configPath),
  scanDir: (path) => ipcRenderer.invoke("scan-dir", path),
  scanCases: (dirPaths) => ipcRenderer.invoke("scan-cases", dirPaths),
  // 文件对话框
  openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
  saveReportDialog: (reportData) => ipcRenderer.invoke("save-report-dialog", reportData),
  // 事件监听
  onRunnerEvent: (callback) => ipcRenderer.on("runner-event", (_, data) => callback(data)),
  onRunnerError: (callback) => ipcRenderer.on("runner-error", (_, data) => callback(data)),
  onRunnerExit: (callback) => ipcRenderer.on("runner-exit", (_, data) => callback(data)),
  onBrowserConsole: (callback) => ipcRenderer.on("browser-console", (_, data) => callback(data)),
  // 移除监听
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
