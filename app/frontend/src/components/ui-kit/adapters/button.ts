/**
 * 平台适配器 - 按钮组件
 * 职责：封装 H5(Ant Design) 和 小程序(Vant) 的按钮属性映射逻辑
 */
import { computed } from 'vue'
import type { ButtonProps } from '../../types'

/**
 * Ant Design 按钮适配器
 */
export function useAntButtonAdapter(props: ButtonProps) {
  const adaptedType = computed(() => {
    const typeMap: Record<string, string> = {
      'primary': 'primary',
      'default': 'default',
      'dashed': 'dashed',
      'link': 'link',
      'text': 'text',
      'danger': 'primary',
      'ghost': 'default'
    }
    return typeMap[props.type || 'default'] || 'default'
  })

  const adaptedSize = computed(() => {
    const sizeMap: Record<string, string> = {
      'large': 'large',
      'middle': 'middle',
      'small': 'small'
    }
    return sizeMap[props.size || 'middle'] || 'middle'
  })

  const isDanger = computed(() => props.type === 'danger')
  const isGhost = computed(() => props.type === 'ghost')

  return {
    adaptedType,
    adaptedSize,
    isDanger,
    isGhost
  }
}

/**
 * Vant 按钮适配器
 */
export function useVantButtonAdapter(props: ButtonProps) {
  const vantType = computed(() => {
    const typeMap: Record<string, string> = {
      'primary': 'primary',
      'default': 'default',
      'danger': 'danger',
      'ghost': 'default',
      'dashed': 'default',
      'link': 'default',
      'text': 'default'
    }
    return typeMap[props.type || 'default'] || 'default'
  })

  const vantSize = computed(() => {
    const sizeMap: Record<string, string> = {
      'large': 'normal',
      'middle': 'normal',
      'small': 'small'
    }
    return sizeMap[props.size || 'middle'] || 'normal'
  })

  const isRound = computed(() => props.shape === 'round')

  return {
    vantType,
    vantSize,
    isRound
  }
}
