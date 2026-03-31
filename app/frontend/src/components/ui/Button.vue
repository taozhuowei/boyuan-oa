<!--
  Button 按钮组件
  用途：基于 OaButton 的样式定制按钮，保持与 OaButton API 兼容
  注意：此组件是 OaButton 的业务封装，提供统一的业务样式
-->
<template>
  <oa-button
    :type="adaptedType"
    :size="adaptedSize"
    :disabled="disabled"
    :loading="loading"
    :block="block"
    :html-type="htmlType"
    @click="handleClick"
  >
    <template #icon v-if="icon">
      <Icon :name="icon" :size="16" />
    </template>
    <slot />
  </oa-button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { OaButton } from '../ui-kit'
import Icon from './Icon.vue'

interface Props {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** 尺寸 */
  size?: 'small' | 'middle' | 'large'
  /** 是否块级显示 */
  block?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 左侧图标名称 */
  icon?: string
  /** HTML 类型 */
  htmlType?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'middle',
  block: false,
  disabled: false,
  loading: false,
  htmlType: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 将 variant 映射到 OaButton 的 type
const adaptedType = computed(() => {
  const map: Record<string, any> = {
    primary: 'primary',
    secondary: 'default',
    ghost: 'ghost',
    danger: 'danger'
  }
  return map[props.variant] || 'default'
})

const adaptedSize = computed(() => props.size)

const handleClick = (e: MouseEvent) => {
  emit('click', e)
}
</script>

<style lang="scss" scoped>
:deep(.oa-button),
:deep(.ant-btn) {
  border-radius: 999px !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
</style>
