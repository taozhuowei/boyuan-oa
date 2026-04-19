<template>
  <!-- LeaveTab — 请假申请 tab: leave application form -->
  <a-form :model="leave_form" layout="vertical" style="max-width: 480px" @finish="submitLeave">
    <a-form-item label="假种" name="leaveType" :rules="[{ required: true, message: '请选择假种' }]">
      <div data-catch="form-leave-type" style="display: block">
        <a-select v-model:value="leave_form.leaveType" placeholder="请选择" style="width: 100%">
          <a-select-option v-for="lt in leave_types" :key="lt.code" :value="lt.name">
            {{ lt.name }}
          </a-select-option>
        </a-select>
      </div>
    </a-form-item>
    <a-form-item
      label="开始日期"
      name="startDate"
      :rules="[{ required: true, message: '请选择开始日期' }]"
    >
      <div data-catch="form-leave-start-date" style="display: block">
        <a-date-picker
          v-model:value="leave_form.startDate"
          style="width: 100%"
          placeholder="请选择日期"
        />
      </div>
    </a-form-item>
    <a-form-item
      label="结束日期"
      name="endDate"
      :rules="[{ required: true, message: '请选择结束日期' }]"
    >
      <div data-catch="form-leave-end-date" style="display: block">
        <a-date-picker
          v-model:value="leave_form.endDate"
          style="width: 100%"
          placeholder="请选择日期"
        />
      </div>
    </a-form-item>
    <a-form-item label="请假时长">
      <span style="color: #555">{{ leave_duration ?? '请先选择开始和结束日期' }}</span>
    </a-form-item>
    <a-form-item
      label="请假原因"
      name="reason"
      :rules="[{ required: true, message: '请填写原因' }]"
    >
      <a-textarea v-model:value="leave_form.reason" :rows="3" data-catch="form-leave-reason" />
    </a-form-item>
    <a-form-item>
      <a-checkbox v-model:checked="leave_form.retroactive">追溯申请（补录历史请假）</a-checkbox>
    </a-form-item>
    <a-form-item label="附件（可选）">
      <customized-file-upload
        ref="leave_file_ref"
        business-type="LEAVE"
        :max-count="3"
        accept="image/*,.pdf"
        hint="可上传病假单、证明材料等，最多 3 个"
        @change="handleLeaveFilesChange"
      />
    </a-form-item>

    <a-form-item>
      <a-button
        type="primary"
        html-type="submit"
        :loading="is_submitting"
        data-catch="leave-form-submit"
      >
        提交申请
      </a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
/**
 * LeaveTab — 请假申请 Tab
 *
 * Purpose: render and submit the leave application form.
 * Supports retroactive leave and attachment upload.
 *
 * Data flow:
 *   - Fetches /config/leave-types on mount for the leave type dropdown
 *   - On submit: POST /attendance/leave
 *   - Emits 'submitted' so parent can switch to records tab and reload records
 *   - Accepts optional 'prefill' prop for resubmit flow from MyRecordsTab
 */
import { ref, computed, watch, onMounted } from 'vue'
import { request } from '~/utils/http'
import dayjs, { type Dayjs } from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

interface LeaveFormState {
  leaveType: string | undefined
  startDate: Dayjs | undefined
  endDate: Dayjs | undefined
  reason: string
  retroactive: boolean
  attachmentIds: number[]
}

interface PrefillData {
  leaveType: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  reason: string
}

const props = defineProps<{
  /** Pre-filled form values when user clicks 重新发起 on a rejected leave record */
  prefill?: PrefillData | null
}>()

const emit = defineEmits<{
  /** Emitted after successful submission so parent can switch tab and reload records */
  submitted: []
}>()

const is_submitting = ref(false)
const leave_types = ref<Array<{ code: string; name: string }>>([])
const leave_file_ref = ref<{ clear: () => void } | null>(null)

function handleLeaveFilesChange(files: Array<{ attachmentId: number }>) {
  leave_form.value.attachmentIds = files.map((f) => f.attachmentId)
}

function makeEmptyForm(): LeaveFormState {
  return {
    leaveType: undefined,
    startDate: undefined,
    endDate: undefined,
    reason: '',
    retroactive: false,
    attachmentIds: [],
  }
}

const leave_form = ref<LeaveFormState>(makeEmptyForm())

/** Calculated leave duration displayed below date pickers */
const leave_duration = computed(() => {
  const s = leave_form.value.startDate
  const e = leave_form.value.endDate
  if (s && e && e.diff(s, 'day') >= 0) {
    return `${e.diff(s, 'day') + 1} 天`
  }
  return null
})

/** Apply prefill data when parent sets it (resubmit flow) */
watch(
  () => props.prefill,
  (data) => {
    if (!data) return
    leave_form.value = {
      ...makeEmptyForm(),
      leaveType: data.leaveType,
      startDate: data.startDate ? dayjs(data.startDate) : undefined,
      endDate: data.endDate ? dayjs(data.endDate) : undefined,
      reason: data.reason,
    }
  }
)

async function loadLeaveTypes() {
  try {
    const data = await request<Array<{ code: string; name: string }>>({
      url: '/config/leave-types',
    })
    leave_types.value = data ?? []
  } catch {
    leave_types.value = []
  }
}

async function submitLeave() {
  is_submitting.value = true
  try {
    await request({
      url: '/attendance/leave',
      method: 'POST',
      body: {
        formType: 'LEAVE',
        formData: {
          leaveType: leave_form.value.leaveType,
          startDate: leave_form.value.startDate?.format('YYYY-MM-DD'),
          endDate: leave_form.value.endDate?.format('YYYY-MM-DD'),
          days: (() => {
            const s = leave_form.value.startDate
            const e = leave_form.value.endDate
            if (s && e) return e.diff(s, 'day') + 1
            return 1
          })(),
          retroactive: leave_form.value.retroactive,
          attachmentIds: leave_form.value.attachmentIds,
        },
        remark: leave_form.value.reason,
      },
    })
    leave_file_ref.value?.clear()
    leave_form.value = makeEmptyForm()
    emit('submitted')
  } catch (e: unknown) {
    alert((e as Error).message ?? '提交失败')
  } finally {
    is_submitting.value = false
  }
}

onMounted(loadLeaveTypes)
</script>
