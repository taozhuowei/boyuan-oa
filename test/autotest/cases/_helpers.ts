/**
 * Shared test step helpers
 * Purpose: Avoid repetition of login/navigation sequences across cases
 */
import type { TestStep } from '../../../tools/autotest/runner/types.js';

/**
 * Generate login steps starting at stepId 1.
 * Caller uses startId to offset subsequent steps.
 */
export function loginSteps(
  username: string,
  password: string,
  startId = 1,
): TestStep[] {
  return [
    { id: startId, desc: '打开登录页', action: 'navigate', to: '/login' },
    {
      id: startId + 1,
      desc: '输入工号/手机号',
      action: 'fill',
      locator: { by: 'label', value: '工号 / 手机号' },
      value: username,
    },
    {
      id: startId + 2,
      desc: '输入密码',
      action: 'fill',
      locator: { by: 'label', value: '登录密码' },
      value: password,
    },
    {
      id: startId + 3,
      desc: '点击登录按钮',
      action: 'click',
      locator: { by: 'catch', value: 'login-form-submit' },
    },
    {
      id: startId + 4,
      desc: '等待跳转到工作台',
      action: 'assert',
      check: { type: 'url_contains', value: '/' },
    },
  ];
}

/**
 * Standard test users from dev seed data.
 */
export const USERS = {
  ceo: { username: 'ceo.demo', password: '123456' },
  hr: { username: 'hr.demo', password: '123456' },
  finance: { username: 'finance.demo', password: '123456' },
  pm: { username: 'pm.demo', password: '123456' },
  employee: { username: 'employee.demo', password: '123456' },
  worker: { username: 'worker.demo', password: '123456' },
} as const;

export type UserRole = keyof typeof USERS;

/**
 * Navigate to a path via sidebar menu click (stable) or direct URL (fast).
 * Default uses direct URL for speed.
 */
export function gotoPath(stepId: number, path: string, desc?: string): TestStep {
  return {
    id: stepId,
    desc: desc ?? `导航到 ${path}`,
    action: 'navigate',
    to: path,
  };
}

/**
 * Assert sidebar menu item is visible (for role-based menu tests).
 */
export function assertSidebarMenu(stepId: number, menuText: string): TestStep {
  return {
    id: stepId,
    desc: `侧边栏应显示"${menuText}"菜单`,
    action: 'assert',
    check: { type: 'text_visible', value: menuText },
  };
}

/**
 * Assert sidebar menu item is absent (negative permission check).
 */
export function assertSidebarMenuAbsent(stepId: number, menuText: string): TestStep {
  return {
    id: stepId,
    desc: `侧边栏不应显示"${menuText}"菜单`,
    action: 'assert',
    check: { type: 'text_absent', value: menuText },
  };
}
