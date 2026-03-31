<!--
  StatCard 统计卡片组件
  用途：工作台数据概览的统计项展示
-->
<template>
  <view class="stat-card">
    <text class="stat-label">{{ label }}</text>
    <text class="stat-value">{{ value }}</text>
    <text v-if="note" class="stat-note">{{ note }}</text>
  </view>
</template>

<script setup lang="ts">
interface Props {
  label: string
  value: string
  note?: string
}

defineProps<Props>()
</script>

<style scoped>
.stat-card {
  padding: 16px;
  border-radius: var(--oa-radius-lg);
  background: linear-gradient(180deg, rgba(255, 251, 246, 0.94) 0%, rgba(247, 240, 234, 0.94) 100%);
  border: 1px solid var(--oa-border-strong);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.stat-value {
  display: block;
  margin: 8px 0 4px;
  font-family: var(--oa-font-display);
  font-size: 28px;
  color: var(--oa-text-primary);
}

.stat-note {
  display: block;
  font-size: 12px;
  color: var(--oa-text-secondary);
}
</style>
