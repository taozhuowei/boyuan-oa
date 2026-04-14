import { app, BrowserWindow, Menu, WebContentsView, dialog, ipcMain, screen } from 'electron'
import { fork, spawn, type ChildProcess } from 'child_process'
import { dirname, join, resolve as resolvePath } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import net from 'net'
import { createElectronIPC } from '../runner/ipc.js'
import { DEFAULT_CONFIG_FILENAMES, normalizeAutotestConfig } from '../runner/config.js'
import type {
  AutotestConfig,
  BrowserState,
  ResolvedAutotestConfig,
  ResolvedLaunchCommand,
  TreeNode,
} from '../runner/types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const tsx_loader_path = resolvePath(__dirname, '../node_modules/tsx/dist/loader.mjs')

const remote_debugging_port = 9222
const top_bar_height = 44
const browser_toolbar_height = 48
const left_column_width = 320
const right_column_width = 380
const root_system_dirs = new Set([
  'bin',
  'boot',
  'dev',
  'etc',
  'lib',
  'lib64',
  'proc',
  'run',
  'sbin',
  'snap',
  'sys',
  'usr',
  'var',
])

app.commandLine.appendSwitch('remote-debugging-port', String(remote_debugging_port))

let main_window: BrowserWindow | null = null
let browser_view: WebContentsView | null = null
let runner_process: ChildProcess | null = null
let active_project: ResolvedAutotestConfig | null = null
const project_processes = new Map<string, ChildProcess>()

function sendRunnerEvent(event: any): void {
  if (main_window && !main_window.isDestroyed()) {
    main_window.webContents.send('runner-event', event)
  }
}

function sendRunnerLog(level: 'info' | 'warn' | 'error', message: string): void {
  sendRunnerEvent({
    type: 'log',
    level,
    message,
  })
}

function isHiddenName(name: string): boolean {
  return name.startsWith('.')
}

function isSystemRootChild(parent_path: string, name: string): boolean {
  return parent_path === '/' && root_system_dirs.has(name)
}

function shouldIncludeEntry(parent_path: string, name: string): boolean {
  if (isHiddenName(name)) {
    return false
  }

  if (isSystemRootChild(parent_path, name)) {
    return false
  }

  return true
}

function getVisibleChildCount(dir_path: string): number {
  try {
    const entries = fs.readdirSync(dir_path, { withFileTypes: true })
    return entries.filter((entry) => shouldIncludeEntry(dir_path, entry.name)).length
  } catch {
    return 0
  }
}

function scanVisibleDir(dir_path: string): TreeNode[] {
  try {
    const entries = fs.readdirSync(dir_path, { withFileTypes: true })
    return entries
      .filter((entry) => shouldIncludeEntry(dir_path, entry.name))
      .map((entry) => {
        const full_path = join(dir_path, entry.name)
        if (entry.isDirectory()) {
          return {
            name: entry.name,
            path: full_path,
            type: 'dir' as const,
            has_children: getVisibleChildCount(full_path) > 0,
          }
        }

        return {
          name: entry.name,
          path: full_path,
          type: 'file' as const,
          has_children: false,
        }
      })
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === 'dir' ? -1 : 1
        }
        return left.name.localeCompare(right.name)
      })
  } catch {
    return []
  }
}

function insertSearchPath(root: Map<string, any>, full_path: string): void {
  const segments = full_path.split('/').filter(Boolean)
  let current_map = root
  let current_path = ''

  for (const segment of segments) {
    current_path = `${current_path}/${segment}`
    if (!current_map.has(segment)) {
      current_map.set(segment, {
        name: segment,
        path: current_path,
        type: 'dir',
        children_map: new Map<string, any>(),
      })
    }
    current_map = current_map.get(segment).children_map
  }
}

function mapTreeToNodes(tree: Map<string, any>): TreeNode[] {
  return Array.from(tree.values())
    .map((node) => ({
      name: node.name,
      path: node.path,
      type: node.type,
      has_children: node.children_map.size > 0,
      children: mapTreeToNodes(node.children_map),
    }))
    .sort((left, right) => left.name.localeCompare(right.name))
}

function searchFileSystemByName(query: string, dir_path = '/', depth = 0, results: string[] = []): string[] {
  if (!query.trim() || results.length >= 200 || depth > 10) {
    return results
  }

  let entries: fs.Dirent[] = []
  try {
    entries = fs.readdirSync(dir_path, { withFileTypes: true })
  } catch {
    return results
  }

  for (const entry of entries) {
    if (results.length >= 200) {
      break
    }

    if (!shouldIncludeEntry(dir_path, entry.name)) {
      continue
    }

    const full_path = join(dir_path, entry.name)
    if (entry.name.toLowerCase().includes(query.toLowerCase())) {
      results.push(full_path)
    }

    if (entry.isDirectory()) {
      searchFileSystemByName(query, full_path, depth + 1, results)
    }
  }

  return results
}

function buildSearchTree(query: string): TreeNode[] {
  const matches = searchFileSystemByName(query)
  const root = new Map<string, any>()

  for (const match of matches) {
    insertSearchPath(root, match)
  }

  return mapTreeToNodes(root)
}

async function findConfigFile(dir_path: string, depth = 0): Promise<string | null> {
  if (depth > 6) {
    return null
  }

  for (const filename of DEFAULT_CONFIG_FILENAMES) {
    const candidate = join(dir_path, filename)
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  const common_candidates = [
    join(dir_path, 'test', 'autotest', 'autotest.config.json'),
    join(dir_path, 'tests', 'autotest', 'autotest.config.json'),
    join(dir_path, '.autotest', 'autotest.config.json'),
  ]

  for (const candidate of common_candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  try {
    const entries = fs.readdirSync(dir_path, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory() || !shouldIncludeEntry(dir_path, entry.name)) {
        continue
      }
      const nested = await findConfigFile(join(dir_path, entry.name), depth + 1)
      if (nested) {
        return nested
      }
    }
  } catch {
    return null
  }

  return null
}

function detectPackageManager(project_root: string): 'pnpm' | 'yarn' | 'npm' {
  if (fs.existsSync(join(project_root, 'pnpm-lock.yaml'))) {
    return 'pnpm'
  }
  if (fs.existsSync(join(project_root, 'yarn.lock'))) {
    return 'yarn'
  }
  return 'npm'
}

function buildScriptCommand(package_manager: 'pnpm' | 'yarn' | 'npm', script_name: string): string {
  if (package_manager === 'yarn') {
    return `yarn ${script_name}`
  }

  return `${package_manager} run ${script_name}`
}

function parsePackageScripts(project_root: string): Record<string, string> {
  const package_path = join(project_root, 'package.json')
  if (!fs.existsSync(package_path)) {
    return {}
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(package_path, 'utf-8'))
    return pkg.scripts || {}
  } catch {
    return {}
  }
}

function withDetectedLaunchCommands(project: ResolvedAutotestConfig): ResolvedAutotestConfig {
  if (project.launch.commands.length > 0) {
    return project
  }

  const scripts = parsePackageScripts(project.project_root)
  const package_manager = detectPackageManager(project.project_root)
  const detected_commands: ResolvedLaunchCommand[] = []

  if (scripts['dev:backend']) {
    detected_commands.push({
      name: 'backend',
      command: buildScriptCommand(package_manager, 'dev:backend'),
      cwd: project.project_root,
      ready: {
        type: 'tcp',
        port: 8080,
        timeout_ms: 120000,
        interval_ms: 1000,
      },
      env: {},
    })
  }

  const frontend_script = ['dev:h5', 'dev:web', 'dev:frontend', 'preview', 'dev']
    .find((script_name) => Boolean(scripts[script_name]))

  if (frontend_script) {
    detected_commands.push({
      name: frontend_script.includes('preview') ? 'preview' : 'frontend',
      command: buildScriptCommand(package_manager, frontend_script),
      cwd: project.project_root,
      ready: {
        type: 'http',
        url: project.preview.healthcheck_url,
        timeout_ms: 120000,
        interval_ms: 1000,
      },
      env: {},
    })
  }

  return {
    ...project,
    launch: {
      commands: detected_commands,
      detection_source: detected_commands.length ? 'auto-detect' : 'manual',
    },
  }
}

function createWindow(): void {
  const { workArea } = screen.getPrimaryDisplay()
  main_window = new BrowserWindow({
    x: workArea.x,
    y: workArea.y,
    width: workArea.width,
    height: workArea.height,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  main_window.setMenuBarVisibility(false)

  browser_view = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (main_window) {
    main_window.contentView.addChildView(browser_view)
    updateLayout()
    main_window.on('resize', updateLayout)

    if (process.env.VITE_DEV_SERVER_URL) {
      void main_window.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
      void main_window.loadFile(join(__dirname, '../dist/index.html'))
    }
  }

  browser_view.webContents.openDevTools({ mode: 'bottom' })
  attachBrowserListeners()
  void browser_view.webContents.loadURL('about:blank')
}

function updateLayout(): void {
  if (!browser_view || !main_window) {
    return
  }

  const [window_width, window_height] = main_window.getSize()
  browser_view.setBounds({
    x: left_column_width,
    y: top_bar_height + browser_toolbar_height,
    width: window_width - left_column_width - right_column_width,
    height: window_height - top_bar_height - browser_toolbar_height,
  })
}

function collectBrowserState(): BrowserState {
  const contents = browser_view?.webContents
  return {
    current_url: contents?.getURL() || '',
    title: contents?.getTitle() || '',
    can_go_back: contents?.navigationHistory.canGoBack() || false,
    can_go_forward: contents?.navigationHistory.canGoForward() || false,
    is_loading: contents?.isLoading() || false,
    devtools_open: contents?.isDevToolsOpened() || false,
  }
}

function emitBrowserState(): void {
  if (main_window && !main_window.isDestroyed()) {
    main_window.webContents.send('browser-state', collectBrowserState())
  }
}

function attachBrowserListeners(): void {
  if (!browser_view) {
    return
  }

  browser_view.webContents.on('did-navigate', emitBrowserState)
  browser_view.webContents.on('did-navigate-in-page', emitBrowserState)
  browser_view.webContents.on('did-start-loading', emitBrowserState)
  browser_view.webContents.on('did-stop-loading', emitBrowserState)
  browser_view.webContents.on('page-title-updated', (event) => {
    event.preventDefault()
    emitBrowserState()
  })
  browser_view.webContents.on('console-message', (_, level, message) => {
    if (main_window && !main_window.isDestroyed()) {
      main_window.webContents.send('browser-console', {
        level: ['verbose', 'info', 'warning', 'error'][level] || 'info',
        message,
        timestamp: Date.now(),
      })
    }
  })
}

async function fetchBrowserWSEndpoint(): Promise<string> {
  const response = await fetch(`http://127.0.0.1:${remote_debugging_port}/json/version`)
  const data = await response.json() as { webSocketDebuggerUrl: string }
  return data.webSocketDebuggerUrl
}

function isPortReachable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
    socket.setTimeout(700, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function isReadyCheckSatisfied(command: ResolvedLaunchCommand): Promise<boolean> {
  if (!command.ready) {
    return false
  }

  if (command.ready.type === 'tcp' && command.ready.port) {
    return isPortReachable(command.ready.port)
  }

  if (command.ready.type === 'http' && command.ready.url) {
    try {
      const response = await fetch(command.ready.url)
      return response.ok || response.status < 500
    } catch {
      return false
    }
  }

  return false
}

async function waitForReady(command: ResolvedLaunchCommand): Promise<void> {
  if (!command.ready) {
    await new Promise((resolve) => setTimeout(resolve, 1500))
    return
  }

  const timeout_ms = command.ready.timeout_ms ?? 120000
  const interval_ms = command.ready.interval_ms ?? 1000
  const started_at = Date.now()

  while (Date.now() - started_at < timeout_ms) {
    if (await isReadyCheckSatisfied(command)) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, interval_ms))
  }

  throw new Error(`Service ${command.name} did not become ready within ${timeout_ms}ms`)
}

function attachProcessLogs(command_name: string, child: ChildProcess): void {
  child.stdout?.on('data', (chunk) => {
    sendRunnerLog('info', `[${command_name}] ${String(chunk).trim()}`)
  })
  child.stderr?.on('data', (chunk) => {
    sendRunnerLog('warn', `[${command_name}] ${String(chunk).trim()}`)
  })
}

async function ensureProjectServices(project: ResolvedAutotestConfig): Promise<void> {
  for (const command of project.launch.commands) {
    if (await isReadyCheckSatisfied(command)) {
      sendRunnerLog('info', `Reuse existing service: ${command.name}`)
      continue
    }

    sendRunnerLog('info', `Starting service: ${command.name}`)
    const child = spawn(command.command, {
      cwd: command.cwd,
      shell: true,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ...command.env,
      },
    })

    project_processes.set(command.name, child)
    attachProcessLogs(command.name, child)
    await waitForReady(command)
  }
}

function killChildProcess(child: ChildProcess): void {
  if (!child.pid) {
    return
  }

  try {
    if (process.platform === 'win32') {
      child.kill('SIGTERM')
    } else {
      process.kill(-child.pid, 'SIGTERM')
    }
  } catch {
    try {
      child.kill('SIGTERM')
    } catch {
      // ignore
    }
  }
}

function stopProjectServices(): void {
  for (const child of project_processes.values()) {
    killChildProcess(child)
  }
  project_processes.clear()
}

function stopRunnerProcess(): void {
  if (!runner_process) {
    return
  }

  try {
    runner_process.send?.({ type: 'control', data: { type: 'stop' } })
  } catch {
    // ignore
  }

  setTimeout(() => {
    if (runner_process) {
      runner_process.kill('SIGTERM')
      runner_process = null
    }
  }, 1500)
}

async function loadProjectFromDirectory(dir_path: string): Promise<{ project: ResolvedAutotestConfig; cases: any[] }> {
  const config_path = await findConfigFile(dir_path)
  if (!config_path) {
    throw new Error(`No autotest config found under ${dir_path}`)
  }

  const raw_config = JSON.parse(fs.readFileSync(config_path, 'utf-8')) as AutotestConfig
  const project = withDetectedLaunchCommands(normalizeAutotestConfig(raw_config, config_path, dir_path))
  const cases = await scanCases(project)
  return { project, cases }
}

async function scanCases(project: ResolvedAutotestConfig): Promise<any[]> {
  const runner_path = join(__dirname, '../runner/index.ts')

  return new Promise<any[]>((resolve, reject) => {
    const child = fork(runner_path, [
      '--scan-only',
      '--config',
      project.config_path,
      '--cases-dir',
      project.cases.root_dir,
    ], {
      execArgv: ['--import', tsx_loader_path],
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    })

    child.on('message', (message: any) => {
      if (message?.type === 'cases-scanned') {
        resolve(message.cases)
        child.kill('SIGTERM')
      } else if (message?.type === 'cases-scan-error') {
        reject(new Error(message.error))
        child.kill('SIGTERM')
      }
    })

    child.on('error', reject)
    child.stderr?.on('data', (chunk) => {
      sendRunnerLog('warn', `[scan] ${String(chunk).trim()}`)
    })
  })
}

function startRunnerProcess(project: ResolvedAutotestConfig, mode: 'auto' | 'manual', cdp_endpoint: string): void {
  const runner_path = join(__dirname, '../runner/index.ts')
  runner_process = fork(runner_path, [
    '--config',
    project.config_path,
    '--cases-dir',
    project.cases.root_dir,
    '--cdp-endpoint',
    cdp_endpoint,
    '--mode',
    mode,
  ], {
    execArgv: ['--import', tsx_loader_path],
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  })

  runner_process.on('message', (message: any) => {
    if (message?.type === 'runner-event') {
      sendRunnerEvent(message.data)
    }
  })

  runner_process.on('error', (error) => {
    sendRunnerLog('error', `Runner process error: ${error.message}`)
  })

  runner_process.stderr?.on('data', (chunk) => {
    sendRunnerLog('warn', `[runner] ${String(chunk).trim()}`)
  })
}

ipcMain.handle('scan-dir', async (_, dir_path?: string) => {
  const target_path = dir_path || '/'
  return {
    success: true,
    tree: scanVisibleDir(target_path),
  }
})

ipcMain.handle('search-file-system', async (_, query: string) => {
  return {
    success: true,
    tree: buildSearchTree(query),
  }
})

ipcMain.handle('select-project', async (_, dir_path: string) => {
  try {
    stopRunnerProcess()
    active_project = null

    const { project, cases } = await loadProjectFromDirectory(dir_path)
    active_project = project

    await ensureProjectServices(project)

    if (browser_view) {
      await browser_view.webContents.loadURL(project.preview.entry_url)
      emitBrowserState()
    }

    return {
      success: true,
      project,
      cases,
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
    }
  }
})

ipcMain.handle('start-runner', async (_, project: ResolvedAutotestConfig, auto_advance = true) => {
  try {
    active_project = project
    await ensureProjectServices(project)
    const cdp_endpoint = await fetchBrowserWSEndpoint()
    startRunnerProcess(project, auto_advance ? 'auto' : 'manual', cdp_endpoint)
    return { success: true, cdpEndpoint: cdp_endpoint }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('stop-runner', async () => {
  stopRunnerProcess()
  return { success: true }
})

ipcMain.handle('reset-session', async () => {
  try {
    stopRunnerProcess()
    stopProjectServices()

    if (active_project) {
      await ensureProjectServices(active_project)
      if (browser_view) {
        await browser_view.webContents.loadURL(active_project.preview.entry_url)
        emitBrowserState()
      }
      const cases = await scanCases(active_project)
      return { success: true, project: active_project, cases }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

ipcMain.handle('send-control', async (_, message: any) => {
  if (!runner_process) {
    return { success: false, error: 'Runner is not running' }
  }
  runner_process.send?.({ type: 'control', data: message })
  return { success: true }
})

ipcMain.handle('browser-back', async () => {
  browser_view?.webContents.navigationHistory.goBack()
  emitBrowserState()
})

ipcMain.handle('browser-forward', async () => {
  browser_view?.webContents.navigationHistory.goForward()
  emitBrowserState()
})

ipcMain.handle('browser-reload', async () => {
  browser_view?.webContents.reload()
  emitBrowserState()
})

ipcMain.handle('browser-force-reload', async () => {
  browser_view?.webContents.reloadIgnoringCache()
  emitBrowserState()
})

ipcMain.handle('browser-navigate', async (_, url: string) => {
  await browser_view?.webContents.loadURL(url)
  emitBrowserState()
})

ipcMain.handle('devtools-toggle', async () => {
  if (!browser_view) {
    return
  }

  if (browser_view.webContents.isDevToolsOpened()) {
    browser_view.webContents.closeDevTools()
  } else {
    browser_view.webContents.openDevTools({ mode: 'bottom' })
  }
  emitBrowserState()
})

ipcMain.handle('browser-get-state', async () => collectBrowserState())

ipcMain.handle('open-file-dialog', async () => {
  if (!main_window) {
    return { success: false, error: 'Main window not available' }
  }

  const result = await dialog.showOpenDialog(main_window, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePaths[0]) {
    return { success: false, cancelled: true }
  }

  return { success: true, filePath: result.filePaths[0] }
})

ipcMain.handle('save-report-dialog', async (_, report_data: string) => {
  if (!main_window) {
    return { success: false, error: 'Main window not available' }
  }

  const result = await dialog.showSaveDialog(main_window, {
    defaultPath: 'report.json',
    filters: [
      { name: 'JSON Report', extensions: ['json'] },
      { name: 'HTML Report', extensions: ['html'] },
      { name: 'Markdown Report', extensions: ['md'] },
    ],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true }
  }

  fs.writeFileSync(result.filePath, report_data, 'utf-8')
  return { success: true, filePath: result.filePath }
})

ipcMain.handle('load-config', async (_, config_path: string) => {
  try {
    const raw_config = JSON.parse(fs.readFileSync(config_path, 'utf-8')) as AutotestConfig
    const project = withDetectedLaunchCommands(
      normalizeAutotestConfig(raw_config, config_path, dirname(dirname(config_path)))
    )
    const cases = await scanCases(project)
    return { success: true, config: project, cases }
  } catch (error) {
    return { success: false, error: String(error) }
  }
})

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('before-quit', () => {
  stopRunnerProcess()
  stopProjectServices()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export function forwardToUI(channel: string, data: any): void {
  if (main_window && !main_window.isDestroyed()) {
    main_window.webContents.send(channel, data)
  }
}

export { browser_view, main_window, createElectronIPC }
