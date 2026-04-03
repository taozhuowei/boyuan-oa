<template>
  <view :style="colStyle" class="oa-col">
    <slot />
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
// Col 组件：MP 端基于 24 栅格的列布局
const props = withDefaults(defineProps<{
  span?: number
  offset?: number
}>(), {
  span: 24,
  offset: 0
})

const colStyle = computed(() => ({
  width: `${(props.span / 24) * 100}%`,
  marginLeft: `${(props.offset / 24) * 100}%`,
  boxSizing: 'border-box' as const
}))
</script>
