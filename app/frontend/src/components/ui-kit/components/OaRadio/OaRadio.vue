<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-radio-group
    v-model:value="modelValue"
    :options="optionsWithLabel"
    :disabled="props.disabled"
    @change="handleChange"
  />
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-radio-group
    :value="String(props.modelValue)"
    :disabled="props.disabled"
    @change="handleChange"
  >
    <van-cell-group>
      <van-cell
        v-for="opt in props.options"
        :key="opt.value"
        :title="opt.label"
        clickable
        @click="selectOption(opt.value)"
      >
        <template #right-icon>
          <van-radio :name="String(opt.value)" :disabled="opt.disabled" />
        </template>
      </van-cell>
    </van-cell-group>
  </van-radio-group>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options?: Option[]
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

// 双向绑定
const modelValue = computed({
  get: () => props.modelValue ?? '',
  set: (val: string | number) => emit('update:modelValue', val)
})

// H5 端选项转换
const optionsWithLabel = computed(() => {
  return props.options?.map(opt => ({
    label: opt.label,
    value: opt.value,
    disabled: opt.disabled
  }))
})

// 选择选项
const selectOption = (value: string | number) => {
  if (!props.disabled) {
    emit('update:modelValue', value as string | number)
    emit('change', value as string | number)
  }
}

// H5 事件
const handleChange = (e: any) => {
  const value = typeof e === 'object' ? e.target?.value : e
  emit('update:modelValue', value)
  emit('change', value)
}
</script>
