<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-date-picker
    v-model:value="dateValue"
    :picker="props.type === 'datetime' ? 'date' : props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :allow-clear="props.clearable"
    :format="props.format || 'YYYY-MM-DD'"
    :value-format="'YYYY-MM-DD'"
    :style="{ width: '100%' }"
    @change="handleChange"
  />
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view class="oa-date-picker">
    <van-field
      :value="displayValue"
      :placeholder="props.placeholder"
      :disabled="props.disabled"
      readonly
      is-link
      @click="showPicker = !props.disabled"
    />
    <van-popup
      :show="showPicker"
      position="bottom"
      round
      @close="showPicker = false"
    >
      <van-datetime-picker
        :type="vantType"
        :value="currentDate"
        :min-date="minDateValue"
        :max-date="maxDateValue"
        :title="props.placeholder || '请选择日期'"
        @confirm="handleConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { DatePickerProps } from '../../types'

const props = defineProps<DatePickerProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

// H5 端日期值
const dateValue = computed({
  get: () => props.modelValue ? new Date(props.modelValue) : undefined,
  set: (val) => {
    const str = val ? formatDate(val) : ''
    emit('update:modelValue', str)
  }
})

// 小程序端
const showPicker = ref(false)
const currentDate = computed(() => props.modelValue ? new Date(props.modelValue).getTime() : Date.now())
const minDateValue = computed(() => props.minDate?.getTime() || new Date(2020, 0, 1).getTime())
const maxDateValue = computed(() => props.maxDate?.getTime() || new Date(2030, 11, 31).getTime())

// 显示值
const displayValue = computed(() => props.modelValue || '')

// Vant 类型映射
const vantType = computed(() => {
  const map: Record<string, string> = {
    'date': 'date',
    'datetime': 'datetime',
    'year': 'year-month',
    'month': 'year-month',
    'time': 'time'
  }
  return map[props.type ?? 'date'] || 'date'
})

// 格式化日期
const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 确认选择
const handleConfirm = (e: any) => {
  const date = new Date(e.detail)
  const str = formatDate(date)
  emit('update:modelValue', str)
  emit('change', str)
  showPicker.value = false
}

const handleChange = (val: any) => {
  emit('change', val)
}
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-date-picker {
  width: 100%;
}
/* #endif */
</style>
