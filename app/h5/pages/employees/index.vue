<template>
  <!-- Employee management — list + create/edit dialog with HR/finance fields + emergency contacts subform -->
  <div class="employees-page">
    <h2 class="page-title">员工管理</h2>

    <a-alert
      v-if="disableSuccess"
      data-catch="disable-success"
      message="员工账号已停用"
      type="success"
      show-icon
      closable
      style="margin-bottom: 12px"
      @close="disableSuccess = false"
    />

    <a-card>
      <div class="search-bar">
        <a-input
          v-model:value="keyword"
          placeholder="搜索姓名/工号"
          style="width: 280px"
          allow-clear
          @press-enter="onSearch"
        />
        <a-button type="primary" @click="onSearch">搜索</a-button>
        <a-button
          v-if="canEdit"
          style="margin-left: auto"
          type="primary"
          data-catch="employee-create-btn"
          @click="openCreate"
        >
          + 新增员工
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="employees"
        :loading="loading"
        :pagination="{
          current: page + 1,
          pageSize: pageSize,
          total: totalElements,
          showTotal: (t: number) => `共 ${t} 人`,
          onChange: onPageChange,
        }"
        row-key="id"
        size="small"
        :customRow="
          (record: Employee) => ({ 'data-catch': 'employee-row' }) as Record<string, string>
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <span data-catch="employee-name">{{ record.name }}</span>
          </template>
          <template v-if="column.key === 'entryDate'">
            {{ record.entryDate ?? '—' }}
          </template>
          <template v-if="column.key === 'accountStatus'">
            <a-tag :color="record.accountStatus === 'ACTIVE' ? 'success' : 'default'">
              {{ record.accountStatus === 'ACTIVE' ? '在职' : '停用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                type="link"
                size="small"
                :data-catch="'employees-row-detail-btn-' + record.id"
                @click="openDetail(record as Employee)"
              >
                详情
              </a-button>
              <a-button
                v-if="canEdit"
                type="link"
                size="small"
                data-catch="employee-edit-btn"
                @click="openEdit(record as Employee)"
              >
                编辑
              </a-button>
              <a-button
                v-if="userStore.userInfo?.role === 'ceo' && record.accountStatus === 'ACTIVE'"
                type="link"
                size="small"
                danger
                data-catch="employee-disable-btn"
                @click="openDisable(record as Employee)"
              >
                停用
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗：列表数据 + 紧急联系人懒加载 -->
    <a-modal
      v-model:open="showDetail"
      :title="`员工详情 — ${detailRecord?.name ?? ''}`"
      :footer="null"
      width="560px"
    >
      <a-descriptions v-if="detailRecord" bordered size="small" :column="2">
        <a-descriptions-item label="姓名">{{ detailRecord.name }}</a-descriptions-item>
        <a-descriptions-item label="工号">{{ detailRecord.employeeNo ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="部门">
          {{ detailRecord.departmentName ?? '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="角色">{{ detailRecord.roleName ?? '—' }}</a-descriptions-item>
        <a-descriptions-item label="入职日期">
          {{ detailRecord.entryDate ?? '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="社会工龄">
          {{ detailRecord.socialSeniority ?? '—' }} 年
        </a-descriptions-item>
        <a-descriptions-item label="合同类型">
          {{ contractLabel(detailRecord.contractType) }}
        </a-descriptions-item>
        <a-descriptions-item label="出差日补贴">
          {{ detailRecord.dailySubsidy ?? '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="绩效比例">
          {{ detailRecord.performanceRatio != null ? detailRecord.performanceRatio + '%' : '—' }}
        </a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="detailRecord.accountStatus === 'ACTIVE' ? 'success' : 'default'">
            {{ detailRecord.accountStatus === 'ACTIVE' ? '在职' : '停用' }}
          </a-tag>
        </a-descriptions-item>
      </a-descriptions>

      <div v-if="detailRecord?.emergencyContacts?.length" class="contact-list">
        <div class="contact-title">紧急联系人</div>
        <div v-for="(c, idx) in detailRecord.emergencyContacts" :key="idx" class="contact-row">
          <span>{{ c.name }}</span>
          <span>{{ c.phone }}</span>
          <span>{{ c.address ?? '' }}</span>
        </div>
      </div>
    </a-modal>

    <!-- 创建/编辑弹窗 -->
    <a-modal
      v-model:open="showForm"
      :title="formMode === 'create' ? '新增员工' : '编辑员工'"
      :confirm-loading="submitting"
      width="700px"
      :okButtonProps="{ 'data-catch': 'employee-save-btn' } as unknown as ButtonProps"
      @ok="submitForm"
      @cancel="showForm = false"
    >
      <a-form layout="vertical" :model="form">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="姓名" required>
              <a-input v-model:value="form.name" data-catch="employee-name-input" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="手机号">
              <a-input v-model:value="form.phone" data-catch="employee-phone-input" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="邮箱">
              <a-input v-model:value="form.email" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="入职日期" :required="formMode === 'create'">
              <a-input v-model:value="form.entryDate" placeholder="YYYY-MM-DD" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="主角色" required>
              <!-- 从 GET /roles 动态加载角色列表，避免静态硬编码与后端不同步 -->
              <a-select
                v-model:value="form.roleCode"
                :options="roles"
                :loading="loadingRoles"
                style="width: 100%"
                data-catch="employee-role-select"
                show-search
                option-filter-prop="label"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="部门" required>
              <a-select
                v-model:value="form.departmentId"
                :options="departments"
                placeholder="选择部门"
                show-search
                option-filter-prop="label"
                data-catch="employee-dept-select"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位">
              <!-- 岗位列表按部门过滤（部门变更时自动重新加载） -->
              <a-select
                v-model:value="form.positionId"
                :options="positions.map((p) => ({ value: p.id, label: p.positionName }))"
                :loading="loadingPositions"
                :disabled="!form.departmentId"
                placeholder="请先选择部门"
                show-search
                option-filter-prop="label"
                style="width: 100%"
                allow-clear
                @change="onPositionChange"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="岗位等级">
              <a-select
                v-model:value="form.levelId"
                :options="levels"
                placeholder="先选岗位"
                :disabled="levels.length === 0"
                allow-clear
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="直系领导">
              <a-select
                v-model:value="form.directSupervisorId"
                :options="supervisorOptions"
                placeholder="输入姓名搜索"
                show-search
                :filter-option="false"
                :loading="searchingSupervisor"
                allow-clear
                style="width: 100%"
                @search="searchSupervisor"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="性别" required>
              <a-select
                v-model:value="form.gender"
                style="width: 100%"
                data-catch="employee-gender-select"
              >
                <a-select-option value="MALE">男</a-select-option>
                <a-select-option value="FEMALE">女</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item
              label="身份证号"
              :rules="[
                { pattern: /^\d{17}[\dX]$/i, message: '请输入有效的18位身份证号', trigger: 'blur' },
              ]"
            >
              <a-input
                v-model:value="form.idCardNo"
                placeholder="18位身份证号"
                data-catch="employee-idcard-input"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="出生日期">
              <a-date-picker
                v-model:value="form.birthDate"
                style="width: 100%"
                placeholder="选择出生日期"
                data-catch="employee-birthday-input"
                :disabled-date="(d: Dayjs) => d.isAfter(dayjs())"
              />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="社会工龄（年）">
              <a-input-number
                v-model:value="form.socialSeniority"
                :precision="0"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="合同类型">
              <a-select v-model:value="form.contractType" allow-clear>
                <a-select-option value="FORMAL">正式</a-select-option>
                <a-select-option value="LABOR">劳务</a-select-option>
                <a-select-option value="INTERN">实习</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="出差日补贴（元/天）">
              <a-input-number
                v-model:value="form.dailySubsidy"
                :precision="2"
                :min="0"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="绩效比例（%）">
              <a-input-number
                v-model:value="form.performanceRatio"
                :precision="2"
                :min="0"
                :max="100"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider style="margin: 8px 0">紧急联系人</a-divider>
        <div v-for="(c, idx) in form.emergencyContacts" :key="idx" class="emergency-row">
          <a-input v-model:value="c.name" placeholder="姓名" style="width: 130px" />
          <a-input v-model:value="c.phone" placeholder="手机号" style="width: 160px" />
          <a-input v-model:value="c.address" placeholder="家庭住址（选填）" style="flex: 1" />
          <a-button type="link" danger @click="removeContact(idx)">移除</a-button>
        </div>
        <a-button type="dashed" block @click="addContact">+ 添加紧急联系人</a-button>
      </a-form>
    </a-modal>

    <!-- 停用确认弹窗 -->
    <a-modal
      v-model:open="showDisableModal"
      data-catch="disable-confirm-dialog"
      title="确认停用员工账号"
      :confirm-loading="!!disablingId"
      @ok="doDisable"
      @cancel="showDisableModal = false"
    >
      <template #footer>
        <a-button @click="showDisableModal = false">取消</a-button>
        <a-button
          type="primary"
          danger
          data-catch="disable-confirm-ok"
          :loading="!!disablingId"
          @click="doDisable"
        >
          确认停用
        </a-button>
      </template>
      <p>
        停用后该员工将无法登录系统。确认停用
        <strong>{{ disableTarget?.name }}</strong>
        的账号？
      </p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue'
import { message } from 'ant-design-vue'
import type { ButtonProps } from 'ant-design-vue'
import type { SelectValue } from 'ant-design-vue/es/select'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

interface EmergencyContact {
  id?: number
  name: string
  phone: string
  address?: string
}
interface Employee {
  id: number
  employeeNo?: string
  name: string
  phone?: string
  email?: string
  departmentId?: number | null
  departmentName?: string
  roleCode?: string
  roleName?: string
  positionId?: number | null
  accountStatus: string
  entryDate: string | null
  socialSeniority?: number | null
  contractType?: string | null
  dailySubsidy?: number | null
  performanceRatio?: number | null
  emergencyContacts?: EmergencyContact[]
  gender?: string
  idCardNo?: string
  birthDate?: string
  directSupervisorId?: number | null
  levelId?: number | null
}

interface Department {
  id: number
  name: string
  children?: Department[]
}
interface Position {
  id: number
  positionCode: string
  positionName: string
  levels: { id: number; levelName: string }[]
}
interface Role {
  id: number
  roleCode: string
  roleName: string
}

const userStore = useUserStore()
const canEdit = computed(() => ['ceo', 'hr'].includes(userStore.userInfo?.role ?? ''))

const loading = ref(false)
const employees = ref<Employee[]>([])
const keyword = ref('')
const page = ref(0)
const pageSize = ref(20)
const totalElements = ref(0)

const departments = ref<{ value: number; label: string }[]>([])
const positions = ref<Position[]>([])
const levels = ref<{ value: number; label: string }[]>([])
const roles = ref<{ value: string; label: string }[]>([])
const loadingRoles = ref(false)
const supervisorOptions = ref<{ value: number; label: string }[]>([])
const loadingPositions = ref(false)
const searchingSupervisor = ref(false)
// 编辑回填时跳过部门 watch 清空逻辑
let skipDeptWatch = false

const showDetail = ref(false)
const detailRecord = ref<Employee | null>(null)

const disablingId = ref<number | null>(null)
const showDisableModal = ref(false)
const disableTarget = ref<Employee | null>(null)
const disableSuccess = ref(false)

const showForm = ref(false)
const submitting = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<number | null>(null)

const form = ref<{
  name: string
  phone: string
  email: string
  roleCode: string
  departmentId: number | undefined
  positionId: number | undefined
  entryDate: string
  socialSeniority: number | undefined
  contractType: string | undefined
  dailySubsidy: number | undefined
  performanceRatio: number | undefined
  emergencyContacts: EmergencyContact[]
  gender: string
  idCardNo: string
  birthDate: Dayjs | null
  directSupervisorId: number | undefined
  levelId: number | undefined
}>({
  name: '',
  phone: '',
  email: '',
  roleCode: 'employee',
  departmentId: undefined,
  positionId: undefined,
  entryDate: '',
  socialSeniority: undefined,
  contractType: undefined,
  dailySubsidy: undefined,
  performanceRatio: undefined,
  emergencyContacts: [],
  gender: '',
  idCardNo: '',
  birthDate: null,
  directSupervisorId: undefined,
  levelId: undefined,
})

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '部门', dataIndex: 'departmentName', key: 'departmentName' },
  { title: '角色', dataIndex: 'roleName', key: 'roleName' },
  { title: '入职日期', key: 'entryDate' },
  { title: '状态', key: 'accountStatus', width: 80 },
  { title: '操作', key: 'action', width: 130 },
]

function contractLabel(c?: string | null): string {
  if (c === 'FORMAL') return '正式'
  if (c === 'LABOR') return '劳务'
  if (c === 'INTERN') return '实习'
  return '—'
}

function openDetail(record: Employee) {
  detailRecord.value = record
  showDetail.value = true
}

function resetForm() {
  form.value = {
    name: '',
    phone: '',
    email: '',
    roleCode: 'employee',
    departmentId: undefined,
    positionId: undefined,
    entryDate: new Date().toISOString().slice(0, 10),
    socialSeniority: undefined,
    contractType: undefined,
    dailySubsidy: undefined,
    performanceRatio: undefined,
    emergencyContacts: [],
    gender: '',
    idCardNo: '',
    birthDate: null,
    directSupervisorId: undefined,
    levelId: undefined,
  }
  levels.value = []
  supervisorOptions.value = []
}

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  resetForm()
  showForm.value = true
}

async function openEdit(record: Employee) {
  formMode.value = 'edit'
  editingId.value = record.id
  supervisorOptions.value = []
  levels.value = []
  skipDeptWatch = true
  form.value = {
    name: record.name,
    phone: record.phone ?? '',
    email: record.email ?? '',
    roleCode: record.roleCode ?? 'employee',
    departmentId: record.departmentId ?? undefined,
    positionId: record.positionId ?? undefined,
    entryDate: record.entryDate ?? '',
    socialSeniority: record.socialSeniority ?? undefined,
    contractType: record.contractType ?? undefined,
    dailySubsidy: record.dailySubsidy ?? undefined,
    performanceRatio: record.performanceRatio ?? undefined,
    emergencyContacts: (record.emergencyContacts ?? []).map((c) => ({ ...c })),
    directSupervisorId: record.directSupervisorId ?? undefined,
    levelId: record.levelId ?? undefined,
    gender: record.gender ?? '',
    idCardNo: record.idCardNo ?? '',
    birthDate: record.birthDate ? dayjs(record.birthDate) : null,
  }
  // 岗位全量已在 onMounted 加载，直接回填等级选项（skipDeptWatch 保证 watch 不清空此赋值）
  skipDeptWatch = false
  if (record.positionId) {
    onPositionChange(record.positionId)
  }
  // 直系领导：先从当前列表查找，找不到则发请求获取姓名
  if (record.directSupervisorId) {
    const found = employees.value.find((e) => e.id === record.directSupervisorId)
    if (found) {
      supervisorOptions.value = [
        {
          value: found.id,
          label: found.name + (found.departmentName ? ` (${found.departmentName})` : ''),
        },
      ]
    } else {
      try {
        const emp = await request<Employee>({ url: `/employees/${record.directSupervisorId}` })
        if (emp) {
          supervisorOptions.value = [
            {
              value: emp.id,
              label: emp.name + (emp.departmentName ? ` (${emp.departmentName})` : ''),
            },
          ]
        }
      } catch {
        /* ignore — 直系领导可能已离职 */
      }
    }
  }
  showForm.value = true
}

function openDisable(record: Employee) {
  disableTarget.value = record
  showDisableModal.value = true
}

async function doDisable() {
  if (!disableTarget.value) return
  disablingId.value = disableTarget.value.id
  try {
    await request({
      url: `/employees/${disableTarget.value.id}/status`,
      method: 'PATCH',
      body: { accountStatus: 'DISABLED' },
    })
    showDisableModal.value = false
    disableSuccess.value = true
    await loadEmployees()
  } catch {
    // handled
  } finally {
    disablingId.value = null
  }
}

function addContact() {
  form.value.emergencyContacts.push({ name: '', phone: '', address: '' })
}

function removeContact(idx: number) {
  form.value.emergencyContacts.splice(idx, 1)
}

async function submitForm() {
  if (!form.value.name.trim()) {
    message.warning('请填写姓名')
    return
  }
  if (!form.value.roleCode) {
    message.warning('请选择主角色')
    return
  }
  if (!form.value.departmentId) {
    message.warning('请填写部门 ID')
    return
  }
  if (!form.value.gender) {
    message.warning('请选择性别')
    return
  }
  if (formMode.value === 'create' && !form.value.entryDate) {
    message.warning('请填写入职日期')
    return
  }
  submitting.value = true
  try {
    const body = {
      ...form.value,
      entryDate: form.value.entryDate || null,
      birthDate: form.value.birthDate ? form.value.birthDate.format('YYYY-MM-DD') : null,
    }
    if (formMode.value === 'create') {
      await request({ url: '/employees', method: 'POST', body })
      message.success(h('span', { 'data-catch': 'employee-create-success' }, '员工已创建'))
    } else if (editingId.value) {
      await request({ url: `/employees/${editingId.value}`, method: 'PUT', body })
      message.success(h('span', { 'data-catch': 'employee-save-success' }, '员工已更新'))
    }
    showForm.value = false
    await loadEmployees()
  } catch {
    // handled
  } finally {
    submitting.value = false
  }
}

async function loadDepartments() {
  const tree = await request<Department[]>({ url: '/departments' })
  const flat: { value: number; label: string }[] = []
  function walk(nodes: Department[]) {
    for (const n of nodes) {
      flat.push({ value: n.id, label: n.name })
      if (n.children) walk(n.children)
    }
  }
  walk(tree ?? [])
  departments.value = flat
}

/**
 * 加载全量岗位列表（后端岗位独立于部门，不支持 departmentId 过滤）
 * 三级联动通过 watch departmentId 清空已选岗位/等级实现，岗位列表全量共享
 */
async function loadAllPositions() {
  loadingPositions.value = true
  try {
    const data = await request<Position[]>({ url: '/positions' })
    positions.value = data ?? []
  } catch {
    positions.value = []
  } finally {
    loadingPositions.value = false
  }
}

function onPositionChange(posId: SelectValue) {
  form.value.levelId = undefined
  levels.value = []
  if (!posId) return
  const pos = positions.value.find((p) => p.id === Number(posId))
  levels.value = (pos?.levels ?? []).map((l) => ({ value: l.id, label: l.levelName }))
}

async function loadRoles() {
  loadingRoles.value = true
  try {
    const data = await request<Role[]>({ url: '/roles' })
    roles.value = (data ?? []).map((r) => ({ value: r.roleCode, label: r.roleName }))
  } catch {
    roles.value = []
  } finally {
    loadingRoles.value = false
  }
}

let supervisorTimer: ReturnType<typeof setTimeout> | null = null
/**
 * 直系领导可搜索下拉 — 防抖 300ms
 * 按姓名搜索，限定角色为部门经理或项目经理（role=department_manager,project_manager）
 */
async function searchSupervisor(kw: string) {
  if (!kw) {
    supervisorOptions.value = []
    return
  }
  if (supervisorTimer) clearTimeout(supervisorTimer)
  supervisorTimer = setTimeout(async () => {
    searchingSupervisor.value = true
    try {
      const data = await request<{ content: Employee[] }>({
        url:
          '/employees?search=' +
          encodeURIComponent(kw) +
          '&role=department_manager,project_manager&size=20',
      })
      supervisorOptions.value = (data?.content ?? []).map((e) => ({
        value: e.id,
        label: e.name + (e.departmentName ? ' (' + e.departmentName + ')' : ''),
      }))
    } catch {
    } finally {
      searchingSupervisor.value = false
    }
  }, 300)
}

async function loadEmployees() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      size: String(pageSize.value),
    })
    if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
    const data = await request<{ content: Employee[]; totalElements: number }>({
      url: `/employees?${params}`,
    })
    employees.value = data.content ?? []
    totalElements.value = data.totalElements ?? 0
  } catch {
    employees.value = []
    totalElements.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 0
  loadEmployees()
}
function onPageChange(p: number) {
  page.value = p - 1
  loadEmployees()
}

// 三级联动：部门变更时清空已选岗位和等级（岗位列表全量，不按部门重载）
// skipDeptWatch 为 true 时（openEdit 回填期间）跳过清空，避免覆盖回填值
watch(
  () => form.value.departmentId,
  (deptId, prevDeptId) => {
    if (skipDeptWatch || deptId === prevDeptId) return
    form.value.positionId = undefined
    form.value.levelId = undefined
    levels.value = []
  }
)

onMounted(() => {
  loadEmployees()
  loadDepartments()
  loadAllPositions()
  loadRoles()
})
</script>

<style scoped>
.employees-page {
  /* flow */
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}
.contact-list {
  margin-top: 12px;
}
.contact-title {
  color: #666;
  margin-bottom: 4px;
}
.contact-row {
  display: flex;
  gap: 16px;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}
.emergency-row {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 0;
}
</style>
