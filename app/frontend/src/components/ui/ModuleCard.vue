<!--
  ModuleCard 模块入口卡片
  用途：工作台的功能模块快捷入口
-->
<template>
  <view class="module-card" :class="{ 'module-card-ready': ready, 'module-card-disabled': !ready }" @click="$emit('click')">
    <view class="module-card-head">
      <Icon :name="icon" :size="22" />
      <text class="module-card-title">{{ title }}</text>
    </view>
    <view v-if="ready" class="module-card-dot" />
  </view>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

interface Props {
  title: string
  icon: string
  ready?: boolean
}

withDefaults(defineProps<Props>(), {
  ready: true
})

defineEmits<{
  click: []
}>()
</script>

<style scoped>
.module-card {
  position: relative;
  padding: 16px;
  border-radius: var(--oa-radius-lg);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border-strong);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.module-card-ready:active {
  transform: scale(0.98);
}

.module-card-disabled {
  opacity: 0.6;
}

.module-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.module-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.module-card-dot {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #6f8c4d;
}
</style>
