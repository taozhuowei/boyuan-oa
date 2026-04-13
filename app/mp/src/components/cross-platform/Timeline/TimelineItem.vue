<template>
  <view class="timeline-item" :class="statusClass">
    <view class="timeline-dot">
      <view v-if="status === 'success'" class="dot-inner success">✓</view>
      <view v-else-if="status === 'error'" class="dot-inner error">✕</view>
      <view v-else-if="status === 'processing'" class="dot-inner processing"></view>
      <view v-else class="dot-inner pending"></view>
    </view>
    <view class="timeline-content">
      <view class="timeline-header">
        <text class="timeline-title">{{ title }}</text>
        <text v-if="time" class="timeline-time">{{ time }}</text>
      </view>
      <text v-if="description" class="timeline-desc">{{ description }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * TimelineItem 组件
 * 用途：时间轴子项，展示单个时间节点
 */

interface Props {
  /** 节点标题 */
  title: string
  /** 节点描述 */
  description?: string
  /** 时间戳 */
  time?: string
  /** 节点状态 */
  status?: 'pending' | 'processing' | 'success' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  description: '',
  time: '',
  status: 'pending'
})

const statusClass = computed(() => `status-${props.status}`)
</script>

<style lang="scss" scoped>
.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-bottom: 20px;
  position: relative;
}

.timeline-dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.dot-inner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;

  &.pending {
    background: #fff;
    border: 2px solid var(--oa-border);
  }

  &.processing {
    background: var(--oa-primary);
    border: 2px solid var(--oa-primary);
    animation: pulse 2s infinite;
  }

  &.success {
    background: var(--oa-success);
    border: 2px solid var(--oa-success);
    color: #fff;
  }

  &.error {
    background: var(--oa-error);
    border: 2px solid var(--oa-error);
    color: #fff;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 52, 102, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 52, 102, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 52, 102, 0);
  }
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--oa-text-primary);
}

.timeline-time {
  font-size: 12px;
  color: var(--oa-text-tertiary);
}

.timeline-desc {
  font-size: 13px;
  color: var(--oa-text-secondary);
  line-height: 1.5;
}

// 状态样式
.status-success .timeline-title {
  color: var(--oa-success);
}

.status-error .timeline-title {
  color: var(--oa-error);
}

.status-processing .timeline-title {
  color: var(--oa-primary);
}
</style>
