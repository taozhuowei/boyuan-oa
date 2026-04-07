<template>
  <view :style="col_style" class="oa-col">
    <slot />
  </view>
</template>

<script lang="ts" setup>
/**
 * Col 组件 — 小程序端 24 栅格列布局
 * 用途：对齐 AntD Col 的 span / offset 语义，供 useComponent 按名解析
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  span?: number
  offset?: number
}>(), {
  span: 24,
  offset: 0
})

const col_style = computed(() => ({
  width: `${(props.span / 24) * 100}%`,
  marginLeft: `${(props.offset / 24) * 100}%`,
  boxSizing: 'border-box' as const
}))
</script>
