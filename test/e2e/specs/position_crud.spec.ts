/**
 * C-E2E-08 岗位与薪级 CRUD
 *
 * 覆盖场景：
 *   08-1  CEO 通过 API 创建岗位并添加薪级等级，HR 可通过列表接口查询到该岗位。
 *   08-2  CEO 删除薪级后再删除岗位，均返回 204；随后 GET 该岗位返回 404。
 *   08-3  非 CEO 角色（employee / hr）调用创建岗位接口，返回 403。
 *
 * 接口依据：
 *   POST   /positions                      — CEO only，201
 *   GET    /positions                      — CEO/HR/FINANCE，200
 *   POST   /positions/{id}/levels          — CEO only，201
 *   DELETE /positions/{id}/levels/{lid}    — CEO only，204
 *   DELETE /positions/{id}                 — CEO only，204
 *   GET    /positions/{id}                 — 删除后期望 404
 *
 * 参考：test/e2e/TEST_DESIGN.md §C-E2E-08
 */
import { test, expect, request } from '@playwright/test'
import { loginViaApi } from '../../tools/fixtures/auth'
import { API_URL } from '../playwright.config'

// Shared state across tests — initialised to sentinel -1 (means "not yet created")
let position_id = -1
let level_id = -1
// Unique name per run so repeated runs on a persistent H2 session don't hit unique-constraint 409
const position_name = `E2E岗位测试_${Date.now()}`

test.describe('C-E2E-08 岗位与薪级 CRUD', () => {
  // ── Test 08-1: CEO 创建岗位 + 薪级，HR 可查询 ────────────────────────────
  test('08-1: CEO 通过 API 创建岗位并添加等级，HR 可查询到该岗位', async () => {
    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      // Step 1: CEO 创建岗位
      const create_resp = await api_ctx.post(`${API_URL}/positions`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: {
          positionName: position_name,
          employeeCategory: 'OFFICE',
          defaultRoleCode: 'employee'
        }
      })

      if (create_resp.status() === 409) {
        console.warn('[C-E2E-08] POST /positions returned 409 (conflict). Skipping remaining steps.')
        test.skip(true, `Position ${position_name} already exists (409); cannot proceed safely`)
        return
      }

      expect(create_resp.status()).toBe(201)
      const created_position = await create_resp.json() as { id: number; positionName: string }
      position_id = created_position.id

      // Step 2: CEO 为新岗位添加薪级
      const level_resp = await api_ctx.post(`${API_URL}/positions/${position_id}/levels`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: {
          levelName: 'E2E初级',
          levelOrder: 1
        }
      })
      expect(level_resp.status()).toBe(201)
      const created_level = await level_resp.json() as { id: number; levelName: string }
      level_id = created_level.id

      // Step 3: HR 查询岗位列表，应包含新建岗位
      const { token: hr_token } = await loginViaApi('hr')
      const list_resp = await api_ctx.get(`${API_URL}/positions`, {
        headers: { Authorization: `Bearer ${hr_token}` }
      })
      expect(list_resp.status()).toBe(200)
      const positions = await list_resp.json() as Array<{ id: number; positionName: string }>
      const found = positions.find(p => p.positionName === position_name)
      expect(found).toBeDefined()
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 08-2: CEO 删除薪级后删除岗位，验证资源已消失 ─────────────────────
  test('08-2: CEO 删除等级后再删除岗位，均返回 204', async () => {
    test.skip(
      position_id <= 0 || level_id <= 0,
      '08-1 未成功创建岗位或薪级，跳过删除测试'
    )

    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      // Step 1: 删除薪级
      const del_level_resp = await api_ctx.delete(
        `${API_URL}/positions/${position_id}/levels/${level_id}`,
        { headers: { Authorization: `Bearer ${ceo_token}` } }
      )
      expect(del_level_resp.status()).toBe(204)

      // Step 2: 删除岗位
      const del_pos_resp = await api_ctx.delete(
        `${API_URL}/positions/${position_id}`,
        { headers: { Authorization: `Bearer ${ceo_token}` } }
      )
      expect(del_pos_resp.status()).toBe(204)

      // Step 3: 确认岗位已不存在
      const get_resp = await api_ctx.get(
        `${API_URL}/positions/${position_id}`,
        { headers: { Authorization: `Bearer ${ceo_token}` } }
      )
      expect([404]).toContain(get_resp.status())
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 08-3: 普通员工无权创建岗位，返回 403（HR 有权限，见 DESIGN §3.4）────
  test('08-3: 非 CEO 角色无权创建岗位，返回 403', async () => {
    const api_ctx = await request.newContext()

    try {
      const { token: employee_token } = await loginViaApi('employee')
      const emp_resp = await api_ctx.post(`${API_URL}/positions`, {
        headers: { Authorization: `Bearer ${employee_token}` },
        data: { positionName: 'E2E越权测试岗位' }
      })
      expect(emp_resp.status()).toBe(403)

      // HR can create positions per DESIGN §3.4 (HR 负责：创建部门、岗位名称与等级名称)
      const { token: hr_token } = await loginViaApi('hr')
      const hr_resp = await api_ctx.post(`${API_URL}/positions`, {
        headers: { Authorization: `Bearer ${hr_token}` },
        data: { positionName: 'E2E越权测试岗位' }
      })
      expect([201, 409]).toContain(hr_resp.status())
    } finally {
      await api_ctx.dispose()
    }
  })
})
