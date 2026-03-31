<!--
  Panel 面板组件
  用途：统一的内容容器，基于 OaCard 封装
  注意：此组件是 OaCard 的业务封装，保持与 OaCard API 兼容
-->
<template>
  <oa-card
    :title="title"
    :extra="extra"
    :bordered="bordered"
    :hoverable="hoverable"
    :loading="loading"
    :size="size"
    :class="['panel', { 'panel-hero': variant === 'hero' }]"
  >
    <template #title v-if="$slots.title">
      <slot name="title" />
    </template>
    <template #extra v-if="$slots.extra">
      <slot name="extra" />
    </template>
    <slot />
  </oa-card>
</template>

<script setup lang="ts">
import { OaCard } from '../ui-kit'

interface Props {
  /** 面板标题 */
  title?: string
  /** 面板右上角内容 */
  extra?: string
  /** 是否显示边框 */
  bordered?: boolean
  /** 是否悬浮效果 */
  hoverable?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 尺寸 */
  size?: 'default' | 'small'
  /** 面板变体：default | hero */
  variant?: 'default' | 'hero'
}

withDefaults(defineProps<Props>(), {
  bordered: true,
  hoverable: false,
  loading: false,
  size: 'default',
  variant: 'default'
})
</script>

<style lang="scss" scoped>
.panel {
  :deep(.oa-card__body),
  :deep(.ant-card-body) {
    padding: clamp(16px, 2vw, 22px);
  }

  &-hero {
    :deep(.oa-card),
    :deep(.ant-card) {
      background: var(--oa-gradient-hero);
      box-shadow: var(--oa-shadow-accent);
      border: none;
      color: var(--oa-text-inverse);
    }
  }
}
</style>
