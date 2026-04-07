<template>
  <view class="module-card" @click="onClick">
    <view class="module-icon" :class="iconClass">
      <text class="icon-text">{{ icon }}</text>
    </view>
    <view class="module-content">
      <text class="module-name">{{ title }}</text>
      <text class="module-desc" v-if="description">{{ description }}</text>
    </view>
    <view class="module-arrow">
      <text class="arrow-text">›</text>
    </view>
    <view v-if="badge !== undefined && badge > 0" class="module-badge">
      <text class="badge-text">{{ badge > 99 ? '99+' : badge }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * ModuleCard 组件
 * 用途：系统功能入口卡片，带图标和描述
 */

interface Props {
  /** 模块标题 */
  title: string
  /** 模块描述 */
  description?: string
  /** 图标 */
  icon: string
  /** 图标主题色 */
  iconTheme?: 'primary' | 'success' | 'warning' | 'error' | 'purple' | 'orange'
  /** 点击跳转路径 */
  path?: string
  /** 角标数量 */
  badge?: number
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  iconTheme: 'primary',
  path: ''
})

const emit = defineEmits<{
  click: []
}>()

// 图标主题类名
const iconClass = computed(() => `theme-${props.iconTheme}`)

// 点击事件
const onClick = () => {
  if (props.path) {
    uni.navigateTo({ url: props.path })
  }
  emit('click')
}
</script>

<style lang="scss" scoped>
.module-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--oa-bg);
  border-radius: var(--oa-radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    background: var(--oa-primary-light);
    transform: translateX(4px);
  }
}

.module-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--oa-radius-md);
  color: #fff;
  flex-shrink: 0;

  &.theme-primary {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  }

  &.theme-success {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  }

  &.theme-warning {
    background: linear-gradient(135deg, #faad14 0%, #d48806 100%);
  }

  &.theme-error {
    background: linear-gradient(135deg, #f5222d 0%, #cf1322 100%);
  }

  &.theme-purple {
    background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
  }

  &.theme-orange {
    background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
  }
}

.icon-text {
  font-size: 24px;
}

.module-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.module-desc {
  font-size: 13px;
  color: var(--oa-text-secondary);
}

.module-arrow {
  color: var(--oa-text-tertiary);
}

.arrow-text {
  font-size: 20px;
}

.module-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: var(--oa-error);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-text {
  font-size: 11px;
  color: #fff;
  font-weight: 500;
}
</style>
