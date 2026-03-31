/**
 * 设备尺寸检测组合式函数
 * 用途：响应式布局中判断当前设备类型（手机/平板/PC）
 */
import { ref, onMounted, onUnmounted } from 'vue'

/** 断点定义（单位：px） */
const BREAKPOINTS = {
  mobile: 760,
  tablet: 1120
}

export function useDevice() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 375)

  const isMobile = () => width.value <= BREAKPOINTS.mobile
  const isTablet = () => width.value > BREAKPOINTS.mobile && width.value <= BREAKPOINTS.tablet
  const isDesktop = () => width.value > BREAKPOINTS.tablet

  const update = () => {
    if (typeof window !== 'undefined') {
      width.value = window.innerWidth
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', update)
    }
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', update)
    }
  })

  return {
    width,
    isMobile,
    isTablet,
    isDesktop
  }
}
