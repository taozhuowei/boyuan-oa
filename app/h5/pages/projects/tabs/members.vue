<template>
  <!-- 成员信息 Tab — projects/tabs/members.vue
       职责：展示项目基本信息、CEO 配置表单、项目成员管理、第二角色管理。
       数据来源：
         PATCH /api/projects/{id}/config — 更新周期配置（CEO）
         GET   /api/employees — 搜索员工（CEO 添加成员）
         POST  /api/projects/{id}/members — 添加成员（CEO）
         DELETE /api/projects/{id}/members/{employeeId} — 移除成员（CEO）
         GET   /api/second-roles/defs — 第二角色定义列表
         GET   /api/second-roles?projectId={id} — 项目第二角色分配列表
         POST  /api/second-roles — 分配第二角色
         DELETE /api/second-roles/{id} — 撤销第二角色 -->
  <div>
    <!-- 项目基本信息 -->
    <a-descriptions bordered size="small" :column="2" style="margin-bottom: 16px">
      <a-descriptions-item label="项目名称">{{ project.name }}</a-descriptions-item>
      <a-descriptions-item label="状态">
        {{ project.status === 'ACTIVE' ? '进行中' : '已关闭' }}
      </a-descriptions-item>
      <a-descriptions-item label="开始日期">{{ project.startDate ?? '—' }}</a-descriptions-item>
      <a-descriptions-item label="实际完工日期">
        {{ project.actualEndDate ?? '—' }}
      </a-descriptions-item>
      <a-descriptions-item label="日志申报周期">
        {{ project.logCycleDays ?? 1 }} 天
      </a-descriptions-item>
      <a-descriptions-item label="汇报周期">
        {{ project.logReportCycleDays ?? 1 }} 天
      </a-descriptions-item>
      <a-descriptions-item label="客户名称">{{ project.clientName ?? '—' }}</a-descriptions-item>
      <a-descriptions-item label="合同编号">{{ project.contractNo ?? '—' }}</a-descriptions-item>
      <a-descriptions-item label="合同附件">
        <a
          v-if="project.contractAttachmentId"
          :href="`/api/attachments/${project.contractAttachmentId}`"
          target="_blank"
          rel="noopener noreferrer"
        >
          下载合同附件
        </a>
        <span v-else>—</span>
      </a-descriptions-item>
      <a-descriptions-item label="项目说明" :span="2">
        {{ project.projectDescription ?? '—' }}
      </a-descriptions-item>
    </a-descriptions>

    <!-- CEO：修改配置 -->
    <template v-if="isCeo">
      <a-divider>项目配置</a-divider>
      <a-form layout="inline" style="margin-bottom: 16px">
        <a-form-item label="日志申报周期（天）">
          <a-input-number v-model:value="configForm.logCycleDays" :min="1" :max="30" />
        </a-form-item>
        <a-form-item label="汇报周期（天）">
          <a-input-number v-model:value="configForm.logReportCycleDays" :min="1" :max="90" />
        </a-form-item>
        <a-form-item label="客户名称">
          <a-input
            v-model:value="configForm.clientName"
            placeholder="客户/甲方名称"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="合同编号">
          <a-input
            v-model:value="configForm.contractNo"
            placeholder="合同编号"
            style="width: 200px"
          />
        </a-form-item>
        <a-form-item label="合同附件">
          <customized-file-upload
            ref="contractFileRef"
            business-type="CONTRACT"
            :max-count="1"
            accept="image/*,.pdf,.doc,.docx"
            hint="可上传合同扫描件，最多 1 个"
            @change="
              (files: { attachmentId: number }[]) => {
                configForm.contractAttachmentId = files[0]?.attachmentId ?? null
              }
            "
          />
        </a-form-item>
        <a-form-item label="项目说明">
          <a-textarea
            v-model:value="configForm.projectDescription"
            :rows="2"
            style="width: 400px"
            placeholder="项目背景与说明"
          />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="configLoading" @click="doUpdateConfig">
            保存配置
          </a-button>
        </a-form-item>
      </a-form>
    </template>

    <!-- 成员列表 -->
    <a-divider>项目成员</a-divider>
    <template v-if="isCeo">
      <div style="margin-bottom: 12px">
        <a-space>
          <a-select
            v-model:value="addMemberForm.employeeId"
            show-search
            :filter-option="false"
            :options="employeeOptions"
            placeholder="搜索员工姓名"
            style="width: 200px"
            allow-clear
            @search="debouncedSearchEmployees"
            data-catch="project-members-user-select"
          />
          <a-select v-model:value="addMemberForm.role" style="width: 120px">
            <a-select-option value="PM">PM</a-select-option>
            <a-select-option value="MEMBER">成员</a-select-option>
          </a-select>
          <a-button
            data-catch="project-members-add-btn"
            type="primary"
            :loading="addMemberLoading"
            @click="doAddMember"
          >
            添加成员
          </a-button>
        </a-space>
      </div>
    </template>

    <a-table
      data-catch="project-members-list"
      :columns="memberColumns"
      :data-source="members"
      :loading="membersLoading"
      row-key="employeeId"
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'role'">
          <a-tag :color="record.role === 'PM' ? 'blue' : 'default'">
            {{ record.role === 'PM' ? '项目经理' : '成员' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action' && isCeo">
          <a-popconfirm title="确认移除该成员？" @confirm="doRemoveMember(record.employeeId)">
            <a-button type="link" size="small" danger>移除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 第二角色（PM/CEO） -->
    <template v-if="isPmOrCeo">
      <a-divider>第二角色</a-divider>
      <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: end">
        <a-form-item label="员工ID" style="margin: 0">
          <input
            type="number"
            :value="srForm.employeeId"
            @input="
              (e: Event) => {
                srForm.employeeId = Number((e.target as HTMLInputElement).value) || undefined
              }
            "
            min="1"
            placeholder="输入员工ID"
            class="ant-input"
            style="width: 200px; padding: 4px 11px"
          />
        </a-form-item>
        <a-form-item label="第二角色" style="margin: 0">
          <a-radio-group
            v-model:value="srForm.roleCode"
            style="display: flex; flex-wrap: wrap; gap: 8px"
          >
            <a-radio-button
              v-for="d in srDefs"
              :key="d.code"
              :value="d.code"
              :data-catch="d.code === 'FOREMAN' ? 'second-role-option-FOREMAN' : undefined"
            >
              {{ d.name }}
            </a-radio-button>
          </a-radio-group>
        </a-form-item>
        <a-button
          data-catch="assign-second-role-btn"
          type="primary"
          :loading="srLoading"
          @click="assignSecondRole"
        >
          分配
        </a-button>
        <a-button @click="loadSecondRoles">刷新</a-button>
      </div>
      <a-table
        :columns="srColumns"
        :data-source="srAssignments"
        :loading="srLoading"
        row-key="id"
        size="small"
        :customRow="
          (record: SecondRoleAssignment) =>
            ({ 'data-catch': 'member-row-' + record.employeeId }) as Record<string, string>
        "
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roleName'">{{ srRoleName(record.roleCode) }}</template>
          <template v-if="column.key === 'action'">
            <a-popconfirm title="确定撤销此第二角色？" @confirm="revokeSecondRole(record.id)">
              <a-button type="link" danger size="small">撤销</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 成员信息 Tab 子组件 — projects/tabs/members.vue
 * 职责：项目基本信息展示、CEO 配置更新、成员增删、第二角色分配/撤销。
 * Props：project（父页面传入的项目详情）、projectId（项目 ID）
 * Emits：refresh（需要父页面重新拉取项目数据时触发）
 */
import { ref, computed, watch, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import type { ProjectDetail, MemberInfo } from '../types'

// ── Props & Emits ──────────────────────────────────────
interface Props {
  project: ProjectDetail
  projectId: number
}
const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'refresh'): void }>()

// ── 权限 ──────────────────────────────────────────────
const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isCeo = computed(() => role.value === 'ceo')
const isPmOrCeo = computed(() => ['project_manager', 'ceo'].includes(role.value))

// ── 成员列表（从 project.members 初始化，refresh 后更新） ─
const members = ref<MemberInfo[]>(props.project.members ?? [])
const membersLoading = ref(false)

// 当父页面 project 更新（refresh 后），同步成员列表
watch(
  () => props.project.members,
  (val) => {
    members.value = val ?? []
  }
)

const memberColumns = [
  { title: '员工ID', dataIndex: 'employeeId', key: 'employeeId', width: 80 },
  { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '角色', dataIndex: 'role', key: 'role', width: 80 },
  ...(isCeo.value ? [{ title: '操作', key: 'action', width: 80 }] : []),
]

// ── CEO 配置表单（从 project prop 初始化） ───────────────
const configForm = ref({
  logCycleDays: props.project.logCycleDays ?? 1,
  logReportCycleDays: props.project.logReportCycleDays ?? 1,
  clientName: props.project.clientName ?? '',
  contractNo: props.project.contractNo ?? '',
  contractAttachmentId: null as number | null,
  projectDescription: props.project.projectDescription ?? '',
})
const configLoading = ref(false)
const contractFileRef = ref<{ clear: () => void } | undefined>(undefined)

// 父页面 project 刷新后同步配置表单默认值（用户未修改时）
watch(
  () => props.project,
  (p) => {
    configForm.value.logCycleDays = p.logCycleDays ?? 1
    configForm.value.logReportCycleDays = p.logReportCycleDays ?? 1
    configForm.value.clientName = p.clientName ?? ''
    configForm.value.contractNo = p.contractNo ?? ''
    configForm.value.projectDescription = p.projectDescription ?? ''
    // 刷新后清空上传槽（已保存的附件通过展示区的下载链接体现）
    configForm.value.contractAttachmentId = null
    contractFileRef.value?.clear()
  }
)

async function doUpdateConfig() {
  configLoading.value = true
  try {
    // 使用 PUT /projects/{id} 以支持 contractAttachmentId 字段
    await request({
      url: `/projects/${props.projectId}`,
      method: 'PUT',
      body: {
        name: props.project.name,
        startDate: props.project.startDate ?? null,
        actualEndDate: props.project.actualEndDate ?? null,
        logCycleDays: configForm.value.logCycleDays,
        logReportCycleDays: configForm.value.logReportCycleDays,
        clientName: configForm.value.clientName || null,
        contractNo: configForm.value.contractNo || null,
        contractAttachmentId:
          configForm.value.contractAttachmentId ?? props.project.contractAttachmentId ?? null,
        projectDescription: configForm.value.projectDescription || null,
      },
    })
    message.success('配置已更新')
    emit('refresh')
  } catch {
    message.error('更新失败')
  } finally {
    configLoading.value = false
  }
}

// ── 添加/移除成员 ──────────────────────────────────────
const addMemberForm = ref({ employeeId: undefined as number | undefined, role: 'MEMBER' })
const addMemberLoading = ref(false)
const employeeOptions = ref<{ label: string; value: number }[]>([])

async function searchEmployees(keyword: string) {
  if (!keyword || keyword.length < 1) {
    employeeOptions.value = []
    return
  }
  try {
    const res = await request<{ content: { id: number; name: string; employeeNo: string }[] }>({
      url: '/employees?page=0&size=20&keyword=' + encodeURIComponent(keyword),
    })
    employeeOptions.value = (res.content ?? []).map((e) => ({
      label: e.name + ' (' + e.employeeNo + ')',
      value: e.id,
    }))
  } catch {
    employeeOptions.value = []
  }
}

// 300ms 防抖
let searchTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSearchEmployees(keyword: string) {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => searchEmployees(keyword), 300)
}

async function doAddMember() {
  if (!addMemberForm.value.employeeId) {
    message.warning('请选择员工')
    return
  }
  addMemberLoading.value = true
  try {
    await request({
      url: `/projects/${props.projectId}/members`,
      method: 'POST',
      body: { employeeId: addMemberForm.value.employeeId, role: addMemberForm.value.role },
    })
    message.success('成员已添加')
    addMemberForm.value = { employeeId: undefined, role: 'MEMBER' }
    emit('refresh')
  } catch {
    message.error('添加失败')
  } finally {
    addMemberLoading.value = false
  }
}

async function doRemoveMember(employeeId: number) {
  try {
    await request({ url: `/projects/${props.projectId}/members/${employeeId}`, method: 'DELETE' })
    message.success('已移除')
    emit('refresh')
  } catch {
    message.error('移除失败')
  }
}

// ── 第二角色 ───────────────────────────────────────────
interface SecondRoleDef {
  code: string
  name: string
  appliesTo: 'OFFICE' | 'LABOR'
  projectBound: boolean
}
interface SecondRoleAssignment {
  id: number
  employeeId: number
  roleCode: string
  projectId: number | null
}

const srDefs = ref<SecondRoleDef[]>([])
const srAssignments = ref<SecondRoleAssignment[]>([])
const srLoading = ref(false)
const srForm = ref<{ employeeId: number | undefined; roleCode: string | undefined }>({
  employeeId: undefined,
  roleCode: undefined,
})

const srColumns = [
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId', width: 100 },
  { title: '角色', key: 'roleName' },
  { title: '操作', key: 'action', width: 100 },
]

async function loadSecondRoleDefs() {
  if (srDefs.value.length) return
  try {
    srDefs.value = (await request<SecondRoleDef[]>({ url: '/second-roles/defs' })) ?? []
  } catch {
    srDefs.value = []
  }
}

async function loadSecondRoles() {
  srLoading.value = true
  try {
    srAssignments.value =
      (await request<SecondRoleAssignment[]>({
        url: `/second-roles?projectId=${props.projectId}`,
      })) ?? []
  } catch {
    srAssignments.value = []
  } finally {
    srLoading.value = false
  }
}

function srRoleName(code: string) {
  return srDefs.value.find((d) => d.code === code)?.name ?? code
}

async function assignSecondRole() {
  if (!srForm.value.employeeId || !srForm.value.roleCode) {
    message.warning('请选择员工与第二角色')
    return
  }
  try {
    await request({
      url: '/second-roles',
      method: 'POST',
      body: {
        employeeId: srForm.value.employeeId,
        roleCode: srForm.value.roleCode,
        projectId: props.projectId,
      },
    })
    message.success('已分配')
    srForm.value = { employeeId: undefined, roleCode: undefined }
    await loadSecondRoles()
  } catch {}
}

async function revokeSecondRole(id: number) {
  try {
    await request({ url: `/second-roles/${id}`, method: 'DELETE' })
    await loadSecondRoles()
  } catch {}
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(async () => {
  if (isPmOrCeo.value) {
    await Promise.all([loadSecondRoleDefs(), loadSecondRoles()])
  }
})
</script>
