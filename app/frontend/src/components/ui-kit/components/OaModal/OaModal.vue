<template>
  <!-- H5 使用 Ant Design Vue -->
  <!-- #ifdef H5 -->
  <a-modal
    v-model:open="visible"
    :title="props.title"
    :width="props.width"
    :centered="props.centered"
    :closable="props.closable"
    :mask-closable="props.maskClosable"
    :destroy-on-close="props.destroyOnClose"
    :confirm-loading="props.confirmLoading"
    :ok-text="props.okText"
    :cancel-text="props.cancelText"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <template v-if="slots.title" #title>
      <slot name="title"></slot>
    </template>
    <template v-if="slots.default" #default>
      <slot></slot>
    </template>
    <template v-if="slots.footer" #footer>
      <slot name="footer"></slot>
    </template>
  </a-modal>
  <!-- #endif -->

  <!-- 小程序使用 Vant Dialog -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-dialog
    :show="visible"
    :title="props.title"
    :width="typeof props.width === 'number' ? props.width : parseInt(props.width || '520')"
    :show-confirm-button="false"
    :show-cancel-button="false"
    :close-on-click-overlay="props.maskClosable"
  >
    <view class="oa-modal-content">
      <slot></slot>
    </view>
    <view v-if="slots.footer" class="oa-modal-footer">
      <slot name="footer"></slot>
    </view>
  </van-dialog>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ModalProps } from '../../types'

const props = withDefaults(defineProps<ModalProps>(), {
  modelValue: false,
  title: '',
  width: '520px',
  centered: false,
  closable: true,
  maskClosable: true,
  destroyOnClose: false,
  confirmLoading: false,
  okText: '确定',
  cancelText: '取消'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  ok: []
  cancel: []
}>()

const slots = useSlots()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleOk = () => {
  emit('ok')
}

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>

<style lang="scss" scoped>
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-modal-content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.oa-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--oa-border);
}
/* #endif */
</style>
