<template>
  <!-- Workbench dashboard — shows role-based summary cards and pending approval items -->
  <div class="workbench-page" data-catch="workbench-summary-root">
    <h2 class="page-title">工作台</h2>

    <!-- First-login warning banner — 不暴露明文密码，只提示状态 -->
    <a-alert
      v-if="isDefaultPwd === true"
      type="warning"
      message="您仍在使用初始密码，为账户安全请尽快修改"
      show-icon
    >
      <template #description>
        <a-button type="link" size="small" @click="navigateTo('/me/password')">去修改密码</a-button>
      </template>
    </a-alert>

    <!-- KPI cards -->
    <div class="stat-cards">
      <a-card class="stat-card" data-catch="workbench-card-todos">
        <a-statistic
          title="待审批事项"
          :value="summary?.pendingApprovalCount ?? 0"
          suffix="项"
        />
      </a-card>
      <a-card class="stat-card">
        <a-statistic title="通知" :value="summary?.unreadNotificationCount ?? 0" suffix="条未读" />
      </a-card>

      <a-card
        v-if="totalEmployees != null"
        class="stat-card"
        data-catch="workbench-card-total-employees"
      >
        <a-statistic title="员工总数" :value="totalEmployees" suffix="人" />
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

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { WarningOutlined } from '@ant-design/icons-vue'
import { request } from '~/utils/http'

interface WorkbenchSummary {
  unreadNotificationCount?: number
  pendingApprovalCount?: number
  retentionAlertCount?: number
}

const loading = ref(false)
const summary = ref<WorkbenchSummary | null>(null)
const isDefaultPwd = ref<boolean | null>(null)
const totalEmployees = ref<number | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    // Load summary and employees in parallel
    const [summaryData, employeesData] = await Promise.all([
      request<WorkbenchSummary>({ url: '/workbench/summary' }).catch(() => null),
      request<{ totalElements: number }>({ url: '/employees?size=1' }).catch(() => null),
    ])
    summary.value = summaryData
    totalEmployees.value = employeesData?.totalElements ?? null

    // Check default password status after summary is loaded and userInfo is available
    const userStore = useUserStore()
    if (userStore.userInfo) {
      const authData = await request<{ isDefaultPassword?: boolean }>({ url: '/auth/me' }).catch(
        () => null
      )
      isDefaultPwd.value = authData?.isDefaultPassword ?? false
    }
  } catch {
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
