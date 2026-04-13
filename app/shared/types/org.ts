/**
 * 组织管理相关类型定义模块
 *
 * 模块职责：
 * - 提供员工、项目、通讯录导入等TypeScript类型定义
 * - 纯类型定义文件，无运行时依赖
 */

export interface EmployeeProfile {
  id: number
  employeeNo: string
  name: string
  department: string
  project?: string | null
  employeeType: string
  hireDate: string
  status: string
  phone: string
  email: string
}

export interface ProjectRecord {
  id: number
  projectNo: string
  name: string
  description: string
  department: string
  manager: string
  startDate: string
  endDate: string
  status: string
  members: string[]
  progress: number
}

export interface DirectoryImportRecord {
  name: string
  phone: string
  department: string
  position: string
  email: string
}

export interface DirectoryImportPreviewItem {
  rowIndex: number
  name: string
  phone: string
  department: string
  status: 'VALID' | 'INVALID' | 'DUPLICATE'
  message: string
}

export interface DirectoryImportPreviewResult {
  totalCount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
  items: DirectoryImportPreviewItem[]
}
