<template>
  <!-- 单个复选框模式 -->
  <template v-if="isSingleMode">
    <!-- H5 端使用 Ant Design -->
    <!-- #ifdef H5 -->
    <a-checkbox
      :checked="props.modelValue as boolean"
      :disabled="props.disabled"
      :indeterminate="props.indeterminate"
      @change="handleSingleChange"
    >
      <slot>{{ props.label }}</slot>
    </a-checkbox>
    <!-- #endif -->
    
    <!-- 小程序端使用 Vant -->
    <!-- #ifdef MP-WEIXIN || APP-PLUS -->
    <van-checkbox
      :value="props.modelValue as boolean"
      :disabled="props.disabled"
      @change="handleSingleChange"
    >
      <slot>{{ props.label }}</slot>
    </van-checkbox>
    <!-- #endif -->
  </template>

  <!-- 复选框组模式 -->
  <template v-else>
    <!-- H5 端使用 Ant Design -->
    <!-- #ifdef H5 -->
    <a-checkbox-group
      v-model:value="modelValue"
      :options="optionsWithLabel"
      :disabled="props.disabled"
      @change="handleGroupChange"
    />
    <!-- #endif -->
    
    <!-- 小程序端使用 Vant -->
    <!-- #ifdef MP-WEIXIN || APP-PLUS -->
    <van-checkbox-group
      :value="checkedValues"
      :disabled="props.disabled"
      @change="handleGroupChange"
    >
      <van-cell-group>
        <van-cell
          v-for="opt in props.options"
          :key="opt.value"
          :title="opt.label"
          clickable
          @click="toggleOption(opt.value)"
        >
          <template #right-icon>
            <van-checkbox :name="String(opt.value)" :disabled="opt.disabled" />
          </template>
        </van-cell>
      </van-cell-group>
    </van-checkbox-group>
    <!-- #endif -->
  </template>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CheckboxProps } from '../../types'

interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

const props = withDefaults(defineProps<CheckboxProps & { options?: Option[] }>(), {
  modelValue: false,
  label: '',
  disabled: false,
  indeterminate: false,
  options: undefined
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean | (string | number)[]]
  change: [value: boolean | (string | number)[]]
}>()

// 判断是否为单个复选框模式
const isSingleMode = computed(() => {
  return typeof props.modelValue === 'boolean' || (!props.options)
})

// 双向绑定（组模式）
const modelValue = computed({
  get: () => (props.modelValue as (string | number)[]) || [],
  set: (val) => emit('update:modelValue', val)
})

// 小程序端选中值（转为字符串数组）
const checkedValues = computed(() => {
  const val = props.modelValue as (string | number)[]
  return val?.map(v => String(v)) || []
})

// H5 端选项转换
const optionsWithLabel = computed(() => {
  return props.options?.map(opt => ({
    label: opt.label,
    value: opt.value,
    disabled: opt.disabled
  }))
})

// 单个复选框切换
const handleSingleChange = (e: any) => {
  const checked = typeof e === 'object' ? e.target?.checked : e
  emit('update:modelValue', checked)
  emit('change', checked)
}

// 组模式：切换选项
const toggleOption = (value: string | number) => {
  if (props.disabled) return
  
  const current = (props.modelValue as (string | number)[]) || []
  const index = current.indexOf(value)
  
  if (index > -1) {
    current.splice(index, 1)
  } else {
    current.push(value)
  }
  
  emit('update:modelValue', [...current])
  emit('change', [...current])
}

// 组模式事件处理
const handleGroupChange = (e: any) => {
  const values = typeof e === 'object' && e.detail ? e.detail : e
  emit('update:modelValue', values)
  emit('change', values)
}
</script>
