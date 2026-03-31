<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-button
    :type="adaptedType"
    :size="adaptedSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :block="props.block"
    :shape="props.shape"
    :html-type="props.htmlType"
    @click="handleClick"
  >
    <template #icon v-if="props.icon">
      <Icon :name="props.icon" />
    </template>
    <slot />
  </a-button>
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-button
    :type="vantType"
    :size="vantSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :block="props.block"
    :round="props.shape === 'round'"
    @click="handleClick"
  >
    <slot />
  </van-button>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from '../../types'
import Icon from '../../../../components/ui/Icon.vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'default',
  size: 'middle',
  disabled: false,
  loading: false,
  block: false,
  shape: 'default',
  htmlType: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// Ant Design 类型映射
const adaptedType = computed(() => {
  const typeMap: Record<string, string> = {
    'primary': 'primary',
    'default': 'default',
    'dashed': 'dashed',
    'link': 'link',
    'text': 'text',
    'danger': 'primary', // Ant Design 中 danger 是单独属性
    'ghost': 'default'
  }
  return typeMap[props.type] || 'default'
})

// Ant Design 尺寸映射
const adaptedSize = computed(() => {
  const sizeMap: Record<string, string> = {
    'large': 'large',
    'middle': 'middle',
    'small': 'small'
  }
  return sizeMap[props.size] || 'middle'
})

// Vant 类型映射
const vantType = computed(() => {
  const typeMap: Record<string, string> = {
    'primary': 'primary',
    'default': 'default',
    'danger': 'danger',
    'ghost': 'default',
    'dashed': 'default',
    'link': 'default',
    'text': 'default'
  }
  return typeMap[props.type] || 'default'
})

// Vant 尺寸映射
const vantSize = computed(() => {
  const sizeMap: Record<string, string> = {
    'large': 'normal',
    'middle': 'normal',
    'small': 'small'
  }
  return sizeMap[props.size] || 'normal'
})

const handleClick = (e: MouseEvent) => {
  emit('click', e)
}
</script>

<style scoped>
/* #ifdef H5 */
:deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

:deep(.ant-btn-dangerous) {
  background: var(--oa-error);
  border-color: var(--oa-error);
  color: #fff;
}
/* #endif */
</style>
