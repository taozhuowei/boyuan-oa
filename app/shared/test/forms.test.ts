/**
 * shared/utils/forms.ts 单元测试
 *
 * 覆盖：getAvailableFormOptions（纯函数，按用户角色/类型返回可用表单列表）
 *
 * 该函数无任何平台依赖，可在 jsdom 或 node 环境中直接运行。
 * 测试覆盖场景：未登录用户、OFFICE 员工、LABOR 员工、劳工角色、中文 employeeType。
 */
import { describe, it, expect } from 'vitest'
import { getAvailableFormOptions } from '../utils'
import type { SessionUser } from '../types'

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

  // TODO(audit): DESIGN.md §8.3 — LOG 入口仅限持有「工长」第二角色的劳工，普通 worker 不可见。
  // 当前 SessionUser 类型（auth.ts）无 secondRole 字段，getAvailableFormOptions 对所有
  // role=worker 开放 LOG，与设计不符。需扩展 SessionUser 类型并修正实现后更新本测试。
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

  it('每个选项均含 code / name / description / icon 字段', () => {
    const options = getAvailableFormOptions(null)
    for (const opt of options) {
      expect(opt.code).toBeTruthy()
      expect(opt.name).toBeTruthy()
      expect(opt.description).toBeTruthy()
      expect(opt.icon).toBeTruthy()
    }
  })

  it('LEAVE 排在 OVERTIME 之前（顺序稳定）', () => {
    const codes = getAvailableFormOptions(null).map((o) => o.code)
    expect(codes.indexOf('LEAVE')).toBeLessThan(codes.indexOf('OVERTIME'))
  })

  it('劳工表单中 INJURY 排在 LOG 之前', () => {
    const codes = getAvailableFormOptions(makeUser({ role: 'worker' })).map((o) => o.code)
    expect(codes.indexOf('INJURY')).toBeLessThan(codes.indexOf('LOG'))
  })
})
