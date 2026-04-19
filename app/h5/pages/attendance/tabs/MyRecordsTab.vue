<template>
  <!-- MyRecordsTab — 我的记录 tab: attendance record list, detail modal, resubmit trigger -->
  <div>
    <a-table
      data-catch="attendance-records-table"
      :columns="record_columns"
      :data-source="records"
      :loading="is_loading"
      :pagination="{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'submitTime'">
          {{ formatDate(record.submitTime) }}
        </template>
        <template v-if="column.key === 'summary'">
          {{ getSummary(record as FormRecord) }}
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="viewRecord(record as FormRecord)">
            查看
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 记录详情弹窗 -->
    <a-modal
      v-model:open="is_detail_visible"
      :title="selected_record ? `${selected_record.formTypeName} · 详情` : '详情'"
      width="500px"
      :footer="null"
    >
      <div v-if="selected_record" class="record-detail">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item label="类型">{{ selected_record.formTypeName }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(selected_record.status)">
              {{ statusLabel(selected_record.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交时间" :span="2">
            {{ formatDate(selected_record.submitTime) }}
          </a-descriptions-item>
          <template v-for="(val, key) in selected_record.formData" :key="key">
            <a-descriptions-item :label="getFieldLabel(String(key))" :span="2">
              {{ formatFormValue(key as string, val) }}
            </a-descriptions-item>
          </template>
          <a-descriptions-item v-if="selected_record.remark" label="备注" :span="2">
            {{ selected_record.remark }}
          </a-descriptions-item>
          <a-descriptions-item
            v-if="selected_record.status === 'REJECTED'"
            label="驳回原因"
            :span="2"
          >
            <span style="color: #ff4d4f">{{ getRejectReason(selected_record) }}</span>
          </a-descriptions-item>
        </a-descriptions>

        <div
          v-if="selected_record.status === 'REJECTED' && canResubmit(selected_record)"
          class="resubmit-row"
        >
          <a-button
            type="primary"
            data-catch="attendance-record-resubmit-btn"
            @click="handleResubmit(selected_record)"
          >
            重新发起
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * MyRecordsTab — 我的记录 Tab
 *
 * Purpose: display the current user's attendance form submissions (leave, overtime),
 * show a detail modal with approval history, and trigger resubmit for rejected records.
 *
 * Data flow:
 *   - Fetches /attendance/records on mount (called by parent via expose)
 *   - Emits 'resubmit-leave' or 'resubmit-overtime' with pre-filled form data so the
 *     parent can switch the active tab and pass prefill data down to the target form tab.
 */
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import {
  getFieldLabel,
  getLeaveTypeLabel,
  getOvertimeTypeLabel,
  formatFormSummary,
} from '../../../../shared/utils/formLabels'

dayjs.extend(customParseFormat)

interface ApprovalHistory {
  nodeName?: string
  approver?: string
  action?: string
  comment?: string
  time?: string
}

interface FormRecord {
  id: number
  formType: string
  formTypeName: string
  submitTime: string
  status: string
  formData?: Record<string, unknown>
  remark?: string
  history?: ApprovalHistory[]
}

interface LeaveResubmitData {
  leaveType: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  reason: string
}

interface OvertimeResubmitData {
  date: string | undefined
  startTime: string | undefined
  endTime: string | undefined
  overtimeType: string | undefined
  reason: string
}

const emit = defineEmits<{
  /** Emitted when user clicks 重新发起 on a rejected LEAVE record */
  'resubmit-leave': [data: LeaveResubmitData]
  /** Emitted when user clicks 重新发起 on a rejected OVERTIME record */
  'resubmit-overtime': [data: OvertimeResubmitData]
}>()

const is_loading = ref(false)
const records = ref<FormRecord[]>([])
const is_detail_visible = ref(false)
const selected_record = ref<FormRecord | null>(null)

const record_columns = [
  { title: '日期', key: 'submitTime', width: 100 },
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName', width: 90 },
  { title: '摘要', key: 'summary' },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 80 },
]

/** Fetch attendance records from API and update local state */
async function loadRecords() {
  is_loading.value = true
  try {
    const list = await request<FormRecord[]>({ url: '/attendance/records' })
    records.value = list ?? []
  } catch {
    records.value = []
  } finally {
    is_loading.value = false
  }
}

/** Open detail modal, then lazy-fetch full record (history + formData) */
async function viewRecord(record: FormRecord) {
  selected_record.value = record
  is_detail_visible.value = true
  try {
    const detail = await request<FormRecord>({ url: `/forms/${record.id}` })
    if (detail) {
      selected_record.value = {
        ...record,
        history: detail.history,
        formData: detail.formData ?? record.formData,
      }
    }
  } catch {
    // Non-fatal: basic record info is already displayed
  }
}

/** Handle 重新发起: emit resubmit event to parent, close detail modal */
function handleResubmit(record: FormRecord) {
  const data = record.formData ?? {}
  if (record.formType === 'LEAVE') {
    emit('resubmit-leave', {
      leaveType: (data.leaveType as string) ?? undefined,
      startDate: data.startDate ? String(data.startDate) : undefined,
      endDate: data.endDate ? String(data.endDate) : undefined,
      reason: record.remark ?? '',
    })
  } else if (record.formType === 'OVERTIME') {
    emit('resubmit-overtime', {
      date: data.date ? String(data.date) : undefined,
      startTime: data.startTime ? String(data.startTime) : undefined,
      endTime: data.endTime ? String(data.endTime) : undefined,
      overtimeType: (data.overtimeType as string) ?? undefined,
      reason: record.remark ?? '',
    })
  }
  is_detail_visible.value = false
}

function getRejectReason(record: FormRecord): string {
  const history = record.history ?? []
  const reject_step = [...history].reverse().find((h) => h.action === 'REJECT')
  return reject_step?.comment || '—'
}

function canResubmit(record: FormRecord): boolean {
  return record.formType === 'LEAVE' || record.formType === 'OVERTIME'
}

/** Format ISO datetime to YYYY-MM-DD */
function formatDate(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 10)
}

function getSummary(record: FormRecord): string {
  return formatFormSummary(record.formType, record.formData) || record.formTypeName || ''
}

/** Translate enum values to Chinese for display in detail modal */
function formatFormValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (key === 'leaveType') return getLeaveTypeLabel(String(value)) || String(value)
  if (key === 'overtimeType') return getOvertimeTypeLabel(String(value)) || String(value)
  return String(value)
}

function statusColor(status: string) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'PENDING' || status === 'APPROVING') return 'processing'
  return 'default'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '审批中',
    APPROVING: '审批中',
    APPROVED: '已通过',
    REJECTED: '已驳回',
    ARCHIVED: '已归档',
    RECALLED: '已撤回',
  }
  return map[status] ?? status
}

/** Load records on first mount (initial tab = records, or navigating back to records tab) */
onMounted(loadRecords)

/** Exposed so parent can reload records after a successful form submission */
defineExpose({ loadRecords })
</script>

<style scoped>
.record-detail {
  padding: 4px 0;
}

.resubmit-row {
  margin-top: 16px;
  text-align: right;
}
</style>
