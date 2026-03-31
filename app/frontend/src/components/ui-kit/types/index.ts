/**
 * 统一组件库类型定义
 * 与 Ant Design / Vant 保持兼容的通用接口
 */

// 按钮
export interface ButtonProps {
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text' | 'danger' | 'ghost'
  size?: 'large' | 'middle' | 'small'
  disabled?: boolean
  loading?: boolean
  block?: boolean
  icon?: string
  shape?: 'circle' | 'round' | 'default'
  htmlType?: 'button' | 'submit' | 'reset'
}

// 输入框
export interface InputProps {
  modelValue?: string | number
  type?: 'text' | 'password' | 'number' | 'tel' | 'email' | 'textarea'
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  clearable?: boolean
  maxlength?: number
  showWordLimit?: boolean
  rows?: number
  autosize?: boolean | { minRows?: number; maxRows?: number }
}

// 表单
export interface FormProps {
  model?: Record<string, any>
  rules?: Record<string, any>
  layout?: 'horizontal' | 'vertical' | 'inline'
  labelCol?: { span?: number; offset?: number }
  wrapperCol?: { span?: number; offset?: number }
  labelAlign?: 'left' | 'right'
  disabled?: boolean
  scrollToFirstError?: boolean
}

export interface FormItemProps {
  name?: string | string[]
  label?: string
  rules?: any[]
  required?: boolean
  help?: string
  extra?: string
  labelCol?: { span?: number }
  wrapperCol?: { span?: number }
}

// 选择器
export interface SelectProps {
  modelValue?: string | number | (string | number)[]
  options?: Array<{ label: string; value: any; disabled?: boolean }>
  placeholder?: string
  disabled?: boolean
  multiple?: boolean
  clearable?: boolean
  searchable?: boolean
  loading?: boolean
}

// 日期选择
export interface DatePickerProps {
  modelValue?: string | Date
  type?: 'date' | 'datetime' | 'year' | 'month' | 'time'
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
  minDate?: Date
  maxDate?: Date
  format?: string
}

// 单选框
export interface RadioProps {
  modelValue?: any
  options?: Array<{ label: string; value: any; disabled?: boolean }>
  disabled?: boolean
  size?: 'large' | 'default' | 'small'
  buttonStyle?: 'outline' | 'solid'
}

// 复选框
export interface CheckboxProps {
  modelValue?: boolean | (string | number)[]
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}

// 卡片
export interface CardProps {
  title?: string
  extra?: string
  bordered?: boolean
  hoverable?: boolean
  loading?: boolean
  size?: 'default' | 'small'
}

// 列表
export interface ListProps {
  dataSource?: any[]
  loading?: boolean
  bordered?: boolean
  split?: boolean
  size?: 'default' | 'small' | 'large'
  pagination?: boolean | any
}

// 表格
export interface TableProps {
  dataSource?: any[]
  columns?: any[]
  loading?: boolean
  bordered?: boolean
  size?: 'default' | 'middle' | 'small'
  pagination?: boolean | any
  rowKey?: string | ((record: any) => string)
  scroll?: { x?: number | string; y?: number | string }
}

// 弹窗
export interface ModalProps {
  modelValue?: boolean
  title?: string
  width?: string | number
  centered?: boolean
  closable?: boolean
  maskClosable?: boolean
  okText?: string
  cancelText?: string
  confirmLoading?: boolean
  destroyOnClose?: boolean
}

// 徽标
export interface BadgeProps {
  count?: number
  overflowCount?: number
  dot?: boolean
  showZero?: boolean
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning'
  color?: string
  text?: string
  offset?: [number, number]
}

// 标签页
export interface TabsProps {
  modelValue?: string | number
  type?: 'line' | 'card' | 'editable-card'
  size?: 'large' | 'default' | 'small'
  centered?: boolean
  tabPosition?: 'top' | 'right' | 'bottom' | 'left'
}

export interface TabPaneProps {
  key: string | number
  tab?: string
  disabled?: boolean
  forceRender?: boolean
}

// 空状态
export interface EmptyProps {
  description?: string
  image?: string
  imageStyle?: any
}

// 通用事件
export interface FormEvents {
  'update:modelValue': (value: any) => void
  change: (value: any) => void
  focus: (e: FocusEvent) => void
  blur: (e: FocusEvent) => void
}

export interface ButtonEvents {
  click: (e: MouseEvent) => void
}

export interface ModalEvents {
  ok: () => void
  cancel: () => void
  'update:visible': (visible: boolean) => void
  afterClose: () => void
}
