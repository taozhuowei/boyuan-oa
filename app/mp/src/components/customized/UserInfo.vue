<template>
  <view class="user-info">
    <slot />
  </view>
</template>

<script setup lang="ts">
/**
 * UserInfo 组件
 * 用途：用户信息容器，提供统一的用户信息展示区域
 * 内容通过 slot 注入，配合 UserAvatar、RoleBadge 等子组件使用
 */
</script>

<style lang="scss" scoped>
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
