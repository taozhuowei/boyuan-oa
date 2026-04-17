<template>
  <!-- 项目列表页
       CEO: 可创建/编辑/关闭/删除项目
       PM: 只看自己负责的项目（后端自动过滤）
       其他角色: 只读查看 -->
  <div class="projects-page">
    <div class="page-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h2 class="page-title" style="margin: 0;">项目管理</h2>
      <a-button v-if="isCeo" type="primary" @click="showCreateModal = true">+ 新建项目</a-button>
    </div>

    <!-- 筛选栏 -->
    <a-card style="margin-bottom: 12px;">
      <a-space>
        <a-select
          v-model:value="statusFilter"
          style="width: 140px;"
          placeholder="全部状态"
          allow-clear
          @change="loadProjects"
        >
          <a-select-option value="ACTIVE">进行中</a-select-option>
          <a-select-option value="CLOSED">已关闭</a-select-option>
        </a-select>
        <a-button @click="loadProjects" :loading="loading">刷新</a-button>
      </a-space>
    </a-card>

    <!-- 项目列表 -->
    <a-card>
      <a-table
        data-catch="projects-list-table"
        :columns="columns"
        :data-source="projects"
        :loading="loading"
        row-key="id"
        size="small"
        :pagination="{ pageSize: 10, showSizeChanger: false }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a @click="navigateTo(`/projects/${record.id}`)">{{ record.name }}</a>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
              {{ record.status === 'ACTIVE' ? '进行中' : '已关闭' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'startDate'">
            {{ record.startDate ?? '—' }}
          </template>
          <template v-if="column.key === 'memberCount'">
            {{ record.memberCount }} 人
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="navigateTo(`/projects/${record.id}`)">详情</a-button>
              <template v-if="isCeo">
                <a-button type="link" size="small" @click="openEditModal(record as ProjectItem)">编辑</a-button>
                <a-popconfirm
                  v-if="record.status === 'ACTIVE'"
                  title="确认关闭该项目？"
                  @confirm="doCloseProject(record.id as number)"
                >
                  <a-button type="link" size="small" danger :data-catch="'project-row-close-btn-' + record.id">关闭</a-button>
                </a-popconfirm>
                <a-button
                  v-if="record.status === 'CLOSED'"
                  type="link"
                  size="small"
                  :data-catch="'project-row-reopen-btn-' + record.id"
                  @click="doReopenProject(record.id as number)"
                >重开</a-button>
                <a-popconfirm title="确认删除该项目？" @confirm="doDeleteProject(record.id as number)">
                  <a-button type="link" size="small" danger>删除</a-button>
                </a-popconfirm>
              </template>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新建项目弹窗 -->
    <a-modal
      v-model:open="showCreateModal"
      title="新建项目"
      @ok="doCreateProject"
      :confirm-loading="createLoading"
      @cancel="resetCreateForm"
      :okButtonProps="({ 'data-catch': 'project-create-modal-ok' } as any)" <!-- 原因：antd ButtonProps 不含 data-* 属性，必须 as any 以传入 data-catch 测试标识 -->
    >
      <a-form :model="createForm" layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input v-model:value="createForm.name" placeholder="请输入项目名称" />
        </a-form-item>
        <a-form-item label="开始日期">
          <a-date-picker v-model:value="createForm.startDateStr" style="width: 100%;" value-format="YYYY-MM-DD" placeholder="请选择日期" />
        </a-form-item>
        <a-form-item label="日志申报周期（天）">
          <a-input-number v-model:value="createForm.logCycleDays" :min="1" :max="30" style="width: 100%;" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑项目弹窗 -->
    <a-modal
      v-model:open="showEditModal"
      title="编辑项目"
      @ok="doUpdateProject"
      :confirm-loading="editLoading"
    >
      <a-form :model="editForm" layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input v-model:value="editForm.name" />
        </a-form-item>
        <a-form-item label="开始日期">
          <a-date-picker v-model:value="editForm.startDateStr" style="width: 100%;" value-format="YYYY-MM-DD" placeholder="请选择日期" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目列表页 — projects/index.vue
 * 数据来源：GET /api/projects
 * CEO 可创建/编辑/关闭/删除；PM 只读（后端按 pmEmployeeId 过滤）
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'

interface ProjectItem {
  id: number
  name: string
  status: string
  startDate: string | null
  actualEndDate: string | null
  logCycleDays: number
  memberCount: number
}

interface PageResult<T> {
  records: T[]
  total: number
  current: number
  size: number
}

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isCeo = computed(() => role.value === 'ceo')

const loading = ref(false)
const projects = ref<ProjectItem[]>([])
const statusFilter = ref<string | undefined>(undefined)

// 新建表单
const showCreateModal = ref(false)
const createLoading = ref(false)
const createForm = ref({ name: '', startDateStr: undefined as string | undefined, logCycleDays: 1 })

// 编辑表单
const showEditModal = ref(false)
const editLoading = ref(false)
const editForm = ref({ id: 0, name: '', startDateStr: undefined as string | undefined })

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '项目名称', dataIndex: 'name', key: 'name' },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 120 },
  { title: '成员数', dataIndex: 'memberCount', key: 'memberCount', width: 80 },
  { title: '操作', key: 'action', width: 180 }
]

async function loadProjects() {
  loading.value = true
  try {
    const params: Record<string, string> = { page: '1', size: '100' }
    if (statusFilter.value) params.status = statusFilter.value
    const query = new URLSearchParams(params).toString()
    const res = await request<PageResult<ProjectItem>>({ url: `/projects?${query}`, method: 'GET' })
    projects.value = res.records ?? []
  } catch {
    message.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

function resetCreateForm() {
  createForm.value = { name: '', startDateStr: undefined, logCycleDays: 1 }
}

async function doCreateProject() {
  if (!createForm.value.name.trim()) {
    message.warning('项目名称不能为空')
    return
  }
  createLoading.value = true
  try {
    const body: Record<string, unknown> = { name: createForm.value.name }
    if (createForm.value.startDateStr) body.startDate = createForm.value.startDateStr
    if (createForm.value.logCycleDays) body.logCycleDays = createForm.value.logCycleDays
    await request({ url: '/projects', method: 'POST', body })
    message.success('项目创建成功')
    showCreateModal.value = false
    resetCreateForm()
    await loadProjects()
  } catch {
    message.error('创建失败')
  } finally {
    createLoading.value = false
  }
}

function openEditModal(project: ProjectItem) {
  editForm.value = { id: project.id, name: project.name, startDateStr: project.startDate ?? undefined }
  showEditModal.value = true
}

async function doUpdateProject() {
  if (!editForm.value.name.trim()) {
    message.warning('项目名称不能为空')
    return
  }
  editLoading.value = true
  try {
    const body: Record<string, unknown> = { name: editForm.value.name }
    if (editForm.value.startDateStr) body.startDate = editForm.value.startDateStr
    await request({ url: `/projects/${editForm.value.id}`, method: 'PUT', body })
    message.success('已更新')
    showEditModal.value = false
    await loadProjects()
  } catch {
    message.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

async function doCloseProject(id: number) {
  try {
    await request({ url: `/projects/${id}/status`, method: 'PATCH', body: { status: 'CLOSED' } })
    message.success('项目已关闭')
    await loadProjects()
  } catch {
    message.error('操作失败')
  }
}

async function doReopenProject(id: number) {
  try {
    await request({ url: `/projects/${id}/status`, method: 'PATCH', body: { status: 'ACTIVE' } })
    message.success('项目已重开')
    await loadProjects()
  } catch {
    message.error('操作失败')
  }
}

async function doDeleteProject(id: number) {
  try {
    await request({ url: `/projects/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadProjects()
  } catch {
    message.error('删除失败')
  }
}

onMounted(() => loadProjects())
</script>

<style scoped>
.projects-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
}

/* Removed flex constraints to allow natural content flow */
</style>
