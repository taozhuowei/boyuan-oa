<template>
  <view class="timeline">
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * Timeline 组件（跨平台）
 * 用途：时间轴容器，用于展示审批流程、施工日志等时间线数据
 * 子组件：TimelineItem
 */
</script>

<style lang="scss" scoped>
.timeline {
  display: flex;
  flex-direction: column;
  position: relative;
  padding-left: 16px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  background: var(--oa-border);
}
</style>
