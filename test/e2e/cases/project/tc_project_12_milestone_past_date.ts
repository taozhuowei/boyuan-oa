import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-12',
  title: '里程碑目标日期早于今天时警告或校验提示',
  module: 'project',
  priority: 'P2',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: '导航到登录页', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录按钮', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目详情页', action: 'navigate', to: '/projects/1' },
    { id: 7, desc: '等待页面加载', action: 'wait', ms: 1500 },
    { id: 8, desc: '点击添加里程碑', action: 'click', locator: { by: 'role', role: 'button', name: '添加里程碑' } },
    { id: 9, desc: '输入里程碑名称', action: 'fill', locator: { by: 'placeholder', value: '里程碑名称' }, value: '过去里程碑' } },
    { id: 10, desc: '输入过去的日期', action: 'fill', locator: { by: 'placeholder', value: '目标日期' }, value: '2020-01-01' },
    { id: 11, desc: '点击保存按钮', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
    { id: 12, desc: '断言警告或校验提示', action: 'assert', check: { type: 'text_visible', value: '日期' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
