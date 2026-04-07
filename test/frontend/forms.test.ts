/**
 * utils/forms.ts 单元测试
 *
 * 覆盖：getAvailableFormOptions（纯函数，按用户角色/类型返回可用表单列表）
 */
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/utils/http', () => ({ request: vi.fn() }))

import { getAvailableFormOptions } from '@/utils/forms'
import type { SessionUser } from '@shared/types'

// 辅助：构造最小 SessionUser
function makeUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    username: 'test',
    displayName: '测试用户',
    role: 'employee',
    roleName: '员工',
    department: '综合管理部',
    employeeType: 'OFFICE',
    status: '在线值守',
    userId: null,
    positionId: null,
    ...overrides
  }
}

describe('getAvailableFormOptions', () => {
  it('user 为 null 时只返回 office 表单（LEAVE / OVERTIME）', () => {
    const options = getAvailableFormOptions(null)
    expect(options).toHaveLength(2)
    expect(options.map((o) => o.code)).toEqual(expect.arrayContaining(['LEAVE', 'OVERTIME']))
  })

  it('OFFICE 员工返回 2 种表单，不含 INJURY / LOG', () => {
    const options = getAvailableFormOptions(makeUser({ employeeType: 'OFFICE' }))
    expect(options).toHaveLength(2)
    expect(options.map((o) => o.code)).not.toContain('INJURY')
    expect(options.map((o) => o.code)).not.toContain('LOG')
  })

  it('role=worker 用户返回 4 种表单（含 INJURY / LOG）', () => {
    const options = getAvailableFormOptions(makeUser({ role: 'worker', employeeType: 'OFFICE' }))
    expect(options).toHaveLength(4)
    expect(options.map((o) => o.code)).toContain('INJURY')
    expect(options.map((o) => o.code)).toContain('LOG')
  })

  it('employeeType=LABOR 用户返回 4 种表单', () => {
    const options = getAvailableFormOptions(makeUser({ role: 'employee', employeeType: 'LABOR' }))
    expect(options).toHaveLength(4)
  })

  it('employeeType=劳工（中文）用户返回 4 种表单', () => {
    const options = getAvailableFormOptions(makeUser({ role: 'employee', employeeType: '劳工' }))
    expect(options).toHaveLength(4)
  })
})
