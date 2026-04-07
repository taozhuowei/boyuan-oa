<template>
  <!-- Attendance page — shows personal attendance records; sub-tabs for leave/overtime requests -->
  <div class="attendance-page">
    <h2 class="page-title">考勤管理</h2>

    <a-card>
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="records" tab="我的记录" />
        <a-tab-pane key="leave" tab="请假申请" />
        <a-tab-pane key="overtime" tab="加班申报" />
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
              {{ formatTime(record.submitTime) }}
            </template>
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
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
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import type { Dayjs } from 'dayjs'

interface FormRecord {
  id: number
  formType: string
  formTypeName: string
  submitTime: string
  status: string
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
  { title: '日期', key: 'submitTime', dataIndex: 'submitTime' },
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName' },
  { title: '状态', key: 'status' }
]

function formatTime(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

function statusColor(status: string) {
  if (status === 'APPROVED' || status === '已通过') return 'success'
  if (status === 'REJECTED' || status === '已驳回') return 'error'
  if (status === 'PENDING' || status === '审批中') return 'processing'
  return 'default'
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
        leaveType: leaveForm.value.leaveType,
        startDate: leaveForm.value.startDate?.format('YYYY-MM-DD'),
        endDate: leaveForm.value.endDate?.format('YYYY-MM-DD'),
        reason: leaveForm.value.reason
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
        date: overtimeForm.value.date?.format('YYYY-MM-DD'),
        startTime: overtimeForm.value.startTime?.format('HH:mm'),
        endTime: overtimeForm.value.endTime?.format('HH:mm'),
        overtimeType: overtimeForm.value.overtimeType,
        reason: overtimeForm.value.reason
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
</style>
