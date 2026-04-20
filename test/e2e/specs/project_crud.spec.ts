/**
 * C-E2E-10 项目与里程碑 CRUD
 *
 * 覆盖场景：
 *   10-1: CEO 创建项目 + 添加里程碑 + 记录进度，接口均返回预期状态码
 *   10-2: GET 项目详情包含正确字段（employee 视角）
 *   10-3: CEO 关闭项目后，GET 项目详情状态为 CLOSED
 *
 * 数据依赖：seed-data.sql 中存在 ceo.demo / employee.demo 账号。
 * API 文档：DESIGN.md §项目管理。
 */
import { test, expect, request } from '@playwright/test'
import { loginViaApi } from '../../tools/fixtures/auth'
import { API_URL } from '../playwright.config'

// Shared state across tests in this describe block
let project_id = -1
let milestone_id = -1

test.describe('C-E2E-10 项目与里程碑 CRUD', () => {
  // ── Test 10-1: CEO 创建项目 + 添加里程碑 + 记录进度 ────────────────────────
  test('10-1: CEO 创建项目 + 添加里程碑 + 记录进度，接口均返回预期状态码', async () => {
    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      // Step 1: 创建项目
      const create_resp = await api_ctx.post(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: {
          name: 'E2E测试项目',
          clientName: 'E2E客户',
          contractNo: 'CONTRACT-E2E-001'
        }
      })
      if (!create_resp.ok()) {
        throw new Error(
          `[10-1] POST /projects failed: ${create_resp.status()} ${await create_resp.text()}`
        )
      }
      expect(create_resp.status()).toBe(201)

      const project_body = await create_resp.json() as { id: number }
      project_id = project_body.id

      // Step 2: 添加里程碑
      const milestone_resp = await api_ctx.post(`${API_URL}/projects/${project_id}/milestones`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: { name: 'E2E里程碑一', sort: 1 }
      })
      if (!milestone_resp.ok()) {
        throw new Error(
          `[10-1] POST /projects/${project_id}/milestones failed: ${milestone_resp.status()} ${await milestone_resp.text()}`
        )
      }
      expect(milestone_resp.status()).toBe(201)

      const milestone_body = await milestone_resp.json() as { id: number }
      milestone_id = milestone_body.id

      // Step 3: 记录进度
      const progress_resp = await api_ctx.post(`${API_URL}/projects/${project_id}/progress`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: { milestoneId: milestone_id, note: 'E2E进度记录' }
      })
      if (!progress_resp.ok()) {
        throw new Error(
          `[10-1] POST /projects/${project_id}/progress failed: ${progress_resp.status()} ${await progress_resp.text()}`
        )
      }
      expect(progress_resp.status()).toBe(201)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 10-2: GET 项目详情包含正确字段 ────────────────────────────────────
  test('10-2: GET 项目详情包含正确字段', async () => {
    test.skip(project_id <= 0, '10-1 未创建项目，跳过详情校验')

    const { token: employee_token } = await loginViaApi('employee')
    const api_ctx = await request.newContext()

    try {
      const detail_resp = await api_ctx.get(`${API_URL}/projects/${project_id}`, {
        headers: { Authorization: `Bearer ${employee_token}` }
      })
      expect(detail_resp.status()).toBe(200)

      const body = await detail_resp.json() as {
        name: string
        clientName: string
        contractNo: string
        memberCount?: number
        members?: unknown[]
      }

      expect(body.name).toBe('E2E测试项目')
      expect(body.clientName).toBe('E2E客户')
      expect(body.contractNo).toBe('CONTRACT-E2E-001')
      // 项目人数字段：后端返回 memberCount 或 members 数组，二者有其一即可
      const has_member_info =
        body.memberCount !== undefined || body.members !== undefined
      expect(has_member_info).toBe(true)
    } finally {
      await api_ctx.dispose()
    }
  })

  // ── Test 10-3: CEO 关闭项目后状态为 CLOSED ─────────────────────────────────
  test('10-3: CEO 关闭项目后，GET 项目详情状态为 CLOSED', async () => {
    test.skip(project_id <= 0, '10-1 未创建项目，跳过关闭验证')

    const { token: ceo_token } = await loginViaApi('ceo')
    const api_ctx = await request.newContext()

    try {
      // 关闭项目
      const close_resp = await api_ctx.patch(`${API_URL}/projects/${project_id}/status`, {
        headers: { Authorization: `Bearer ${ceo_token}` },
        data: { status: 'CLOSED' }
      })
      if (!close_resp.ok()) {
        throw new Error(
          `[10-3] PATCH /projects/${project_id}/status failed: ${close_resp.status()} ${await close_resp.text()}`
        )
      }
      expect(close_resp.status()).toBe(200)

      // 验证状态已变为 CLOSED
      const detail_resp = await api_ctx.get(`${API_URL}/projects/${project_id}`, {
        headers: { Authorization: `Bearer ${ceo_token}` }
      })
      expect(detail_resp.status()).toBe(200)

      const body = await detail_resp.json() as { status: string }
      expect(body.status).toBe('CLOSED')
    } finally {
      await api_ctx.dispose()
    }
  })
})
