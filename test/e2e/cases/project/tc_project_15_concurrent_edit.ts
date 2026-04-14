import type { TestCase } from '../../../tools/autotest/runner/types';

const tc: TestCase = {
  id: 'TC-PROJ-15',
  title: 'PM 和 CEO 同时修改同一项目进度',
  module: 'project',
  priority: 'P2',
  credentials: { username: 'pm.demo', password: '123456' },
  steps: [
    { id: 1, desc: 'PM登录', action: 'navigate', to: '/login' },
    { id: 2, desc: '输入用户名', action: 'fill', locator: { by: 'placeholder', value: '用户名' }, value: '{{credentials.username}}' },
    { id: 3, desc: '输入密码', action: 'fill', locator: { by: 'placeholder', value: '密码' }, value: '{{credentials.password}}' },
    { id: 4, desc: '点击登录', action: 'click', locator: { by: 'role', role: 'button', name: '登录' } },
    { id: 5, desc: '等待跳转', action: 'wait', ms: 1500 },
    { id: 6, desc: '导航到项目详情页', action: 'navigate', to: '/projects/1' },
    { id: 7, desc: '并发修改进度', action: 'parallel', contexts: [
      [
        { id: 71, desc: 'PM编辑进度', action: 'click', locator: { by: 'role', role: 'button', name: '编辑进度' } },
        { id: 72, desc: 'PM输入60', action: 'fill', locator: { by: 'placeholder', value: '进度' }, value: '60' },
        { id: 73, desc: 'PM保存', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
      ],
      [
        { id: 81, desc: 'CEO编辑进度', action: 'click', locator: { by: 'role', role: 'button', name: '编辑进度' } },
        { id: 82, desc: 'CEO输入80', action: 'fill', locator: { by: 'placeholder', value: '进度' }, value: '80' },
        { id: 83, desc: 'CEO保存', action: 'click', locator: { by: 'role', role: 'button', name: '保存' } },
      ],
    ]},
    { id: 8, desc: '断言至少一人收到冲突提示', action: 'assert', check: { type: 'text_visible', value: '冲突' } },
  ],
  expect: { result: 'pass' },
};

export default tc;
