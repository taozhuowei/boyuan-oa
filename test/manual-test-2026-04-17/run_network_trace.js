/**
 * Network trace: capture exact API URLs that fail (4xx/5xx) per role
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:4134';

// Key pages to probe per role
const PROBE = [
  { role: 'ceo',          username: 'ceo.demo',          pages: ['/config', '/attendance'] },
  { role: 'hr',           username: 'hr.demo',           pages: ['/', '/employees', '/leave-types', '/attendance', '/directory', '/positions', '/forms', '/me'] },
  { role: 'finance',      username: 'finance.demo',      pages: ['/injury', '/expense/apply'] },
  { role: 'pm',           username: 'pm.demo',           pages: ['/team', '/attendance'] },
  { role: 'dept_manager', username: 'dept_manager.demo', pages: ['/', '/attendance'] },
  { role: 'employee',     username: 'employee.demo',     pages: ['/', '/attendance', '/expense/apply', '/forms', '/me'] },
  { role: 'worker',       username: 'worker.demo',       pages: ['/', '/attendance', '/forms', '/me'] },
];

async function login(page, username) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.fill('input[type="text"]', username);
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]', { timeout: 10000 });
  await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const { role, username, pages } of PROBE) {
    results[role] = {};
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    try {
      await login(page, username);
    } catch (e) {
      console.log(`[${role}] login failed`);
      await context.close();
      continue;
    }

    for (const routePath of pages) {
      const failures = [];
      const handler = response => {
        if (response.url().includes('/api/') && response.status() >= 400) {
          const url = new URL(response.url());
          failures.push(`${response.status()} ${url.pathname}${url.search}`);
        }
      };
      page.on('response', handler);
      try {
        await page.goto(`${BASE_URL}${routePath}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(1000);
      } catch (_) {}
      page.off('response', handler);
      if (failures.length > 0) {
        results[role][routePath] = failures;
        console.log(`[${role}] ${routePath}: ${failures.join(', ')}`);
      }
    }
    await context.close();
  }

  require('fs').writeFileSync(
    require('path').join(__dirname, 'network_failures.json'),
    JSON.stringify(results, null, 2)
  );
  console.log('\nDone — network_failures.json written');
}

main().catch(console.error);
