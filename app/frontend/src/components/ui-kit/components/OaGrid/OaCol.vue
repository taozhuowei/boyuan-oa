<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-col
    :span="props.span"
    :offset="props.offset"
    :pull="props.pull"
    :push="props.push"
    :xs="props.xs"
    :sm="props.sm"
    :md="props.md"
    :lg="props.lg"
    :xl="props.xl"
    :xxl="props.xxl"
    :class="['oa-col', props.className]"
    :style="colStyle"
  >
    <slot />
  </a-col>
  <!-- #endif -->
  
  <!-- 小程序端使用自定义实现 -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view
    class="oa-col"
    :class="[
      spanClass,
      offsetClass,
          props.className
    ]"
    :style="colStyle"
  >
    <slot />
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'

interface ResponsiveValue {
  span?: number
  offset?: number
}

interface Props {
  span?: number
  offset?: number
  pull?: number
  push?: number
  xs?: number | ResponsiveValue
  sm?: number | ResponsiveValue
  md?: number | ResponsiveValue
  lg?: number | ResponsiveValue
  xl?: number | ResponsiveValue
  xxl?: number | ResponsiveValue
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  span: undefined,
  offset: 0,
  className: ''
})

// 注入 row 的 gutter
const rowGutter = inject('rowGutter', 0)

// 计算 span 类名
const spanClass = computed(() => {
  if (props.span) {
    return `oa-col--${props.span}`
  }
  return 'oa-col--24'
})

// 计算 offset 类名
const offsetClass = computed(() => {
  if (props.offset) {
    return `oa-col--offset-${props.offset}`
  }
  return ''
})

// 计算列样式
const colStyle = computed(() => {
  const padding = typeof rowGutter === 'number' ? rowGutter / 2 : 0
  return {
    paddingLeft: `${padding}px`,
    paddingRight: `${padding}px`
  }
})
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-col {
  box-sizing: border-box;
  flex: 0 0 auto;
}

// 生成 span 类
@for $i from 1 through 24 {
  .oa-col--#{$i} {
    flex: 0 0 percentage($i / 24);
    max-width: percentage($i / 24);
  }
}

// 生成 offset 类
@for $i from 1 through 24 {
  .oa-col--offset-#{$i} {
    margin-left: percentage($i / 24);
  }
}
/* #endif */
</style>
