<template>
  <view class="stat-card" :class="themeClass">
    <view class="stat-icon" v-if="icon">
      <text class="icon-text">{{ icon }}</text>
    </view>
    <view class="stat-content">
      <text class="stat-value">{{ formattedValue }}</text>
      <text class="stat-unit" v-if="unit">{{ unit }}</text>
      <text class="stat-title">{{ title }}</text>
    </view>
    <view class="stat-trend" v-if="trend">
      <text :class="['trend-text', trend.type]">
        {{ trend.type === 'up' ? '↑' : '↓' }} {{ trend.value }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * StatCard 组件
 * 用途：统计卡片，用于工作台快捷统计展示
 */

interface Props {
  /** 统计标题 */
  title: string
  /** 统计数值 */
  value: string | number
  /** 数值单位 */
  unit?: string
  /** 图标 */
  icon?: string
  /** 趋势变化 */
  trend?: {
    type: 'up' | 'down'
    value: string
  }
  /** 主题色 */
  theme?: 'primary' | 'success' | 'warning' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  unit: '',
  icon: '',
  theme: 'primary'
})

// 格式化数值
const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

// 主题类名
const themeClass = computed(() => `theme-${props.theme}`)
</script>

<style lang="scss" scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: var(--oa-radius-lg);
  box-shadow: var(--oa-shadow-sm);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-primary-light);
  color: var(--oa-primary);
}

.icon-text {
  font-size: 24px;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-family: var(--oa-font-family-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.stat-unit {
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.stat-title {
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.stat-trend {
  display: flex;
  align-items: center;
}

.trend-text {
  font-size: 12px;
  font-weight: 500;

  &.up {
    color: var(--oa-success);
  }

  &.down {
    color: var(--oa-error);
  }
}

// 主题色
.theme-primary .stat-icon {
  background: var(--oa-primary-light);
  color: var(--oa-primary);
}

.theme-success .stat-icon {
  background: rgba(82, 196, 26, 0.1);
  color: var(--oa-success);
}

.theme-warning .stat-icon {
  background: rgba(250, 173, 20, 0.1);
  color: var(--oa-warning);
}

.theme-error .stat-icon {
  background: rgba(245, 34, 45, 0.1);
  color: var(--oa-error);
}
</style>
