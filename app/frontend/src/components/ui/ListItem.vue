<!--
  ListItem 列表项组件
  用途：统一的信息列表项，支持标题、描述、右侧标签/时间
-->
<template>
  <view class="list-item">
    <view class="list-item-main">
      <text class="list-item-title">{{ title }}</text>
      <text v-if="desc" class="list-item-desc">{{ desc }}</text>
    </view>
    <view class="list-item-side">
      <Badge v-if="badge" :variant="badgeVariant">{{ badge }}</Badge>
      <text v-if="meta" class="list-item-meta">{{ meta }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import Badge from './Badge.vue'

interface Props {
  title: string
  desc?: string
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  meta?: string
}

withDefaults(defineProps<Props>(), {
  badgeVariant: 'default'
})
</script>

<style scoped>
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--oa-border);
}

.list-item:last-child {
  border-bottom: none;
}

.list-item-main {
  flex: 1;
  min-width: 0;
}

.list-item-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--oa-text-primary);
  line-height: 1.5;
}

.list-item-desc {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-secondary);
  line-height: 1.5;
}

.list-item-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.list-item-meta {
  font-size: 12px;
  color: var(--oa-text-muted);
  white-space: nowrap;
}
</style>
