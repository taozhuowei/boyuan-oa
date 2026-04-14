/**
 * Reporter.
 * Purpose: write AI-friendly JSON, Markdown, and HTML reports for finished runs.
 */

import os from 'os'
import { writeFileSync } from 'fs'
import { join } from 'path'
import type {
  CaseResult,
  ConsoleEntry,
  LocatorDef,
  NetworkRequest,
  ResolvedAutotestConfig,
  StepResult,
  TestCase,
  TestStep,
} from './types.js'

interface ReportInput {
  config: ResolvedAutotestConfig
  cases: TestCase[]
  results: CaseResult[]
}

interface FailureItem {
  case_id: string
  title: string
  description: string
  module: string
  priority: string
  roles: string[]
  fail_step: {
    step_id: number
    desc: string
    action: string
    locator?: LocatorDef
  } | null
  page_state: {
    url: string | null
    title: string | null
  }
  action_path: Array<{ step_id: number; desc: string; result: string }>
  error: {
    message: string
    stack?: string
  }
  locator_hint: {
    by: string
    value: string
    fallback_selectors: string[]
  } | null
  screenshot_base64: string | null
  browser_console_tail: ConsoleEntry[]
  network_last_requests: NetworkRequest[]
  human_note: string | null
}

interface ParsedReport {
  report_version: string
  generated_at: string
  project: string
  overview: {
    total: number
    pass: number
    fail: number
    skip: number
    summary: string
  }
  environment: {
    project_root: string
    config_path: string
    base_url: string
    healthcheck_url: string
    platform: string
    release: string
    arch: string
    node_version: string
    electron_version: string | null
    chrome_version: string | null
  }
  network: {
    preview_base_url: string
    healthcheck_url: string
    captured_request_count: number
    recent_requests: NetworkRequest[]
  }
  failures: FailureItem[]
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function buildSummary(results: CaseResult[]): { total: number; pass: number; fail: number; skip: number } {
  return {
    total: results.length,
    pass: results.filter((result) => (result.humanResult ?? result.status) === 'pass').length,
    fail: results.filter((result) => (result.humanResult ?? result.status) === 'fail').length,
    skip: results.filter((result) => (result.humanResult ?? result.status) === 'skip').length,
  }
}

function fallbackSelectors(locator: LocatorDef | undefined): string[] {
  if (!locator) {
    return []
  }

  switch (locator.by) {
    case 'catch':
      return [`[data-catch="${locator.value}"]`]
    case 'testid':
      return [`[data-testid="${locator.value}"]`]
    case 'css':
      return [locator.value]
    case 'text':
      return [`text="${locator.value}"`]
    case 'label':
      return [`label="${locator.value}"`]
    case 'placeholder':
      return [`[placeholder="${locator.value}"]`]
    case 'role':
      return [`role=${locator.role}[name="${locator.name}"]`]
    default:
      return []
  }
}

function locateFailureStep(test_case: TestCase, case_result: CaseResult): { step?: TestStep; result?: StepResult } {
  const failed_result = case_result.steps.find((step) => step.status === 'fail')
  if (!failed_result) {
    return {}
  }

  return {
    step: test_case.steps.find((step) => step.id === failed_result.stepId),
    result: failed_result,
  }
}

function buildFailureItem(test_case: TestCase, case_result: CaseResult): FailureItem {
  const { step, result } = locateFailureStep(test_case, case_result)

  return {
    case_id: test_case.id,
    title: test_case.title,
    description: test_case.description,
    module: test_case.module,
    priority: test_case.priority,
    roles: test_case.roles || [],
    fail_step: step
      ? {
          step_id: step.id,
          desc: step.desc,
          action: step.action,
          locator: 'locator' in step ? step.locator : 'check' in step && 'locator' in step.check ? step.check.locator : undefined,
        }
      : null,
    page_state: {
      url: result?.pageUrl || null,
      title: result?.pageTitle || null,
    },
    action_path: test_case.steps.map((step_item) => {
      const step_result = case_result.steps.find((result_item) => result_item.stepId === step_item.id)
      return {
        step_id: step_item.id,
        desc: step_item.desc,
        result: step_result?.status || 'pending',
      }
    }),
    error: {
      message: result?.error || 'Unknown error',
      stack: result?.errorStack,
    },
    locator_hint: result?.locator
      ? {
          by: result.locator.by,
          value: 'value' in result.locator ? result.locator.value : 'name' in result.locator ? result.locator.name : '',
          fallback_selectors: fallbackSelectors(result.locator),
        }
      : null,
    screenshot_base64: result?.screenshot ? `data:image/png;base64,${result.screenshot}` : null,
    browser_console_tail: result?.consoleTail || [],
    network_last_requests: result?.networkTail || [],
    human_note: case_result.humanNote || null,
  }
}

function buildReport(input: ReportInput): ParsedReport {
  const summary = buildSummary(input.results)
  const failures = input.results
    .filter((result) => (result.humanResult ?? result.status) === 'fail')
    .map((result) => {
      const test_case = input.cases.find((case_item) => case_item.id === result.caseId)
      if (!test_case) {
        return null
      }
      return buildFailureItem(test_case, result)
    })
    .filter((item): item is FailureItem => item !== null)

  const recent_requests = input.results
    .flatMap((result) => result.steps.flatMap((step) => step.networkTail || []))
    .slice(-20)

  return {
    report_version: '2.0',
    generated_at: new Date().toISOString(),
    project: input.config.name,
    overview: {
      ...summary,
      summary: `共 ${summary.total} 条用例，通过 ${summary.pass} 条，失败 ${summary.fail} 条，跳过 ${summary.skip} 条。`,
    },
    environment: {
      project_root: input.config.project_root,
      config_path: input.config.config_path,
      base_url: input.config.preview.base_url,
      healthcheck_url: input.config.preview.healthcheck_url,
      platform: process.platform,
      release: os.release(),
      arch: process.arch,
      node_version: process.version,
      electron_version: process.versions.electron || null,
      chrome_version: process.versions.chrome || null,
    },
    network: {
      preview_base_url: input.config.preview.base_url,
      healthcheck_url: input.config.preview.healthcheck_url,
      captured_request_count: input.results.flatMap((result) => result.steps.flatMap((step) => step.networkTail || [])).length,
      recent_requests,
    },
    failures,
  }
}

function buildMarkdown(report: ParsedReport): string {
  const lines: string[] = []
  lines.push(`# AutoTest Report — ${report.project}`)
  lines.push('')
  lines.push(`- 生成时间：${report.generated_at}`)
  lines.push(`- 项目根目录：${report.environment.project_root}`)
  lines.push(`- 预览地址：${report.environment.base_url}`)
  lines.push(`- 健康检查：${report.environment.healthcheck_url}`)
  lines.push(`- 总览：${report.overview.summary}`)
  lines.push('')

  if (!report.failures.length) {
    lines.push('## 失败用例')
    lines.push('')
    lines.push('无失败用例。')
    return lines.join('\n')
  }

  lines.push('## 失败用例')
  lines.push('')

  for (const failure of report.failures) {
    lines.push(`### FAIL ${failure.case_id} — ${failure.title} [${failure.priority} · ${failure.module}]`)
    lines.push(`- 描述：${failure.description}`)
    lines.push(`- 页面：${failure.page_state.url || '未知'}${failure.page_state.title ? ` | ${failure.page_state.title}` : ''}`)
    lines.push(`- 失败步骤：#${failure.fail_step?.step_id || '?'} ${failure.fail_step?.desc || '未知步骤'}`)
    lines.push(`- 错误：${failure.error.message}`)
    if (failure.locator_hint) {
      lines.push(`- 定位：${failure.locator_hint.by}=${failure.locator_hint.value}`)
      lines.push(`- 回退选择器：${failure.locator_hint.fallback_selectors.join(' | ') || '无'}`)
    }
    if (failure.human_note) {
      lines.push(`- 人工备注：${failure.human_note}`)
    }
    lines.push(`- 操作路径：${failure.action_path.map((step) => `${step.step_id}${step.result === 'pass' ? '✓' : step.result === 'fail' ? '✗' : '·'}`).join(' → ')}`)
    lines.push('')
  }

  return lines.join('\n')
}

function buildHtml(report: ParsedReport): string {
  const failure_cards = report.failures
    .map((failure, index) => `
      <section class="failure-card">
        <header class="failure-head">
          <span class="badge fail">FAIL</span>
          <strong>${escapeHtml(failure.case_id)}</strong>
          <span class="title">${escapeHtml(failure.title)}</span>
          <span class="meta">${escapeHtml(failure.priority)} · ${escapeHtml(failure.module)}</span>
        </header>
        <div class="failure-body">
          <p><strong>描述：</strong>${escapeHtml(failure.description)}</p>
          <p><strong>页面：</strong>${escapeHtml(failure.page_state.url || '未知')} ${failure.page_state.title ? `| ${escapeHtml(failure.page_state.title)}` : ''}</p>
          <p><strong>失败步骤：</strong>#${failure.fail_step?.step_id || '?'} ${escapeHtml(failure.fail_step?.desc || '未知步骤')}</p>
          <p><strong>错误：</strong>${escapeHtml(failure.error.message)}</p>
          ${failure.locator_hint ? `<p><strong>定位：</strong>${escapeHtml(failure.locator_hint.by)} = ${escapeHtml(failure.locator_hint.value)}</p>` : ''}
          ${failure.human_note ? `<p><strong>人工备注：</strong>${escapeHtml(failure.human_note)}</p>` : ''}
          ${failure.screenshot_base64 ? `<button onclick="toggle('shot-${index}')">截图</button><div id="shot-${index}" class="collapsed"><img src="${failure.screenshot_base64}" alt="screenshot"></div>` : ''}
          ${failure.error.stack ? `<button onclick="toggle('stack-${index}')">堆栈</button><pre id="stack-${index}" class="collapsed">${escapeHtml(failure.error.stack)}</pre>` : ''}
          <details>
            <summary>网络请求 (${failure.network_last_requests.length})</summary>
            <pre>${escapeHtml(JSON.stringify(failure.network_last_requests, null, 2))}</pre>
          </details>
          <details>
            <summary>控制台 (${failure.browser_console_tail.length})</summary>
            <pre>${escapeHtml(JSON.stringify(failure.browser_console_tail, null, 2))}</pre>
          </details>
        </div>
      </section>
    `)
    .join('')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(report.project)} AutoTest Report</title>
  <style>
    :root {
      --bg-0: #0B0D10;
      --bg-1: #15181D;
      --bg-2: #1C2027;
      --line: #242830;
      --text-1: #E6EAF0;
      --text-2: #8A94A6;
      --brand: #5EB8FF;
      --pass: #5CE68D;
      --fail: #FF5E62;
    }
    body { margin: 0; padding: 24px; background: var(--bg-0); color: var(--text-1); font: 13px/1.6 "IBM Plex Sans", sans-serif; }
    h1, h2 { margin: 0 0 12px; }
    .summary { display: grid; grid-template-columns: repeat(4, minmax(120px, 1fr)); gap: 12px; margin: 20px 0; }
    .stat { background: var(--bg-1); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
    .stat strong { display: block; font-size: 22px; margin-bottom: 4px; }
    .failure-card { background: var(--bg-1); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 16px; overflow: hidden; }
    .failure-head { display: flex; gap: 10px; align-items: center; padding: 14px 16px; border-bottom: 1px solid var(--line); }
    .failure-body { padding: 16px; }
    .badge { padding: 2px 8px; border-radius: 999px; font-size: 11px; }
    .badge.fail { background: rgba(255, 94, 98, 0.12); color: var(--fail); }
    .title { font-weight: 600; }
    .meta { color: var(--text-2); }
    .collapsed { display: none; margin-top: 10px; }
    img { max-width: 100%; border: 1px solid var(--line); border-radius: 8px; }
    pre { white-space: pre-wrap; word-break: break-word; background: var(--bg-2); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
    button { margin-right: 8px; background: var(--bg-2); color: var(--text-1); border: 1px solid var(--line); border-radius: 6px; padding: 6px 10px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>${escapeHtml(report.project)} AutoTest 测试报告</h1>
  <p>${escapeHtml(report.overview.summary)}</p>
  <div class="summary">
    <div class="stat"><strong>${report.overview.total}</strong>总用例</div>
    <div class="stat"><strong style="color: var(--pass)">${report.overview.pass}</strong>通过</div>
    <div class="stat"><strong style="color: var(--fail)">${report.overview.fail}</strong>失败</div>
    <div class="stat"><strong>${report.overview.skip}</strong>跳过</div>
  </div>
  <h2>环境信息</h2>
  <pre>${escapeHtml(JSON.stringify(report.environment, null, 2))}</pre>
  <h2>网络信息</h2>
  <pre>${escapeHtml(JSON.stringify(report.network, null, 2))}</pre>
  <h2>失败用例 (${report.failures.length})</h2>
  ${failure_cards || '<p>无失败用例。</p>'}
  <script>
    function toggle(id) {
      const el = document.getElementById(id)
      if (!el) return
      el.style.display = el.style.display === 'block' ? 'none' : 'block'
    }
  </script>
</body>
</html>`
}

export function writeReports(input: ReportInput): { json: string; html: string; markdown: string } {
  const report = buildReport(input)
  const timestamp = new Date().toISOString().replaceAll(':', '-')
  const json_path = join(input.config.report.output_dir, `report_${timestamp}.json`)
  const html_path = join(input.config.report.output_dir, `report_${timestamp}.html`)
  const markdown_path = join(input.config.report.output_dir, `report_${timestamp}.md`)

  writeFileSync(json_path, JSON.stringify(report, null, 2), 'utf-8')
  writeFileSync(html_path, buildHtml(report), 'utf-8')
  writeFileSync(markdown_path, buildMarkdown(report), 'utf-8')

  return {
    json: json_path,
    html: html_path,
    markdown: markdown_path,
  }
}
