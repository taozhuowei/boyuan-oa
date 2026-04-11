// OA System Page Accessibility Test Script
// Uses Playwright to test all page routes

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://127.0.0.1:3000';
const API_URL = 'http://127.0.0.1:8080';
const SCREENSHOT_DIR = './test_results/screenshots';

// Pages to test
const PAGES_TO_TEST = [
  { path: '/', name: '首页' },
  { path: '/login', name: '登录页' },
  { path: '/me', name: '个人中心' },
  { path: '/me/password', name: '修改密码' },
  { path: '/todo', name: '待办' },
  { path: '/notifications', name: '通知' },
  { path: '/projects', name: '项目列表' },
  { path: '/projects/1', name: '项目详情' },
  { path: '/construction-log', name: '施工日志' },
  { path: '/construction-log/templates', name: '日志模板' },
  { path: '/employees', name: '员工管理' },
  { path: '/org', name: '组织架构' },
  { path: '/positions', name: '岗位管理' },
  { path: '/role', name: '角色管理' },
  { path: '/forms', name: '表单管理' },
  { path: '/payroll', name: '工资条' },
  { path: '/payroll/signature-bind', name: '签名绑定' },
  { path: '/retention', name: '保留金' },
  { path: '/setup', name: '系统设置' },
  { path: '/config', name: '系统配置' },
  { path: '/operation-logs', name: '操作日志' },
  { path: '/attendance', name: '考勤' },
  { path: '/directory', name: '人员名录' },
  { path: '/injury', name: '工伤申报' },
];

const results = {
  accessible: [],
  notFound404: [],
  permissionDenied: [],
  error: [],
  loginRequired: [],
  details: []
};

async function testPage(browser, pageInfo, isAuthenticated = false, context = null) {
  const page = context ? await context.newPage() : await browser.newPage();
  const url = `${BASE_URL}${pageInfo.path}`;
  const startTime = Date.now();
  
  try {
    console.log(`\nTesting: ${pageInfo.name} (${url})`);
    
    // Navigate with timeout
    const response = await page.goto(url, { 
      waitUntil: 'networkidle', 
      timeout: 15000 
    });
    
    const loadTime = Date.now() - startTime;
    const status = response ? response.status() : 'unknown';
    const finalUrl = page.url();
    
    // Wait a bit for SPA rendering
    await page.waitForTimeout(1000);
    
    // Get page title
    const title = await page.title().catch(() => 'No title');
    
    // Check for 404 indicators
    const pageContent = await page.content();
    const has404Indicator = pageContent.includes('404') || 
                           pageContent.includes('Not Found') ||
                           pageContent.includes('页面不存在') ||
                           title.includes('404');
    
    // Check for login page (redirected to login)
    const isLoginPage = finalUrl.includes('/login') && pageInfo.path !== '/login';
    
    // Take screenshot
    const screenshotName = `${isAuthenticated ? 'auth_' : 'noauth_'}${pageInfo.path.replace(/\//g, '_').replace(/^_$/, 'index')}.png`;
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
    const result = {
      name: pageInfo.name,
      path: pageInfo.path,
      url: finalUrl,
      status: status,
      loadTime: loadTime,
      title: title,
      screenshot: screenshotPath,
      isAuthenticated
    };
    
    if (isLoginPage) {
      results.loginRequired.push(pageInfo);
      result.category = 'login_required';
      console.log(`  -> LOGIN REQUIRED (redirected to ${finalUrl})`);
    } else if (has404Indicator || status === 404) {
      results.notFound404.push(pageInfo);
      result.category = '404';
      console.log(`  -> 404 NOT FOUND`);
    } else if (status >= 500) {
      results.error.push(pageInfo);
      result.category = 'error';
      console.log(`  -> SERVER ERROR (${status})`);
    } else {
      results.accessible.push(pageInfo);
      result.category = 'accessible';
      console.log(`  -> OK (${loadTime}ms, status: ${status})`);
    }
    
    results.details.push(result);
    
  } catch (err) {
    console.log(`  -> ERROR: ${err.message}`);
    results.error.push(pageInfo);
    results.details.push({
      name: pageInfo.name,
      path: pageInfo.path,
      error: err.message,
      category: 'error',
      isAuthenticated
    });
  } finally {
    await page.close();
  }
}

async function performLogin(browser) {
  console.log('\n=== Attempting to Login ===');
  const page = await browser.newPage();
  
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    // Get snapshot to find elements
    const inputs = await page.$$('input');
    const buttons = await page.$$('button');
    
    console.log(`Found ${inputs.length} inputs, ${buttons.length} buttons`);
    
    // Try to find username/password inputs
    const usernameInput = await page.$('input[type="text"], input[name="username"], input[placeholder*="用户"], input[placeholder*="账号"], input[placeholder*="手机"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitButton = await page.$('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
    
    if (!usernameInput || !passwordInput) {
      console.log('Could not find login form elements');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login_form.png') });
      await page.close();
      return null;
    }
    
    // Try common test credentials
    const testCredentials = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: '123456' },
      { username: '13800138000', password: '123456' },
      { username: '13800138001', password: '123456' },
      { username: 'test', password: 'test' },
    ];
    
    for (const cred of testCredentials) {
      console.log(`Trying: ${cred.username} / ${cred.password}`);
      
      await usernameInput.fill(cred.username);
      await passwordInput.fill(cred.password);
      
      if (submitButton) {
        await submitButton.click();
      } else {
        await passwordInput.press('Enter');
      }
      
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        console.log(`Login successful with ${cred.username}`);
        
        // Get storage state for reuse
        const storageState = await page.context().storageState();
        await page.close();
        return storageState;
      }
      
      // Clear inputs for next attempt
      await usernameInput.fill('');
      await passwordInput.fill('');
    }
    
    console.log('All login attempts failed');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'login_failed.png') });
    await page.close();
    return null;
    
  } catch (err) {
    console.log(`Login error: ${err.message}`);
    await page.close();
    return null;
  }
}

async function generateReport() {
  const reportPath = './test_results/accessibility_report.md';
  
  let report = `# OA System Page Accessibility Test Report

**Test Time:** ${new Date().toISOString()}
**Base URL:** ${BASE_URL}
**API URL:** ${API_URL}

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| Accessible | ${results.accessible.length} | ${((results.accessible.length / PAGES_TO_TEST.length) * 100).toFixed(1)}% |
| 404 Not Found | ${results.notFound404.length} | ${((results.notFound404.length / PAGES_TO_TEST.length) * 100).toFixed(1)}% |
| Login Required | ${results.loginRequired.length} | ${((results.loginRequired.length / PAGES_TO_TEST.length) * 100).toFixed(1)}% |
| Server Error | ${results.error.length} | ${((results.error.length / PAGES_TO_TEST.length) * 100).toFixed(1)}% |
| Permission Denied | ${results.permissionDenied.length} | ${((results.permissionDenied.length / PAGES_TO_TEST.length) * 100).toFixed(1)}% |

---

## 404 Pages (Not Found)

${results.notFound404.length > 0 
  ? results.notFound404.map(p => `- **${p.name}** (${p.path})`).join('\n')
  : 'No 404 pages found.'}

---

## Login Required Pages

${results.loginRequired.length > 0 
  ? results.loginRequired.map(p => `- **${p.name}** (${p.path})`).join('\n')
  : 'No pages requiring login found.'}

---

## Server Errors

${results.error.length > 0 
  ? results.error.map(p => `- **${p.name}** (${p.path})`).join('\n')
  : 'No server errors found.'}

---

## Detailed Results

| Page | Path | Status | Load Time | Category | Screenshot |
|------|------|--------|-----------|----------|------------|
`;

  for (const detail of results.details) {
    report += `| ${detail.name} | ${detail.path} | ${detail.status || detail.error || 'N/A'} | ${detail.loadTime || 'N/A'}ms | ${detail.category} | [View](./screenshots/${path.basename(detail.screenshot || '')}) |\n`;
  }
  
  report += `

---

## Screenshot Directory

All screenshots are saved in: \`./test_results/screenshots/\`

## Notes

- Pages marked as "login_required" redirected to the login page when accessed without authentication
- 404 pages indicate routes that do not exist or are not properly configured
- Server errors indicate backend issues
`;
  
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`\nReport saved to: ${reportPath}`);
}

async function main() {
  console.log('=== OA System Page Accessibility Test ===\n');
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
  
  const browser = await chromium.launch({ headless: true });
  
  try {
    // Test without authentication first
    console.log('=== Testing WITHOUT Authentication ===');
    for (const pageInfo of PAGES_TO_TEST) {
      await testPage(browser, pageInfo, false);
    }
    
    // Try to login
    const authState = await performLogin(browser);
    
    if (authState) {
      console.log('\n=== Testing WITH Authentication ===');
      const context = await browser.newContext({ storageState: authState });
      
      for (const pageInfo of PAGES_TO_TEST) {
        // Skip login page for authenticated test
        if (pageInfo.path === '/login') continue;
        await testPage(browser, pageInfo, true, context);
      }
      
      await context.close();
    } else {
      console.log('\n=== Authentication failed, skipping authenticated tests ===');
    }
    
    // Generate report
    await generateReport();
    
  } finally {
    await browser.close();
  }
  
  // Print summary
  console.log('\n=== Test Summary ===');
  console.log(`Total pages tested: ${PAGES_TO_TEST.length}`);
  console.log(`Accessible: ${results.accessible.length}`);
  console.log(`404 Not Found: ${results.notFound404.length}`);
  console.log(`Login Required: ${results.loginRequired.length}`);
  console.log(`Server Error: ${results.error.length}`);
  console.log(`Permission Denied: ${results.permissionDenied.length}`);
}

main().catch(console.error);
