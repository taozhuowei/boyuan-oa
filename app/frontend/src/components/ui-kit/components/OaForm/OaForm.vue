<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-form
    :model="props.model"
    :rules="props.rules"
    :layout="props.layout"
    :label-col="props.labelCol"
    :wrapper-col="props.wrapperCol"
    :label-align="props.labelAlign"
    :disabled="props.disabled"
    :scroll-to-first-error="props.scrollToFirstError"
    @finish="handleFinish"
    @finish-failed="handleFinishFailed"
  >
    <slot />
  </a-form>
  <!-- #endif -->
  
  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-form
    :validate-first="false"
    @submit="handleSubmit"
    @failed="handleFailed"
  >
    <slot />
  </van-form>
  <!-- #endif -->
</template>

<script setup lang="ts">
import type { FormProps } from '../../types'

const props = defineProps<FormProps>()

const emit = defineEmits<{
  finish: [values: any]
  'finish-failed': [errors: any]
  submit: [values: any]
  failed: [errors: any]
}>()

// H5 事件
const handleFinish = (values: any) => emit('finish', values)
const handleFinishFailed = (errors: any) => emit('finish-failed', errors)

// 小程序事件
const handleSubmit = (e: any) => emit('submit', e.detail.values)
const handleFailed = (e: any) => emit('failed', e.detail.errors)
</script>
