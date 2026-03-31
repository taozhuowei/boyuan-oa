<template>
  <!-- H5 使用 Ant Design Vue -->
  <!-- #ifdef H5 -->
  <a-badge 
    :count="props.count"
    :dot="props.dot"
    :status="adaptedStatus"
    :text="props.text"
    :color="props.color"
    :offset="props.offset"
    :overflow-count="props.overflowCount"
    :show-zero="props.showZero"
  >
    <slot></slot>
  </a-badge>
  <!-- #endif -->

  <!-- 小程序使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view class="oa-badge-wrapper">
    <slot></slot>
    <view 
      v-if="shouldShowBadge"
      class="oa-badge"
      :class="[badgeClass, { dot: props.dot }]"
      :style="badgeStyle"
    >
      {{ displayText }}
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { BadgeProps } from '../../types'

const props = withDefaults(defineProps<BadgeProps>(), {
  count: 0,
  dot: false,
  status: undefined,
  text: '',
  color: '',
  overflowCount: 99,
  showZero: false,
  offset: undefined
})

// Ant Design status 映射
const adaptedStatus = computed(() => {
  const statusMap: Record<string, any> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    processing: 'processing',
    default: 'default'
  }
  return props.status ? (statusMap[props.status] || props.status) : undefined
})

// Vant 自定义 badge 实现
const shouldShowBadge = computed(() => {
  if (props.dot) return true
  if (props.status) return true
  if (props.text) return true
  return props.count > 0 || props.showZero
})

const displayText = computed(() => {
  if (props.text) return props.text
  if (props.dot) return ''
  if (props.count > props.overflowCount) return `${props.overflowCount}+`
  return String(props.count)
})

const badgeClass = computed(() => {
  if (props.status) return `status-${props.status}`
  if (props.color) return 'custom-color'
  return 'default'
})

const badgeStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (props.color && !props.status) {
    style.backgroundColor = props.color
  }
  
  if (props.offset) {
    style.right = `${props.offset[0]}px`
    style.top = `${props.offset[1]}px`
  }
  
  return style
})
</script>

<style lang="scss" scoped>
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-badge-wrapper {
  position: relative;
  display: inline-block;
}

.oa-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 10px;
  line-height: 16px;
  text-align: center;
  background: var(--oa-error);
  color: #fff;
  border-radius: 8px;

  &.dot {
    width: 8px;
    height: 8px;
    min-width: auto;
    padding: 0;
    border-radius: 50%;
  }

  &.status-success {
    background: var(--oa-success);
  }

  &.status-error {
    background: var(--oa-error);
  }

  &.status-warning {
    background: var(--oa-warning);
  }

  &.status-processing {
    background: var(--oa-primary);
  }

  &.status-default {
    background: var(--oa-text-tertiary);
  }
}
/* #endif */
</style>
