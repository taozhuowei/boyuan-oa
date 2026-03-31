/**
 * 平台适配器 - 徽标组件
 * 职责：封装 H5(Ant Design) 和 小程序(Vant) 的徽标属性映射逻辑
 */
import { computed } from 'vue'
import type { BadgeProps } from '../../types'

/**
 * Ant Design 徽标适配器
 */
export function useAntBadgeAdapter(props: BadgeProps) {
  const adaptedStatus = computed(() => {
    const statusMap: Record<string, any> = {
      success: 'success',
      error: 'error',
      warning: 'warning',
      processing: 'processing',
      default: 'default'
    }
    return props.status ? (statusMap[props.status] || props.status) : undefined
  })

  return {
    adaptedStatus
  }
}

/**
 * Vant 徽标适配器
 */
export function useVantBadgeAdapter(props: BadgeProps) {
  const shouldShowBadge = computed(() => {
    if (props.dot) return true
    if (props.status) return true
    if (props.text) return true
    return (props.count || 0) > 0 || props.showZero
  })

  const displayText = computed(() => {
    if (props.text) return props.text
    if (props.dot) return ''
    const count = props.count || 0
    const overflowCount = props.overflowCount || 99
    if (count > overflowCount) return `${overflowCount}+`
    return String(count)
  })

  const badgeClass = computed(() => {
    if (props.status) return `status-${props.status}`
    if (props.color) return 'custom-color'
    return 'default'
  })

  const badgeStyle = computed(() => {
    const style: Record<string, string> = {}

    if (props.color && !props.status) {
      style.backgroundColor = props.color
    }

    if (props.offset) {
      style.right = `${props.offset[0]}px`
      style.top = `${props.offset[1]}px`
    }

    return style
  })

  return {
    shouldShowBadge,
    displayText,
    badgeClass,
    badgeStyle
  }
}
