/**
 * 统一组件库 (OA UI Kit)
 *
 * 跨端组件封装层：
 * - H5 端使用 Ant Design Vue
 * - 小程序端使用 Vant
 *
 * 通过 uni-app 条件编译实现自动切换
 */

// 类型定义
export type {
  ButtonProps,
  InputProps,
  FormProps,
  FormItemProps,
  SelectProps,
  DatePickerProps,
  RadioProps,
  CheckboxProps,
  CardProps,
  ListProps,
  TableProps,
  ModalProps,
  BadgeProps,
  TabsProps,
  TabPaneProps,
  EmptyProps
} from './types'

// 基础组件
export { default as OaButton } from './components/OaButton/OaButton.vue'
export { default as OaInput } from './components/OaInput/OaInput.vue'
export { default as OaForm } from './components/OaForm/OaForm.vue'
export { default as OaCard } from './components/OaCard/OaCard.vue'
export { default as OaSelect } from './components/OaSelect/OaSelect.vue'
export { default as OaDatePicker } from './components/OaDatePicker/OaDatePicker.vue'
export { default as OaRadio } from './components/OaRadio/OaRadio.vue'
export { default as OaCheckbox } from './components/OaCheckbox/OaCheckbox.vue'

// 栅格系统
export { default as OaRow } from './components/OaGrid/OaRow.vue'
export { default as OaCol } from './components/OaGrid/OaCol.vue'

// 反馈组件
export { default as OaModal } from './components/OaModal/OaModal.vue'
export { default as OaBadge } from './components/OaBadge/OaBadge.vue'
export { default as OaEmpty } from './components/OaEmpty/OaEmpty.vue'

// 平台适配器（供高级自定义使用）
export * from './adapters/button'
export * from './adapters/input'
export * from './adapters/badge'

// 样式文件（需在 App.vue 中导入）
// import '@/components/ui-kit/styles/variables.scss'
// import '@/components/ui-kit/styles/ant-theme.scss'  // H5
// import '@/components/ui-kit/styles/vant-theme.scss' // 小程序
