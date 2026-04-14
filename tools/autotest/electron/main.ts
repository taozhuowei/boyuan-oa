import { app, BrowserWindow, ipcMain, WebContentsView, dialog, screen, Menu } from 'electron'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { fork } from 'child_process'
import fs from 'fs'
import { createElectronIPC, ipcServer } from '../runner/ipc.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null
let browserView: WebContentsView | null = null
let runnerProcess: any = null
let cdpPort: number = 9222

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay()
  mainWindow = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindow.setMenuBarVisibility(false)

  // 创建 BrowserView 用于显示被测页面
  browserView = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // 启用远程调试 (CDP)
  browserView.webContents.debugger.attach('1.3')

  // 打开 DevTools（嵌入底部）
  browserView.webContents.openDevTools({ mode: 'bottom' })

  if (mainWindow) {
    mainWindow.contentView.addChildView(browserView)
    
    // 设置布局：浏览器视图占中间栏
    const bounds = mainWindow.getBounds()
    updateLayout(bounds.width, bounds.height)

    // 窗口大小变化时更新布局
    mainWindow.on('resize', () => {
      if (mainWindow) {
        const [width, height] = mainWindow.getSize()
        updateLayout(width, height)
      }
    })

    // 加载 Vue UI
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
      mainWindow.webContents.openDevTools()
    } else {
      mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }
  }
}

function updateLayout(width: number, height: number) {
  if (!browserView || !mainWindow) return

  // TopBar 40 + BrowserToolbar 40 = 80 留给 Vue UI
  const topOffset = 80
  const leftCol = 260
  const rightCol = 320

  browserView.setBounds({
    x: leftCol,
    y: topOffset,
    width: width - leftCol - rightCol,
    height: height - topOffset,
  })

  mainWindow.webContents.executeJavaScript(`
    document.documentElement.style.setProperty('--browser-width', '${width - leftCol - rightCol}px')
  `)
}

// 递归扫描目录，仅包含 .ts 文件和目录
function scanDir(dirPath: string): any[] {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const result: any[] = []
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          path: fullPath,
          type: 'dir',
          children: scanDir(fullPath)
        })
      } else if (entry.isFile() && entry.name.endsWith('.ts')) {
        result.push({
          name: entry.name,
          path: fullPath,
          type: 'file'
        })
      }
    }
    return result.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name)
      return a.type === 'dir' ? -1 : 1
    })
  } catch {
    return []
  }
}

// IPC 通信
ipcMain.handle('scan-dir', async (_, dirPath: string) => {
  try {
    const tree = scanDir(dirPath)
    return { success: true, tree }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('scan-cases', async (_, dirPaths: string[]) => {
  try {
    const runnerPath = join(__dirname, '../runner/index.ts')
    const allCases: any[] = []
    for (const casesDir of dirPaths) {
      const cases = await new Promise<any[]>((resolveP, rejectP) => {
        const child = fork(runnerPath, ['--scan-only', '--cases-dir', casesDir], {
          execArgv: ['--import', 'tsx'],
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        })
        const timer = setTimeout(() => {
          child.kill('SIGTERM')
          rejectP(new Error('Scan timeout'))
        }, 30000)
        child.on('message', (msg: any) => {
          if (msg?.type === 'cases-scanned') {
            clearTimeout(timer)
            resolveP(msg.cases)
            child.kill()
          } else if (msg?.type === 'cases-scan-error') {
            clearTimeout(timer)
            rejectP(new Error(msg.error))
            child.kill()
          }
        })
        child.on('error', (e) => { clearTimeout(timer); rejectP(e) })
      })
      allCases.push(...cases)
    }
    return { success: true, cases: allCases }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('browser-back', async () => {
  if (browserView) {
    browserView.webContents.goBack()
  }
})

ipcMain.handle('browser-forward', async () => {
  if (browserView) {
    browserView.webContents.goForward()
  }
})

ipcMain.handle('browser-reload', async () => {
  if (browserView) {
    browserView.webContents.reload()
  }
})

ipcMain.handle('browser-navigate', async (_, url: string) => {
  if (browserView) {
    await browserView.webContents.loadURL(url)
  }
})

ipcMain.handle('devtools-toggle', async () => {
  if (!browserView) return
  if (browserView.webContents.isDevToolsOpened()) {
    browserView.webContents.closeDevTools()
  } else {
    browserView.webContents.openDevTools({ mode: 'bottom' })
  }
})

ipcMain.handle('start-runner', async (_, casesDir: string, baseUrl: string) => {
  try {
    if (runnerProcess) {
      stopRunnerProcess()
    }

    // 获取 BrowserView 的调试 WebSocket 端点
    if (!browserView) {
      return { success: false, error: 'BrowserView not initialized' }
    }

    const debuggerInfo = browserView.webContents.debugger
    // 获取或创建调试端口
    const port = await new Promise<number>((resolve) => {
      browserView!.webContents.debugger.sendCommand('Runtime.evaluate', {
        expression: 'window.location.href'
      }).catch(() => {})
      
      // Electron 调试器默认使用环境变量的端口
      // 我们用一个固定的 WebSocket endpoint
      setTimeout(() => resolve(cdpPort), 100)
    })

    const cdpEndpoint = `ws://127.0.0.1:${port}/devtools/page/${browserView.webContents.id}`
    
    // 启动 runner 进程
    const configPath = join(casesDir, '..', 'autotest.config.json')
    startRunnerProcess(casesDir, configPath, cdpEndpoint)

    return { success: true, cdpEndpoint }
  } catch (err) {
    console.error('[start-runner error]', err)
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('stop-runner', async () => {
  stopRunnerProcess()
  return { success: true }
})

ipcMain.handle('navigate-browser', async (_, url: string) => {
  if (browserView) {
    await browserView.webContents.loadURL(url)
  }
})

// 加载配置并扫描用例
ipcMain.handle('load-config', async (_, configPath: string) => {
  try {
    const configText = fs.readFileSync(configPath, 'utf-8')
    const config = JSON.parse(configText)
    const casesDir = join(dirname(configPath), config.cases_dir || './cases')

    const runnerPath = join(__dirname, '../runner/index.ts')
    const cases = await new Promise<any[]>((resolveP, rejectP) => {
      const child = fork(runnerPath, ['--scan-only', '--cases-dir', casesDir], {
        execArgv: ['--import', 'tsx'],
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      })
      const timer = setTimeout(() => {
        child.kill('SIGTERM')
        rejectP(new Error('Scan timeout'))
      }, 30000)
      child.on('message', (msg: any) => {
        if (msg?.type === 'cases-scanned') {
          clearTimeout(timer)
          resolveP(msg.cases)
          child.kill()
        } else if (msg?.type === 'cases-scan-error') {
          clearTimeout(timer)
          rejectP(new Error(msg.error))
          child.kill()
        }
      })
      child.on('error', (e) => { clearTimeout(timer); rejectP(e) })
    })

    return { success: true, config: { ...config, _configPath: configPath, _casesDir: casesDir }, cases }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// 文件选择对话框
ipcMain.handle('open-file-dialog', async () => {
  if (!mainWindow) return { success: false, error: 'Main window not available' }
  
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Config Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  })
  
  if (filePaths && filePaths.length > 0) {
    return { success: true, filePath: filePaths[0] }
  }
  return { success: false, cancelled: true }
})

// 保存报告对话框
ipcMain.handle('save-report-dialog', async (_, reportData: string) => {
  if (!mainWindow) return { success: false, error: 'Main window not available' }
  
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'report.html',
    filters: [
      { name: 'HTML Report', extensions: ['html'] },
      { name: 'JSON Report', extensions: ['json'] }
    ]
  })
  
  if (filePath) {
    try {
      fs.writeFileSync(filePath, reportData)
      return { success: true, filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
  return { success: false, cancelled: true }
})

// 转发控制消息到 runner
ipcMain.handle('send-control', async (_, message: any) => {
  if (runnerProcess) {
    runnerProcess.send({ type: 'control', data: message })
    return { success: true }
  }
  return { success: false, error: 'Runner not running' }
})

// 转发 console 日志到 Vue UI
function setupConsoleForwarding() {
  if (!browserView) return
  
  browserView.webContents.on('console-message', (_, level, message) => {
    if (mainWindow) {
      mainWindow.webContents.send('browser-console', {
        level: ['verbose', 'info', 'warning', 'error'][level] || 'log',
        message,
        timestamp: Date.now()
      })
    }
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  setupConsoleForwarding()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 从 runner 进程接收消息并转发到 Vue
export function forwardToUI(channel: string, data: any) {
  if (mainWindow) {
    mainWindow.webContents.send(channel, data)
  }
}

// 启动 runner 子进程
function startRunnerProcess(casesDir: string, configPath: string, cdpEndpoint: string) {
  const runnerPath = join(__dirname, '../runner/index.ts')
  
  runnerProcess = fork(runnerPath, [
    '--cases-dir', casesDir,
    '--config', configPath,
    '--cdp-endpoint', cdpEndpoint,
    '--mode', 'case-confirm'
  ], {
    execArgv: ['--loader', 'tsx/esm'],
    stdio: ['pipe', 'pipe', 'pipe', 'ipc']
  })

  // 转发 runner 消息到 UI
  runnerProcess.on('message', (msg: any) => {
    if (msg.type === 'runner-event') {
      forwardToUI('runner-event', msg.data)
    }
  })

  runnerProcess.on('error', (err: Error) => {
    console.error('[Runner Process Error]', err)
    forwardToUI('runner-error', { error: err.message })
  })

  runnerProcess.on('exit', (code: number) => {
    console.log(`[Runner Process] Exited with code ${code}`)
    forwardToUI('runner-exit', { code })
    runnerProcess = null
  })
}

// 停止 runner 进程
function stopRunnerProcess() {
  if (runnerProcess) {
    runnerProcess.send({ type: 'control', data: { type: 'stop' } })
    setTimeout(() => {
      if (runnerProcess) {
        runnerProcess.kill('SIGTERM')
      }
    }, 5000)
  }
}

export { browserView, mainWindow }
