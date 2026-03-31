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

// 样式文件（需在 App.vue 中导入）
// import '@/components/ui-kit/styles/variables.scss'
// import '@/components/ui-kit/styles/ant-theme.scss'  // H5
// import '@/components/ui-kit/styles/vant-theme.scss' // 小程序
