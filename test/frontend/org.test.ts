/**
 * utils/org.ts 单元测试
 *
 * 覆盖：previewDirectoryImport 的本地 fallback 路径（即 buildPreviewResult 逻辑）
 *
 * 原理：org.ts 内部 request() 在 uni.request 不存在时抛出 TypeError，
 *       previewDirectoryImport 的 catch 块捕获后执行本地 buildPreviewResult。
 *       setup.ts 中 uni mock 故意不包含 request 方法，确保走 fallback 路径。
 */
import { describe, it, expect } from 'vitest'
import { previewDirectoryImport } from '@/utils/org'
import type { DirectoryImportRecord } from '@/utils/org'

function rec(overrides: Partial<DirectoryImportRecord> = {}): DirectoryImportRecord {
  return {
    name: '张三',
    phone: '13800138001',
    department: '综合管理部',
    position: '工程师',
    email: 'zhangsan@test.com',
    ...overrides
  }
}

describe('previewDirectoryImport — 本地校验逻辑', () => {
  it('姓名为空时记录标记为 INVALID，message 含"姓名"', async () => {
    const result = await previewDirectoryImport([rec({ name: '' })])
    expect(result.items[0].status).toBe('INVALID')
    expect(result.items[0].message).toMatch(/姓名/)
    expect(result.invalidCount).toBe(1)
    expect(result.validCount).toBe(0)
  })

  it('手机号为空时标记为 INVALID，message 含"手机号"', async () => {
    const result = await previewDirectoryImport([rec({ phone: '' })])
    expect(result.items[0].status).toBe('INVALID')
    expect(result.items[0].message).toMatch(/手机号/)
  })

  it('手机号格式错误时标记为 INVALID（如 12345678901）', async () => {
    const result = await previewDirectoryImport([rec({ phone: '12345678901' })])
    expect(result.items[0].status).toBe('INVALID')
    expect(result.items[0].message).toMatch(/格式/)
  })

  it('同批数据手机号重复时第二条标记为 DUPLICATE', async () => {
    const result = await previewDirectoryImport([
      rec({ name: '张三', phone: '13800138001' }),
      rec({ name: '李四', phone: '13800138001' }) // 重复
    ])
    expect(result.items[0].status).toBe('VALID')
    expect(result.items[1].status).toBe('DUPLICATE')
    expect(result.duplicateCount).toBe(1)
  })

  it('合法记录标记为 VALID，message="校验通过"', async () => {
    const result = await previewDirectoryImport([rec()])
    expect(result.items[0].status).toBe('VALID')
    expect(result.items[0].message).toBe('校验通过')
    expect(result.validCount).toBe(1)
  })

  it('统计字段 totalCount / validCount / invalidCount / duplicateCount 准确', async () => {
    const result = await previewDirectoryImport([
      rec({ name: '张三', phone: '13800000001' }),  // VALID
      rec({ name: '', phone: '13800000002' }),        // INVALID
      rec({ name: '王五', phone: '13800000001' }),  // DUPLICATE
      rec({ name: '赵六', phone: '138' })            // INVALID（格式错）
    ])
    expect(result.totalCount).toBe(4)
    expect(result.validCount).toBe(1)
    expect(result.invalidCount).toBe(2)
    expect(result.duplicateCount).toBe(1)
  })
})
