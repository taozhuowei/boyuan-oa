/**
 * Runner entry.
 * Purpose: load config, discover test cases, run Playwright automation, and emit IPC events.
 */

import { existsSync, readFileSync } from 'fs'
import { promises as fsPromises } from 'fs'
import { dirname, join, relative, resolve as resolvePath } from 'path'
import { pathToFileURL } from 'url'
import { createElectronIPC, ipcServer } from './ipc.js'
import { normalizeAutotestConfig, isCaseFileIncluded } from './config.js'
import { TestEngine } from './engine.js'
import type {
  AutotestConfig,
  ControlMessage,
  ResolvedAutotestConfig,
  RunnerMode,
  TestCase,
} from './types.js'

interface CliArgs {
  configPath?: string
  casesDir?: string
  mode: RunnerMode
  cdpEndpoint?: string
  scanOnly?: boolean
}

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2)
  const parsed: Partial<CliArgs> = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    switch (arg) {
      case '--cases-dir':
        parsed.casesDir = args[index + 1]
        index += 1
        break
      case '--config':
        parsed.configPath = args[index + 1]
        index += 1
        break
      case '--mode': {
        const mode = args[index + 1]
        if (mode !== 'auto' && mode !== 'manual') {
          throw new Error(`Invalid runner mode: ${mode}`)
        }
        parsed.mode = mode
        index += 1
        break
      }
      case '--cdp-endpoint':
        parsed.cdpEndpoint = args[index + 1]
        index += 1
        break
      case '--scan-only':
        parsed.scanOnly = true
        break
      default:
        break
    }
  }

  return {
    configPath: parsed.configPath,
    casesDir: parsed.casesDir,
    mode: parsed.mode || 'auto',
    cdpEndpoint: parsed.cdpEndpoint,
    scanOnly: parsed.scanOnly,
  }
}

function loadRawConfig(config_path: string): AutotestConfig {
  if (!existsSync(config_path)) {
    throw new Error(`Config file not found: ${config_path}`)
  }

  try {
    return JSON.parse(readFileSync(config_path, 'utf-8')) as AutotestConfig
  } catch (error) {
    throw new Error(`Failed to parse config ${config_path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function resolveRunnerConfig(args: CliArgs): ResolvedAutotestConfig {
  if (!args.configPath) {
    throw new Error('--config is required')
  }

  const config_path = resolvePath(args.configPath)
  const raw_config = loadRawConfig(config_path)
  const normalized = normalizeAutotestConfig(raw_config, config_path)

  if (args.casesDir) {
    normalized.cases.root_dir = resolvePath(args.casesDir)
  }

  return normalized
}

function lightCase(test_case: TestCase) {
  return {
    id: test_case.id,
    title: test_case.title,
    description: test_case.description,
    module: test_case.module,
    priority: test_case.priority,
    roles: test_case.roles,
    tags: test_case.tags,
    steps: test_case.steps.map((step) => ({
      id: step.id,
      desc: step.desc,
      action: step.action,
    })),
  }
}

async function importCaseModule(file_path: string): Promise<TestCase[]> {
  const imported = await import(pathToFileURL(file_path).href)
  if (!imported.default) {
    return []
  }

  if (Array.isArray(imported.default)) {
    return imported.default as TestCase[]
  }

  return [imported.default as TestCase]
}

async function loadCases(config: ResolvedAutotestConfig): Promise<TestCase[]> {
  const cases_root_dir = config.cases.root_dir
  const cases: TestCase[] = []
  const root_index_path = join(cases_root_dir, 'index.ts')

  if (existsSync(root_index_path)) {
    return importCaseModule(root_index_path)
  }

  const scan_dir = async (dir_path: string): Promise<void> => {
    const entries = await fsPromises.readdir(dir_path, { withFileTypes: true })

    for (const entry of entries) {
      const full_path = join(dir_path, entry.name)
      if (entry.isDirectory()) {
        await scan_dir(full_path)
        continue
      }

      if (!entry.isFile() || !entry.name.endsWith('.ts')) {
        continue
      }

      const relative_path = relative(cases_root_dir, full_path).replace(/\\/g, '/')
      if (!isCaseFileIncluded(relative_path, config.cases.include, config.cases.exclude)) {
        continue
      }

      const imported_cases = await importCaseModule(full_path)
      cases.push(...imported_cases)
    }
  }

  await scan_dir(cases_root_dir)
  return cases
}

let engine: TestEngine | null = null

async function runCli(args: CliArgs): Promise<void> {
  const config = resolveRunnerConfig(args)
  const cases = await loadCases(config)

  if (!cases.length) {
    throw new Error(`No test cases found in ${config.cases.root_dir}`)
  }

  engine = new TestEngine(config, args.cdpEndpoint)
  engine.setMode(args.mode)

  ipcServer.onControl((message: ControlMessage) => {
    engine?.handleControl(message)
  })

  ipcServer.send({
    type: 'cases-loaded',
    cases: cases.map(lightCase),
  })

  await engine.run(cases)
}

export async function startRunner(
  electron_ipc: any,
  config: ResolvedAutotestConfig,
  cases: TestCase[],
  cdp_endpoint?: string
): Promise<void> {
  ipcServer.initElectron(electron_ipc)

  engine = new TestEngine(config, cdp_endpoint)
  engine.setMode(config.execution.auto_advance ? 'auto' : 'manual')

  ipcServer.onControl((message: ControlMessage) => {
    engine?.handleControl(message)
  })

  ipcServer.send({
    type: 'cases-loaded',
    cases: cases.map(lightCase),
  })

  await engine.run(cases)
}

export function stopRunner(): void {
  void engine?.stop()
}

export { createElectronIPC, ipcServer }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseCliArgs()

  if (args.scanOnly) {
    try {
      const config = resolveRunnerConfig(args)
      loadCases(config)
        .then((cases) => {
          process.send?.({ type: 'cases-scanned', cases: cases.map(lightCase) })
          process.exit(0)
        })
        .catch((error) => {
          process.send?.({ type: 'cases-scan-error', error: String(error) })
          process.exit(1)
        })
    } catch (error) {
      process.send?.({ type: 'cases-scan-error', error: String(error) })
      process.exit(1)
    }
  } else {
    runCli(args).catch((error) => {
      console.error('[Runner Fatal]', error)
      process.exit(1)
    })
  }
}
