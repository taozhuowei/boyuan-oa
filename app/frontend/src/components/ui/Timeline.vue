<!--
  Timeline 时间线组件
  用途：审批记录、操作日志的时序展示
-->
<template>
  <view class="timeline">
    <view v-for="(item, index) in items" :key="index" class="timeline-item">
      <text class="timeline-node">{{ item.node }}</text>
      <view class="timeline-body">
        <text class="timeline-meta">{{ item.meta }}</text>
        <text v-if="item.comment" class="timeline-comment">{{ item.comment }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface TimelineItem {
  node: string
  meta: string
  comment?: string
}

interface Props {
  items: TimelineItem[]
}

defineProps<Props>()
</script>

<style scoped>
.timeline {
  display: grid;
  gap: 12px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border-radius: var(--oa-radius-md);
  background: rgba(249, 243, 237, 0.72);
}

.timeline-node {
  font-size: 12px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.timeline-meta {
  display: block;
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.timeline-comment {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

@media (max-width: 760px) {
  .timeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
