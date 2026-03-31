<template>
  <view class="user-avatar">
    <image
      v-if="src"
      class="avatar-image"
      :src="src"
      mode="aspectFill"
      @error="onError"
    />
    <view v-else class="avatar-placeholder">
      <text class="avatar-initial">{{ initial }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * UserAvatar 组件
 * 用途：显示用户头像，支持图片和文字首字母回退
 */

interface Props {
  /** 头像图片地址 */
  src?: string
  /** 用户姓名（用于生成首字母） */
  name?: string
  /** 头像尺寸 */
  size?: 'small' | 'default' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  name: '',
  size: 'default'
})

const emit = defineEmits<{
  error: []
}>()

// 计算首字母
const initial = computed(() => {
  if (!props.name) return '?'
  return props.name.charAt(0).toUpperCase()
})

// 头像尺寸
const size_class = computed(() => `size-${props.size}`)

// 图片加载失败
const onError = () => {
  emit('error')
}
</script>

<style lang="scss" scoped>
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background: var(--oa-primary-light);

  &.size-small {
    width: 32px;
    height: 32px;
  }

  &.size-default {
    width: 48px;
    height: 48px;
  }

  &.size-large {
    width: 64px;
    height: 64px;
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--oa-primary);
}

.avatar-initial {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}
</style>
