/**
 * Boyuan OA — Full-role manual browser test script
 * Runs headless Playwright against http://localhost:4134
 * Saves screenshots to ./screenshots/ and writes a JSON issues log.
 *
 * Usage: node run_tests.js   (from repo root)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4134';
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');
const ISSUES_FILE = path.join(__dirname, 'issues.json');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

// ─── Role definitions ────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'ceo',
    username: 'ceo.demo',
    password: '123456',
    pages: [
      '/',
      '/employees',
      '/org',
      '/positions',
      '/role',
      '/directory',
      '/config',
      '/operation-logs',
      '/data-export',
      '/data-viewer',
      '/projects',
      '/attendance',
      '/payroll',
      '/forms',
      '/allowances',
      '/me',
      '/me/password',
    ],
  },
  {
    id: 'hr',
    username: 'hr.demo',
    password: '123456',
    pages: [
      '/',
      '/employees',
      '/leave-types',
      '/attendance',
      '/directory',
      '/positions',
      '/payroll',
      '/forms',
      '/me',
    ],
  },
  {
    id: 'finance',
    username: 'finance.demo',
    password: '123456',
    pages: [
      '/',
      '/expense/records',
      '/payroll',
      '/injury',
      '/forms',
      '/me',
    ],
  },
  {
    id: 'pm',
    username: 'pm.demo',
    password: '123456',
    pages: [
      '/',
      '/projects',
      '/construction-log',
      '/team',
      '/forms',
      '/attendance',
      '/me',
    ],
  },
  {
    id: 'dept_manager',
    username: 'dept_manager.demo',
    password: '123456',
    pages: [
      '/',
      '/team',
      '/attendance',
      '/forms',
      '/me',
    ],
  },
  {
    id: 'employee',
    username: 'employee.demo',
    password: '123456',
    pages: [
      '/',
      '/attendance',
      '/expense/apply',
      '/forms',
      '/me',
    ],
  },
  {
    id: 'worker',
    username: 'worker.demo',
    password: '123456',
    pages: [
      '/',
      '/attendance',
      '/forms',
      '/me',
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function screenshotName(roleId, routePath, suffix = '') {
  const safe = routePath.replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'home';
  return path.join(SCREENSHOT_DIR, `${roleId}${safe}${suffix}.png`);
}

async function dismissViteOverlay(page) {
  try {
    const overlay = page.locator('vite-error-overlay');
    if (await overlay.count() > 0) {
      await overlay.locator('button[aria-label="Close"]').click({ timeout: 1000 }).catch(() => {});
      await page.keyboard.press('Escape');
    }
  } catch (_) { /* ignore */ }
}

async function login(page, username, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await dismissViteOverlay(page);
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', password);
  await dismissViteOverlay(page);
  await page.click('button[type="submit"]', { timeout: 10000 });
  // Wait for redirect away from /login
  await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });
  const allIssues = [];

  for (const role of ROLES) {
    console.log(`\n=== Testing role: ${role.id} (${role.username}) ===`);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Collect console errors per page
    const pendingConsole = [];
    page.on('console', msg => {
      if (msg.type() === 'error') pendingConsole.push(`[console.error] ${msg.text()}`);
    });
    page.on('pageerror', err => pendingConsole.push(`[pageerror] ${err.message}`));

    // Login
    try {
      await login(page, role.username, role.password);
      await page.screenshot({ path: screenshotName(role.id, '/login', '_after'), fullPage: false });
      console.log(`  [OK] Login succeeded → ${page.url()}`);
      pendingConsole.length = 0; // clear login noise
    } catch (err) {
      console.log(`  [FAIL] Login failed: ${err.message.split('\n')[0]}`);
      await page.screenshot({ path: screenshotName(role.id, '/login', '_fail'), fullPage: false }).catch(() => {});
      allIssues.push({ role: role.id, page: '/login', type: 'LOGIN_FAIL', detail: err.message.split('\n')[0] });
      await context.close();
      continue;
    }

    // Visit each page
    for (const routePath of role.pages) {
      const url = `${BASE_URL}${routePath}`;
      pendingConsole.length = 0;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1500);
        await dismissViteOverlay(page);

        const finalUrl = page.url();
        const title = await page.title().catch(() => '');
        const ssPath = screenshotName(role.id, routePath);
        await page.screenshot({ path: ssPath, fullPage: true });

        // 1. Route guard redirect
        const finalPath = new URL(finalUrl).pathname;
        const expectedPath = routePath === '/' ? '/' : routePath;
        const wasRedirected = !finalPath.startsWith(expectedPath) && expectedPath !== '/';
        if (wasRedirected) {
          allIssues.push({
            role: role.id, page: routePath, type: 'ACCESS_DENIED',
            detail: `Redirected to ${finalPath}`,
            screenshot: path.basename(ssPath),
          });
          console.log(`  [REDIRECT] ${routePath} → ${finalPath}`);
          continue;
        }

        // 2. 404 / Nuxt error page
        const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
        const has404 = title.includes('404') || bodyText.includes('Page not found') || bodyText.includes('页面不存在');
        if (has404) {
          allIssues.push({
            role: role.id, page: routePath, type: 'NOT_FOUND',
            detail: `Title: "${title}"`,
            screenshot: path.basename(ssPath),
          });
          console.log(`  [404] ${routePath}`);
          continue;
        }

        // 3. Error overlay / ant-result-error
        const errCount = await page.locator('.ant-result-error, .nuxt-error-page').count();
        if (errCount > 0) {
          allIssues.push({
            role: role.id, page: routePath, type: 'ERROR_PAGE',
            detail: 'ant-result-error or nuxt-error-page detected',
            screenshot: path.basename(ssPath),
          });
          console.log(`  [ERROR_PAGE] ${routePath}`);
        }

        // 4. Vite error overlay persists after dismiss
        const viteErr = await page.locator('vite-error-overlay').count();
        if (viteErr > 0) {
          const errText = await page.locator('vite-error-overlay').innerText({ timeout: 2000 }).catch(() => '');
          allIssues.push({
            role: role.id, page: routePath, type: 'VITE_ERROR',
            detail: errText.substring(0, 300),
            screenshot: path.basename(ssPath),
          });
          console.log(`  [VITE_ERROR] ${routePath}`);
        }

        // 5. Console errors
        if (pendingConsole.length > 0) {
          allIssues.push({
            role: role.id, page: routePath, type: 'CONSOLE_ERROR',
            detail: pendingConsole.slice(0, 5).join(' | '),
            screenshot: path.basename(ssPath),
          });
          console.log(`  [CONSOLE] ${routePath}: ${pendingConsole.slice(0, 2).join(', ')}`);
        }

        if (!wasRedirected && errCount === 0 && viteErr === 0) {
          console.log(`  [OK] ${routePath} → title: "${title}"`);
        }
      } catch (err) {
        allIssues.push({
          role: role.id, page: routePath, type: 'LOAD_ERROR',
          detail: err.message.split('\n')[0],
          screenshot: null,
        });
        console.log(`  [LOAD_ERR] ${routePath}: ${err.message.split('\n')[0]}`);
      }
    }

    await context.close();
  }

  await browser.close();
  fs.writeFileSync(ISSUES_FILE, JSON.stringify(allIssues, null, 2));
  console.log(`\n=== Done. ${allIssues.length} issues logged. ===`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
