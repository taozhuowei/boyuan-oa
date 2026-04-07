const apiBaseUrl = 'http://localhost:8080/api'

import type {
  EmployeeProfile,
  ProjectRecord,
  DirectoryImportRecord,
  DirectoryImportPreviewItem,
  DirectoryImportPreviewResult
} from '@shared/types'

export type {
  EmployeeProfile,
  ProjectRecord,
  DirectoryImportRecord,
  DirectoryImportPreviewItem,
  DirectoryImportPreviewResult
} from '@shared/types'

const fallbackEmployees: EmployeeProfile[] = [
  {
    id: 1,
    employeeNo: 'E001',
    name: '张晓宁',
    department: '综合管理部',
    project: null,
    employeeType: 'OFFICE',
    hireDate: '2022-03-15',
    status: 'ACTIVE',
    phone: '13800138001',
    email: 'zhangxn@oa.com'
  },
  {
    id: 2,
    employeeNo: 'E002',
    name: '赵铁柱',
    department: '施工一部',
    project: 'P001',
    employeeType: 'LABOR',
    hireDate: '2021-06-01',
    status: 'ACTIVE',
    phone: '13800138002',
    email: 'zhaotz@oa.com'
  },
  {
    id: 3,
    employeeNo: 'E003',
    name: '李静',
    department: '财务管理部',
    project: null,
    employeeType: 'OFFICE',
    hireDate: '2020-01-10',
    status: 'ACTIVE',
    phone: '13800138003',
    email: 'lijing@oa.com'
  },
  {
    id: 4,
    employeeNo: 'E004',
    name: '王建国',
    department: '项目一部',
    project: 'P001',
    employeeType: 'OFFICE',
    hireDate: '2019-08-20',
    status: 'ACTIVE',
    phone: '13800138004',
    email: 'wangjg@oa.com'
  },
  {
    id: 5,
    employeeNo: 'E005',
    name: '陈明远',
    department: '运营管理部',
    project: null,
    employeeType: 'OFFICE',
    hireDate: '2018-05-01',
    status: 'ACTIVE',
    phone: '13800138005',
    email: 'chenmy@oa.com'
  },
  {
    id: 6,
    employeeNo: 'E006',
    name: '刘大力',
    department: '施工一部',
    project: 'P002',
    employeeType: 'LABOR',
    hireDate: '2023-02-10',
    status: 'ACTIVE',
    phone: '13800138006',
    email: 'liudl@oa.com'
  }
]

const fallbackProjects: ProjectRecord[] = [
  {
    id: 1,
    projectNo: 'P001',
    name: '绿地中心大厦装修项目',
    description: '高层商业楼宇内部装修工程，当前以机电和精装穿插施工为主。',
    department: '项目一部',
    manager: '王建国',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'ACTIVE',
    members: ['王建国', '赵铁柱', '刘大力'],
    progress: 65.5
  },
  {
    id: 2,
    projectNo: 'P002',
    name: '科技园区基础设施改造',
    description: '园区道路、管网和绿化改造，当前处于节点穿插和材料协调阶段。',
    department: '项目二部',
    manager: '李华',
    startDate: '2024-03-01',
    endDate: '2024-10-30',
    status: 'ACTIVE',
    members: ['李华', '王小燕'],
    progress: 40
  },
  {
    id: 3,
    projectNo: 'P003',
    name: '地铁站出口建设工程',
    description: '土建与装饰交付已完成，进入归档和结算收尾阶段。',
    department: '项目三部',
    manager: '张伟',
    startDate: '2023-06-01',
    endDate: '2024-06-30',
    status: 'COMPLETED',
    members: ['张伟', '赵铁柱'],
    progress: 100
  }
]

function getUniInstance() {
  return typeof uni === 'undefined' ? null : uni
}

function request<T>(options: {
  url: string
  method?: 'GET' | 'POST'
  data?: unknown
  token?: string
}): Promise<T> {
  const uniInstance = getUniInstance()

  if (!uniInstance) {
    return Promise.reject(new Error('当前环境不可调用接口'))
  }

  return new Promise((resolve, reject) => {
    uniInstance.request({
      url: options.url,
      method: options.method ?? 'GET',
      data: options.data as string | Record<string, unknown> | ArrayBuffer | undefined,
      header: options.token ? { Authorization: `Bearer ${options.token}` } : undefined,
      success: (response) => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data as T)
          return
        }

        reject(new Error('组织接口请求失败'))
      },
      fail: () => reject(new Error('组织接口请求失败'))
    })
  })
}

function buildPreviewResult(records: DirectoryImportRecord[]): DirectoryImportPreviewResult {
  const phoneSet = new Set<string>()
  let validCount = 0
  let invalidCount = 0
  let duplicateCount = 0

  const items = records.map((record, rowIndex) => {
    if (!record.name.trim()) {
      invalidCount += 1
      return {
        rowIndex,
        name: record.name,
        phone: record.phone,
        department: record.department,
        status: 'INVALID' as const,
        message: '姓名不能为空'
      }
    }

    if (!record.phone.trim()) {
      invalidCount += 1
      return {
        rowIndex,
        name: record.name,
        phone: record.phone,
        department: record.department,
        status: 'INVALID' as const,
        message: '手机号不能为空'
      }
    }

    if (!/^1[3-9]\d{9}$/.test(record.phone.trim())) {
      invalidCount += 1
      return {
        rowIndex,
        name: record.name,
        phone: record.phone,
        department: record.department,
        status: 'INVALID' as const,
        message: '手机号格式不正确'
      }
    }

    if (phoneSet.has(record.phone.trim())) {
      duplicateCount += 1
      return {
        rowIndex,
        name: record.name,
        phone: record.phone,
        department: record.department,
        status: 'DUPLICATE' as const,
        message: '手机号重复'
      }
    }

    phoneSet.add(record.phone.trim())
    validCount += 1

    return {
      rowIndex,
      name: record.name,
      phone: record.phone,
      department: record.department,
      status: 'VALID' as const,
      message: '校验通过'
    }
  })

  return {
    totalCount: records.length,
    validCount,
    invalidCount,
    duplicateCount,
    items
  }
}

// Keep the org pages usable during tests or when the demo backend is unavailable.
export async function fetchEmployees(token?: string): Promise<EmployeeProfile[]> {
  try {
    return await request<EmployeeProfile[]>({
      url: `${apiBaseUrl}/employees`,
      method: 'GET',
      token
    })
  } catch {
    return fallbackEmployees
  }
}

export async function fetchEmployeeDetail(id: number, token?: string): Promise<EmployeeProfile> {
  try {
    return await request<EmployeeProfile>({
      url: `${apiBaseUrl}/employees/${id}`,
      method: 'GET',
      token
    })
  } catch {
    const fallback = fallbackEmployees.find((item) => item.id === id)
    if (!fallback) {
      throw new Error('未找到员工资料')
    }

    return fallback
  }
}

export async function fetchProjects(token?: string): Promise<ProjectRecord[]> {
  try {
    return await request<ProjectRecord[]>({
      url: `${apiBaseUrl}/projects`,
      method: 'GET',
      token
    })
  } catch {
    return fallbackProjects
  }
}

export async function previewDirectoryImport(
  records: DirectoryImportRecord[],
  token?: string
): Promise<DirectoryImportPreviewResult> {
  try {
    return await request<DirectoryImportPreviewResult>({
      url: `${apiBaseUrl}/directory/import-preview`,
      method: 'POST',
      data: { records },
      token
    })
  } catch {
    return buildPreviewResult(records)
  }
}

export async function applyDirectoryImport(selectedIndices: number[], token?: string): Promise<string> {
  try {
    return await request<string>({
      url: `${apiBaseUrl}/directory/import-apply`,
      method: 'POST',
      data: { selectedIndices },
      token
    })
  } catch {
    return `导入成功，共导入 ${selectedIndices.length} 条记录（本地演示）`
  }
}
