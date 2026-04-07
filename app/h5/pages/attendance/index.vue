<template>
  <!-- Attendance page — shows personal attendance records; sub-tabs for leave/overtime requests -->
  <div class="attendance-page">
    <h2 class="page-title">考勤管理</h2>

    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="records" tab="我的记录" />
        <a-tab-pane key="leave" tab="请假申请" />
        <a-tab-pane key="overtime" tab="加班申报" />
        <a-tab-pane key="notifications" tab="加班通知" />
      </a-tabs>

      <!-- 我的记录 -->
      <template v-if="activeTab === 'records'">
        <a-table
          :columns="recordColumns"
          :data-source="records"
          :loading="loadingRecords"
          :pagination="{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
          row-key="id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'submitTime'">
              {{ formatDate(record.submitTime) }}
            </template>
            <template v-if="column.key === 'summary'">
              {{ getSummary(record) }}
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <a-button type="link" size="small" @click="viewRecord(record)">查看</a-button>
            </template>
          </template>
        </a-table>
      </template>

      <!-- 请假申请 -->
      <template v-if="activeTab === 'leave'">
        <a-form
          :model="leaveForm"
          layout="vertical"
          style="max-width: 480px"
          @finish="submitLeave"
        >
          <a-form-item label="假种" name="leaveType" :rules="[{ required: true, message: '请选择假种' }]">
            <a-select v-model:value="leaveForm.leaveType" placeholder="请选择">
              <a-select-option value="事假">事假</a-select-option>
              <a-select-option value="病假">病假</a-select-option>
              <a-select-option value="年假">年假</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="开始日期" name="startDate" :rules="[{ required: true, message: '请选择开始日期' }]">
            <a-date-picker v-model:value="leaveForm.startDate" style="width: 100%" />
          </a-form-item>
          <a-form-item label="结束日期" name="endDate" :rules="[{ required: true, message: '请选择结束日期' }]">
            <a-date-picker v-model:value="leaveForm.endDate" style="width: 100%" />
          </a-form-item>
          <a-form-item label="请假原因" name="reason" :rules="[{ required: true, message: '请填写原因' }]">
            <a-textarea v-model:value="leaveForm.reason" :rows="3" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submittingLeave">
              提交申请
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- 加班申报 -->
      <template v-if="activeTab === 'overtime'">
        <a-form
          :model="overtimeForm"
          layout="vertical"
          style="max-width: 480px"
          @finish="submitOvertime"
        >
          <a-form-item label="加班日期" name="date" :rules="[{ required: true, message: '请选择日期' }]">
            <a-date-picker v-model:value="overtimeForm.date" style="width: 100%" />
          </a-form-item>
          <a-form-item label="开始时间" name="startTime" :rules="[{ required: true, message: '请选择开始时间' }]">
            <a-time-picker v-model:value="overtimeForm.startTime" format="HH:mm" style="width: 100%" />
          </a-form-item>
          <a-form-item label="结束时间" name="endTime" :rules="[{ required: true, message: '请选择结束时间' }]">
            <a-time-picker v-model:value="overtimeForm.endTime" format="HH:mm" style="width: 100%" />
          </a-form-item>
          <a-form-item label="加班类型" name="overtimeType">
            <a-select v-model:value="overtimeForm.overtimeType" placeholder="请选择">
              <a-select-option value="周末加班">周末加班</a-select-option>
              <a-select-option value="节假日加班">节假日加班</a-select-option>
              <a-select-option value="工作日加班">工作日加班</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="说明" name="reason">
            <a-textarea v-model:value="overtimeForm.reason" :rows="3" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submittingOvertime">
              提交申报
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- 加班通知 Tab — 员工/劳工查看收到的加班通知，可确认或拒绝 -->
      <template v-if="activeTab === 'notifications'">
        <a-table
          :columns="notifColumns"
          :data-source="notifications"
          :loading="loadingNotifs"
          :pagination="{ pageSize: 20 }"
          row-key="notification.id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'date'">
              {{ record.notification.overtimeDate }}
            </template>
            <template v-if="column.key === 'type'">
              {{ overtimeTypeLabel(record.notification.overtimeType) }}
            </template>
            <template v-if="column.key === 'content'">
              {{ record.notification.content }}
            </template>
            <template v-if="column.key === 'status'">
              <template v-if="record.myResponse">
                <a-tag :color="record.myResponse.accepted ? 'success' : 'error'">
                  {{ record.myResponse.accepted ? '已确认' : '已拒绝' }}
                </a-tag>
              </template>
              <a-tag v-else color="processing">待响应</a-tag>
            </template>
            <template v-if="column.key === 'action'">
              <template v-if="!record.myResponse && record.notification.status !== 'ARCHIVED'">
                <a-space>
                  <a-button size="small" type="primary" @click="respondNotif(record.notification.id, true, '')">确认</a-button>
                  <a-button size="small" danger @click="openRejectModal(record.notification.id)">拒绝</a-button>
                </a-space>
              </template>
              <span v-else class="text-muted">—</span>
            </template>
          </template>
        </a-table>
      </template>
    </a-card>

    <!-- 拒绝加班通知弹窗 -->
    <a-modal
      v-model:open="rejectModalVisible"
      title="拒绝原因"
      @ok="confirmReject"
      ok-text="确认拒绝"
      cancel-text="取消"
    >
      <a-textarea v-model:value="rejectReason" placeholder="请填写拒绝原因（必填）" :rows="3" />
    </a-modal>

    <!-- 记录详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      :title="selectedRecord ? `${selectedRecord.formTypeName} · 详情` : '详情'"
      width="500px"
      :footer="null"
    >
      <div v-if="selectedRecord" class="record-detail">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item label="类型">{{ selectedRecord.formTypeName }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="statusColor(selectedRecord.status)">{{ statusLabel(selectedRecord.status) }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="提交时间" :span="2">{{ formatDate(selectedRecord.submitTime) }}</a-descriptions-item>
          <template v-for="(val, key) in selectedRecord.formData" :key="key">
            <a-descriptions-item :label="String(key)" :span="2">{{ String(val ?? '—') }}</a-descriptions-item>
          </template>
          <a-descriptions-item v-if="selectedRecord.remark" label="备注" :span="2">{{ selectedRecord.remark }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import type { Dayjs } from 'dayjs'

interface OvertimeNotifRecord {
  notification: {
    id: number
    projectId?: number
    initiatorId: number
    overtimeDate: string
    overtimeType: string
    content: string
    status: string
  }
  myResponse: {
    accepted: boolean
    rejectReason?: string
    rejectApprovalStatus?: string
  } | null
}

interface FormRecord {
  id: number
  formType: string
  formTypeName: string
  submitTime: string
  status: string
  formData?: Record<string, unknown>
  remark?: string
}

const activeTab = ref('records')
const loadingRecords = ref(false)
const records = ref<FormRecord[]>([])
const submittingLeave = ref(false)
const submittingOvertime = ref(false)

const leaveForm = ref<{
  leaveType: string | null
  startDate: Dayjs | null
  endDate: Dayjs | null
  reason: string
}>({ leaveType: null, startDate: null, endDate: null, reason: '' })

const overtimeForm = ref<{
  date: Dayjs | null
  startTime: Dayjs | null
  endTime: Dayjs | null
  overtimeType: string | null
  reason: string
}>({ date: null, startTime: null, endTime: null, overtimeType: null, reason: '' })

const recordColumns = [
  { title: '日期', key: 'submitTime', width: 100 },
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName', width: 90 },
  { title: '摘要', key: 'summary' },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 80 }
]

const detailVisible = ref(false)
const selectedRecord = ref<FormRecord | null>(null)

// 加班通知
const loadingNotifs = ref(false)
const notifications = ref<OvertimeNotifRecord[]>([])
const rejectModalVisible = ref(false)
const rejectReason = ref('')
const pendingRejectId = ref<number | null>(null)

const notifColumns = [
  { title: '加班日期', key: 'date', width: 110 },
  { title: '类型', key: 'type', width: 100 },
  { title: '说明', key: 'content' },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 130 }
]

function overtimeTypeLabel(t: string) {
  const map: Record<string, string> = { WEEKDAY: '工作日加班', WEEKEND: '周末加班', HOLIDAY: '节假日加班' }
  return map[t] ?? t
}

function onTabChange(key: string) {
  if (key === 'notifications') loadNotifications()
}

async function loadNotifications() {
  loadingNotifs.value = true
  try {
    const list = await request<OvertimeNotifRecord[]>({ url: '/overtime-notifications' })
    notifications.value = list ?? []
  } catch {
    notifications.value = []
  } finally {
    loadingNotifs.value = false
  }
}

async function respondNotif(id: number, accepted: boolean, reason: string) {
  try {
    await request({
      url: `/overtime-notifications/${id}/respond`,
      method: 'POST',
      body: { accepted, rejectReason: reason }
    })
    await loadNotifications()
  } catch (e: unknown) {
    alert((e as Error).message ?? '操作失败')
  }
}

function openRejectModal(id: number) {
  pendingRejectId.value = id
  rejectReason.value = ''
  rejectModalVisible.value = true
}

async function confirmReject() {
  if (!pendingRejectId.value || !rejectReason.value.trim()) {
    alert('请填写拒绝原因')
    return
  }
  await respondNotif(pendingRejectId.value, false, rejectReason.value)
  rejectModalVisible.value = false
}

/** 格式化日期，精确到天 */
function formatDate(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 10)
}

/** 生成摘要文字 */
function getSummary(record: FormRecord): string {
  const d = (record.formData ?? {}) as Record<string, unknown>
  if (record.formType === 'LEAVE') {
    return `${d.leaveType ?? ''} ${d.days ?? ''}天`
  }
  if (record.formType === 'OVERTIME') {
    return `${d.overtimeType ?? ''} ${d.startTime ?? ''}~${d.endTime ?? ''}`
  }
  return record.formTypeName ?? ''
}

function statusColor(status: string) {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'error'
  if (status === 'PENDING' || status === 'APPROVING') return 'processing'
  return 'default'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '审批中', APPROVING: '审批中',
    APPROVED: '已通过', REJECTED: '已驳回',
    ARCHIVED: '已归档', RECALLED: '已撤回'
  }
  return map[status] ?? status
}

function viewRecord(record: FormRecord) {
  selectedRecord.value = record
  detailVisible.value = true
}

async function loadRecords() {
  loadingRecords.value = true
  try {
    const list = await request<FormRecord[]>({ url: '/attendance/records' })
    records.value = list ?? []
  } catch {
    records.value = []
  } finally {
    loadingRecords.value = false
  }
}

async function submitLeave() {
  submittingLeave.value = true
  try {
    await request({
      url: '/attendance/leave',
      method: 'POST',
      body: {
        formType: 'LEAVE',
        formData: {
          leaveType: leaveForm.value.leaveType,
          startDate: leaveForm.value.startDate?.format('YYYY-MM-DD'),
          endDate: leaveForm.value.endDate?.format('YYYY-MM-DD'),
          days: (() => {
            const s = leaveForm.value.startDate
            const e = leaveForm.value.endDate
            if (s && e) return e.diff(s, 'day') + 1
            return 1
          })()
        },
        remark: leaveForm.value.reason
      }
    })
    leaveForm.value = { leaveType: null, startDate: null, endDate: null, reason: '' }
    activeTab.value = 'records'
    await loadRecords()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '提交失败'
    alert(msg)
  } finally {
    submittingLeave.value = false
  }
}

async function submitOvertime() {
  submittingOvertime.value = true
  try {
    await request({
      url: '/attendance/overtime',
      method: 'POST',
      body: {
        formType: 'OVERTIME',
        formData: {
          date: overtimeForm.value.date?.format('YYYY-MM-DD'),
          startTime: overtimeForm.value.startTime?.format('HH:mm'),
          endTime: overtimeForm.value.endTime?.format('HH:mm'),
          overtimeType: overtimeForm.value.overtimeType
        },
        remark: overtimeForm.value.reason
      }
    })
    overtimeForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: '' }
    activeTab.value = 'records'
    await loadRecords()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '提交失败'
    alert(msg)
  } finally {
    submittingOvertime.value = false
  }
}

onMounted(loadRecords)

</script>

<style scoped>
.attendance-page {
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

.record-detail {
  padding: 4px 0;
}
</style>
