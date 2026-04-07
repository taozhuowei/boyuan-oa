/**
 * useComponent — 小程序端组件解析器
 *
 * 用途：将组件逻辑名（如 "Button"、"Modal"）映射到对应的 vant / 本地组件，
 *       与原跨平台适配层保持相同 API（Record<string, Ref<Component | null>>），
 *       方便模板直接用 <component :is="ButtonRef" /> 渲染。
 *
 * 数据流：组件名字符串 → 静态映射表 → shallowRef 包装 → 返回
 *
 * 注意：这是 MP 专用简化版，直接导入 vant / 本地组件，不含异步加载。
 */
import { shallowRef } from 'vue'
import type { Component } from 'vue'

// Vant 组件（MP 端使用 vant v4 Vue 版本）
import {
  Button,
  Field,
  Cell,
  Form,
  Picker,
  DatePicker,
  Radio,
  RadioGroup,
  Checkbox,
  Dialog,
  Badge,
  Empty,
  Tabs,
  Tab,
  Tag,
  Popup,
  Stepper,
  Switch,
  Steps,
  Step
} from 'vant'

// 本地跨平台组件
import Row from '@/components/cross-platform/Row/index.vue'
import Col from '@/components/cross-platform/Col/index.vue'
import Table from '@/components/cross-platform/Table/index.vue'
import OaSteps from '@/components/cross-platform/Steps/index.vue'
import Timeline from '@/components/cross-platform/Timeline/index.vue'
import TimelineItem from '@/components/cross-platform/Timeline/TimelineItem.vue'
import FileUpload from '@/components/cross-platform/FileUpload/index.vue'
import SignatureCanvas from '@/components/cross-platform/SignatureCanvas/index.vue'

// 定制业务组件
import StatCard from '@/components/customized/StatCard.vue'
import ModuleCard from '@/components/customized/ModuleCard.vue'
import UserInfo from '@/components/customized/UserInfo.vue'
import UserAvatar from '@/components/customized/UserAvatar.vue'
import Permission from '@/components/customized/Permission.vue'
import ChangePhoneModal from '@/components/customized/ChangePhoneModal.vue'

/** 逻辑名 → 组件 映射表（MP 端） */
const COMPONENT_MAP: Record<string, Component> = {
  Button,
  Input: Field,        // vant Field 兼作输入框
  Textarea: Field,     // vant Field（type=textarea）
  Card: Cell,
  Form,
  FormItem: Field,
  Select: Picker,      // vant Picker 兼作下拉选择
  DatePicker,
  Radio,
  RadioGroup,
  Checkbox,
  Modal: Dialog,       // vant Dialog 兼作模态框
  Badge,
  Empty,
  Row,
  Col,
  Table,
  Steps: OaSteps,      // 本地 Steps，数据驱动（items prop）
  Step: Step as Component, // vant Step，与 vant Steps 配套
  Timeline,
  TimelineItem,
  StatCard,
  ModuleCard,
  UserInfo,
  UserAvatar,
  Permission,
  Upload: FileUpload,
  Canvas: SignatureCanvas,
  Tabs,
  Tab,
  Tag,
  Popup,
  InputNumber: Stepper,
  Switch,
  ChangePhoneModal,
  // vant Steps 也可按需直接使用
  VantSteps: Steps as Component,
}

/**
 * 按名称批量解析 MP 端组件
 * @param names 逻辑组件名列表，如 ['Button', 'Modal']
 * @returns Record<name, Ref<Component | null>>，模板中自动解包
 */
export function useComponent(
  names: string[]
): Record<string, ReturnType<typeof shallowRef<Component | null>>> {
  const result: Record<string, ReturnType<typeof shallowRef<Component | null>>> = {}
  for (const name of names) {
    result[name] = shallowRef<Component | null>(COMPONENT_MAP[name] ?? null)
  }
  return result
}
