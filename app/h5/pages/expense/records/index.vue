<template>
  <div class="expense-records-page">
    <h2 class="page-title">我的报销记录</h2>

    <a-card>
      <a-table
        :columns="columns"
        :data-source="records"
        :loading="loading"
        :pagination="{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'submitTime'">
            {{ formatDateTime(record.submitTime) }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ statusLabel(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'totalAmount'">
            ¥{{ record.formData?.totalAmount || '—' }}
          </template>
          <template v-if="column.key === 'expenseType'">
            {{ getExpenseTypeLabel(record.formData?.expenseType) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-button type="link" size="small" @click="viewDetail(record as FormRecord)">查看详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 详情弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      title="报销详情"
      width="600px"
      :footer="null"
    >
      <div v-if="selectedRecord" class="detail-content">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item label="表单编号">{{ selectedRecord.formNo }}</a-descriptions-item>
          <a-descriptions-item label="报销类型">
            {{ getExpenseTypeLabel(selectedRecord.formData?.expenseType as string | undefined) }}
          </a-descriptions-item>
          <a-descriptions-item label="报销金额">¥{{ selectedRecord.formData?.totalAmount }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(selectedRecord.status)">
              {{ statusLabel(selectedRecord.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="当前审批节点" :span="2">
            {{ selectedRecord.currentNode || '—' }}
          </a-descriptions-item>
          <a-descriptions-item label="提交时间" :span="2">
            {{ formatDateTime(selectedRecord.submitTime) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="selectedRecord.remark" label="备注" :span="2">
            {{ selectedRecord.remark }}
          </a-descriptions-item>
        </a-descriptions>

        <!-- 审批历史 -->
        <div v-if="selectedRecord.history && selectedRecord.history.length > 0" class="history-section">
          <h4 class="section-title">审批历史</h4>
          <a-timeline>
            <a-timeline-item v-for="(item, index) in selectedRecord.history" :key="index">
              <div class="timeline-item">
                <div class="timeline-node">{{ item.nodeName }}</div>
                <div class="timeline-approver">审批人：{{ item.approver }}</div>
                <div class="timeline-action">操作：{{ getHistoryActionLabel(item.action) }}</div>
                <div v-if="item.comment" class="timeline-comment">意见：{{ item.comment }}</div>
                <div class="timeline-time">{{ formatDateTime(item.time) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'

interface ApprovalHistoryItem {
  nodeName: string
  approver: string
  action: string
  comment?: string
  time: string
}

interface FormRecord {
  id: number
  formNo: string
  formType: string
  formTypeName: string
  submitTime: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  currentNode: string
  formData: Record<string, unknown>
  history: ApprovalHistoryItem[]
  remark?: string
}

const loading = ref(false)
const records = ref<FormRecord[]>([])
const modalVisible = ref(false)
const selectedRecord = ref<FormRecord | null>(null)

const columns = [
  { title: '表单编号', dataIndex: 'formNo', key: 'formNo' },
  { title: '报销类型', key: 'expenseType' },
  { title: '金额', key: 'totalAmount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '提交时间', key: 'submitTime' },
  { title: '操作', key: 'action', width: 100 }
]

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  TRAVEL: '差旅费',
  MEAL: '餐饮费',
  ACCOMMODATION: '住宿费',
  TRANSPORT: '交通费',
  OFFICE: '办公用品',
  OTHER: '其他'
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  CANCELLED: '已取消'
}

const HISTORY_ACTION_LABELS: Record<string, string> = {
  APPROVE: '审批通过',
  APPROVED: '审批通过',
  REJECT: '驳回',
  REJECTED: '驳回',
  SKIP: '跳过',
  SUBMIT: '提交',
  RECALL: '撤回'
}

function getExpenseTypeLabel(type: string | undefined): string {
  if (!type) return '—'
  return EXPENSE_TYPE_LABELS[type] || type
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}

function statusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'gray'
  }
  return colorMap[status] || 'default'
}

function getHistoryActionLabel(action: string): string {
  return HISTORY_ACTION_LABELS[action] || action
}

function formatDateTime(datetime: string): string {
  if (!datetime) return '—'
  const date = new Date(datetime)
  if (isNaN(date.getTime())) return datetime
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function viewDetail(record: FormRecord) {
  selectedRecord.value = record
  modalVisible.value = true
}

async function loadRecords() {
  loading.value = true
  try {
    const list = await request<FormRecord[]>({ url: '/expense/records' })
    records.value = list ?? []
  } catch {
    records.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadRecords)
</script>

<style scoped>
.expense-records-page {
  /* Page container */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.history-section {
  margin-top: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #003466;
}

.timeline-item {
  font-size: 13px;
}

.timeline-node {
  font-weight: 500;
  color: #003466;
  margin-bottom: 4px;
}

.timeline-approver {
  color: #666;
  margin-bottom: 2px;
}

.timeline-action {
  color: #666;
  margin-bottom: 2px;
}

.timeline-comment {
  color: #888;
  font-style: italic;
  margin-bottom: 2px;
}

.timeline-time {
  color: #999;
  font-size: 12px;
}
</style>
