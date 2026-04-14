/**
 * Reporter - HTML and JSON report generation
 *
 * Generates self-contained HTML reports with dark theme,
 * step screenshots, collapsible case cards, and summary statistics.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CaseResult, StepResult, AutotestConfig, TestCase, TestStep } from './types.js';

export interface ReportData {
  config: AutotestConfig;
  results: CaseResult[];
  summary: { total: number; pass: number; fail: number; skip: number };
  startedAt: number;
  finishedAt: number;
}

// =============================================================================
// New failure report types (T6)
// =============================================================================

interface FailureReport {
  report_version: string;
  generated_at: string;
  project: string;
  base_url: string;
  total: number;
  pass: number;
  fail: number;
  skip: number;
  failures: FailureItem[];
}

interface FailureItem {
  case_id: string;
  title: string;
  description: string;
  module: string;
  priority: string;
  roles: string[];
  fail_step: any;
  action_path: ActionPathItem[];
  error: ErrorInfo;
  locator_hint: LocatorHint | null;
  screenshot_base64: string | null;
  url_at_failure: string | null;
  browser_console_tail: ConsoleEntry[];
  network_last_requests: NetworkRequest[];
  human_note: string | null;
  reproduction_hint: string;
}

interface ActionPathItem {
  step_id: number;
  desc: string;
  result: string;
}

interface ErrorInfo {
  message: string;
  stack?: string;
  playwright_expected: string | null;
  playwright_actual: string | null;
}

interface LocatorHint {
  by: string;
  value: string;
  fallback_selectors: string[];
  likely_source_file: string | null;
  searched_text: string | null;
}

interface ConsoleEntry {
  level: string;
  ts: string;
  message: string;
}

interface NetworkRequest {
  method: string;
  url: string;
  status: number | null;
  duration_ms: number | null;
}

// =============================================================================
// Legacy helpers
// =============================================================================

export function buildSummary(results: CaseResult[]): { total: number; pass: number; fail: number; skip: number } {
  let pass = 0;
  let fail = 0;
  let skip = 0;
  for (const r of results) {
    const status = r.humanResult ?? r.status;
    if (status === 'pass') pass++;
    else if (status === 'fail') fail++;
    else if (status === 'skip') skip++;
  }
  return { total: results.length, pass, fail, skip };
}

function formatDuration(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (m > 0) return m + 'm ' + s + 's';
  return s + 's';
}

// =============================================================================
// New T6 report generator
// =============================================================================

export function generateReports(
  results: CaseResult[],
  cases: TestCase[],
  meta: { projectName: string; baseUrl: string }
): { json: string; html: string; markdown: string } {
  const summary = buildSummary(results);
  const failures: FailureItem[] = [];

  for (const r of results) {
    const status = r.humanResult ?? r.status;
    if (status !== 'fail') continue;

    const testCase = cases.find((c) => c.id === r.caseId);
    if (!testCase) continue;

    const failStepResult = r.steps.find((s) => s.status === 'fail');
    const failStepId = failStepResult?.stepId ?? (r.steps[r.steps.length - 1]?.stepId);
    const failStepDef = testCase.steps.find((s) => s.id === failStepId);

    const actionPath: ActionPathItem[] = testCase.steps.map((step) => {
      const stepResult = r.steps.find((sr) => sr.stepId === step.id);
      return {
        step_id: step.id,
        desc: step.desc,
        result: stepResult?.status ?? 'skip',
      };
    });

    const errorInfo = parseErrorInfo(failStepResult?.error ?? 'Unknown error');
    const locatorHint = buildLocatorHint(failStepDef, testCase.module);
    const screenshot = failStepResult?.screenshot
      ? `data:image/png;base64,${failStepResult.screenshot}`
      : null;

    failures.push({
      case_id: testCase.id,
      title: testCase.title,
      description: testCase.description,
      module: testCase.module,
      priority: testCase.priority,
      roles: testCase.roles ?? [],
      fail_step: failStepDef ? { ...failStepDef } : null,
      action_path: actionPath,
      error: errorInfo,
      locator_hint: locatorHint,
      screenshot_base64: screenshot,
      url_at_failure: null,
      browser_console_tail: [],
      network_last_requests: [],
      human_note: r.humanNote ?? null,
      reproduction_hint: buildReproductionHint(failStepDef, locatorHint),
    });
  }

  const report: FailureReport = {
    report_version: '1.0',
    generated_at: new Date().toISOString(),
    project: meta.projectName,
    base_url: meta.baseUrl,
    total: summary.total,
    pass: summary.pass,
    fail: summary.fail,
    skip: summary.skip,
    failures,
  };

  const json = JSON.stringify(report, null, 2);
  const html = buildFailureHtml(report);
  const markdown = buildFailureMarkdown(report);

  return { json, html, markdown };
}

function parseErrorInfo(rawError: string): ErrorInfo {
  let expected: string | null = null;
  let actual: string | null = null;
  const msg = rawError;

  if (msg.includes('waiting for locator') && msg.includes('to be visible')) {
    expected = 'locator visible';
    actual = 'locator not found';
  } else if (msg.includes('Expected URL to contain')) {
    const m = msg.match(/Expected URL to contain "([^"]+)" but got "([^"]+)"/);
    if (m) {
      expected = `URL contains "${m[1]}"`;
      actual = m[2];
    }
  } else if (msg.includes('Expected URL')) {
    const m = msg.match(/Expected URL "([^"]+)" but got "([^"]+)"/);
    if (m) {
      expected = m[1];
      actual = m[2];
    }
  } else if (msg.includes('Expected title to contain')) {
    const m = msg.match(/Expected title to contain "([^"]+)" but got "([^"]+)"/);
    if (m) {
      expected = `title contains "${m[1]}"`;
      actual = m[2];
    }
  } else {
    const m = msg.match(/Expected (.+?) but got (.+)/);
    if (m) {
      expected = m[1].trim();
      actual = m[2].trim();
    }
  }

  return {
    message: msg,
    playwright_expected: expected,
    playwright_actual: actual,
  };
}

function buildLocatorHint(step: TestStep | undefined, module: string): LocatorHint | null {
  if (!step) return null;

  let locator: any = null;
  if ('locator' in step && step.locator) {
    locator = step.locator;
  } else if ('check' in step && step.check && 'locator' in step.check) {
    locator = step.check.locator;
  }

  if (!locator) return null;

  const by = locator.by;
  const value = locator.value ?? locator.role ?? locator.name ?? '';
  const fallbackSelectors: string[] = [];

  if (by === 'catch') {
    fallbackSelectors.push(`[data-catch='${value}']`);
    fallbackSelectors.push('.ant-alert-error');
    fallbackSelectors.push(`text=/错误|失败|error/i`);
  } else if (by === 'testid') {
    fallbackSelectors.push(`[data-testid='${value}']`);
  } else if (by === 'css') {
    fallbackSelectors.push(value);
  } else if (by === 'role') {
    const name = locator.name ? `, name="${locator.name}"` : '';
    fallbackSelectors.push(`role=${value}${name}`);
  } else if (by === 'text') {
    fallbackSelectors.push(`text="${value}"`);
  } else if (by === 'label') {
    fallbackSelectors.push(`label="${value}"`);
  } else if (by === 'placeholder') {
    fallbackSelectors.push(`[placeholder="${value}"]`);
  }

  // Add module-specific generic fallback
  if (module === 'auth' || module === 'login') {
    fallbackSelectors.push('form button[type="submit"]');
  }

  return {
    by,
    value,
    fallback_selectors: Array.from(new Set(fallbackSelectors)),
    likely_source_file: null,
    searched_text: null,
  };
}

function buildReproductionHint(step: TestStep | undefined, locatorHint: LocatorHint | null): string {
  if (!step) return '建议：1) 检查前置步骤是否已通过；2) 确认页面已加载完成；3) 查看错误截图定位问题。';

  const hints: string[] = [];

  if ('locator' in step && step.locator) {
    hints.push(`确认 ${step.locator.by}="${(step.locator as any).value || (step.locator as any).name || ''}" 对应的元素存在于 DOM 中`);
    if (step.locator.by === 'catch') {
      hints.push('确认 data-catch 属性已在源码中正确绑定');
    }
  }

  if (step.action === 'assert') {
    hints.push('检查断言条件是否与当前页面状态一致');
  }

  if (step.action === 'navigate') {
    hints.push('确认目标 URL 可访问且路由配置正确');
  }

  if (hints.length === 0) {
    hints.push('检查前置步骤是否已通过');
    hints.push('确认页面已加载完成');
  }

  return '建议：1) ' + hints.join('；2) ') + '。';
}

function buildFailureHtml(report: FailureReport): string {
  const s = report;
  const failuresHtml = report.failures.map((f, idx) => {
    const screenshotSection = f.screenshot_base64
      ? `<div class="screenshot-wrap">
          <button class="toggle-btn" onclick="toggle('ss-${idx}')">Toggle Screenshot</button>
          <div id="ss-${idx}" class="collapsible">
            <img src="${escapeHtml(f.screenshot_base64)}" alt="screenshot">
          </div>
        </div>`
      : '';

    const stackSection = f.error.stack
      ? `<div class="stack-wrap">
          <button class="toggle-btn" onclick="toggle('st-${idx}')">Toggle Stack Trace</button>
          <pre id="st-${idx}" class="collapsible">${escapeHtml(f.error.stack)}</pre>
        </div>`
      : '';

    return `<div class="failure">
      <div class="failure-header">
        <span class="badge badge-fail">FAIL</span>
        <strong>${escapeHtml(f.case_id)}</strong>
        <span class="title">${escapeHtml(f.title)}</span>
        <span class="meta">${escapeHtml(f.priority)} · ${escapeHtml(f.module)}</span>
      </div>
      <div class="failure-body">
        <p><strong>Description:</strong> ${escapeHtml(f.description)}</p>
        <p><strong>Failed step:</strong> #${f.fail_step?.id ?? '?'} "${escapeHtml(f.fail_step?.desc ?? '')}"</p>
        <p><strong>Error:</strong> ${escapeHtml(f.error.message)}</p>
        ${f.locator_hint ? `<p><strong>Locator:</strong> ${escapeHtml(f.locator_hint.by)}="${escapeHtml(f.locator_hint.value)}"</p>` : ''}
        ${screenshotSection}
        ${stackSection}
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(report.project)} Failure Report</title>
<style>
  :root {
    --bg-0: #0B0D10;
    --bg-1: #15181D;
    --bg-2: #1C2027;
    --line: #242830;
    --text-1: #E6EAF0;
    --text-2: #8A94A6;
    --text-3: #596273;
    --brand: #5EB8FF;
    --pass: #5CE68D;
    --fail: #FF5E62;
  }
  body { font-family: 'IBM Plex Sans', -apple-system, sans-serif; background: var(--bg-0); color: var(--text-1); padding: 24px; margin: 0; font-size: 13px; }
  h1 { color: var(--brand); margin-bottom: 4px; font-size: 18px; }
  .meta-bar { color: var(--text-2); margin-bottom: 24px; }
  .summary { display: flex; gap: 16px; margin-bottom: 24px; }
  .stat { background: var(--bg-1); border: 1px solid var(--line); border-radius: 8px; padding: 16px 24px; text-align: center; min-width: 80px; }
  .stat .num { font-size: 24px; font-weight: bold; }
  .btn { background: var(--bg-2); color: var(--text-1); border: 1px solid var(--line); padding: 8px 14px; border-radius: 6px; cursor: pointer; }
  .btn:hover { border-color: var(--brand); }
  .failure { background: var(--bg-1); border: 1px solid var(--line); border-radius: 8px; margin-bottom: 16px; overflow: hidden; }
  .failure-header { padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--line); }
  .failure-body { padding: 12px 16px; color: var(--text-2); }
  .failure-body p { margin: 6px 0; }
  .badge { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-fail { background: rgba(255,94,98,0.15); color: var(--fail); }
  .title { color: var(--text-1); font-weight: 600; }
  .toggle-btn { margin-top: 8px; background: transparent; border: 1px solid var(--line); color: var(--text-2); padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px; }
  .toggle-btn:hover { color: var(--text-1); border-color: var(--text-3); }
  .collapsible { display: none; margin-top: 8px; }
  .collapsible.open { display: block; }
  .screenshot-wrap img { max-width: 100%; border: 1px solid var(--line); border-radius: 4px; }
  .stack-wrap pre { background: var(--bg-0); border: 1px solid var(--line); padding: 10px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; color: var(--fail); }
</style>
</head>
<body>
  <h1>${escapeHtml(report.project)} Failure Report</h1>
  <div class="meta-bar">${escapeHtml(report.base_url)} · Generated at ${escapeHtml(report.generated_at)}</div>
  <div class="summary">
    <div class="stat"><div class="num">${report.total}</div><div>Total</div></div>
    <div class="stat"><div class="num" style="color:var(--pass)">${report.pass}</div><div>Pass</div></div>
    <div class="stat"><div class="num" style="color:var(--fail)">${report.fail}</div><div>Fail</div></div>
    <div class="stat"><div class="num">${report.skip}</div><div>Skip</div></div>
  </div>
  <button class="btn" onclick="downloadJson()">Download JSON</button>
  <h2 style="margin-top:24px;font-size:15px;">Failures (${report.failures.length})</h2>
  ${failuresHtml || '<p style="color:var(--text-3)">No failures.</p>'}
  <script>
    const reportJson = ${JSON.stringify(JSON.stringify(report))};
    function toggle(id) {
      const el = document.getElementById(id);
      el.classList.toggle('open');
    }
    function downloadJson() {
      const blob = new Blob([reportJson], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'report_${Date.now()}.json';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  </script>
</body>
</html>`;
}

function buildFailureMarkdown(report: FailureReport): string {
  const lines: string[] = [];
  lines.push(`# Failure Report — ${report.project}`);
  lines.push('');
  lines.push(`- **Base URL**: ${report.base_url}`);
  lines.push(`- **Generated at**: ${report.generated_at}`);
  lines.push(`- **Summary**: Total ${report.total} | Pass ${report.pass} | Fail ${report.fail} | Skip ${report.skip}`);
  lines.push('');

  for (const f of report.failures) {
    lines.push(`### FAIL ${f.case_id} — ${f.title} [${f.priority} · ${f.module}]`);
    lines.push(`**Role**: ${f.roles.join(', ') || '—'}`);
    lines.push(`**Description**: ${f.description}`);
    lines.push(`**Failed step**: #${f.fail_step?.id ?? '?'} "${f.fail_step?.desc ?? ''}"`);
    lines.push(`**Error**: ${f.error.message}`);
    if (f.locator_hint?.likely_source_file) {
      lines.push(`**Likely source**: ${f.locator_hint.likely_source_file}`);
    }
    if (f.locator_hint && f.locator_hint.fallback_selectors.length > 0) {
      lines.push(`**Fallback selectors**: ${f.locator_hint.fallback_selectors.join(' | ')}`);
    }
    const pathSymbols = f.action_path.map((a) => {
      if (a.result === 'pass') return `${a.step_id}✓`;
      if (a.result === 'fail') return `${a.step_id}✗`;
      return `${a.step_id}−`;
    }).join(' → ');
    lines.push(`**Action path**: ${pathSymbols}`);
    lines.push(`**Screenshot**: ${f.screenshot_base64 ? 'embedded base64' : 'none'}`);
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// Legacy report generator (kept for compatibility)
// =============================================================================

export function generateReport(data: ReportData, outputDir: string): { htmlPath: string; jsonPath: string } {
  mkdirSync(outputDir, { recursive: true });
  const ts = Date.now();
  const jsonPath = join(outputDir, 'report_' + ts + '.json');
  const htmlPath = join(outputDir, 'report_' + ts + '.html');

  writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf-8');

  const html = buildHtml(data);
  writeFileSync(htmlPath, html, 'utf-8');

  return { htmlPath, jsonPath };
}

function buildHtml(data: ReportData): string {
  const s = data.summary;
  const projectName = data.config.name;
  const baseUrl = data.config.base_url;
  const runAt = new Date(data.startedAt).toLocaleString();
  const durationMs = data.finishedAt - data.startedAt;

  const head = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(projectName) + ' Test Report</title><style>' +
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#0d1117;color:#e6edf3;padding:24px;margin:0}' +
    'h1{color:#58a6ff;margin-bottom:4px}' +
    '.meta{color:#8b949e;font-size:13px;margin-bottom:24px}' +
    '.summary{display:flex;gap:16px;margin-bottom:32px}' +
    '.stat{background:#161b22;border-radius:8px;padding:16px 24px;text-align:center}' +
    '.stat .num{font-size:32px;font-weight:bold}' +
    '.pass{color:#3fb950}.fail{color:#f85149}.skip{color:#8b949e}.total{color:#58a6ff}' +
    '.case-card{background:#161b22;border:1px solid #30363d;border-radius:8px;margin-bottom:16px;overflow:hidden}' +
    '.case-header{padding:12px 16px;cursor:pointer;display:flex;align-items:center;gap:12px;user-select:none}' +
    '.case-header:hover{background:#1f2937}' +
    '.badge{padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600}' +
    '.badge-pass{background:#1a4731;color:#3fb950}.badge-fail{background:#4d1a1a;color:#f85149}' +
    '.badge-skip{background:#2d2d2d;color:#8b949e}.badge-p0{background:#4d1a1a;color:#f85149}' +
    '.badge-p1{background:#4d3a1a;color:#e3b341}.badge-p2{background:#1a2d4d;color:#58a6ff}' +
    '.steps{display:none;padding:0 16px 16px;border-top:1px solid #30363d}' +
    '.steps.open{display:block}' +
    '.step{padding:8px 0;border-bottom:1px solid #21262d;display:flex;gap:12px;align-items:flex-start}' +
    '.step:last-child{border-bottom:none}' +
    '.step-status{font-size:14px;width:18px;flex-shrink:0}' +
    '.step-info{flex:1}' +
    '.step-desc{font-size:13px}' +
    '.step-meta{font-size:11px;color:#8b949e;margin-top:2px}' +
    '.step-error{background:#2d1a1a;border-left:3px solid #f85149;padding:8px;margin-top:6px;font-family:monospace;font-size:11px;color:#f85149;border-radius:2px;white-space:pre-wrap}' +
    '.thumb{max-width:200px;max-height:120px;cursor:pointer;border-radius:4px;margin-top:6px;border:1px solid #30363d}' +
    '.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:100;justify-content:center;align-items:center}' +
    '.modal.open{display:flex}' +
    '.modal img{max-width:90vw;max-height:90vh;border-radius:8px}' +
    '.note{background:#1a2d1a;border-left:3px solid #3fb950;padding:8px;margin-top:6px;font-size:12px;color:#8b949e}' +
    '</style></head><body>';

  const header = '<h1>' + escapeHtml(projectName) + ' Test Report</h1>' +
    '<div class="meta">Run at: ' + escapeHtml(runAt) + ' | Base URL: ' + escapeHtml(baseUrl) + ' | Duration: ' + formatDuration(durationMs) + '</div>';

  const summary = '<div class="summary">' +
    '<div class="stat"><div class="num total">' + s.total + '</div><div>Total</div></div>' +
    '<div class="stat"><div class="num pass">' + s.pass + '</div><div>Pass</div></div>' +
    '<div class="stat"><div class="num fail">' + s.fail + '</div><div>Fail</div></div>' +
    '<div class="stat"><div class="num skip">' + s.skip + '</div><div>Skip</div></div>' +
    '</div>';

  let casesHtml = '';
  for (const r of data.results) {
    casesHtml += buildCaseHtml(r);
  }

  const modal = '<div class="modal" id="imgModal"><img id="modalImg" src="" alt="screenshot"></div>';

  const script = '<script>' +
    'function toggleSteps(id){var el=document.getElementById("steps-"+id);el.classList.toggle("open")}' +
    'function openModal(src){document.getElementById("modalImg").src=src;document.getElementById("imgModal").classList.add("open")}' +
    'document.getElementById("imgModal").addEventListener("click",function(){this.classList.remove("open")})' +
    '</' + 'script></body></html>';

  return head + header + summary + casesHtml + modal + script;
}

function buildCaseHtml(r: CaseResult): string {
  const status = r.humanResult ?? r.status;
  const statusClass = status === 'pass' ? 'badge-pass' : status === 'fail' ? 'badge-fail' : 'badge-skip';
  const stepCount = r.steps ? r.steps.length : 0;
  const caseDuration = r.finishedAt ? r.finishedAt - r.startedAt : 0;

  let html = '<div class="case-card">';
  html += '<div class="case-header" onclick="toggleSteps(\'' + escapeHtml(r.caseId) + '\')">';
  html += '<span class="badge ' + statusClass + '">' + String(status).toUpperCase() + '</span>';
  html += '<strong>' + escapeHtml(r.caseId) + '</strong>';
  if (r.humanNote) {
    html += ' <small style="color:#8b949e">(note)</small>';
  }
  html += '<span style="margin-left:auto;color:#8b949e;font-size:12px">' + stepCount + ' steps, ' + formatDuration(caseDuration) + '</span>';
  html += '</div>';

  html += '<div class="steps" id="steps-' + escapeHtml(r.caseId) + '">';
  if (r.humanNote) {
    html += '<div class="note">' + escapeHtml(r.humanNote) + '</div>';
  }
  if (r.steps) {
    for (const step of r.steps) {
      html += buildStepHtml(step);
    }
  }
  html += '</div></div>';

  return html;
}

function buildStepHtml(step: StepResult): string {
  let icon = '';
  if (step.status === 'pass') icon = '<span style="color:#3fb950">&#10003;</span>';
  else if (step.status === 'fail') icon = '<span style="color:#f85149">&#10007;</span>';
  else if (step.status === 'skip') icon = '<span style="color:#8b949e">&#8211;</span>';
  else icon = '<span style="color:#58a6ff">&#9679;</span>';

  let html = '<div class="step">';
  html += '<span class="step-status">' + icon + '</span>';
  html += '<div class="step-info">';
  html += '<div class="step-desc">Step ' + step.stepId + '</div>';
  html += '<div class="step-meta">' + step.status + ' ' + step.durationMs + 'ms</div>';
  if (step.error) {
    html += '<div class="step-error">' + escapeHtml(step.error) + '</div>';
  }
  if (step.screenshot) {
    const src = 'data:image/png;base64,' + step.screenshot;
    html += '<img class="thumb" src="' + src + '" onclick="openModal(this.src)" alt="screenshot">';
  }
  html += '</div></div>';

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
