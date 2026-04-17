/**
 * Boyuan OA — 补充测试：初始化流程 + 登录异常 + 表单边界值
 *
 * 每个用例独立重置页面，避免 Toast/状态污染。
 * Usage: node run_edge_tests.js   (from repo root)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4134';
const SS_DIR = path.join(__dirname, 'screenshots');
const results = [];
let ssIdx = 0;

function ssPath(id) {
  return path.join(SS_DIR, `edge_${String(ssIdx++).padStart(3, '0')}_${id}.png`);
}

function log(tag, id, desc) {
  const sym = tag === 'PASS' ? '✓' : tag === 'FAIL' ? '✗' : '·';
  console.log(`  [${sym}] ${id}: ${desc}`);
}

async function record(page, id, desc, passed, extra = {}) {
  const p = ssPath(id);
  await page.screenshot({ path: p, fullPage: false });
  const r = { id, desc, passed, screenshot: path.basename(p), url: page.url(), ...extra };
  results.push(r);
  log(passed === true ? 'PASS' : passed === false ? 'FAIL' : 'INFO', id, desc);
  return r;
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Wait for a FRESH toast after an action (dismisses old ones first) */
async function waitFreshToast(page, action, timeout = 4000) {
  // Dismiss all existing toasts by waiting for them to clear
  await page.evaluate(() => {
    document.querySelectorAll('.ant-message-notice').forEach(el => el.remove());
  }).catch(() => {});
  try { await action(); } catch (e) { /* action may throw (timeout etc), ignore */ }
  try {
    await page.waitForSelector('.ant-message-notice-content', { timeout });
    return await page.locator('.ant-message-notice-content').first().innerText({ timeout: 2000 });
  } catch { return ''; }
}

async function getFormErrors(page) {
  return page.locator('.ant-form-item-explain-error').allInnerTexts().catch(() => []);
}

async function resetToUninit() {
  await fetch('http://localhost:8080/api/dev/reset-setup', { method: 'POST' });
}
async function resetToInit() {
  await fetch('http://localhost:8080/api/dev/reset', { method: 'POST' });
}

async function newPage(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return [await ctx.newPage(), ctx];
}

// ─── BLOCK 1: Setup Wizard ─────────────────────────────────────────────────────
async function testSetup(browser) {
  console.log('\n=== BLOCK 1: Setup Wizard ===');

  // S01 + S02: uninit redirect checks
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1200);
    await record(page, 'S01_uninit_root',
      `未初始化访问/ → 实际: ${page.url()}`,
      page.url().includes('/setup'));
    await ctx.close();
  }
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1200);
    await record(page, 'S02_uninit_login',
      `未初始化访问/login → 实际: ${page.url()}`,
      page.url().includes('/setup'));
    await ctx.close();
  }

  // S03: Step 1 empty submit
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);
    const toast = await waitFreshToast(page,
      () => page.locator('[data-catch="setup-step1-next"]').click());
    await record(page, 'S03_step1_empty', `空提交→Toast: "${toast}"`, toast.includes('CEO姓名'), { toast });
    await ctx.close();
  }

  // S04: Missing phone
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);
    await page.fill('[data-catch="setup-ceo-name"]', '测试管理员');
    const toast = await waitFreshToast(page,
      () => page.locator('[data-catch="setup-step1-next"]').click());
    await record(page, 'S04_step1_no_phone', `填名不填手机→Toast: "${toast}"`, toast.includes('手机号'), { toast });
    await ctx.close();
  }

  // S05: Password too short (3 chars)
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);
    await page.fill('[data-catch="setup-ceo-name"]', '测试管理员');
    await page.fill('[data-catch="setup-ceo-phone"]', '13800138000');
    await page.fill('[data-catch="setup-ceo-password"]', '123');
    await page.fill('input[placeholder*="再次输入"]', '123');
    const toast = await waitFreshToast(page,
      () => page.locator('[data-catch="setup-step1-next"]').click());
    const e = await record(page, 'S05_step1_pw_short', `密码3位→Toast: "${toast}"`,
      toast.includes('8位') || toast.includes('密码'), { toast });
    if (!e.passed) e.note = 'BUG: 密码长度< 8位未被正确提示';
    await ctx.close();
  }

  // S06: Password mismatch
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);
    await page.fill('[data-catch="setup-ceo-name"]', '测试管理员');
    await page.fill('[data-catch="setup-ceo-phone"]', '13800138000');
    await page.fill('[data-catch="setup-ceo-password"]', 'Password@2026');
    await page.fill('input[placeholder*="再次输入"]', 'DifferentPass@2026');
    const toast = await waitFreshToast(page,
      () => page.locator('[data-catch="setup-step1-next"]').click());
    await record(page, 'S06_step1_pw_mismatch', `密码不一致→Toast: "${toast}"`,
      toast.includes('不一致'), { toast });
    await ctx.close();
  }

  // S07: Invalid phone format (letters)
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);
    await page.fill('[data-catch="setup-ceo-name"]', '测试管理员');
    await page.fill('[data-catch="setup-ceo-phone"]', 'abcdefghijk');  // non-digit phone
    await page.fill('[data-catch="setup-ceo-password"]', 'Password@2026');
    await page.fill('input[placeholder*="再次输入"]', 'Password@2026');
    const toast = await waitFreshToast(page,
      () => page.locator('[data-catch="setup-step1-next"]').click());
    const e = await record(page, 'S07_step1_invalid_phone', `非数字手机号→Toast: "${toast}"`,
      toast.includes('手机') || toast.includes('格式') || toast.includes('11'), { toast });
    if (!e.passed) e.note = `BUG: 手机号"abcdefghijk"未被格式校验，Toast="${toast}"（系统接受非数字手机号）`;
    await ctx.close();
  }

  // S08–S18: Complete full setup flow
  await resetToUninit();
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(500);

    // Step 1: valid data
    await page.fill('[data-catch="setup-ceo-name"]', '测试CEO');
    await page.fill('[data-catch="setup-ceo-phone"]', '13800138001');
    await page.fill('[data-catch="setup-ceo-password"]', 'TestCeo@2026');
    await page.fill('input[placeholder*="再次输入"]', 'TestCeo@2026');
    await page.locator('[data-catch="setup-step1-next"]').click();
    await sleep(1000);
    const step2OK = await page.locator('text=创建HR账号').isVisible().catch(() => false);
    await record(page, 'S08_step1_to_step2', `第1步有效→进入第2步: ${step2OK}`, step2OK);

    // Step 2: HR
    if (step2OK) {
      await page.fill('input[placeholder*="HR姓名"]', '测试HR');
      await page.fill('input[placeholder*="HR手机号"]', '13900139001');
      await page.locator('button:has-text("下一步")').first().click();
      await sleep(800);
      await record(page, 'S09_step2_to_step3', '第2步→第3步（可选人员）',
        await page.locator('text=可选人员配置').isVisible().catch(() => false));

      // Step 3: skip optional
      await page.locator('button:has-text("跳过")').first().click();
      await sleep(800);
      await record(page, 'S10_step3_skip', '第3步跳过→确认页',
        await page.locator('text=确认信息').isVisible().catch(() => false));

      // Step 4: submit to backend
      // Note: Ant Design Vue inserts a space in 2-char CJK button text ("提 交"), use regex
      const submitBtn = page.locator('.step-actions .ant-btn-primary, button[type="button"].ant-btn-primary').last();
      const toast4 = await waitFreshToast(page,
        () => submitBtn.click({ timeout: 10000 }), 8000).catch(() => '');
      await sleep(3000);
      const step5OK = await page.locator('text=恢复码').isVisible().catch(() => false);
      await record(page, 'S11_step4_submit', `第4步提交→恢复码页: ${step5OK}，Toast: "${toast4}"`, step5OK);

      if (step5OK) {
        // Step 5: recovery code — next button should be disabled without checkbox
        const nextBtn = page.locator('button:has-text("下一步")').first();
        const isDisabled = await nextBtn.isDisabled().catch(() => false);
        const code = await page.locator('[data-catch="setup-recovery-code"]').innerText().catch(() => '');
        await record(page, 'S12_step5_no_checkbox',
          `恢复码未勾选复选框→下一步应禁用: ${isDisabled}，恢复码: "${code.substring(0, 20)}..."`,
          isDisabled, { recoveryCode: code });

        // Check checkbox and proceed
        await page.locator('.ant-checkbox-input, input[type="checkbox"]').first().check();
        await sleep(300);
        await nextBtn.click();
        await sleep(600);
        await record(page, 'S13_step5_checked', '勾选并继续→进入第6步',
          await page.locator('text=自定义角色').isVisible().catch(() => false));

        // Steps 6-9: skip each
        const skipLabels = ['自定义角色', '员工批量导入', '组织架构', '全局配置'];
        for (let i = 0; i < 4; i++) {
          const skipBtn = page.locator('button:has-text("跳过")').first();
          if (await skipBtn.count() > 0) await skipBtn.click();
          else await page.locator('button:has-text("下一步")').first().click().catch(() => {});
          await sleep(600);
          await record(page, `S1${4 + i}_step${6 + i}_skip`, `第${6 + i}步（${skipLabels[i]}）跳过`, null);
        }

        // Final: "完成初始化"
        const finishBtn = page.locator('button:has-text("完成初始化")');
        if (await finishBtn.count() > 0) {
          await finishBtn.click();
          await sleep(2000);
          await record(page, 'S18_finish', `完成初始化→实际: ${page.url()}`,
            page.url().includes('/login'));
        }
      }
    }
    await ctx.close();
  }
}

// ─── BLOCK 2: Login Boundary Tests ────────────────────────────────────────────
async function testLogin(browser) {
  console.log('\n=== BLOCK 2: Login 异常/边界测试 ===');
  await resetToInit();

  async function loginTest(id, desc, username, password, expectedBlock) {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(400);
    const submitBtn = page.locator('button[type="submit"]');

    if (username !== null) await page.fill('input[type="text"]', username);
    if (password !== null) await page.fill('input[type="password"]', password);

    const toast = await waitFreshToast(page, () => submitBtn.click(), 3000);
    await sleep(1500);
    const isBlocked = page.url().includes('/login') || page.url().includes('/setup');
    const formErrs = await getFormErrors(page);

    const passed = expectedBlock ? (isBlocked || formErrs.length > 0 || toast !== '') : !isBlocked;
    const e = await record(page, id, `${desc} | blocked=${isBlocked} toast="${toast}" formErrs=${formErrs.length}`,
      passed, { toast, formErrors: formErrs });
    await ctx.close();
    return e;
  }

  await loginTest('L01_empty_both', '空用户名+空密码', null, null, true);
  await loginTest('L02_empty_username', '空用户名+有效密码', null, '123456', true);
  await loginTest('L03_empty_password', '有效用户名+空密码', 'ceo.demo', null, true);
  await loginTest('L04_wrong_username', '不存在用户名', 'ghost.nobody.xyz', '123456', true);
  await loginTest('L05_wrong_password', '正确用户名+错误密码', 'ceo.demo', 'wrongpass999', true);

  const sqlR = await loginTest('L06_sql_injection', "SQL注入", "' OR '1'='1' --", '123456', true);
  if (!sqlR.passed) sqlR.severity = 'CRITICAL: SQL注入绕过登录';

  const xssR = await loginTest('L07_xss_username', 'XSS用户名', "<script>alert('xss')</script>", '123456', true);
  if (!xssR.passed) xssR.severity = 'HIGH: XSS输入绕过登录';

  const longR = await loginTest('L08_long_username', '300字符超长用户名', 'a'.repeat(300), '123456', true);
  if (!longR.passed) longR.note = 'BUG: 超长用户名未被前端输入限制拦截';

  await loginTest('L09_valid_login', '正常登录ceo.demo/123456', 'ceo.demo', '123456', false);

  // L10: Unauth access to protected route
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/employees', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1500);
    await record(page, 'L10_unauth_access', `未登录访问/employees→实际: ${page.url()}`,
      page.url().includes('/login'));
    await ctx.close();
  }

  // L11: Privilege escalation (employee → admin pages)
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(400);
    await page.fill('input[type="text"]', 'employee.demo');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').click({ timeout: 10000 });
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });

    for (const target of ['/operation-logs', '/config', '/role', '/data-export', '/employees']) {
      await page.goto(BASE_URL + target, { waitUntil: 'networkidle', timeout: 20000 });
      await sleep(1200);
      const blocked = !new URL(page.url()).pathname.startsWith(target);
      await record(page, `L11_escalation${target.replace(/\//g, '_')}`,
        `employee越权访问${target}→blocked=${blocked}，实际:${page.url()}`, blocked);
    }
    await ctx.close();
  }
}

// ─── BLOCK 3: Form Boundary Value Tests ───────────────────────────────────────
async function testForms(browser) {
  console.log('\n=== BLOCK 3: 表单边界值测试 ===');
  await resetToInit();

  // ── 3A: Change Password ─────────────────────────────────────────────────────
  console.log('\n  -- 3A: 修改密码 --');
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.fill('input[type="text"]', 'ceo.demo');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').click({ timeout: 10000 });
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
    await page.goto(BASE_URL + '/me/password', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(800);

    const submit = () => page.locator('button[type="submit"], button:has-text("确认修改"), button:has-text("保存"), button:has-text("提交")').first().click({ timeout: 5000 }).catch(() => {});
    const pwInputs = page.locator('input[type="password"]');
    const cnt = await pwInputs.count();

    // F_P01: Empty
    const toast_p01 = await waitFreshToast(page, submit, 3000);
    const ferrs_p01 = await getFormErrors(page);
    await record(page, 'F_P01_pw_empty', `密码表单空提交→errs:${ferrs_p01.length}个，Toast:"${toast_p01}"`,
      ferrs_p01.length > 0 || toast_p01 !== '', { toast: toast_p01, formErrors: ferrs_p01 });

    // F_P02: Wrong current password
    if (cnt >= 3) {
      await pwInputs.nth(0).fill('WrongCurrent@999');
      await pwInputs.nth(1).fill('NewPass@2026');
      await pwInputs.nth(2).fill('NewPass@2026');
    }
    const toast_p02 = await waitFreshToast(page, submit, 4000);
    await sleep(1000);
    const e_p02 = await record(page, 'F_P02_pw_wrong_current',
      `错误当前密码→Toast:"${toast_p02}"，应提示密码不正确`,
      toast_p02 !== '' && (toast_p02.includes('密码') || toast_p02.includes('错误') || toast_p02.includes('不正确')),
      { toast: toast_p02 });
    if (!e_p02.passed) e_p02.note = `BUG: 错误当前密码提交无明确错误提示，Toast="${toast_p02}"`;

    // F_P03: Confirm mismatch
    if (cnt >= 3) {
      await pwInputs.nth(0).fill('123456');
      await pwInputs.nth(1).fill('NewPass@2026');
      await pwInputs.nth(2).fill('MismatchPass@2026');
    }
    const toast_p03 = await waitFreshToast(page, submit, 2000);
    const ferrs_p03 = await getFormErrors(page);
    await record(page, 'F_P03_pw_confirm_mismatch',
      `确认密码不一致→errs:${ferrs_p03.length}个"${ferrs_p03[0] || ''}"，Toast:"${toast_p03}"`,
      ferrs_p03.length > 0 || toast_p03.includes('不一致'),
      { toast: toast_p03, formErrors: ferrs_p03 });

    // F_P04: Too short (3 chars)
    if (cnt >= 3) {
      await pwInputs.nth(0).fill('123456');
      await pwInputs.nth(1).fill('abc');
      await pwInputs.nth(2).fill('abc');
    }
    const toast_p04 = await waitFreshToast(page, submit, 2000);
    const ferrs_p04 = await getFormErrors(page);
    const e_p04 = await record(page, 'F_P04_pw_too_short',
      `3字符新密码→errs:${ferrs_p04.length}个，Toast:"${toast_p04}"，应有长度校验`,
      ferrs_p04.length > 0 || toast_p04.includes('8位') || toast_p04.includes('密码'),
      { toast: toast_p04, formErrors: ferrs_p04 });
    if (!e_p04.passed) e_p04.note = 'BUG: 新密码无最小长度校验';

    await ctx.close();
  }

  // ── 3B: Employee Create Form (CEO) ─────────────────────────────────────────
  console.log('\n  -- 3B: 新增员工表单 --');
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.fill('input[type="text"]', 'ceo.demo');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').click({ timeout: 10000 });
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
    await page.goto(BASE_URL + '/employees', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1500);

    const addBtn = page.locator('button:has-text("新增员工")');
    if (await addBtn.count() > 0) {
      await addBtn.click();
      await sleep(1000);
      const modalSubmit = () =>
        page.locator('.ant-modal-footer .ant-btn-primary, button:has-text("确定"), button:has-text("保存")').first()
          .click({ timeout: 5000 }).catch(() => {});

      // F_E01: Empty submit
      const toast_e01 = await waitFreshToast(page, modalSubmit, 2000);
      const ferrs_e01 = await getFormErrors(page);
      await record(page, 'F_E01_employee_empty',
        `新增员工空提交→${ferrs_e01.length}个错误:${ferrs_e01.slice(0, 3).join('|')}，Toast:"${toast_e01}"`,
        ferrs_e01.length > 0 || toast_e01 !== '',
        { formErrors: ferrs_e01, toast: toast_e01 });

      // F_E02: Invalid ID card
      const idInput = page.locator('input[placeholder*="身份证"]');
      if (await idInput.count() > 0) {
        await idInput.fill('12345');
        const toast_e02 = await waitFreshToast(page, modalSubmit, 2000);
        const ferrs_e02 = await getFormErrors(page);
        const e_e02 = await record(page, 'F_E02_employee_invalid_id',
          `5位身份证号→errs:${ferrs_e02.join('|')}，Toast:"${toast_e02}"`,
          ferrs_e02.some(e => e.includes('身份证') || e.includes('18') || e.includes('格式')),
          { formErrors: ferrs_e02 });
        if (!e_e02.passed) e_e02.note = 'BUG: 无效身份证格式未被前端校验';
      }

      // F_E03: XSS in name field (observe if rendered safely)
      const nameInput = page.locator('input[placeholder*="姓名"]').first();
      if (await nameInput.count() > 0) {
        const xssStr = "<script>alert('xss')</script>";
        await nameInput.fill(xssStr);
        await sleep(300);
        const val = await nameInput.inputValue();
        const e_e03 = await record(page, 'F_E03_employee_xss_name',
          `XSS姓名输入，input实际值:"${val.substring(0, 40)}"`,
          null, { inputValue: val });
        e_e03.note = val === xssStr
          ? 'INFO: 前端接受XSS输入（依赖后端转义），需验证后端存储和展示是否安全'
          : 'INFO: 前端已过滤XSS内容';
      }

      await page.keyboard.press('Escape');
      await sleep(500);
    } else {
      results.push({ id: 'F_E01', desc: '新增员工按钮未找到（后端403导致列表为空）', passed: false });
      console.log('  [✗] 新增员工按钮未找到，跳过');
    }
    await ctx.close();
  }

  // ── 3C: Expense Apply Form (employee) ──────────────────────────────────────
  console.log('\n  -- 3C: 报销申请表单 --');
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.fill('input[type="text"]', 'employee.demo');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').click({ timeout: 10000 });
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
    await page.goto(BASE_URL + '/expense/apply', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1500);

    const submitExp = () =>
      page.locator('button[type="submit"], button:has-text("提交申请"), button:has-text("提交")').first()
        .click({ timeout: 5000 }).catch(() => {});

    // F_X01: Empty submit
    const toast_x01 = await waitFreshToast(page, submitExp, 3000);
    const ferrs_x01 = await getFormErrors(page);
    await record(page, 'F_X01_expense_empty',
      `报销申请空提交→${ferrs_x01.length}个错误，Toast:"${toast_x01}"`,
      ferrs_x01.length > 0 || toast_x01 !== '',
      { formErrors: ferrs_x01, toast: toast_x01 });

    const amtInput = page.locator('input[placeholder*="金额"]').first();
    if (await amtInput.count() > 0) {
      // F_X02: Negative amount
      await amtInput.fill('-100');
      await sleep(300);
      const val_x02 = await amtInput.inputValue();
      const e_x02 = await record(page, 'F_X02_expense_negative',
        `金额=-100，input实际值:"${val_x02}"`,
        !val_x02.includes('-'), { inputValue: val_x02 });
      if (val_x02.includes('-')) e_x02.note = 'BUG: 负数金额未被前端输入控件拦截';

      // F_X03: Zero amount
      await amtInput.fill('0');
      const toast_x03 = await waitFreshToast(page, submitExp, 2000);
      const ferrs_x03 = await getFormErrors(page);
      const e_x03 = await record(page, 'F_X03_expense_zero',
        `金额=0提交→errs:${ferrs_x03.join('|')}，Toast:"${toast_x03}"`,
        ferrs_x03.some(e => /[>大于]/.test(e)) || toast_x03 !== '',
        { formErrors: ferrs_x03, toast: toast_x03 });
      if (!e_x03.passed) e_x03.note = 'BUG: 金额=0未被前端校验';

      // F_X04: Very large
      await amtInput.fill('9999999999');
      await sleep(300);
      const val_x04 = await amtInput.inputValue();
      await record(page, 'F_X04_expense_huge', `金额=99亿，input接受:"${val_x04}"`, null,
        { note: '需确认是否有金额上限校验' });
    }
    await ctx.close();
  }

  // ── 3D: Attendance Leave Form ───────────────────────────────────────────────
  console.log('\n  -- 3D: 请假申请表单 --');
  {
    const [page, ctx] = await newPage(browser);
    await page.goto(BASE_URL + '/login', { waitUntil: 'networkidle', timeout: 20000 });
    await page.fill('input[type="text"]', 'employee.demo');
    await page.fill('input[type="password"]', '123456');
    await page.locator('button[type="submit"]').click({ timeout: 10000 });
    await page.waitForFunction(() => !window.location.href.includes('/login'), { timeout: 15000 });
    await page.goto(BASE_URL + '/attendance', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(1000);

    const leaveTab = page.locator('.ant-tabs-tab:has-text("请假申请")');
    if (await leaveTab.count() > 0) {
      await leaveTab.click();
      await sleep(600);
      const startBtn = page.locator('button:has-text("发起请假"), button:has-text("申请")').first();
      if (await startBtn.count() > 0) {
        await startBtn.click();
        await sleep(800);

        const submitLeave = () =>
          page.locator('.ant-modal-footer .ant-btn-primary, button:has-text("提交"), button:has-text("确定")').first()
            .click({ timeout: 5000 }).catch(() => {});

        // F_A01: Empty submit
        const toast_a01 = await waitFreshToast(page, submitLeave, 3000);
        const ferrs_a01 = await getFormErrors(page);
        const e_a01 = await record(page, 'F_A01_leave_empty',
          `请假申请空提交→errs:${ferrs_a01.length}个，Toast:"${toast_a01}"`,
          ferrs_a01.length > 0 || toast_a01 !== '',
          { formErrors: ferrs_a01, toast: toast_a01 });
        if (toast_a01.includes('404') || toast_a01.includes('leave-types')) {
          e_a01.note = 'BUG-05 confirmed: leave-types API 404导致请假无法正常使用';
        }

        await page.keyboard.press('Escape').catch(() => {});
      } else {
        results.push({ id: 'F_A01', desc: '发起请假按钮未找到', passed: false });
      }
    } else {
      results.push({ id: 'F_A01', desc: '请假申请Tab未找到', passed: false });
    }
    await ctx.close();
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    await testSetup(browser);
    await testLogin(browser);
    await testForms(browser);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(__dirname, 'edge_results.json'), JSON.stringify(results, null, 2));
  const pass = results.filter(r => r.passed === true).length;
  const fail = results.filter(r => r.passed === false).length;
  const info = results.filter(r => r.passed === null).length;
  console.log(`\n=== Done. ✓${pass} ✗${fail} ·${info}  Total:${results.length} ===`);
  console.log(`Results: edge_results.json`);
}
main().catch(err => { console.error('Fatal:', err); process.exit(1); });
