<!--
  Badge 徽章组件
  用途：状态标签、优先级标识
-->
<template>
  <text class="badge" :class="`badge-${variant}`">
    <slot />
  </text>
</template>

<script setup lang="ts">
interface Props {
  /** 徽章变体 */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}

withDefaults(defineProps<Props>(), {
  variant: 'default'
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-default {
  background: var(--oa-accent-soft);
  color: var(--oa-accent-deep);
}

.badge-success {
  background: var(--oa-success-soft);
  color: #4b6c52;
}

.badge-warning {
  background: var(--oa-warning-soft);
  color: #8d642c;
}

.badge-danger {
  background: var(--oa-danger-soft);
  color: #954740;
}

.badge-info {
  background: rgba(63, 83, 112, 0.08);
  color: var(--oa-text-muted);
}
</style>
