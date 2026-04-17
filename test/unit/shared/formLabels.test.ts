/**
 * 表单字段标签映射工具测试
 *
 * 测试范围：
 * - 字段名到中文标签的映射
 * - 枚举值到中文描述的映射
 * - 表单数据摘要生成
 */
import { describe, it, expect } from 'vitest'
import {
  getFieldLabel,
  getLeaveTypeLabel,
  getOvertimeTypeLabel,
  formatFormSummary,
  FIELD_LABELS,
  LEAVE_TYPE_LABELS,
  OVERTIME_TYPE_LABELS,
} from '@shared/utils/formLabels'

describe('formLabels', () => {
  describe('getFieldLabel', () => {
    it('should return Chinese label for known fields', () => {
      expect(getFieldLabel('leaveType')).toBe('请假类型')
      expect(getFieldLabel('overtimeType')).toBe('加班类型')
      expect(getFieldLabel('startDate')).toBe('开始日期')
      expect(getFieldLabel('endDate')).toBe('结束日期')
      expect(getFieldLabel('days')).toBe('天数')
      expect(getFieldLabel('hours')).toBe('小时数')
      expect(getFieldLabel('reason')).toBe('原因')
    })

    it('should return original key for unknown fields', () => {
      expect(getFieldLabel('unknownField')).toBe('unknownField')
      expect(getFieldLabel('customKey')).toBe('customKey')
    })

    it('should handle empty string', () => {
      expect(getFieldLabel('')).toBe('')
    })
  })

  describe('getLeaveTypeLabel', () => {
    it('should return Chinese label for ANNUAL (uppercase)', () => {
      expect(getLeaveTypeLabel('ANNUAL')).toBe('年假')
    })

    it('should return Chinese label for lowercase variants', () => {
      expect(getLeaveTypeLabel('annual')).toBe('年假')
      expect(getLeaveTypeLabel('personal')).toBe('事假')
      expect(getLeaveTypeLabel('sick')).toBe('病假')
      expect(getLeaveTypeLabel('marriage')).toBe('婚假')
      expect(getLeaveTypeLabel('maternity')).toBe('产假')
    })

    it('should return Chinese label for already Chinese values', () => {
      expect(getLeaveTypeLabel('年假')).toBe('年假')
      expect(getLeaveTypeLabel('事假')).toBe('事假')
      expect(getLeaveTypeLabel('病假')).toBe('病假')
    })

    it('should return empty string for null/undefined', () => {
      expect(getLeaveTypeLabel(null as any)).toBe('')
      expect(getLeaveTypeLabel(undefined)).toBe('')
    })

    it('should return original value for unknown types', () => {
      expect(getLeaveTypeLabel('UNKNOWN')).toBe('UNKNOWN')
    })
  })

  describe('getOvertimeTypeLabel', () => {
    it('should return Chinese label for uppercase variants', () => {
      expect(getOvertimeTypeLabel('WEEKDAY')).toBe('工作日加班')
      expect(getOvertimeTypeLabel('WEEKEND')).toBe('周末加班')
      expect(getOvertimeTypeLabel('HOLIDAY')).toBe('节假日加班')
    })

    it('should return Chinese label for lowercase variants', () => {
      expect(getOvertimeTypeLabel('weekday')).toBe('工作日加班')
      expect(getOvertimeTypeLabel('weekend')).toBe('周末加班')
      expect(getOvertimeTypeLabel('holiday')).toBe('节假日加班')
    })

    it('should return Chinese label for already Chinese values', () => {
      expect(getOvertimeTypeLabel('工作日加班')).toBe('工作日加班')
      expect(getOvertimeTypeLabel('周末加班')).toBe('周末加班')
      expect(getOvertimeTypeLabel('节假日加班')).toBe('节假日加班')
    })

    it('should return empty string for null/undefined', () => {
      expect(getOvertimeTypeLabel(null as any)).toBe('')
      expect(getOvertimeTypeLabel(undefined)).toBe('')
    })
  })

  describe('formatFormSummary', () => {
    it('should format LEAVE form summary with ANNUAL type', () => {
      const result = formatFormSummary('LEAVE', { leaveType: 'ANNUAL', days: 1 })
      expect(result).toBe('年假 1天')
    })

    it('should format LEAVE form summary with sick leave', () => {
      const result = formatFormSummary('LEAVE', { leaveType: 'sick', days: 2 })
      expect(result).toBe('病假 2天')
    })

    it('should format OVERTIME form summary with hours', () => {
      const result = formatFormSummary('OVERTIME', { overtimeType: 'WEEKDAY', hours: 8 })
      expect(result).toBe('工作日加班 8小时')
    })

    it('should format OVERTIME form summary with time range', () => {
      const result = formatFormSummary('OVERTIME', {
        overtimeType: 'WEEKEND',
        startTime: '18:00',
        endTime: '22:00',
      })
      expect(result).toBe('周末加班 18:00~22:00')
    })

    it('should handle missing formData', () => {
      expect(formatFormSummary('LEAVE', undefined)).toBe('')
      expect(formatFormSummary('LEAVE', {})).toBe('')
    })

    it('should return empty string for unknown form types', () => {
      expect(formatFormSummary('UNKNOWN', { someField: 'value' })).toBe('')
    })

    it('should fix the user reported issue: ANNUAL 1天 should show as 年假 1天', () => {
      // This was the original bug: showing "ANNUAL 1天" instead of "年假 1天"
      const result = formatFormSummary('LEAVE', { leaveType: 'ANNUAL', days: 1 })
      expect(result).not.toContain('ANNUAL')
      expect(result).toContain('年假')
      expect(result).toBe('年假 1天')
    })
  })

  describe('all label maps should be non-empty', () => {
    it('FIELD_LABELS should have entries', () => {
      expect(Object.keys(FIELD_LABELS).length).toBeGreaterThan(0)
    })

    it('LEAVE_TYPE_LABELS should have entries', () => {
      expect(Object.keys(LEAVE_TYPE_LABELS).length).toBeGreaterThan(0)
    })

    it('OVERTIME_TYPE_LABELS should have entries', () => {
      expect(Object.keys(OVERTIME_TYPE_LABELS).length).toBeGreaterThan(0)
    })
  })
})
