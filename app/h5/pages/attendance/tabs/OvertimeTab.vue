<template>
  <!-- OvertimeTab — 加班申报 + 自补加班 tabs -->
  <!-- mode='overtime' renders the standard overtime form -->
  <!-- mode='self-report' renders the retroactive overtime form -->
  <div>
    <!-- 加班申报 -->
    <template v-if="mode === 'overtime'">
      <a-form
        :model="overtime_form"
        layout="vertical"
        style="max-width: 480px"
        @finish="submitOvertime"
      >
        <a-form-item
          label="加班日期"
          name="date"
          :rules="[{ required: true, message: '请选择日期' }]"
        >
          <a-date-picker
            v-model:value="overtime_form.date"
            style="width: 100%"
            placeholder="请选择日期"
          />
        </a-form-item>
        <a-form-item
          label="开始时间"
          name="startTime"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        >
          <a-time-picker
            v-model:value="overtime_form.startTime"
            format="HH:mm"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item
          label="结束时间"
          name="endTime"
          :rules="[{ required: true, message: '请选择结束时间' }]"
        >
          <a-time-picker v-model:value="overtime_form.endTime" format="HH:mm" style="width: 100%" />
        </a-form-item>
        <a-form-item label="加班时长">
          <span
            :style="{ color: overtime_duration === '结束时间须晚于开始时间' ? '#f5222d' : '#555' }"
          >
            {{ overtime_duration ?? '请先选择开始和结束时间' }}
          </span>
        </a-form-item>
        <a-form-item label="加班类型" name="overtimeType">
          <a-select v-model:value="overtime_form.overtimeType" placeholder="请选择">
            <a-select-option value="周末加班">周末加班</a-select-option>
            <a-select-option value="节假日加班">节假日加班</a-select-option>
            <a-select-option value="工作日加班">工作日加班</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="说明" name="reason">
          <a-textarea v-model:value="overtime_form.reason" :rows="3" />
        </a-form-item>
        <a-form-item label="附件（可选）">
          <customized-file-upload
            ref="overtime_file_ref"
            business-type="OVERTIME"
            :max-count="3"
            accept="image/*,.pdf"
            hint="可上传相关证明，最多 3 个"
            @change="handleOvertimeFilesChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="is_submitting_overtime"
            data-catch="attendance-overtime-submit"
          >
            提交申报
          </a-button>
        </a-form-item>
      </a-form>
    </template>

    <!-- 自补加班 — 补申报历史加班，走审批流 -->
    <template v-if="mode === 'self-report'">
      <a-form
        :model="self_report_form"
        layout="vertical"
        style="max-width: 480px"
        @finish="submitSelfReport"
      >
        <a-form-item
          label="加班日期"
          name="date"
          :rules="[{ required: true, message: '请选择日期' }]"
        >
          <a-date-picker
            v-model:value="self_report_form.date"
            style="width: 100%"
            placeholder="请选择日期"
          />
        </a-form-item>
        <a-form-item
          label="开始时间"
          name="startTime"
          :rules="[{ required: true, message: '请选择开始时间' }]"
        >
          <a-time-picker
            v-model:value="self_report_form.startTime"
            format="HH:mm"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item
          label="结束时间"
          name="endTime"
          :rules="[{ required: true, message: '请选择结束时间' }]"
        >
          <a-time-picker
            v-model:value="self_report_form.endTime"
            format="HH:mm"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="加班时长">
          <span
            :style="{
              color: self_report_duration === '结束时间须晚于开始时间' ? '#f5222d' : '#555',
            }"
          >
            {{ self_report_duration ?? '请先选择开始和结束时间' }}
          </span>
        </a-form-item>
        <a-form-item
          label="加班类型"
          name="overtimeType"
          :rules="[{ required: true, message: '请选择类型' }]"
        >
          <a-select v-model:value="self_report_form.overtimeType" placeholder="请选择">
            <a-select-option value="WEEKDAY">工作日加班</a-select-option>
            <a-select-option value="WEEKEND">周末加班</a-select-option>
            <a-select-option value="HOLIDAY">节假日加班</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="补申报原因"
          name="reason"
          :rules="[{ required: true, message: '请填写原因' }]"
        >
          <a-textarea
            v-model:value="self_report_form.reason"
            :rows="3"
            placeholder="请说明未能及时申报的原因"
          />
        </a-form-item>
        <a-form-item label="附件（可选）">
          <customized-file-upload
            ref="self_report_file_ref"
            business-type="OVERTIME"
            :max-count="3"
            accept="image/*,.pdf"
            hint="可上传相关证明，最多 3 个"
            @change="handleSelfReportFilesChange"
          />
        </a-form-item>
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="is_submitting_self_report"
            data-catch="attendance-selfreport-submit"
          >
            提交申请
          </a-button>
        </a-form-item>
      </a-form>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * OvertimeTab — 加班申报 + 自补加班 Tab
 *
 * Purpose: renders either the standard overtime form (mode='overtime') or the
 * retroactive overtime self-report form (mode='self-report'), controlled by
 * the parent via the `mode` prop which mirrors the active tab key.
 *
 * Data flow:
 *   - On submit: POST /attendance/overtime or /attendance/overtime-self-report
 *   - Emits 'submitted' so parent can switch to records tab and reload
 *   - Accepts optional 'prefill' prop for resubmit flow from MyRecordsTab
 */
import { ref, computed, watch } from 'vue'
import { request } from '~/utils/http'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

type OvertimeMode = 'overtime' | 'self-report'

interface OvertimeFormState {
  date: Dayjs | undefined
  startTime: Dayjs | undefined
  endTime: Dayjs | undefined
  overtimeType: string | undefined
  reason: string
  attachmentIds: number[]
}

interface SelfReportFormState {
  date: Dayjs | undefined
  startTime: Dayjs | undefined
  endTime: Dayjs | undefined
  overtimeType: string | undefined
  reason: string
  attachmentIds: number[]
}

interface PrefillData {
  date: string | undefined
  startTime: string | undefined
  endTime: string | undefined
  overtimeType: string | undefined
  reason: string
}

const props = defineProps<{
  /** Active sub-mode: 'overtime' for standard申报, 'self-report' for retroactive */
  mode: OvertimeMode
  /** Pre-filled values when user clicks 重新发起 on a rejected overtime record */
  prefill?: PrefillData | null
}>()

const emit = defineEmits<{
  /** Emitted after successful submission so parent can switch tab and reload records */
  submitted: []
}>()

const is_submitting_overtime = ref(false)
const is_submitting_self_report = ref(false)
const overtime_file_ref = ref<{ clear: () => void } | null>(null)
const self_report_file_ref = ref<{ clear: () => void } | null>(null)

function handleOvertimeFilesChange(files: Array<{ attachmentId: number }>) {
  overtime_form.value.attachmentIds = files.map((f) => f.attachmentId)
}

function handleSelfReportFilesChange(files: Array<{ attachmentId: number }>) {
  self_report_form.value.attachmentIds = files.map((f) => f.attachmentId)
}

function makeEmptyOvertimeForm(): OvertimeFormState {
  return {
    date: undefined,
    startTime: undefined,
    endTime: undefined,
    overtimeType: undefined,
    reason: '',
    attachmentIds: [],
  }
}

function makeEmptySelfReportForm(): SelfReportFormState {
  return {
    date: undefined,
    startTime: undefined,
    endTime: undefined,
    overtimeType: undefined,
    reason: '',
    attachmentIds: [],
  }
}

const overtime_form = ref<OvertimeFormState>(makeEmptyOvertimeForm())
const self_report_form = ref<SelfReportFormState>(makeEmptySelfReportForm())

function calcDuration(s: Dayjs | undefined, e: Dayjs | undefined): string | null {
  if (!s || !e) return null
  const mins = e.diff(s, 'minute')
  if (mins <= 0) return '结束时间须晚于开始时间'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`
}

/** Calculated overtime duration displayed below time pickers */
const overtime_duration = computed(() =>
  calcDuration(overtime_form.value.startTime, overtime_form.value.endTime)
)

/** Calculated self-report duration displayed below time pickers */
const self_report_duration = computed(() =>
  calcDuration(self_report_form.value.startTime, self_report_form.value.endTime)
)

/** Apply prefill data when parent sets it (resubmit flow); targets overtime form only */
watch(
  () => props.prefill,
  (data) => {
    if (!data) return
    overtime_form.value = {
      ...makeEmptyOvertimeForm(),
      date: data.date ? dayjs(data.date) : undefined,
      startTime: data.startTime ? dayjs(data.startTime, 'HH:mm') : undefined,
      endTime: data.endTime ? dayjs(data.endTime, 'HH:mm') : undefined,
      overtimeType: data.overtimeType,
      reason: data.reason,
    }
  }
)

async function submitOvertime() {
  is_submitting_overtime.value = true
  try {
    await request({
      url: '/attendance/overtime',
      method: 'POST',
      body: {
        formType: 'OVERTIME',
        formData: {
          date: overtime_form.value.date?.format('YYYY-MM-DD'),
          startTime: overtime_form.value.startTime?.format('HH:mm'),
          endTime: overtime_form.value.endTime?.format('HH:mm'),
          overtimeType: overtime_form.value.overtimeType,
          attachmentIds: overtime_form.value.attachmentIds,
        },
        remark: overtime_form.value.reason,
      },
    })
    overtime_file_ref.value?.clear()
    overtime_form.value = makeEmptyOvertimeForm()
    emit('submitted')
  } catch (e: unknown) {
    alert((e as Error).message ?? '提交失败')
  } finally {
    is_submitting_overtime.value = false
  }
}

async function submitSelfReport() {
  is_submitting_self_report.value = true
  try {
    await request({
      url: '/attendance/overtime-self-report',
      method: 'POST',
      body: {
        formType: 'OVERTIME',
        formData: {
          date: self_report_form.value.date?.format('YYYY-MM-DD'),
          startTime: self_report_form.value.startTime?.format('HH:mm'),
          endTime: self_report_form.value.endTime?.format('HH:mm'),
          overtimeType: self_report_form.value.overtimeType,
          attachmentIds: self_report_form.value.attachmentIds,
        },
        remark: self_report_form.value.reason,
      },
    })
    self_report_file_ref.value?.clear()
    self_report_form.value = makeEmptySelfReportForm()
    emit('submitted')
  } catch (e: unknown) {
    alert((e as Error).message ?? '提交失败')
  } finally {
    is_submitting_self_report.value = false
  }
}
</script>
