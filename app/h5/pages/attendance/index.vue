<template>
  <!-- Attendance page — shows personal attendance records; sub-tabs for leave/overtime requests -->
  <!-- PM/CEO additionally see: 发起通知 + 已发起 tabs -->
  <div class="attendance-page">
    <h2 class="page-title">考勤管理</h2>

    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="records" tab="我的记录" />
        <a-tab-pane key="leave" tab="请假申请" />
        <a-tab-pane key="overtime" tab="加班申报" />
        <a-tab-pane key="self-report" tab="自补加班" />
        <a-tab-pane key="notifications" tab="加班通知" />
        <a-tab-pane v-if="isPmOrCeo" key="notify-create" tab="发起通知" />
        <a-tab-pane v-if="isPmOrCeo" key="notify-initiated" tab="已发起" />
      </a-tabs>

      <!-- 我的记录 -->
      <template v-if="activeTab === 'records'">
        <a-table
          data-catch="attendance-records-table"
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
            <a-date-picker v-model:value="leaveForm.startDate" style="width: 100%" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item label="结束日期" name="endDate" :rules="[{ required: true, message: '请选择结束日期' }]">
            <a-date-picker v-model:value="leaveForm.endDate" style="width: 100%" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item label="请假原因" name="reason" :rules="[{ required: true, message: '请填写原因' }]">
            <a-textarea v-model:value="leaveForm.reason" :rows="3" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submittingLeave" data-catch="leave-form-submit">
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
            <a-date-picker v-model:value="overtimeForm.date" style="width: 100%" placeholder="请选择日期" />
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
            <a-button type="primary" html-type="submit" :loading="submittingOvertime" data-catch="attendance-overtime-submit">
              提交申报
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- 自补加班 — 补申报历史加班，走审批流 -->
      <template v-if="activeTab === 'self-report'">
        <a-form
          :model="selfReportForm"
          layout="vertical"
          style="max-width: 480px"
          @finish="submitSelfReport"
        >
          <a-form-item label="加班日期" name="date" :rules="[{ required: true, message: '请选择日期' }]">
            <a-date-picker v-model:value="selfReportForm.date" style="width: 100%" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item label="开始时间" name="startTime" :rules="[{ required: true, message: '请选择开始时间' }]">
            <a-time-picker v-model:value="selfReportForm.startTime" format="HH:mm" style="width: 100%" />
          </a-form-item>
          <a-form-item label="结束时间" name="endTime" :rules="[{ required: true, message: '请选择结束时间' }]">
            <a-time-picker v-model:value="selfReportForm.endTime" format="HH:mm" style="width: 100%" />
          </a-form-item>
          <a-form-item label="加班类型" name="overtimeType" :rules="[{ required: true, message: '请选择类型' }]">
            <a-select v-model:value="selfReportForm.overtimeType" placeholder="请选择">
              <a-select-option value="WEEKDAY">工作日加班</a-select-option>
              <a-select-option value="WEEKEND">周末加班</a-select-option>
              <a-select-option value="HOLIDAY">节假日加班</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="补申报原因" name="reason" :rules="[{ required: true, message: '请填写原因' }]">
            <a-textarea v-model:value="selfReportForm.reason" :rows="3" placeholder="请说明未能及时申报的原因" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submittingSelfReport" data-catch="attendance-selfreport-submit">
              提交申请
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

      <!-- 发起通知 Tab — PM/CEO 创建加班通知 -->
      <template v-if="activeTab === 'notify-create'">
        <a-form
          :model="notifyForm"
          layout="vertical"
          style="max-width: 480px"
          @finish="submitNotification"
        >
          <a-form-item label="加班日期" name="overtimeDate" :rules="[{ required: true, message: '请选择日期' }]">
            <a-date-picker v-model:value="notifyForm.overtimeDate" style="width: 100%" placeholder="请选择日期" />
          </a-form-item>
          <a-form-item label="加班类型" name="overtimeType" :rules="[{ required: true, message: '请选择类型' }]">
            <a-select v-model:value="notifyForm.overtimeType" placeholder="请选择">
              <a-select-option value="WEEKDAY">工作日加班</a-select-option>
              <a-select-option value="WEEKEND">周末加班</a-select-option>
              <a-select-option value="HOLIDAY">节假日加班</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="通知内容" name="content" :rules="[{ required: true, message: '请填写通知内容' }]">
            <a-textarea v-model:value="notifyForm.content" :rows="3" placeholder="说明加班安排、要求等" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="submittingNotification">
              发送通知
            </a-button>
          </a-form-item>
        </a-form>
      </template>

      <!-- 已发起 Tab — PM/CEO 查看自己发起的通知及响应情况 -->
      <template v-if="activeTab === 'notify-initiated'">
        <a-table
          :columns="initiatedColumns"
          :data-source="initiatedNotifs"
          :loading="loadingInitiated"
          :pagination="{ pageSize: 20 }"
          row-key="notification.id"
          size="small"
          :expand-row-by-click="true"
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
              <a-tag :color="notifStatusColor(record.notification.status)">
                {{ notifStatusLabel(record.notification.status) }}
              </a-tag>
            </template>
            <template v-if="column.key === 'responseCount'">
              {{ record.responses.length }} 人响应
            </template>
          </template>
          <template #expandedRowRender="{ record }">
            <div v-if="record.responses.length === 0" class="no-response-tip">暂无响应</div>
            <a-table
              v-else
              :columns="responseDetailColumns"
              :data-source="record.responses"
              :pagination="false"
              row-key="id"
              size="small"
            >
              <template #bodyCell="{ column: col, record: resp }">
                <template v-if="col.key === 'accepted'">
                  <a-tag :color="resp.accepted ? 'success' : 'error'">
                    {{ resp.accepted ? '已确认' : '已拒绝' }}
                  </a-tag>
                </template>
                <template v-if="col.key === 'rejectReason'">
                  {{ resp.rejectReason || '—' }}
                </template>
              </template>
            </a-table>
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
            <a-descriptions-item :label="getFieldLabel(String(key))" :span="2">
              {{ formatFormValue(key as string, val) }}
            </a-descriptions-item>
          </template>
          <a-descriptions-item v-if="selectedRecord.remark" label="备注" :span="2">{{ selectedRecord.remark }}</a-descriptions-item>
        </a-descriptions>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import type { Dayjs } from 'dayjs'
import {
  getFieldLabel,
  getLeaveTypeLabel,
  getOvertimeTypeLabel,
  formatFormSummary
} from '../../../shared/utils/formLabels'

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

interface OvertimeResponse {
  id: number
  employeeId: number
  accepted: boolean
  rejectReason?: string
  rejectApprovalStatus?: string
}

interface InitiatedNotifRecord {
  notification: {
    id: number
    overtimeDate: string
    overtimeType: string
    content: string
    status: string
  }
  responses: OvertimeResponse[]
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

const userStore = useUserStore()
const isPmOrCeo = computed(() => {
  const role = userStore.userInfo?.role ?? ''
  return role === 'project_manager' || role === 'ceo'
})

const activeTab = ref('records')
const loadingRecords = ref(false)
const records = ref<FormRecord[]>([])
const submittingLeave = ref(false)
const submittingOvertime = ref(false)
const submittingSelfReport = ref(false)
const submittingNotification = ref(false)

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

const selfReportForm = ref<{
  date: Dayjs | null
  startTime: Dayjs | null
  endTime: Dayjs | null
  overtimeType: string | null
  reason: string
}>({ date: null, startTime: null, endTime: null, overtimeType: null, reason: '' })

const notifyForm = ref<{
  overtimeDate: Dayjs | null
  overtimeType: string | null
  content: string
}>({ overtimeDate: null, overtimeType: null, content: '' })

const recordColumns = [
  { title: '日期', key: 'submitTime', width: 100 },
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName', width: 90 },
  { title: '摘要', key: 'summary' },
  { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 80 }
]

const detailVisible = ref(false)
const selectedRecord = ref<FormRecord | null>(null)

// 加班通知（员工接收）
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

// 已发起通知（PM/CEO 视图）
const loadingInitiated = ref(false)
const initiatedNotifs = ref<InitiatedNotifRecord[]>([])

const initiatedColumns = [
  { title: '加班日期', key: 'date', width: 110 },
  { title: '类型', key: 'type', width: 100 },
  { title: '通知内容', key: 'content' },
  { title: '状态', key: 'status', width: 90 },
  { title: '响应', key: 'responseCount', width: 90 }
]

const responseDetailColumns = [
  { title: '员工ID', dataIndex: 'employeeId', key: 'employeeId', width: 90 },
  { title: '响应', key: 'accepted', width: 80 },
  { title: '拒绝原因', key: 'rejectReason' }
]

function overtimeTypeLabel(t: string) {
  const map: Record<string, string> = { WEEKDAY: '工作日加班', WEEKEND: '周末加班', HOLIDAY: '节假日加班' }
  return map[t] ?? t
}

function notifStatusColor(s: string) {
  if (s === 'ARCHIVED') return 'default'
  if (s === 'NOTIFIED') return 'processing'
  return 'default'
}

function notifStatusLabel(s: string) {
  const map: Record<string, string> = { NOTIFIED: '待响应', ARCHIVED: '已归档' }
  return map[s] ?? s
}

function onTabChange(key: string) {
  if (key === 'notifications') loadNotifications()
  if (key === 'notify-initiated') loadInitiatedNotifs()
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

async function loadInitiatedNotifs() {
  loadingInitiated.value = true
  try {
    const list = await request<InitiatedNotifRecord[]>({ url: '/overtime-notifications/initiated' })
    initiatedNotifs.value = list ?? []
  } catch {
    initiatedNotifs.value = []
  } finally {
    loadingInitiated.value = false
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
  return formatFormSummary(record.formType, record.formData) || record.formTypeName || ''
}

/** 格式化表单字段值（将枚举值转换为中文） */
function formatFormValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'
  // 请假类型转换为中文
  if (key === 'leaveType') {
    return getLeaveTypeLabel(String(value)) || String(value)
  }
  // 加班类型转换为中文
  if (key === 'overtimeType') {
    return getOvertimeTypeLabel(String(value)) || String(value)
  }
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

async function submitSelfReport() {
  submittingSelfReport.value = true
  try {
    await request({
      url: '/attendance/overtime-self-report',
      method: 'POST',
      body: {
        formType: 'OVERTIME',
        formData: {
          date: selfReportForm.value.date?.format('YYYY-MM-DD'),
          startTime: selfReportForm.value.startTime?.format('HH:mm'),
          endTime: selfReportForm.value.endTime?.format('HH:mm'),
          overtimeType: selfReportForm.value.overtimeType
        },
        remark: selfReportForm.value.reason
      }
    })
    selfReportForm.value = { date: null, startTime: null, endTime: null, overtimeType: null, reason: '' }
    activeTab.value = 'records'
    await loadRecords()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '提交失败'
    alert(msg)
  } finally {
    submittingSelfReport.value = false
  }
}

async function submitNotification() {
  submittingNotification.value = true
  try {
    await request({
      url: '/overtime-notifications',
      method: 'POST',
      body: {
        overtimeDate: notifyForm.value.overtimeDate?.format('YYYY-MM-DD'),
        overtimeType: notifyForm.value.overtimeType,
        content: notifyForm.value.content
      }
    })
    notifyForm.value = { overtimeDate: null, overtimeType: null, content: '' }
    activeTab.value = 'notify-initiated'
    await loadInitiatedNotifs()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '发送失败'
    alert(msg)
  } finally {
    submittingNotification.value = false
  }
}

onMounted(loadRecords)

</script>

<style scoped>
.attendance-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.record-detail {
  padding: 4px 0;
}

.no-response-tip {
  padding: 8px 16px;
  color: #999;
  font-size: 13px;
}

/* Removed flex constraints to allow natural content flow */
</style>
