<!--
  Empty 空状态组件
  用途：基于 OaEmpty 的业务封装
  注意：此组件是 OaEmpty 的包装，提供默认的图标样式
-->
<template>
  <oa-empty :description="text">
    <template #image>
      <view class="empty-icon-wrapper">
        <Icon name="info" :size="40" color="var(--oa-text-muted)" />
      </view>
    </template>
    <slot />
  </oa-empty>
</template>

<script setup lang="ts">
import { OaEmpty } from '../ui-kit'
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
.empty-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
</style>
