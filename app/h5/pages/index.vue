<template>
  <!-- Workbench dashboard — shows role-based summary cards and pending approval items -->
  <div class="workbench-page">
    <h2 class="page-title">工作台</h2>

    <!-- First-login warning banner -->
    <a-alert
      v-if="isDefaultPwd === true"
      type="warning"
      message="当前密码为初始密码（123456），请立即修改以确保账户安全"
      show-icon
    >
      <template #description>
        <a-button type="link" size="small" @click="navigateTo('/me/password')">
          去修改密码
        </a-button>
      </template>
    </a-alert>

    <!-- KPI cards -->
    <div class="stat-cards">
      <a-card class="stat-card">
        <a-statistic
          title="待审批事项"
          :value="summary?.pendingApprovalCount ?? todoList.length"
          suffix="项"
        />
      </a-card>
      <a-card class="stat-card">
        <a-statistic
          title="通知"
          :value="summary?.unreadNotificationCount ?? 0"
          suffix="条未读"
        />
      </a-card>

      <!-- Payroll cycle status card -->
      <a-card
        v-if="summary?.payrollStatus != null"
        class="stat-card clickable-card"
        @click="navigateTo('/payroll')"
      >
        <div class="stat-label">薪资周期状态</div>
        <a-tag :color="payrollStatusColor(summary.payrollStatus)">
          {{ payrollStatusLabel(summary.payrollStatus) }}
        </a-tag>
      </a-card>

      <!-- Active project count card -->
      <a-card
        v-if="summary?.activeProjectCount != null"
        class="stat-card clickable-card"
        @click="navigateTo('/projects')"
      >
        <a-statistic
          title="进行中项目"
          :value="summary.activeProjectCount"
          suffix="个"
        />
      </a-card>

      <!-- Retention alerts warning card -->
      <a-card
        v-if="summary?.retentionAlertCount != null && summary.retentionAlertCount > 0"
        class="stat-card warning-card"
      >
        <div class="stat-label">
          <warning-outlined class="warning-icon" />
          留存预警
        </div>
        <div class="warning-value">{{ summary.retentionAlertCount }} 项</div>
      </a-card>
    </div>

    <!-- Pending approval items -->
    <a-card title="待办事项" class="section-card">
      <a-table
        :columns="todoColumns"
        :data-source="todoList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'submitTime'">
            {{ formatTime(record.submitTime) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="navigateTo('/todo')">查看</a-button>
          </template>
        </template>
      </a-table>
      <div v-if="!loading && todoList.length === 0" class="empty-tip">
        暂无待办事项
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { WarningOutlined } from '@ant-design/icons-vue'
import { request } from '~/utils/http'

interface FormRecord {
  id: number
  formTypeName: string
  submitter: string
  submitTime: string
  status: string
  formData?: Record<string, unknown>
}

interface WorkbenchSummary {
  unreadNotificationCount?: number
  pendingApprovalCount?: number
  payrollStatus?: 'OPEN' | 'WINDOW_OPEN' | 'WINDOW_CLOSED' | 'SETTLED' | 'LOCKED'
  activeProjectCount?: number
  retentionAlertCount?: number
}

const loading = ref(false)
const todoList = ref<FormRecord[]>([])
const summary = ref<WorkbenchSummary | null>(null)
const isDefaultPwd = ref<boolean | null>(null)

const todoColumns = [
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName' },
  { title: '申请人', dataIndex: 'submitter', key: 'submitter' },
  { title: '提交时间', key: 'submitTime' },
  { title: '操作', key: 'action', width: 80 }
]

/**
 * Format timestamp for display
 */
function formatTime(t: string | undefined): string {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

/**
 * Get Chinese label for payroll status
 */
function payrollStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    OPEN: '待处理',
    WINDOW_OPEN: '申报中',
    WINDOW_CLOSED: '窗口已关闭',
    SETTLED: '已结算',
    LOCKED: '已锁定'
  }
  return labels[status] ?? status
}

/**
 * Get color for payroll status tag
 */
function payrollStatusColor(status: string): string {
  const colors: Record<string, string> = {
    OPEN: 'default',
    WINDOW_OPEN: 'blue',
    WINDOW_CLOSED: 'orange',
    SETTLED: 'green',
    LOCKED: 'purple'
  }
  return colors[status] ?? 'default'
}

onMounted(async () => {
  loading.value = true
  try {
    // Load both todo list and summary in parallel
    const role = useUserStore().userInfo?.role
    const canAccessAttendanceTodo = role === 'ceo' || role === 'project_manager'
    const [list, summaryData] = await Promise.all([
      canAccessAttendanceTodo
        ? request<FormRecord[]>({ url: '/attendance/todo' }).catch(() => [])
        : Promise.resolve([]),
      request<WorkbenchSummary>({ url: '/workbench/summary' }).catch(() => null)
    ])
    todoList.value = list ?? []
    summary.value = summaryData

    // Check default password status after summary is loaded and userInfo is available
    const userStore = useUserStore()
    if (userStore.userInfo) {
      const authData = await request<{ isDefaultPassword?: boolean }>({ url: '/auth/me' }).catch(() => null)
      isDefaultPwd.value = authData?.isDefaultPassword ?? false
    }
  } catch {
    todoList.value = []
    summary.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.workbench-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.stat-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  min-width: 160px;
}

.clickable-card {
  cursor: pointer;
}

.stat-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 4px;
}

.warning-card {
  background-color: #fff2e8;
  border-color: #ffbb96;
}

.warning-icon {
  color: #ff4d4f;
  margin-right: 4px;
}

.warning-value {
  font-size: 24px;
  font-weight: 600;
  color: #ff4d4f;
}

.section-card {
  /* Natural flow, no flex constraints */
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 24px 0;
}
</style>
