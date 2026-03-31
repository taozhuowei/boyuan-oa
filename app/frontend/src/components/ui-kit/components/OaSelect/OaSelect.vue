<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-select
    v-model:value="modelValue"
    :options="props.options"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :mode="props.multiple ? 'multiple' : undefined"
    :allow-clear="props.clearable"
    :show-search="props.searchable"
    :loading="props.loading"
    :style="{ width: '100%' }"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
  />
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view class="oa-select">
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
      <van-picker
        :columns="pickerColumns"
        :default-index="defaultIndex"
        show-toolbar
        :title="props.placeholder || '请选择'"
        @confirm="handleConfirm"
        @cancel="showPicker = false"
      />
    </van-popup>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SelectProps } from '../../types'

const props = defineProps<SelectProps>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 双向绑定
const modelValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 小程序端
const showPicker = ref(false)

// 显示值
const displayValue = computed(() => {
  const selected = props.options?.find(opt => opt.value === props.modelValue)
  return selected?.label || ''
})

// Picker 列数据
const pickerColumns = computed(() => {
  return props.options?.map(opt => opt.label) || []
})

// 默认选中索引
const defaultIndex = computed(() => {
  return props.options?.findIndex(opt => opt.value === props.modelValue) || 0
})

// 确认选择
const handleConfirm = (e: any) => {
  const index = e.detail.index
  const selected = props.options?.[index]
  if (selected) {
    emit('update:modelValue', selected.value)
    emit('change', selected.value)
  }
  showPicker.value = false
}

// H5 事件
const handleChange = (val: any) => emit('change', val)
const handleFocus = (e: FocusEvent) => emit('focus', e)
const handleBlur = (e: FocusEvent) => emit('blur', e)
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-select {
  width: 100%;
}
/* #endif */
</style>
