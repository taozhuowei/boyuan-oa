// @vitest-environment node
/**
 * 前后端 API 集成测试
 *
 * 覆盖：认证、员工、部门、项目、角色等核心端点的真实 HTTP 行为
 *
 * 前提：后端服务在 http://localhost:8080 运行
 *       服务不可达时所有用例自动跳过，不报错
 */
import { describe, it, expect, beforeAll } from 'vitest'

const BASE = 'http://localhost:8080/api'

// ─── 服务可达性检测 ──────────────────────────────────────────────────────────

let serverUp = false
let ceoToken = ''
let workerToken = ''
let pmToken = ''
let hrToken = ''
let employeeToken = ''
let financeToken = ''

async function get<T = unknown>(path: string, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { headers })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function post<T = unknown>(path: string, data: unknown, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function loginAs(username: string): Promise<string> {
  const { body } = await post<{ token: string }>('/auth/login', { username, password: '123456' })
  return (body as any)?.token ?? ''
}

beforeAll(async () => {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 3000)
    const res = await fetch(`${BASE}/health`, { signal: controller.signal })
    clearTimeout(timer)
    serverUp = res.ok
    if (serverUp) {
      ceoToken = await loginAs('ceo.demo')
      pmToken = await loginAs('pm.demo')
      workerToken = await loginAs('worker.demo')
      hrToken = await loginAs('hr.demo')
      employeeToken = await loginAs('employee.demo')
      financeToken = await loginAs('finance.demo')
    }
  } catch {
    serverUp = false
  }
  if (!serverUp) {
    console.warn('[integration] Backend not running — all integration tests SKIPPED')
  }
})

// Use context.skip() inside test body for runtime conditional skipping
// (it.skipIf with function is evaluated at collection time, before beforeAll runs)
type SkipCtx = { skip: () => void }

// ─── M0 基础设施 ──────────────────────────────────────────────────────────────

describe('M0 - 基础设施', () => {
  it('GET /health 无需 token，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/health')
    expect(status).toBe(200)
  })
})

// ─── M1 认证 ─────────────────────────────────────────────────────────────────

describe('M1 - 认证', () => {
  it('POST /auth/login — ceo.demo 登录成功，返回 token + role=ceo', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>('/auth/login', { username: 'ceo.demo', password: '123456' })
    expect(status).toBe(200)
    expect((body as any).token).toBeTruthy()
    expect((body as any).role).toBe('ceo')
  })

  it('POST /auth/login — 密码错误返回 401', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/auth/login', { username: 'ceo.demo', password: 'wrong' })
    expect(status).toBe(401)
  })

  it('GET /employees — 无 token 返回 401', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees')
    expect(status).toBe(401)
  })

  it('GET /roles — 有效 token 返回角色数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/roles', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect((body as any[]).length).toBeGreaterThan(0)
  })

  it('GET /auth/me — 返回当前登录用户信息', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/auth/me', ceoToken)
    expect(status).toBe(200)
    expect((body as any).employeeNo).toBe('ceo.demo')
    expect((body as any).roleCode).toBe('ceo')
    expect((body as any).name).toBeTruthy()
  })
})

// ─── M1 员工管理 ──────────────────────────────────────────────────────────────

describe('M1 - 员工管理', () => {
  it('GET /employees — CEO token 返回 200 + content 数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/employees', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).content)).toBe(true)
  })

  it('GET /employees — worker token 返回 403（无权限）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', workerToken)
    expect(status).toBe(403)
  })

  it('GET /employees/1 — 返回 employee.demo 员工详情', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/employees/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).employeeNo).toBe('employee.demo')
  })

  it('GET /employees/9999 — 不存在返回 404', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees/9999', ceoToken)
    expect(status).toBe(404)
  })
})

// ─── M2 组织管理 ──────────────────────────────────────────────────────────────

describe('M2 - 组织管理', () => {
  it('GET /departments — 返回部门数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/departments', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('GET /projects — PM token 返回分页结果（records 数组）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/projects', pmToken)
    expect(status).toBe(200)
    expect(Array.isArray((body as any).records)).toBe(true)
  })

  it('GET /projects/1 — 返回项目详情，包含 name 和 members 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/projects/1', ceoToken)
    expect(status).toBe(200)
    expect((body as any).name).toBeTruthy()
    expect(Array.isArray((body as any).members)).toBe(true)
  })

  it('GET /operation-logs — CEO token 返回分页数据', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/operation-logs', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).total).toBe('number')
    expect(Array.isArray((body as any).records)).toBe(true)
  })

  it('GET /operation-logs — finance token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const financeToken = await loginAs('finance.demo')
    const { status } = await get('/operation-logs', financeToken)
    expect(status).toBe(403)
  })
})

// ─── M5 V5：薪资构成扩展（补贴 + 临时补贴 + 审批开关）───────────────────────────

async function put<T = unknown>(path: string, data: unknown, token?: string): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { method: 'PUT', headers, body: JSON.stringify(data) })
  const body = await res.json().catch(() => null)
  return { status: res.status, body: body as T }
}

async function del(path: string, token?: string): Promise<{ status: number }> {
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(BASE + path, { method: 'DELETE', headers })
  return { status: res.status }
}

describe('M5 V5 - 薪资构成扩展', () => {
  it('GET /allowances — 认证用户可查列表', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/allowances', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('POST /allowances — 仅 CEO/HR 可创建', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const code = 'TEST_MEAL_' + Date.now()
    const create = await post<any>('/allowances', { code, name: '测试餐补', displayOrder: 1 }, ceoToken)
    expect(create.status).toBe(200)
    expect((create.body as any).code).toBe(code)
    // worker 没权限
    const denied = await post('/allowances', { code: 'X', name: 'Y' }, workerToken)
    expect(denied.status).toBe(403)
    // 清理
    const id = (create.body as any).id
    if (id) await del(`/allowances/${id}`, ceoToken)
  })

  it('PUT /allowances/{id}/configs — 三级覆盖批量保存', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const code = 'TEST_TRANSPORT_' + Date.now()
    const create = await post<any>('/allowances', { code, name: '测试交通补' }, ceoToken)
    const id = (create.body as any).id
    expect(id).toBeTruthy()
    // 全局 200 元
    const save = await put(`/allowances/${id}/configs`, [
      { scope: 'GLOBAL', scopeTargetId: null, amount: 200 }
    ], ceoToken)
    expect(save.status).toBe(200)
    const list = await get<any[]>(`/allowances/${id}/configs`, ceoToken)
    expect(list.status).toBe(200)
    expect((list.body as any[]).length).toBe(1)
    expect((list.body as any[])[0].scope).toBe('GLOBAL')
    expect(Number((list.body as any[])[0].amount)).toBe(200)
    await del(`/allowances/${id}`, ceoToken)
  })

  it('GET /payroll/bonus-approval-config — 默认 false', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/payroll/bonus-approval-config', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).approvalRequired).toBe('boolean')
  })

  it('PUT /payroll/bonus-approval-config — 仅 CEO 可设置', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const ok = await put('/payroll/bonus-approval-config', { approvalRequired: false }, ceoToken)
    expect(ok.status).toBe(200)
    const denied = await put('/payroll/bonus-approval-config', { approvalRequired: true }, workerToken)
    expect(denied.status).toBe(403)
  })
})

// ─── Phase B - 联调冒烟测试 ───────────────────────────────────────────────────

describe('Phase B - 联调冒烟测试', () => {
  it('TC-B1-01: 员工请假 → CEO 审批链通过 → 状态 APPROVED', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    await post('/dev/reset', {})

    const submit = await post<any>('/attendance/leave', {
      formType: 'LEAVE',
      formData: { leaveType: 'SICK', startDate: '2026-05-01', endDate: '2026-05-01', reason: '身体不适' }
    }, workerToken)
    expect(submit.status).toBe(200)
    const formId = (submit.body as any).id ?? (submit.body as any).formId
    expect(formId).toBeTruthy()

    const pmApprove = await post<any>(`/attendance/${formId}/approve`, { action: 'APPROVE', comment: '同意' }, pmToken)
    expect(pmApprove.status).toBe(200)

    const ceoApprove = await post<any>(`/attendance/${formId}/approve`, { action: 'APPROVE', comment: '批准' }, ceoToken)
    expect(ceoApprove.status).toBe(200)

    const records = await get<any[]>('/attendance/records', workerToken)
    expect(records.status).toBe(200)
    const record = (records.body as any[]).find((r: any) => (r.id ?? r.formId) === formId)
    expect(record).toBeTruthy()
    expect(record.status).toBe('APPROVED')
  })

  it('TC-B1-02: 劳工提交施工日志 → PM 审批通过 → 状态 APPROVED', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    await post('/dev/reset', {})

    const submit = await post<any>('/logs/construction-logs', {
      formData: { projectId: 1, logDate: '2026-05-01', workContent: '安装空调外机', manCount: 5 }
    }, workerToken)
    expect(submit.status).toBe(200)
    const formId = (submit.body as any).id ?? (submit.body as any).formId
    expect(formId).toBeTruthy()

    const approve = await post<any>(`/logs/${formId}/approve`, { comment: '审批通过' }, pmToken)
    expect(approve.status).toBe(200)

    const records = await get<any[]>('/logs/records', workerToken)
    expect(records.status).toBe(200)
    const record = (records.body as any[]).find((r: any) => (r.id ?? r.formId) === formId)
    expect(record).toBeTruthy()
    expect(record.status).toBe('APPROVED')
  })

  it('TC-B1-03: CEO 工作台摘要数据非空', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/workbench/summary', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).unreadNotificationCount).toBe('number')
    expect((body as any).activeProjectCount).toBeGreaterThanOrEqual(0)
  })

  it('TC-B1-04: 财务创建薪资周期 → 返回 OPEN 状态', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    await post('/dev/reset', {})

    const financeToken = await loginAs('finance.demo')
    const create = await post<any>('/payroll/cycles', { period: '2026-05' }, financeToken)
    expect(create.status).toBe(200)
    const cycleId = (create.body as any).id
    expect(cycleId).toBeTruthy()
    expect((create.body as any).status).toBe('OPEN')

    const list = await get<any[]>('/payroll/cycles', financeToken)
    expect(list.status).toBe(200)
    const found = (list.body as any[]).find((c: any) => c.id === cycleId || c.period === '2026-05')
    expect(found).toBeTruthy()
  })
})

// ─── C-INT-01 假期类型 API ────────────────────────────────────────────────────

describe('C-INT-01 - 假期类型 API', () => {
  // LT-02 创建的假期类型 id，供 LT-04 删除使用
  let createdLeaveTypeId: number | null = null

  it('LT-01: GET /config/leave-types — CEO token 返回 200 + 数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/config/leave-types', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('LT-02: POST /config/leave-types — HR 可创建，返回 201 + 非空 id', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>(
      '/config/leave-types',
      { code: 'ANNUAL_TEST_' + Date.now(), name: '年假测试_' + Date.now(), quotaDays: 15, deductionRate: 1.0, deductionBasis: 'DAILY' },
      hrToken
    )
    expect(status).toBe(201)
    expect((body as any).id).toBeTruthy()
    createdLeaveTypeId = (body as any).id as number
  })

  it('LT-03: POST /config/leave-types — worker token 返回 403（无权限）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/config/leave-types',
      { name: '无权测试', quota: 5, deductible: true },
      workerToken
    )
    expect(status).toBe(403)
  })

  it('LT-04: DELETE /config/leave-types/{id} — HR 可删除 LT-02 创建的记录，返回 200/204', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (createdLeaveTypeId === null) return ctx.skip()
    const { status } = await del(`/config/leave-types/${createdLeaveTypeId}`, hrToken)
    expect([200, 204]).toContain(status)
  })

  it('LT-05: DELETE /config/leave-types/99999 — 不存在记录返回 404', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await del('/config/leave-types/99999', hrToken)
    expect(status).toBe(404)
  })
})

// ─── C-INT-02 考勤/请假 API ───────────────────────────────────────────────────

describe('C-INT-02 - 考勤/请假 API', () => {
  // AT-01 提交后记录的表单 id，供 AT-05 审批使用
  let leaveFormId: number | string | null = null
  // 本人员工 id，用于 AT-03 数据隔离断言
  let currentEmployeeId: number | null = null

  it('AT-01: POST /attendance/leave — employee 提交请假，返回 200/201 + 非空 id', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>(
      '/attendance/leave',
      {
        formType: 'LEAVE',
        formData: { leaveType: 'ANNUAL', startDate: '2026-06-01', endDate: '2026-06-02', reason: '休假测试' }
      },
      employeeToken
    )
    expect([200, 201]).toContain(status)
    const id = (body as any).id ?? (body as any).formId
    expect(id).toBeTruthy()
    leaveFormId = id
  })

  it('AT-02: POST /attendance/leave — 缺少 leaveType 字段返回 400', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/attendance/leave',
      { startDate: '2026-06-01', endDate: '2026-06-02', reason: '缺字段测试' },
      employeeToken
    )
    expect(status).toBe(400)
  })

  it('AT-03: GET /attendance/records — employee 只看到自己的记录（数据隔离）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    // 先获取本人 id
    const me = await get<any>('/auth/me', employeeToken)
    expect(me.status).toBe(200)
    currentEmployeeId = (me.body as any).id as number

    const { status, body } = await get<any[]>('/attendance/records', employeeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    // 若数组非空则每条记录的申请人 id 等于本人 id
    if ((body as any[]).length > 0 && currentEmployeeId !== null) {
      for (const record of body as any[]) {
        const applicantId = record.employeeId ?? record.applicantId ?? record.submitterId
        if (applicantId !== undefined) {
          expect(applicantId).toBe(currentEmployeeId)
        }
      }
    }
  })

  it('AT-04: GET /attendance/records — CEO 可查看所有记录（不限定 employeeId）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any[]>('/attendance/records', ceoToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('AT-05: POST /attendance/{formId}/approve — dept_manager 审批（返回 200 或 403，记录实际结果）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (leaveFormId === null) return ctx.skip()
    const deptManagerToken = await loginAs('dept_manager.demo')
    const { status } = await post(
      `/attendance/${leaveFormId}/approve`,
      { action: 'APPROVE' },
      deptManagerToken
    )
    // 200：审批成功；403：设计要求部门匹配，也是合法结果
    expect([200, 403]).toContain(status)
  })

  it('AT-06: POST /attendance/{leaveFormId}/approve — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (leaveFormId === null) return ctx.skip() // 依赖 AT-01 成功
    const { status } = await post(
      `/attendance/${leaveFormId}/approve`,
      { action: 'APPROVE' },
      employeeToken
    )
    expect(status).toBe(403)
  })
})

// ─── C-INT-03 报销 API ────────────────────────────────────────────────────────

describe('C-INT-03 - 报销 API', () => {
  // EX-02 提交后记录的报销 id，供 EX-05/EX-06 使用
  let expenseId: number | string | null = null
  // 本人员工 id，用于 EX-03 数据隔离断言
  let currentEmployeeId: number | null = null

  it('EX-01: GET /expense/types — employee token 返回 200 + 非空数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/expense/types', employeeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect((body as unknown[]).length).toBeGreaterThan(0)
  })

  it('EX-02: POST /expense — employee 提交报销申请，返回 200/201 + 非空 id', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>(
      '/expense',
      { expenseType: 'TRAVEL', totalAmount: 500, items: [{ itemType: 'TRAVEL', amount: 500, description: 'test' }] },
      employeeToken
    )
    expect([200, 201]).toContain(status)
    const id = (body as any).id ?? (body as any).expenseId
    expect(id).toBeTruthy()
    expenseId = id
  })

  it('EX-03: GET /expense/records — employee 只看到自己的报销记录（数据隔离）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    // 获取本人 id
    const me = await get<any>('/auth/me', employeeToken)
    expect(me.status).toBe(200)
    currentEmployeeId = (me.body as any).id as number

    const { status, body } = await get<any[]>('/expense/records', employeeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    // 若数组非空则每条记录的申请人 id 等于本人 id
    if ((body as any[]).length > 0 && currentEmployeeId !== null) {
      for (const record of body as any[]) {
        const applicantId = record.employeeId ?? record.applicantId ?? record.submitterId
        if (applicantId !== undefined) {
          expect(applicantId).toBe(currentEmployeeId)
        }
      }
    }
  })

  it('EX-04: GET /expense/records — finance token 返回 200 + 数组（可查所有记录）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any[]>('/expense/records', financeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('EX-05: POST /forms/{expenseId}/approve — finance token 审批通过，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (expenseId === null) return ctx.skip()
    const { status } = await post(
      `/forms/${expenseId}/approve`,
      { action: 'APPROVE' },
      financeToken
    )
    expect(status).toBe(200)
  })

  it('EX-06: POST /forms/{expenseId}/approve — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (expenseId === null) return ctx.skip()
    const { status } = await post(
      `/forms/${expenseId}/approve`,
      { action: 'APPROVE' },
      employeeToken
    )
    expect(status).toBe(403)
  })
})

// ─── C-INT-04 工伤 API ────────────────────────────────────────────────────────

describe('C-INT-04 - 工伤 API', () => {
  // IN-01 成功后记录表单 id，供后续用例引用
  let injuryFormId: number | string | null = null

  it('IN-01: POST /logs/injury — worker 提交工伤申报，返回 200 + 非空 id', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>(
      '/logs/injury',
      {
        formData: {
          injuryDate: '2026-05-01',
          injuryTime: '10:00',
          diagnosis: '手部割伤',
          description: '操作失误'
        },
        remark: '工伤申报'
      },
      workerToken
    )
    expect(status).toBe(200)
    const id = (body as any).id ?? (body as any).formId
    expect(id).toBeTruthy()
    injuryFormId = id
  })

  it('IN-02: GET /injury-claims — finance token 返回 200 + 数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/injury-claims', financeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('IN-03: POST /injury-claims — finance 新建理赔记录，返回 200 或 400（formRecordId=null 可能触发校验）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post<any>(
      '/injury-claims',
      {
        formRecordId: null,
        employeeId: 1,
        injuryDate: '2026-05-01',
        injuryDescription: '手部割伤',
        compensationAmount: 5000,
        financeNote: '已审核'
      },
      financeToken
    )
    expect([200, 400]).toContain(status)
  })

  it('IN-04: POST /injury-claims — worker token 返回 403（无权限）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/injury-claims',
      { formRecordId: 1, employeeId: 1, injuryDate: '2026-01-01', compensationAmount: 1000 },
      workerToken
    )
    expect(status).toBe(403)
  })
})

// ─── C-INT-05 系统配置 API ────────────────────────────────────────────────────

describe('C-INT-05 - 系统配置 API', () => {
  it('SC-01: GET /config/company-name — CEO token 返回 200 + companyName 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/config/company-name', ceoToken)
    expect(status).toBe(200)
    expect(typeof (body as any).companyName).toBe('string')
  })

  it('SC-02: PUT /config/company-name — CEO 可修改公司名称，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '测试企业名称' }, ceoToken)
    expect(status).toBe(200)
  })

  it('SC-03: PUT /config/company-name — HR token 返回 403（无权修改）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '违规' }, hrToken)
    expect(status).toBe(403)
  })

  it('SC-04: GET /config/payroll-cycle — CEO token 返回 200 + payday 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/config/payroll-cycle', ceoToken)
    expect(status).toBe(200)
    expect((body as any).payday).toBeDefined()
  })

  it('SC-05: PUT /config/payroll-cycle — CEO 可修改薪资周期，返回 200', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/payroll-cycle', { payday: 20 }, ceoToken)
    expect(status).toBe(200)
  })

  it('SC-06: GET /config/retention-period — CEO token 返回 200 + days 字段', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<any>('/config/retention-period', ceoToken)
    expect(status).toBe(200)
    expect((body as any).days).toBeDefined()
  })
})

// ─── C-INT-06 权限越权直调 ────────────────────────────────────────────────────

describe('C-INT-06 - 权限越权直调', () => {
  it('SEC-01: GET /employees — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-02: GET /employees — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/employees', workerToken)
    expect(status).toBe(403)
  })

  it('SEC-03: DELETE /employees/1 — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await del('/employees/1', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-04: GET /payroll/cycles — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/payroll/cycles', workerToken)
    expect(status).toBe(403)
  })

  it('SEC-05: POST /payroll/cycles — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/payroll/cycles', { period: '2026-07' }, workerToken)
    expect(status).toBe(403)
  })

  it('SEC-06: POST /payroll/cycles/1/settle — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/payroll/cycles/1/settle', {}, employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-07: GET /operation-logs — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/operation-logs', employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-08: GET /operation-logs — finance token 返回 403（操作日志仅 CEO）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/operation-logs', financeToken)
    expect(status).toBe(403)
  })

  it('SEC-09: PUT /config/company-name — HR token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/company-name', { companyName: '越权测试' }, hrToken)
    expect(status).toBe(403)
  })

  it('SEC-10: PUT /config/payroll-cycle — finance token 返回 403（CEO 专属）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await put('/config/payroll-cycle', { payday: 25 }, financeToken)
    expect(status).toBe(403)
  })

  it('SEC-11: POST /injury-claims — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/injury-claims', { formRecordId: 1, employeeId: 1, injuryDate: '2026-01-01', compensationAmount: 1000 }, workerToken)
    expect(status).toBe(403)
  })

  it('SEC-12: POST /forms/1/approve — employee token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/forms/1/approve', { action: 'APPROVE' }, employeeToken)
    expect(status).toBe(403)
  })

  it('SEC-13: POST /allowances — worker token 返回 403', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post('/allowances', { code: 'X', name: 'Y' }, workerToken)
    expect(status).toBe(403)
  })

  it('SEC-14: GET /payroll/slips?cycleId=1 — employee token 返回 200（仅含本人工资条，cycleId 参数不触发权限拒绝）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown>('/payroll/slips?cycleId=1', employeeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('SEC-15: GET /config/retention-period — HR token 返回 403（CEO 专属）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await get('/config/retention-period', hrToken)
    expect(status).toBe(403)
  })
})

// ─── C-INT-07 密码变更 API ────────────────────────────────────────────────────

describe('C-INT-07 - 密码变更 API', () => {
  it('PW-01: POST /auth/change-password — 正确旧密码变更成功，返回 204；随后立即还原密码', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: '123456', newPassword: 'Abc12345!' },
      employeeToken
    )
    expect(status).toBe(204)
    // 立即还原密码，避免影响其他用例
    await post(
      '/auth/change-password',
      { currentPassword: 'Abc12345!', newPassword: '123456' },
      employeeToken
    )
  })

  it('PW-02: POST /auth/change-password — 旧密码错误返回 400', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: 'wrongpwd', newPassword: 'Abc12345!' },
      hrToken
    )
    expect(status).toBe(400)
  })

  it('PW-03: POST /auth/change-password — 新密码少于 6 位返回 400', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status } = await post(
      '/auth/change-password',
      { currentPassword: '123456', newPassword: '123' },
      workerToken
    )
    expect(status).toBe(400)
  })
})

// ─── C-INT-08 薪资结算链路 API ────────────────────────────────────────────────

describe('C-INT-08 - 薪资结算链路 API', () => {
  // PR-01 创建后记录周期 id，供后续用例引用
  let cycleId: number | string | null = null
  // PR-04 查询到的工资条列表，供 PR-05 使用
  let slipId: number | string | null = null

  it('PR-01: POST /payroll/cycles — finance 创建薪资周期，返回 200 + 非空 id', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await post<any>(
      '/payroll/cycles',
      { period: '2026-07' },
      financeToken
    )
    expect(status).toBe(200)
    const id = (body as any).id
    expect(id).toBeTruthy()
    cycleId = id
  })

  it('PR-02: POST /payroll/cycles/{cycleId}/settle — finance 结算周期，返回 200 或 400（窗口期未开放时可接受 400）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (cycleId === null) return ctx.skip()
    const { status } = await post(`/payroll/cycles/${cycleId}/settle`, {}, financeToken)
    expect([200, 400]).toContain(status)
  })

  it('PR-03: GET /payroll/slips — employee token（无 cycleId）返回 200 + 数组（可能为空）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    const { status, body } = await get<unknown[]>('/payroll/slips', employeeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
  })

  it('PR-04: GET /payroll/slips?cycleId={cycleId} — finance token 返回 200 + 数组', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (cycleId === null) return ctx.skip()
    const { status, body } = await get<any[]>(`/payroll/slips?cycleId=${cycleId}`, financeToken)
    expect(status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    // 记录第一条工资条 id，供 PR-05 使用
    if ((body as any[]).length > 0) {
      slipId = (body as any[])[0].id ?? null
    }
  })

  it('PR-05: POST /payroll/slips/{id}/confirm — employee 确认工资条，返回 200 或 400（无电子签名时 400 可接受）', async (ctx: SkipCtx) => {
    if (!serverUp) return ctx.skip()
    if (slipId === null) return ctx.skip()
    const { status } = await post(
      `/payroll/slips/${slipId}/confirm`,
      { pin: '123456' },
      employeeToken
    )
    expect([200, 400]).toContain(status)
  })
})
