<!--
  Button 按钮组件
  用途：统一的操作按钮，支持多种样式变体
-->
<template>
  <button
    class="btn"
    :class="[`btn-${variant}`, { 'btn-block': block, 'btn-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <Icon v-if="loading" name="schedule" :size="16" class="btn-icon-spin" />
    <Icon v-else-if="icon" :name="icon" :size="16" />
    <text v-if="$slots.default" class="btn-text"><slot /></text>
  </button>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

interface Props {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** 是否块级显示 */
  block?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 左侧图标名称 */
  icon?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  block: false,
  disabled: false,
  loading: false
})

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn:active:not(:disabled) {
  transform: scale(0.98);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-block {
  display: flex;
  width: 100%;
}

.btn-primary {
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  box-shadow: var(--oa-shadow-accent);
}

.btn-secondary {
  background: var(--oa-surface-soft);
  color: var(--oa-text-primary);
  border: 1px solid var(--oa-border-strong);
}

.btn-ghost {
  background: transparent;
  color: var(--oa-text-secondary);
}

.btn-danger {
  background: rgba(185, 93, 83, 0.12);
  color: #9b4239;
}

.btn-icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
