<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-row
    :gutter="props.gutter"
    :justify="props.justify"
    :align="props.align"
    :class="['oa-row', props.className]"
    :style="rowStyle"
  >
    <slot />
  </a-row>
  <!-- #endif -->
  
  <!-- 小程序端使用自定义实现 -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view
    class="oa-row"
    :class="[
      justifyClass,
      alignClass,
      props.className
    ]"
    :style="rowStyle"
  >
    <slot />
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  gutter?: number | [number, number]
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  align?: 'top' | 'middle' | 'bottom' | 'stretch'
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  gutter: 0,
  justify: 'start',
  align: 'top',
  className: ''
})

// 小程序端样式映射
const justifyClass = computed(() => {
  const map: Record<string, string> = {
    'start': 'oa-row--justify-start',
    'end': 'oa-row--justify-end',
    'center': 'oa-row--justify-center',
    'space-around': 'oa-row--justify-space-around',
    'space-between': 'oa-row--justify-space-between',
    'space-evenly': 'oa-row--justify-space-evenly'
  }
  return map[props.justify] || ''
})

const alignClass = computed(() => {
  const map: Record<string, string> = {
    'top': 'oa-row--align-top',
    'middle': 'oa-row--align-middle',
    'bottom': 'oa-row--align-bottom',
    'stretch': 'oa-row--align-stretch'
  }
  return map[props.align] || ''
})

// 计算 gutter 样式
const rowStyle = computed(() => {
  const gutter = props.gutter
  if (typeof gutter === 'number') {
    return {
      marginLeft: `-${gutter / 2}px`,
      marginRight: `-${gutter / 2}px`
    }
  } else if (Array.isArray(gutter)) {
    return {
      marginLeft: `-${gutter[0] / 2}px`,
      marginRight: `-${gutter[0] / 2}px`,
      rowGap: `${gutter[1]}px`
    }
  }
  return {}
})
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-row {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
  
  // Justify
  &--justify-start {
    justify-content: flex-start;
  }
  &--justify-end {
    justify-content: flex-end;
  }
  &--justify-center {
    justify-content: center;
  }
  &--justify-space-around {
    justify-content: space-around;
  }
  &--justify-space-between {
    justify-content: space-between;
  }
  &--justify-space-evenly {
    justify-content: space-evenly;
  }
  
  // Align
  &--align-top {
    align-items: flex-start;
  }
  &--align-middle {
    align-items: center;
  }
  &--align-bottom {
    align-items: flex-end;
  }
  &--align-stretch {
    align-items: stretch;
  }
}
/* #endif */
</style>
