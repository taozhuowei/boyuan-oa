<template>
  <!-- Form Center — record center for form submissions and approvals -->
  <div class="forms-page">
    <h2 class="page-title">表单中心</h2>

    <a-card>
      <a-tabs v-model:active-key="activeTab">
        <!-- Tab 1: My Submissions -->
        <a-tab-pane key="submissions" tab="我的提交">
          <a-table
            :columns="columns"
            :data-source="submissions"
            :loading="loading"
            :pagination="pagination"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'submitTime'">
                {{ formatDateTime(record.submitTime) }}
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openDetail(record)">
                  查看
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- Tab 2: Approval History -->
        <a-tab-pane key="approvals" tab="审批历史">
          <a-table
            :columns="columns"
            :data-source="approvals"
            :loading="loading"
            :pagination="pagination"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'submitTime'">
                {{ formatDateTime(record.submitTime) }}
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">
                  {{ record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openDetail(record)">
                  查看
                </a-button>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <!-- Detail Drawer -->
    <a-drawer
      v-model:open="drawerOpen"
      title="表单详情"
      placement="right"
      width="520"
    >
      <template v-if="selectedForm">
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">表单编号：</span>
            <span class="detail-value">{{ selectedForm.formNo }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">表单类型：</span>
            <span class="detail-value">{{ selectedForm.formTypeName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提交人：</span>
            <span class="detail-value">{{ selectedForm.submitter }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">部门：</span>
            <span class="detail-value">{{ selectedForm.department }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提交时间：</span>
            <span class="detail-value">{{ formatDateTime(selectedForm.submitTime) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态：</span>
            <a-tag :color="getStatusColor(selectedForm.status)">
              {{ selectedForm.status }}
            </a-tag>
          </div>
          <div v-if="selectedForm.remark" class="detail-row">
            <span class="detail-label">备注：</span>
            <span class="detail-value">{{ selectedForm.remark }}</span>
          </div>
        </div>

        <!-- Form Data -->
        <div v-if="selectedForm.formData && Object.keys(selectedForm.formData).length > 0" class="detail-section">
          <h4 class="section-title">表单数据</h4>
          <div class="detail-row" v-for="[key, value] in Object.entries(selectedForm.formData)" :key="key">
            <span class="detail-label">{{ formatKey(key) }}:</span>
            <span class="detail-value">{{ formatValue(value) }}</span>
          </div>
        </div>

        <!-- Approval History Timeline -->
        <div v-if="selectedForm.history && selectedForm.history.length > 0" class="detail-section">
          <h4 class="section-title">审批历史</h4>
          <a-timeline>
            <a-timeline-item v-for="(item, index) in selectedForm.history" :key="index">
              <div class="timeline-item">
                <div class="timeline-node">{{ item.nodeName }}</div>
                <div class="timeline-approver">审批人：{{ item.approver }}</div>
                <div class="timeline-action">操作：{{ item.action }}</div>
                <div v-if="item.comment" class="timeline-comment">意见：{{ item.comment }}</div>
                <div class="timeline-time">{{ formatDateTime(item.time) }}</div>
              </div>
            </a-timeline-item>
          </a-timeline>
        </div>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'

// Types
interface HistoryItem {
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
  submitter: string
  department: string
  submitTime: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  currentNode?: string
  formData: Record<string, unknown>
  history: HistoryItem[]
  remark?: string
}

// State
const activeTab = ref('submissions')
const loading = ref(false)
const submissions = ref<FormRecord[]>([])
const approvals = ref<FormRecord[]>([])
const drawerOpen = ref(false)
const selectedForm = ref<FormRecord | null>(null)

const pagination = {
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
  pageSize: 20
}

const columns = [
  { title: '表单编号', dataIndex: 'formNo', key: 'formNo' },
  { title: '表单类型', dataIndex: 'formTypeName', key: 'formTypeName' },
  { title: '提交人', dataIndex: 'submitter', key: 'submitter' },
  { title: '提交时间', key: 'submitTime' },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 100 }
]

// Methods
function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    PENDING: 'blue',
    APPROVED: 'green',
    REJECTED: 'red',
    CANCELLED: 'gray'
  }
  return colorMap[status] || 'default'
}

function formatDateTime(datetime: string): string {
  if (!datetime) return '—'
  // Format: YYYY-MM-DD HH:mm
  const date = new Date(datetime)
  if (isNaN(date.getTime())) return datetime
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatKey(key: string): string {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

function openDetail(record: FormRecord) {
  selectedForm.value = record
  drawerOpen.value = true
}

async function loadForms() {
  loading.value = true
  try {
    const data = await request<FormRecord[]>({
      url: '/forms/history?formTypes=LEAVE,OVERTIME'
    })
    // For now, backend filters by role; we assign to both tabs
    submissions.value = data ?? []
    approvals.value = data ?? []
  } catch {
    submissions.value = []
    approvals.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadForms)
</script>

<style scoped>
.forms-page {
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

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #003466;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  align-items: flex-start;
}

.detail-label {
  flex-shrink: 0;
  width: 100px;
  color: #666;
  font-size: 13px;
}

.detail-value {
  flex: 1;
  color: #333;
  font-size: 13px;
  word-break: break-word;
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
