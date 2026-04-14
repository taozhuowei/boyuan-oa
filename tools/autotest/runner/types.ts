/**
 * Autotest shared type definitions.
 * Purpose: keep runner, Electron main process, and Vue UI aligned on the same data model.
 */

// =============================================================================
// Locator and Assertion Types
// =============================================================================

export type LocatorDef =
  | { by: 'role'; role: string; name: string; exact?: boolean }
  | { by: 'label'; value: string; exact?: boolean }
  | { by: 'text'; value: string; exact?: boolean }
  | { by: 'placeholder'; value: string }
  | { by: 'testid'; value: string }
  | { by: 'catch'; value: string }
  | { by: 'css'; value: string }

export type AssertCheck =
  | { type: 'url_contains' | 'url_equals'; value: string }
  | { type: 'text_visible' | 'text_absent'; value: string }
  | { type: 'element_visible' | 'element_hidden'; locator: LocatorDef }
  | { type: 'toast_contains'; value: string }
  | { type: 'http_status'; value: number }
  | { type: 'title_contains'; value: string }

// =============================================================================
// Test Definition Types
// =============================================================================

export type TestStep =
  | { id: number; desc: string; action: 'navigate'; to: string }
  | { id: number; desc: string; action: 'click'; locator: LocatorDef }
  | { id: number; desc: string; action: 'fill'; locator: LocatorDef; value: string }
  | { id: number; desc: string; action: 'select'; locator: LocatorDef; value: string }
  | { id: number; desc: string; action: 'check' | 'uncheck'; locator: LocatorDef }
  | { id: number; desc: string; action: 'wait'; ms: number }
  | { id: number; desc: string; action: 'wait_for'; locator: LocatorDef }
  | { id: number; desc: string; action: 'assert'; check: AssertCheck }
  | { id: number; desc: string; action: 'screenshot'; label?: string }
  | { id: number; desc: string; action: 'upload'; locator: LocatorDef; value: string }
  | {
      id: number
      desc: string
      action: 'api_call'
      method: string
      endpoint: string
      body?: Record<string, unknown>
    }
  | {
      id: number
      desc: string
      action: 'parallel'
      contexts: TestStep[][]
    }
  | {
      id: number
      desc: string
      action: 'rapid'
      repeat: number
      interval: number
      step: TestStep
    }

export interface TestCase {
  id: string
  title: string
  description: string
  module: string
  priority: 'P0' | 'P1' | 'P2'
  roles?: string[]
  tags?: string[]
  credentials?: { username: string; password: string }
  steps: TestStep[]
  expect: { result: 'pass' | 'fail'; url?: string }
}

// =============================================================================
// Runtime and Report Types
// =============================================================================

export type StepStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip'
export type CaseStatus = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'waiting_confirm'

export interface ConsoleEntry {
  level: string
  ts: string
  message: string
}

export interface NetworkRequest {
  method: string
  url: string
  status: number | null
  duration_ms: number | null
  resource_type?: string
}

export interface StepResult {
  stepId: number
  status: StepStatus
  error?: string
  errorStack?: string
  screenshot?: string
  durationMs: number
  pageUrl?: string
  pageTitle?: string
  locator?: LocatorDef
  consoleTail?: ConsoleEntry[]
  networkTail?: NetworkRequest[]
}

export interface CaseResult {
  caseId: string
  status: CaseStatus
  autoStatus?: 'pass' | 'fail'
  steps: StepResult[]
  humanResult?: 'pass' | 'fail' | 'skip'
  humanNote?: string
  startedAt: number
  finishedAt?: number
}

// =============================================================================
// Config Types
// =============================================================================

export interface ReadyCheck {
  type: 'http' | 'tcp'
  url?: string
  port?: number
  timeout_ms?: number
  interval_ms?: number
}

export interface LaunchCommandConfig {
  name: string
  command: string
  cwd?: string
  ready?: ReadyCheck
  env?: Record<string, string>
}

export interface PreviewConfig {
  base_url: string
  entry_url?: string
  healthcheck_url?: string
}

export interface CasesConfig {
  root_dir: string
  include?: string[]
  exclude?: string[]
}

export interface ExecutionConfig {
  concurrency?: number
  step_timeout?: number
  screenshot_on_step?: boolean
  auto_advance?: boolean
}

export interface ReportConfig {
  output_dir?: string
  formats?: string[]
}

export interface AutotestConfig {
  schema_version?: string
  name: string
  project_root?: string
  preview?: PreviewConfig
  cases?: CasesConfig
  execution?: ExecutionConfig
  report?: ReportConfig
  launch?: { commands?: LaunchCommandConfig[] }
  discovery?: { config_filenames?: string[] }

  // Legacy compatibility
  base_url?: string
  cases_dir?: string
  concurrency?: number
  step_timeout?: number
  screenshot_on_step?: boolean
}

export interface ResolvedLaunchCommand {
  name: string
  command: string
  cwd: string
  ready?: ReadyCheck
  env: Record<string, string>
}

export interface ResolvedAutotestConfig {
  schema_version: string
  name: string
  project_root: string
  config_path: string
  preview: {
    base_url: string
    entry_url: string
    healthcheck_url: string
  }
  cases: {
    root_dir: string
    include: string[]
    exclude: string[]
  }
  execution: Required<ExecutionConfig>
  report: {
    output_dir: string
    formats: string[]
  }
  launch: {
    commands: ResolvedLaunchCommand[]
    detection_source: string
  }
  discovery: {
    config_filenames: string[]
  }
}

export interface BrowserState {
  current_url: string
  title: string
  can_go_back: boolean
  can_go_forward: boolean
  is_loading: boolean
  devtools_open: boolean
}

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'dir'
  has_children?: boolean
  children?: TreeNode[]
}

// =============================================================================
// IPC Types
// =============================================================================

export type RunnerMode = 'auto' | 'manual'

export type RunnerEvent =
  | { type: 'step-start'; caseId: string; stepId: number; desc: string }
  | {
      type: 'step-done'
      caseId: string
      stepId: number
      status: StepStatus
      error?: string
      errorStack?: string
      screenshot?: string
      durationMs: number
      pageUrl?: string
      pageTitle?: string
      locator?: LocatorDef
      consoleTail?: ConsoleEntry[]
      networkTail?: NetworkRequest[]
    }
  | { type: 'case-done'; caseId: string; autoStatus: 'pass' | 'fail'; needConfirm: boolean }
  | {
      type: 'all-done'
      summary: { total: number; pass: number; fail: number; skip: number }
      reportPaths?: { json?: string; html?: string; markdown?: string }
    }
  | {
      type: 'cases-loaded'
      cases: Array<{
        id: string
        title: string
        description: string
        module: string
        priority: 'P0' | 'P1' | 'P2'
        roles?: string[]
        tags?: string[]
        steps: Array<{ id: number; desc: string; action: string }>
      }>
    }
  | { type: 'log'; level: 'info' | 'warn' | 'error'; message: string }

export type ControlMessage =
  | { type: 'resume' }
  | { type: 'confirm'; caseId: string; result: 'pass' | 'fail' | 'skip'; note?: string }
  | { type: 'stop' }
  | { type: 'set-mode'; mode: RunnerMode }
