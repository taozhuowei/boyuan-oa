/**
 * API 集成测试
 * 运行: node test/integration/api.test.js
 */

const BASE_URL = 'http://localhost:8082/api';

// 测试账号
const TEST_ACCOUNTS = {
  employee: { username: 'employee.demo', password: '123456' },
  worker: { username: 'worker.demo', password: '123456' },
  finance: { username: 'finance.demo', password: '123456' },
  pm: { username: 'pm.demo', password: '123456' },
  ceo: { username: 'ceo.demo', password: '123456' }
};

// 简单的 HTTP 请求工具
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

// 登录获取 Token
async function login(role) {
  const { status, data } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_ACCOUNTS[role])
  });
  if (status !== 200 || !data?.token) {
    throw new Error(`Login failed for ${role}: ${status}`);
  }
  return data.token;
}

// 测试套件
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 OA API 集成测试\n');
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (err) {
      console.log(`❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 结果: ${passed} 通过, ${failed} 失败`);
  process.exit(failed > 0 ? 1 : 0);
}

// ========== 测试用例 ==========

// 认证测试
test('POST /auth/login - 正确账号密码应返回 token', async () => {
  const { status, data } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_ACCOUNTS.ceo)
  });
  if (status !== 200) throw new Error(`期望 200, 得到 ${status}`);
  if (!data.token) throw new Error('未返回 token');
});

test('POST /auth/login - 错误密码应返回 401', async () => {
  const { status } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'ceo.demo', password: 'wrong' })
  });
  if (status !== 401) throw new Error(`期望 401, 得到 ${status}`);
});

// 权限测试
test('GET /payroll/cycles - 财务应可访问', async () => {
  const token = await login('finance');
  const { status } = await request('/payroll/cycles', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (status !== 200) throw new Error(`期望 200, 得到 ${status}`);
});

test('POST /payroll/cycles/1/settle - CEO 不应能执行结算', async () => {
  const token = await login('ceo');
  const { status } = await request('/payroll/cycles/1/settle', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  // CEO 不应该能执行结算，应该返回 403
  if (status !== 403 && status !== 404) throw new Error(`期望 403/404, 得到 ${status}`);
});

// 表单测试
test('GET /forms/config?formType=LEAVE - 应返回表单配置', async () => {
  const token = await login('employee');
  const { status, data } = await request('/forms/config?formType=LEAVE', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (status !== 200) throw new Error(`期望 200, 得到 ${status}`);
  if (!data.formType) throw new Error('未返回表单配置');
});

test('POST /forms/leave - 员工应可提交请假', async () => {
  const token = await login('employee');
  const { status, data } = await request('/forms/leave', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      formData: { leaveType: '年假', days: 1, reason: '测试' },
      remark: ''
    })
  });
  if (status !== 200) throw new Error(`期望 200, 得到 ${status}`);
  if (!data.id) throw new Error('未返回表单 ID');
});

// 角色权限测试
test('POST /forms/injury - 普通员工不应可提交工伤', async () => {
  const token = await login('employee');
  const { status } = await request('/forms/injury', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      formData: { injuryDate: '2024-01-01', medicalFee: 100 },
      remark: ''
    })
  });
  if (status !== 403) throw new Error(`期望 403, 得到 ${status}`);
});

test('POST /forms/injury - 劳工应可提交工伤', async () => {
  const token = await login('worker');
  const { status } = await request('/forms/injury', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      formData: { injuryDate: '2024-01-01', medicalFee: 100 },
      remark: ''
    })
  });
  if (status !== 200) throw new Error(`期望 200, 得到 ${status}`);
});

// 运行测试
runTests();
