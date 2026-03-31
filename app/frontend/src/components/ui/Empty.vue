<!--
  Empty 空状态组件
  用途：列表为空时的统一提示
-->
<template>
  <view class="empty">
    <Icon name="info" :size="40" color="var(--oa-text-muted)" />
    <text class="empty-text">{{ text }}</text>
  </view>
</template>

<script setup lang="ts">
import Icon from './Icon.vue'

interface Props {
  /** 提示文本 */
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '暂无数据'
})
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px 16px;
}

.empty-text {
  font-size: 13px;
  color: var(--oa-text-muted);
}
</style>
