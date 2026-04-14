import type { TestCase } from '../../../../tools/autotest/runner/types.js';

export default {
  id: 'TC-SYS-08',
  title: '在登录页表单中注入 XSS payload 被转义不执行',
  module: 'system',
  priority: 'P1',
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '在用户名输入框输入 XSS payload', action: 'fill', locator: { by: 'label', value: '用户名', exact: false }, value: '<script>alert(1)</script>' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'label', value: '密码', exact: false }, value: '123456' },
    { id: 4, desc: '点击登录', action: 'click', locator: { by: 'text', value: '登录', exact: false } },
    { id: 5, desc: '等待响应', action: 'wait', ms: 1000 },
    { id: 6, desc: '断言页面没有 alert 弹窗（通过检查仍在登录页）', action: 'assert', check: { type: 'url_contains', value: '/login' } },
    { id: 7, desc: '断言显示账号不存在或格式错误提示', action: 'assert', check: { type: 'text_visible', value: '账号' } },
  ],
  expect: { result: 'pass' },
} satisfies TestCase;
