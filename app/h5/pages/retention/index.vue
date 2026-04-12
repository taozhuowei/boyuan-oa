<template>
  <!-- 数据保留管理页面
       仅 CEO 角色可见
       功能：查看保留策略、处理到期提醒、查看导出任务 -->
  <div class="retention-page">
    <h2 class="page-title">数据保留管理</h2>

    <!-- CEO 视图 -->
    <template v-if="isCeo">
      <!-- Section 1: 数据保留策略 -->
      <a-card title="数据保留策略" style="margin-bottom: 16px;">
        <a-table
          :columns="policyColumns"
          :data-source="policies"
          :loading="loadingPolicies"
          row-key="id"
          size="small"
          :pagination="false"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'dataType'">
              {{ getDataTypeLabel(record.dataType) }}
            </template>
            <template v-if="column.key === 'retentionYears'">
              {{ record.retentionYears }} 年
            </template>
            <template v-if="column.key === 'warnBeforeDays'">
              {{ record.warnBeforeDays }} 天
            </template>
          </template>
        </a-table>
      </a-card>

      <!-- Section 2: 到期提醒 -->
      <a-card title="到期提醒" style="margin-bottom: 16px;">
        <a-empty v-if="reminders.length === 0 && !loadingReminders" description="暂无到期提醒" />
        <a-list
          v-else
          :data-source="reminders"
          :loading="loadingReminders"
          size="small"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <span>{{ getDataTypeLabel(item.dataType) }}</span>
                  <a-tag color="orange" style="margin-left: 8px;">
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
                  <a-button size="small" :loading="dismissingId === item.id">
                    忽略
                  </a-button>
                </a-popconfirm>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <!-- Section 3: 导出任务 -->
      <a-card title="导出任务">
        <div style="margin-bottom: 12px;">
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
              <span v-else-if="record.status === 'FAILED'" style="color: #ff4d4f; font-size: 12px;">
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
 * 数据保留管理页面
 * 职责：数据保留策略管理、到期提醒处理、导出任务查看
 * 权限：仅限 CEO 角色访问
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

// ── 类型定义 ──────────────────────────────────────────────────

interface RetentionPolicy {
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

// 策略数据
const policies = ref<RetentionPolicy[]>([])
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

const policyColumns = [
  { title: '数据类型', key: 'dataType' },
  { title: '保留年限', key: 'retentionYears' },
  { title: '提前警告天数', key: 'warnBeforeDays' },
]

const taskColumns = [
  { title: '任务 ID', dataIndex: 'id', key: 'id' },
  { title: '数据类型', key: 'dataTypes' },
  { title: '状态', key: 'status' },
  { title: '创建时间', key: 'createdAt' },
  { title: '令牌过期', key: 'tokenExpiresAt' },
  { title: '操作', key: 'action' },
]

// ── 数据类型标签映射 ─────────────────────────────────────────

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
    .map(t => getDataTypeLabel(t.trim()))
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

async function loadPolicies() {
  loadingPolicies.value = true
  try {
    const data = await request<RetentionPolicy[]>({ url: '/retention/policies' })
    policies.value = data
  } catch {
    message.error('加载保留策略失败')
  } finally {
    loadingPolicies.value = false
  }
}

async function loadReminders() {
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

async function loadExportTasks() {
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

function startPolling() {
  // 每 5 秒轮询一次，当有 PENDING 或 RUNNING 状态的任务时刷新
  pollTimer = setInterval(() => {
    const hasRunningTask = exportTasks.value.some(
      t => t.status === 'PENDING' || t.status === 'RUNNING'
    )
    if (hasRunningTask) {
      loadExportTasks()
    }
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// ── 操作处理 ──────────────────────────────────────────────

async function handleExportAndDelete(id: number) {
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

async function handleDismiss(id: number) {
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

function handleDownload(token: string) {
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
</script>

<style scoped>
.retention-page {
  /* Flow layout: natural top-to-bottom content flow */
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}
</style>
