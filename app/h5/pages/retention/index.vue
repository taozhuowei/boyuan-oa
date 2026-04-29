<template>
  <!--
    /retention — 数据保留管理页（运营态，仅 CEO 可见）

    本页结构：
      1) 数据保留策略表格 → 复用 <RetentionPanel mode="operation"> 渲染
      2) 到期提醒列表    → 本页内联（运营专属，不抽组件）
      3) 导出任务表格    → 本页内联（运营专属，不抽组件）

    DEF-SETUP-04 C2：保留策略部分作为 wizard / operation 双用组件下沉，
    其他两块继续保留在本页。
  -->
  <div class="retention-page">
    <h2 class="page-title">数据保留管理</h2>

    <!-- CEO 视图 -->
    <template v-if="isCeo">
      <!-- Section 1: 数据保留策略（复用面板组件，operation 模式只读展示） -->
      <a-card title="数据保留策略" style="margin-bottom: 16px">
        <RetentionPanel v-model="retentionModel" mode="operation" :loading="loadingPolicies" />
      </a-card>

      <!-- Section 2: 到期提醒（运营专属，本页内联） -->
      <a-card title="到期提醒" style="margin-bottom: 16px">
        <a-empty v-if="reminders.length === 0 && !loadingReminders" description="暂无到期提醒" />
        <a-list v-else :data-source="reminders" :loading="loadingReminders" size="small">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <span>{{ getDataTypeLabel(item.dataType) }}</span>
                  <a-tag color="orange" style="margin-left: 8px">
                    预计删除: {{ formatDate(item.expectedDeleteDate) }}
                  </a-tag>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-popconfirm
                  title="确定要导出后删除吗？"
                  description="导出文件将保存72小时，之后数据将被永久删除。"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="() => handleExportAndDelete(item.id)"
                >
                  <a-button type="primary" size="small" :loading="processingId === item.id">
                    导出后删除
                  </a-button>
                </a-popconfirm>
                <a-popconfirm
                  title="确定要忽略此提醒吗？"
                  description="忽略后该数据将不会被自动清理。"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="() => handleDismiss(item.id)"
                >
                  <a-button size="small" :loading="dismissingId === item.id">忽略</a-button>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <!-- Section 3: 导出任务（运营专属，本页内联） -->
      <a-card title="导出任务">
        <div style="margin-bottom: 12px">
          <a-button size="small" :loading="loadingTasks" @click="loadExportTasks">刷新</a-button>
        </div>
        <a-table
          :columns="taskColumns"
          :data-source="exportTasks"
          :loading="loadingTasks"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 10 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'dataTypes'">
              {{ formatDataTypes(record.dataTypes) }}
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusLabel(record.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'createdAt'">
              {{ formatDateTime(record.createdAt) }}
            </template>
            <template v-if="column.key === 'tokenExpiresAt'">
              {{ record.tokenExpiresAt ? formatDateTime(record.tokenExpiresAt) : '-' }}
            </template>
            <template v-if="column.key === 'action'">
              <a-button
                v-if="record.status === 'DONE' && record.downloadToken"
                type="link"
                size="small"
                @click="handleDownload(record.downloadToken)"
              >
                下载
              </a-button>
              <span v-else-if="record.status === 'FAILED'" style="color: #ff4d4f; font-size: 12px">
                {{ record.errorMsg || '导出失败' }}
              </span>
              <span v-else>-</span>
            </template>
          </template>
        </a-table>
      </a-card>
    </template>

    <!-- 无权限提示 -->
    <template v-else>
      <a-result status="403" title="无权访问" sub-title="仅 CEO 角色可访问数据保留管理功能">
        <template #extra>
          <a-button type="primary" @click="navigateTo('/')">返回首页</a-button>
        </template>
      </a-result>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据保留管理页面（运营态）
 *
 * 职责：
 *   - 数据保留策略：通过 <RetentionPanel mode="operation"> 展示后端 /retention/policies
 *     拉到的策略列表（只读；编辑能力仅在 wizard 模式下出现）
 *   - 到期提醒：拉取 /retention/reminders、按行执行"导出后删除 / 忽略"
 *   - 导出任务：拉取 /export-tasks，5 秒轮询 PENDING/RUNNING 状态，下载 DONE 任务
 *
 * 权限：仅 CEO。
 *
 * 设计依据：DEF-SETUP-04 C2 — 保留策略 UI 下沉到组件供 /setup 复用，
 * 本页保留运营专属的提醒 / 任务两块。
 */
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import RetentionPanel, {
  type RetentionData,
  type RetentionPolicyEntry,
} from '~/components/setup/RetentionPanel.vue'

// ── 类型定义 ──────────────────────────────────────────────────

/**
 * 后端 RetentionPolicy 实体响应（含 id / 时间戳，前端展示需）。
 * RetentionPolicyEntry（来自共用组件）只关心 dataType / retentionYears / warnBeforeDays，
 * 因此从后端响应映射到组件 modelValue 时丢弃多余字段即可。
 */
interface RetentionPolicyResponse {
  id: number
  dataType: string
  retentionYears: number
  warnBeforeDays: number
  createdAt: string
  updatedAt: string
}

interface RetentionReminder {
  id: number
  policyId: number
  dataType: string
  expectedDeleteDate: string
  status: string
  createdAt: string
}

interface ExportTask {
  id: number
  initiatorId: number
  dataTypes: string
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
  filePath: string | null
  downloadToken: string | null
  tokenExpiresAt: string | null
  startedAt: string | null
  finishedAt: string | null
  errorMsg: string | null
  createdAt: string
}

// ── 状态 ─────────────────────────────────────────────────────

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isCeo = computed(() => role.value === 'ceo')

/**
 * 共用面板的 v-model；运营态只用于把后端拉到的策略列表喂给组件渲染，
 * 用户在面板上的删除 / 编辑按钮已被组件按 mode='operation' 隐藏，因此 modelValue
 * 不会被组件改写。
 */
const retentionModel = reactive<RetentionData>({ policies: [] })
const loadingPolicies = ref(false)

// 提醒数据
const reminders = ref<RetentionReminder[]>([])
const loadingReminders = ref(false)
const processingId = ref<number | null>(null)
const dismissingId = ref<number | null>(null)

// 导出任务数据
const exportTasks = ref<ExportTask[]>([])
const loadingTasks = ref(false)

// 轮询定时器
let pollTimer: ReturnType<typeof setInterval> | null = null

// ── 表格列定义 ─────────────────────────────────────────────

const taskColumns = [
  { title: '任务 ID', dataIndex: 'id', key: 'id' },
  { title: '数据类型', key: 'dataTypes' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
  { title: '令牌过期', key: 'tokenExpiresAt' },
  { title: '操作', key: 'action' },
]

// ── 数据类型标签映射（与 RetentionPanel.DATA_TYPE_LABELS 内容相同；
//    此处保留独立常量以避免组件未挂载时（无权限分支）模板引用 panel 暴露失败） ────

const dataTypeLabels: Record<string, string> = {
  PAYROLL_SLIP: '工资条',
  FORM_RECORD: '表单记录',
  ATTENDANCE_RECORD: '考勤记录',
  CONSTRUCTION_LOG: '施工日志',
  INJURY_CLAIM: '工伤理赔',
  OPERATION_LOG: '操作日志',
}

function getDataTypeLabel(dataType: string): string {
  return dataTypeLabels[dataType] || dataType
}

function formatDataTypes(dataTypes: string): string {
  if (!dataTypes) return '-'
  return dataTypes
    .split(',')
    .map((t) => getDataTypeLabel(t.trim()))
    .join(', ')
}

// ── 状态标签和颜色 ───────────────────────────────────────────

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '等待中',
    RUNNING: '执行中',
    DONE: '已完成',
    FAILED: '失败',
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'default',
    RUNNING: 'blue',
    DONE: 'green',
    FAILED: 'red',
  }
  return colors[status] || 'default'
}

// ── 格式化工具 ─────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// ── 生命周期 ──────────────────────────────────────────────

onMounted(() => {
  if (isCeo.value) {
    loadPolicies()
    loadReminders()
    loadExportTasks()
    startPolling()
  }
})

onUnmounted(() => {
  stopPolling()
})

// ── 数据加载 ──────────────────────────────────────────────

/**
 * 加载保留策略；把后端响应映射到 RetentionPolicyEntry 子集后塞入 retentionModel.policies。
 */
async function loadPolicies(): Promise<void> {
  loadingPolicies.value = true
  try {
    const data = await request<RetentionPolicyResponse[]>({ url: '/retention/policies' })
    const mapped: RetentionPolicyEntry[] = data.map((p) => ({
      dataType: p.dataType,
      retentionYears: p.retentionYears,
      warnBeforeDays: p.warnBeforeDays,
    }))
    retentionModel.policies = mapped
  } catch {
    message.error('加载保留策略失败')
  } finally {
    loadingPolicies.value = false
  }
}

async function loadReminders(): Promise<void> {
  loadingReminders.value = true
  try {
    const data = await request<RetentionReminder[]>({ url: '/retention/reminders' })
    reminders.value = data
  } catch {
    message.error('加载到期提醒失败')
  } finally {
    loadingReminders.value = false
  }
}

async function loadExportTasks(): Promise<void> {
  loadingTasks.value = true
  try {
    const data = await request<ExportTask[]>({ url: '/export-tasks' })
    exportTasks.value = data
  } catch {
    message.error('加载导出任务失败')
  } finally {
    loadingTasks.value = false
  }
}

// ── 轮询 ──────────────────────────────────────────────────

function startPolling(): void {
  // 每 5 秒轮询一次，当有 PENDING 或 RUNNING 状态的任务时刷新
  pollTimer = setInterval(() => {
    const hasRunningTask = exportTasks.value.some(
      (t) => t.status === 'PENDING' || t.status === 'RUNNING'
    )
    if (hasRunningTask) {
      loadExportTasks()
    }
  }, 5000)
}

function stopPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// ── 操作处理 ──────────────────────────────────────────────

async function handleExportAndDelete(id: number): Promise<void> {
  processingId.value = id
  try {
    await request({
      url: `/retention/reminders/${id}/export-and-delete`,
      method: 'POST',
    })
    message.success('导出任务已启动')
    // 刷新提醒列表和任务列表
    await loadReminders()
    await loadExportTasks()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message || '导出失败')
  } finally {
    processingId.value = null
  }
}

async function handleDismiss(id: number): Promise<void> {
  dismissingId.value = id
  try {
    await request({
      url: `/retention/reminders/${id}/dismiss`,
      method: 'POST',
    })
    message.success('提醒已忽略')
    await loadReminders()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message || '操作失败')
  } finally {
    dismissingId.value = null
  }
}

function handleDownload(token: string): void {
  // 构建下载 URL 并触发下载
  const baseUrl = (import.meta.env.VITE_API_BASE_URL as string) || '/api'
  const downloadUrl = `${baseUrl}/retention/export/${token}/download`

  // 创建临时链接并点击
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `export-${token}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 仅用于 lint：避免 RetentionPanel emit 'change' 在 operation 模式下未被引用而触发未使用警告
// （RetentionPanel 在 operation 模式下不会触发 change，但保留本注释以提示未来若放开编辑能力时
//  应在此处添加 @change 处理器调用对应 API）
watch(
  () => retentionModel.policies.length,
  () => {
    /* placeholder — operation 模式下面板不会改写 modelValue */
  }
)
</script>

<style scoped>
.retention-page {
  /* 自然流式布局 */
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}
</style>
