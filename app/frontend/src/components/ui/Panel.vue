<!--
  Panel 面板组件
  用途：统一的内容容器，提供圆角、背景、阴影和边框
-->
<template>
  <view class="panel" :class="{ 'panel-hero': variant === 'hero' }">
    <slot />
  </view>
</template>

<script setup lang="ts">
interface Props {
  /** 面板变体：default | hero */
  variant?: 'default' | 'hero'
}

withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>

<style scoped>
.panel {
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
  padding: clamp(16px, 2vw, 22px);
}

.panel-hero {
  background: var(--oa-gradient-hero);
  box-shadow: var(--oa-shadow-accent);
  border: none;
  color: var(--oa-text-inverse);
}
</style>
