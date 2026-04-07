<template>
  <view :style="rowStyle" class="oa-row">
    <slot />
  </view>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
// Row 组件：MP 端 flex 行布局，对齐 AntD Row 的 gutter 和 justify 语义
const props = withDefaults(defineProps<{
  gutter?: number | [number, number]
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between'
  align?: 'top' | 'middle' | 'bottom'
}>(), {
  gutter: 0,
  justify: 'start',
  align: 'top'
})

const justifyMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  'space-around': 'space-around',
  'space-between': 'space-between'
}
const alignMap: Record<string, string> = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end'
}

const rowStyle = computed(() => {
  const gapH = Array.isArray(props.gutter) ? props.gutter[0] : props.gutter
  const gapV = Array.isArray(props.gutter) ? (props.gutter[1] ?? 0) : 0
  return {
    display: 'flex',
    flexWrap: 'wrap' as const,
    justifyContent: justifyMap[props.justify] ?? 'flex-start',
    alignItems: alignMap[props.align] ?? 'flex-start',
    marginLeft: `-${gapH / 2}px`,
    marginRight: `-${gapH / 2}px`,
    rowGap: gapV > 0 ? `${gapV}px` : undefined
  }
})
</script>
