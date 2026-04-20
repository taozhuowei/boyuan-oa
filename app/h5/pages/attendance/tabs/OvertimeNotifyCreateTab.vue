<template>
  <!-- OvertimeNotifyCreateTab — 发起通知 tab: PM/CEO creates an overtime notification -->
  <a-form
    :model="notify_form"
    layout="vertical"
    style="max-width: 480px"
    @finish="submitNotification"
  >
    <a-form-item
      label="加班日期"
      name="overtimeDate"
      :rules="[{ required: true, message: '请选择日期' }]"
    >
      <a-date-picker
        v-model:value="notify_form.overtimeDate"
        style="width: 100%"
        placeholder="请选择日期"
      />
    </a-form-item>
    <a-form-item
      label="加班类型"
      name="overtimeType"
      :rules="[{ required: true, message: '请选择类型' }]"
    >
      <a-select v-model:value="notify_form.overtimeType" placeholder="请选择">
        <a-select-option value="WEEKDAY">工作日加班</a-select-option>
        <a-select-option value="WEEKEND">周末加班</a-select-option>
        <a-select-option value="HOLIDAY">节假日加班</a-select-option>
      </a-select>
    </a-form-item>
    <a-form-item
      label="通知内容"
      name="content"
      :rules="[{ required: true, message: '请填写通知内容' }]"
    >
      <a-textarea
        v-model:value="notify_form.content"
        :rows="3"
        placeholder="说明加班安排、要求等"
      />
    </a-form-item>
    <a-form-item>
      <a-button type="primary" html-type="submit" :loading="is_submitting">发送通知</a-button>
    </a-form-item>
  </a-form>
</template>

<script setup lang="ts">
/**
 * OvertimeNotifyCreateTab — 发起通知 Tab
 * Purpose: PM/CEO creates and sends an overtime notification to all employees.
 * Data flow: POST /overtime-notifications → emits 'submitted' so parent switches to 已发起 tab.
 * Only rendered when isPmOrCeo is true (enforced by parent tab bar).
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import type { Dayjs } from 'dayjs'

interface NotifyFormState {
  overtimeDate: Dayjs | undefined
  overtimeType: string | undefined
  content: string
}

const emit = defineEmits<{
  /** Emitted after notification is sent; parent switches to notify-initiated tab */
  submitted: []
}>()

const is_submitting = ref(false)
const notify_form = ref<NotifyFormState>({
  overtimeDate: undefined,
  overtimeType: undefined,
  content: '',
})

async function submitNotification() {
  is_submitting.value = true
  try {
    await request({
      url: '/overtime-notifications',
      method: 'POST',
      body: {
        overtimeDate: notify_form.value.overtimeDate?.format('YYYY-MM-DD'),
        overtimeType: notify_form.value.overtimeType,
        content: notify_form.value.content,
      },
    })
    notify_form.value = { overtimeDate: undefined, overtimeType: undefined, content: '' }
    emit('submitted')
  } catch (e: unknown) {
    message.error((e as Error).message ?? '发送失败')
  } finally {
    is_submitting.value = false
  }
}
</script>
