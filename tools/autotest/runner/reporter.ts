/**
 * Reporter - HTML and JSON report generation
 *
 * Generates self-contained HTML reports with dark theme,
 * step screenshots, collapsible case cards, and summary statistics.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CaseResult, StepResult, AutotestConfig } from './types.js';

export interface ReportData {
  config: AutotestConfig;
  results: CaseResult[];
  summary: { total: number; pass: number; fail: number; skip: number };
  startedAt: number;
  finishedAt: number;
}

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
