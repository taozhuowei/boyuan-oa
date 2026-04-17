/**
 * 项目详情页共享类型 — projects/types.ts
 * 用途：ProjectDetail 和 MemberInfo 在父页面与多个 Tab 子组件间共享，
 *       统一放在此文件避免重复定义。
 */

export interface MemberInfo {
  employeeId: number
  employeeNo: string
  name: string
  role: string
}

export interface ProjectDetail {
  id: number
  name: string
  status: string
  startDate: string | null
  actualEndDate: string | null
  logCycleDays: number
  logReportCycleDays: number
  contractNo: string | null
  contractAttachmentId: number | null
  clientName: string | null
  projectDescription: string | null
  members: MemberInfo[] | null
}
