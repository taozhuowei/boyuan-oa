<template>
  <!-- Operation log viewer page (CEO only) -->
  <div class="operation-logs-page">
    <h2 class="page-title">操作日志</h2>

    <a-card>
      <!-- Filter bar -->
      <div class="search-bar">
        <a-range-picker
          v-model:value="dateRange"
          value-format="YYYY-MM-DD"
          :placeholder="['开始日期', '结束日期']"
        />
        <a-button type="primary" data-catch="operation-logs-list-search-btn" @click="onSearch">搜索</a-button>
        <a-button @click="onReset">重置</a-button>
      </div>

      <a-table
        data-catch="operation-log-list"
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="{
          current: page + 1,
          pageSize: pageSize,
          total: total,
          showTotal: (t: number) => `共 ${t} 条`,
          onChange: onPageChange
        }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'operatorName'">
            {{ record.operatorName ?? '—' }}
          </template>
          <template v-if="column.key === 'action'">
            {{ ACTION_LABELS[record.action] ?? record.action }}
          </template>
          <template v-if="column.key === 'targetType'">
            {{ TARGET_TYPE_LABELS[record.targetType] ?? record.targetType }}
          </template>
          <template v-if="column.key === 'detail'">
            <a-tooltip :title="record.detail">
              {{ truncate(record.detail, 60) }}
            </a-tooltip>
          </template>
          <template v-if="column.key === 'actedAt'">
            {{ formatDateTime(record.actedAt) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import dayjs from 'dayjs'

const ACTION_LABELS: Record<string, string> = {
  UPDATE_EMPLOYEE: '更新员工',
  BIND_SIGNATURE: '绑定签名',
  APPROVAL_ACTION: '审批操作',
  PAYROLL_SETTLE: '薪资结算'
}

const TARGET_TYPE_LABELS: Record<string, string> = {
  EMPLOYEE: '员工',
  SIGNATURE: '签名',
  FORM_RECORD: '表单',
  PAYROLL_CYCLE: '薪资周期'
}

interface OperationLog {
  id: number
  operatorId: number
  operatorName: string | null
  action: string
  targetType: string
  targetId: string
  detail: string
  actedAt: string
}

const loading = ref(false)
const records = ref<OperationLog[]>([])
const dateRange = ref<[string, string] | null>(null)
const page = ref(0)
const pageSize = ref(20)
const total = ref(0)

const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '操作人', dataIndex: 'operatorName', key: 'operatorName' },
  { title: '操作类型', dataIndex: 'action', key: 'action' },
  { title: '目标类型', dataIndex: 'targetType', key: 'targetType' },
  { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
  { title: '时间', dataIndex: 'actedAt', key: 'actedAt', width: 180 }
]

function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function formatDateTime(dateStr: string): string {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

async function loadLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      size: String(pageSize.value)
    })
    if (dateRange.value) {
      params.set('from', dateRange.value[0])
      params.set('to', dateRange.value[1])
    }
    const data = await request<{ total: number; records: OperationLog[] }>({
      url: `/operation-logs?${params}`
    })
    records.value = data.records ?? []
    total.value = data.total ?? 0
  } catch {
    records.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  page.value = 0
  loadLogs()
}

function onReset() {
  dateRange.value = null
  page.value = 0
  loadLogs()
}

function onPageChange(p: number) {
  page.value = p - 1
  loadLogs()
}

onMounted(loadLogs)
</script>

<style scoped>
.operation-logs-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

/* Removed flex constraints to allow natural content flow */

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
