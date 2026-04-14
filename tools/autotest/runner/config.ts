import { dirname, isAbsolute, join, resolve as resolvePath } from 'path'
import type {
  AutotestConfig,
  ExecutionConfig,
  ReadyCheck,
  ReportConfig,
  ResolvedAutotestConfig,
} from './types.js'

export const DEFAULT_CONFIG_FILENAMES = ['autotest.config.json']
export const DEFAULT_CASE_INCLUDE = ['**/*.ts']
export const DEFAULT_CASE_EXCLUDE = [
  '**/_*.ts',
  '**/*.d.ts',
  '**/node_modules/**',
  '**/dist/**',
  '**/coverage/**',
]

function resolveMaybeRelative(base_dir: string, value: string | undefined, fallback: string): string {
  const target = value?.trim() || fallback
  return isAbsolute(target) ? target : resolvePath(base_dir, target)
}

function normalizeExecution(raw_config: AutotestConfig): Required<ExecutionConfig> {
  return {
    concurrency:
      raw_config.execution?.concurrency ??
      raw_config.concurrency ??
      1,
    step_timeout:
      raw_config.execution?.step_timeout ??
      raw_config.step_timeout ??
      30000,
    screenshot_on_step:
      raw_config.execution?.screenshot_on_step ??
      raw_config.screenshot_on_step ??
      true,
    auto_advance:
      raw_config.execution?.auto_advance ??
      true,
  }
}

function normalizeReport(raw_report: ReportConfig | undefined): { output_dir: string; formats: string[] } {
  return {
    output_dir: raw_report?.output_dir || './reports',
    formats: raw_report?.formats?.length ? raw_report.formats : ['json', 'html', 'markdown'],
  }
}

function normalizeReadyCheck(ready: ReadyCheck | undefined): ReadyCheck | undefined {
  if (!ready) {
    return undefined
  }

  return {
    type: ready.type,
    url: ready.url,
    port: ready.port,
    timeout_ms: ready.timeout_ms ?? 120000,
    interval_ms: ready.interval_ms ?? 1000,
  }
}

export function normalizeAutotestConfig(
  raw_config: AutotestConfig,
  config_path: string,
  selected_project_root?: string
): ResolvedAutotestConfig {
  const config_dir = dirname(config_path)
  const project_root = resolveMaybeRelative(
    config_dir,
    raw_config.project_root,
    selected_project_root || config_dir
  )

  const preview_base_url =
    raw_config.preview?.base_url ||
    raw_config.base_url ||
    'http://127.0.0.1:3000'

  const preview_entry_url =
    raw_config.preview?.entry_url ||
    preview_base_url

  const preview_healthcheck_url =
    raw_config.preview?.healthcheck_url ||
    preview_entry_url

  const cases_root_dir = resolveMaybeRelative(
    config_dir,
    raw_config.cases?.root_dir || raw_config.cases_dir,
    './cases'
  )

  const report = normalizeReport(raw_config.report)
  const execution = normalizeExecution(raw_config)

  return {
    schema_version: raw_config.schema_version || '2.0',
    name: raw_config.name,
    project_root,
    config_path,
    preview: {
      base_url: preview_base_url,
      entry_url: preview_entry_url,
      healthcheck_url: preview_healthcheck_url,
    },
    cases: {
      root_dir: cases_root_dir,
      include: raw_config.cases?.include?.length
        ? raw_config.cases.include
        : DEFAULT_CASE_INCLUDE,
      exclude: raw_config.cases?.exclude?.length
        ? raw_config.cases.exclude
        : DEFAULT_CASE_EXCLUDE,
    },
    execution,
    report: {
      output_dir: resolveMaybeRelative(config_dir, report.output_dir, './reports'),
      formats: report.formats,
    },
    discovery: {
      config_filenames:
        raw_config.discovery?.config_filenames?.length
          ? raw_config.discovery.config_filenames
          : DEFAULT_CONFIG_FILENAMES,
    },
    launch: {
      commands: (raw_config.launch?.commands || []).map((command) => ({
        name: command.name,
        command: command.command,
        cwd: resolveMaybeRelative(project_root, command.cwd, '.'),
        ready: normalizeReadyCheck(command.ready),
        env: command.env || {},
      })),
      detection_source: raw_config.launch?.commands?.length ? 'config' : 'auto-detect',
    },
  }
}

function escapeGlobSegment(segment: string): string {
  return segment.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function globToRegExp(pattern: string): RegExp {
  let source = '^'
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]
    const next = pattern[index + 1]

    if (char === '*' && next === '*') {
      source += '.*'
      index += 1
      continue
    }

    if (char === '*') {
      source += '[^/]*'
      continue
    }

    if (char === '?') {
      source += '.'
      continue
    }

    source += escapeGlobSegment(char)
  }

  source += '$'
  return new RegExp(source)
}

export function matchesGlobPatterns(relative_path: string, patterns: string[]): boolean {
  const normalized_path = relative_path.replace(/\\/g, '/')
  return patterns.some((pattern) => globToRegExp(pattern).test(normalized_path))
}

export function isCaseFileIncluded(
  relative_path: string,
  include_patterns: string[],
  exclude_patterns: string[]
): boolean {
  const normalized_path = relative_path.replace(/\\/g, '/')
  if (!matchesGlobPatterns(normalized_path, include_patterns)) {
    return false
  }

  if (matchesGlobPatterns(normalized_path, exclude_patterns)) {
    return false
  }

  return true
}

export function toRelativeProjectPath(project_root: string, absolute_path: string): string {
  const relative_path = absolute_path.startsWith(project_root)
    ? absolute_path.slice(project_root.length)
    : absolute_path

  return relative_path.replace(/^[/\\]+/, '').replace(/\\/g, '/')
}

export function joinProjectPath(project_root: string, relative_path: string): string {
  if (isAbsolute(relative_path)) {
    return relative_path
  }

  return join(project_root, relative_path)
}
