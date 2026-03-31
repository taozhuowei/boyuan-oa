<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-input
    v-model:value="modelValue"
    :type="props.type"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :allow-clear="props.clearable"
    :max-length="props.maxlength"
    :show-count="props.showWordLimit"
    :rows="props.rows"
    :auto-size="props.autosize"
    @focus="handleFocus"
    @blur="handleBlur"
    @change="handleChange"
  >
    <template #prefix v-if="slots.prefix">
      <slot name="prefix" />
    </template>
    <template #suffix v-if="slots.suffix">
      <slot name="suffix" />
    </template>
  </a-input>
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-field
    :model-value="props.modelValue"
    :type="fieldType"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :readonly="props.readonly"
    :clearable="props.clearable"
    :maxlength="props.maxlength"
    :show-word-limit="props.showWordLimit"
    :autosize="props.autosize"
    @input="handleInput"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
  >
    <template #input v-if="props.type === 'textarea'">
      <textarea
        :value="props.modelValue"
        :placeholder="props.placeholder"
        :disabled="props.disabled"
        :maxlength="props.maxlength"
        :rows="props.rows"
        @input="handleTextareaInput"
      />
    </template>
    <template #left-icon v-if="slots.prefix">
      <slot name="prefix" />
    </template>
    <template #right-icon v-if="slots.suffix">
      <slot name="suffix" />
    </template>
  </van-field>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { InputProps } from '../../types'

const props = defineProps<InputProps>()
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  change: [value: string | number]
  clear: []
}>()

const slots = useSlots()

// 双向绑定
const modelValue = computed({
  get: () => props.modelValue ?? '',
  set: (val) => emit('update:modelValue', val)
})

// Vant 类型映射
const fieldType = computed(() => {
  const typeMap: Record<string, string> = {
    'text': 'text',
    'password': 'password',
    'number': 'number',
    'tel': 'tel',
    'email': 'text',
    'textarea': 'textarea'
  }
  return typeMap[props.type ?? 'text'] || 'text'
})

// H5 事件处理
const handleFocus = (e: FocusEvent) => emit('focus', e)
const handleBlur = (e: FocusEvent) => emit('blur', e)
const handleChange = (e: any) => emit('change', e.target?.value)

// 小程序事件处理
const handleInput = (e: any) => {
  emit('update:modelValue', e.detail)
}
const handleTextareaInput = (e: any) => {
  emit('update:modelValue', e.target.value)
}
const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>
