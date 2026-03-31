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
import { useVantInputAdapter, useInputEventAdapter } from '../../adapters/input'

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

// 使用适配器
const { fieldType } = useVantInputAdapter(props)
const {
  handleFocus,
  handleBlur,
  handleChange,
  handleInput,
  handleTextareaInput,
  handleClear
} = useInputEventAdapter(emit)
</script>
