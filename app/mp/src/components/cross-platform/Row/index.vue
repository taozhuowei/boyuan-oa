<template>
  <view :style="row_style" class="oa-row">
    <slot />
  </view>
</template>

<script lang="ts" setup>
/**
 * Row 组件 — 小程序端 flex 行布局
 * 用途：对齐 AntD Row 的 gutter / justify 语义，供 useComponent 按名解析
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  gutter?: number | [number, number]
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between'
  align?: 'top' | 'middle' | 'bottom'
}>(), {
  gutter: 0,
  justify: 'start',
  align: 'top'
})

const justify_map: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  'space-around': 'space-around',
  'space-between': 'space-between'
}
const align_map: Record<string, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end'
}

const row_style = computed(() => {
  const gap_h = Array.isArray(props.gutter) ? props.gutter[0] : props.gutter
  const gap_v = Array.isArray(props.gutter) ? (props.gutter[1] ?? 0) : 0
  return {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: justify_map[props.justify] ?? 'flex-start',
    alignItems: align_map[props.align] ?? 'flex-start',
    marginLeft: `-${gap_h / 2}px`,
    marginRight: `-${gap_h / 2}px`,
    rowGap: gap_v > 0 ? `${gap_v}px` : undefined
  }
})
</script>
