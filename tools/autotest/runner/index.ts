/**
 * Runner Entry Point - Node.js Playwright runner process
 *
 * Supports both CLI mode and Electron module mode.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { promises as fsPromises } from 'fs';
import { resolve as resolvePath, join, dirname } from 'path';
import { pathToFileURL } from 'url';
import { ipcServer, createElectronIPC } from './ipc.js';
import { TestEngine } from './engine.js';
import type { AutotestConfig, TestCase, ControlMessage } from './types.js';

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CliArgs {
  casesDir: string;
  baseUrl?: string;
  configPath: string;
  mode: 'case-confirm' | 'full-auto';
  cdpEndpoint?: string;
}

function parseCliArgs(): CliArgs {
  const args = process.argv.slice(2);
  const parsed: Partial<CliArgs> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--cases-dir':
        parsed.casesDir = args[++i];
        break;
      case '--base-url':
        parsed.baseUrl = args[++i];
        break;
      case '--config':
        parsed.configPath = args[++i];
        break;
      case '--mode':
        const mode = args[++i];
        if (mode !== 'case-confirm' && mode !== 'full-auto') {
          console.error(`[Error] Invalid mode: ${mode}`);
          process.exit(1);
        }
        parsed.mode = mode;
        break;
      case '--cdp-endpoint':
        parsed.cdpEndpoint = args[++i];
        break;
    }
  }

  if (!parsed.casesDir) {
    console.error('[Error] --cases-dir is required');
    process.exit(1);
  }

  const casesDir = resolvePath(parsed.casesDir);
  const defaultConfigPath = join(dirname(casesDir), 'autotest.config.json');

  return {
    casesDir,
    baseUrl: parsed.baseUrl,
    configPath: parsed.configPath ? resolvePath(parsed.configPath) : defaultConfigPath,
    mode: parsed.mode || 'case-confirm',
  };
}

// =============================================================================
// Config Loading
// =============================================================================

function loadConfig(configPath: string): AutotestConfig {
  if (!existsSync(configPath)) {
    console.error(`[Error] Config file not found: ${configPath}`);
    process.exit(1);
  }

  try {
    const configText = readFileSync(configPath, 'utf-8');
    return JSON.parse(configText) as AutotestConfig;
  } catch (err) {
    console.error(`[Error] Failed to parse config: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// =============================================================================
// Test Case Loading
// =============================================================================

async function loadCases(casesDir: string): Promise<TestCase[]> {
  const cases: TestCase[] = [];

  try {
    // Mode A: Import index.ts from cases directory if it exists
    const indexPath = join(casesDir, 'index.ts');
    if (existsSync(indexPath)) {
      const module = await import(pathToFileURL(indexPath).href);
      if (module.default && Array.isArray(module.default)) {
        cases.push(...module.default);
      }
    } else {
      // Mode B: Recursively scan for all *.ts files and collect default exports
      const scanDir = async (dir: string): Promise<void> => {
        const entries = await fsPromises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
            try {
              const mod = await import(pathToFileURL(fullPath).href);
              if (mod.default) {
                if (Array.isArray(mod.default)) {
                  cases.push(...mod.default);
                } else {
                  cases.push(mod.default);
                }
              }
            } catch (e) {
              console.warn(`[Warn] Failed to import ${fullPath}:`, e);
            }
          }
        }
      };
      await scanDir(casesDir);
    }
  } catch (err) {
    console.error('[Error] Failed to load test cases:', err);
  }

  return cases;
}

// =============================================================================
// Main Execution
// =============================================================================

let engine: TestEngine | null = null;

async function run(args: CliArgs): Promise<void> {
  // Load config
  const config = loadConfig(args.configPath);
  if (args.baseUrl) {
    config.base_url = args.baseUrl;
  }

  // Load test cases
  const cases = await loadCases(args.casesDir);
  if (cases.length === 0) {
    console.error('[Error] No test cases found');
    process.exit(1);
  }

  // Create and configure engine
  engine = new TestEngine(config, args.cdpEndpoint);
  engine.setMode(args.mode);

  // Handle control messages
  ipcServer.onControl((msg: ControlMessage) => {
    engine?.handleControl(msg);
  });

  // Send cases-loaded event
  ipcServer.send({
    type: 'cases-loaded',
    cases: cases.map(c => ({
      id: c.id,
      title: c.title,
      module: c.module,
      priority: c.priority,
      tags: c.tags,
      steps: c.steps.map(s => ({ id: s.id, desc: s.desc, action: s.action }))
    }))
  });

  // Run all cases
  await engine.run(cases);

  // Send completion
  ipcServer.send({
    type: 'all-done',
    summary: { total: cases.length, pass: 0, fail: 0, skip: 0 }
  });
}

// =============================================================================
// Electron Mode
// =============================================================================

export async function startRunner(
  electronIPC: any,
  config: AutotestConfig,
  cases: TestCase[],
  cdpEndpoint?: string
): Promise<void> {
  // Initialize IPC with Electron
  ipcServer.initElectron(electronIPC);

  // Create engine with CDP endpoint
  engine = new TestEngine(config, cdpEndpoint);

  // Handle control messages
  ipcServer.onControl((msg: ControlMessage) => {
    engine?.handleControl(msg);
  });

  // Send cases-loaded
  ipcServer.send({
    type: 'cases-loaded',
    cases: cases.map(c => ({
      id: c.id,
      title: c.title,
      module: c.module,
      priority: c.priority,
      tags: c.tags,
      steps: c.steps.map(s => ({ id: s.id, desc: s.desc, action: s.action }))
    }))
  });

  // Run
  await engine.run(cases);

  ipcServer.send({
    type: 'all-done',
    summary: { total: cases.length, pass: 0, fail: 0, skip: 0 }
  });
}

export function stopRunner(): void {
  engine?.stop();
}

export { createElectronIPC, ipcServer };

// =============================================================================
// CLI Entry Point
// =============================================================================

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseCliArgs();
  run(args).catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
  });
}
