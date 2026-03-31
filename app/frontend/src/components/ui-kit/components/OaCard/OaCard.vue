<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-card
    :title="props.title"
    :extra="props.extra"
    :bordered="props.bordered"
    :hoverable="props.hoverable"
    :loading="props.loading"
    :size="props.size"
    :class="['oa-card', { 'oa-card--compact': props.size === 'small' }]"
  >
    <template #title v-if="slots.title">
      <slot name="title" />
    </template>
    <template #extra v-if="slots.extra">
      <slot name="extra" />
    </template>
    <template #cover v-if="slots.cover">
      <slot name="cover" />
    </template>
    <slot />
    <template #actions v-if="slots.actions">
      <slot name="actions" />
    </template>
  </a-card>
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view 
    class="oa-card"
    :class="[
      { 'oa-card--bordered': props.bordered },
      { 'oa-card--compact': props.size === 'small' }
    ]"
  >
    <!-- 卡片头部 -->
    <view v-if="props.title || slots.title || props.extra || slots.extra" class="oa-card__header">
      <view class="oa-card__title">
        <slot name="title">{{ props.title }}</slot>
      </view>
      <view v-if="props.extra || slots.extra" class="oa-card__extra">
        <slot name="extra">{{ props.extra }}</slot>
      </view>
    </view>
    
    <!-- 封面 -->
    <view v-if="slots.cover" class="oa-card__cover">
      <slot name="cover" />
    </view>
    
    <!-- 加载状态 -->
    <view v-if="props.loading" class="oa-card__loading">
      <van-skeleton :row="3" />
    </view>
    
    <!-- 内容区 -->
    <view v-else class="oa-card__body">
      <slot />
    </view>
    
    <!-- 操作区 -->
    <view v-if="slots.actions" class="oa-card__actions">
      <slot name="actions" />
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { useSlots } from 'vue'
import type { CardProps } from '../../types'

const props = withDefaults(defineProps<CardProps>(), {
  bordered: true,
  hoverable: false,
  loading: false,
  size: 'default'
})

const slots = useSlots()
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-card {
  background: var(--oa-bg-container);
  border-radius: var(--oa-border-radius-lg);
  box-shadow: var(--oa-shadow-1);
  overflow: hidden;
  
  &--bordered {
    border: 1px solid var(--oa-border-split);
  }
  
  &--compact {
    .oa-card__header {
      padding: 12px 16px;
    }
    
    .oa-card__body {
      padding: 12px 16px;
    }
  }
  
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--oa-border-split);
  }
  
  &__title {
    font-size: var(--oa-font-size-lg);
    font-weight: 600;
    color: var(--oa-text-primary);
  }
  
  &__extra {
    color: var(--oa-text-secondary);
    font-size: var(--oa-font-size-md);
  }
  
  &__cover {
    width: 100%;
  }
  
  &__body {
    padding: 24px;
  }
  
  &__loading {
    padding: 24px;
  }
  
  &__actions {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    border-top: 1px solid var(--oa-border-split);
    background: var(--oa-bg);
  }
}
/* #endif */

/* #ifdef H5 */
.oa-card {
  :deep(.ant-card) {
    border-radius: var(--oa-border-radius-lg);
  }
  
  :deep(.ant-card-head) {
    border-bottom: 1px solid var(--oa-border-split);
    font-weight: 600;
  }
  
  &--compact {
    :deep(.ant-card-head) {
      padding: 12px 16px;
      min-height: auto;
    }
    
    :deep(.ant-card-body) {
      padding: 12px 16px;
    }
  }
}
/* #endif */
</style>
