/**
 * 平台适配器 - 输入框组件
 * 职责：封装 H5(Ant Design) 和 小程序(Vant) 的输入框属性映射逻辑
 */
import { computed } from 'vue'
import type { InputProps } from '../../types'

/**
 * Vant 输入框类型映射
 */
export function useVantInputAdapter(props: InputProps) {
  const fieldType = computed(() => {
    const typeMap: Record<string, string> = {
      'text': 'text',
      'password': 'password',
      'number': 'number',
      'tel': 'tel',
      'email': 'text',
      'textarea': 'textarea'
    }
    return typeMap[props.type || 'text'] || 'text'
  })

  return {
    fieldType
  }
}

/**
 * 输入框事件处理适配器
 */
export function useInputEventAdapter(
  emit: {
    (e: 'update:modelValue', value: string | number): void
    (e: 'focus', event: FocusEvent): void
    (e: 'blur', event: FocusEvent): void
    (e: 'change', value: string | number): void
    (e: 'clear'): void
  }
) {
  // H5 事件处理
  const handleFocus = (e: FocusEvent) => emit('focus', e)
  const handleBlur = (e: FocusEvent) => emit('blur', e)
  const handleChange = (e: any) => emit('change', e.target?.value)

  // 小程序事件处理
  const handleInput = (e: any) => {
    emit('update:modelValue', e.detail)
  }
  const handleTextareaInput = (e: any) => {
    emit('update:modelValue', e.target.value)
  }
  const handleClear = () => {
    emit('update:modelValue', '')
    emit('clear')
  }

  return {
    handleFocus,
    handleBlur,
    handleChange,
    handleInput,
    handleTextareaInput,
    handleClear
  }
}
