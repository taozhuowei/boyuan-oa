<template>
  <!-- Workbench dashboard — shows role-based summary cards and pending approval items -->
  <div class="workbench-page">
    <h2 class="page-title">工作台</h2>

    <!-- KPI cards -->
    <div class="stat-cards">
      <a-card class="stat-card">
        <a-statistic
          title="待审批事项"
          :value="todoList.length"
          suffix="项"
        />
      </a-card>
      <a-card class="stat-card">
        <a-statistic title="通知" :value="0" suffix="条未读" />
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
import { request } from '~/utils/http'

interface FormRecord {
  id: number
  formTypeName: string
  submitter: string
  submitTime: string
  status: string
  formData?: Record<string, unknown>
}

const loading = ref(false)
const todoList = ref<FormRecord[]>([])

const todoColumns = [
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName' },
  { title: '申请人', dataIndex: 'submitter', key: 'submitter' },
  { title: '提交时间', key: 'submitTime' },
  { title: '操作', key: 'action', width: 80 }
]

function formatTime(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

onMounted(async () => {
  loading.value = true
  try {
    const list = await request<FormRecord[]>({ url: '/attendance/todo' })
    todoList.value = list ?? []
  } catch {
    todoList.value = []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.workbench-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #003466;
}

.stat-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  flex: 1;
  min-width: 160px;
}

.section-card {
  flex: 1;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 24px 0;
}
</style>
