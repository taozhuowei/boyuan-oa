<template>
  <view v-if="hasPermission" class="permission">
    <slot />
  </view>
  <view v-else-if="showFallback" class="permission-fallback">
    <slot name="fallback" />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../stores'

/**
 * Permission 组件
 * 用途：权限控制容器，根据用户角色决定是否渲染内容
 */

interface Props {
  /** 允许访问的角色列表 */
  roles?: string[]
  /** 允许访问的权限标识 */
  permission?: string
  /** 无权限时是否显示 fallback 内容 */
  showFallback?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  roles: () => [],
  permission: '',
  showFallback: false
})

const userStore = useUserStore()

// 检查是否有权限
const hasPermission = computed(() => {
  const userRole = userStore.userInfo?.role

  if (!userRole) return false

  // 如果指定了角色列表，检查是否在列表中
  if (props.roles.length > 0) {
    return props.roles.includes(userRole)
  }

  // 如果指定了权限标识，检查用户是否有该权限
  if (props.permission) {
    // TODO: 从 userInfo.permissions 中检查
    return true
  }

  return true
})
</script>

<style lang="scss" scoped>
.permission {
  display: contents;
}

.permission-fallback {
  display: contents;
}
</style>
