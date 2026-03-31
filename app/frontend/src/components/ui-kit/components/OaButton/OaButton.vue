<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-button
    :type="adaptedType"
    :size="adaptedSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :block="props.block"
    :shape="props.shape"
    :html-type="props.htmlType"
    :danger="isDanger"
    :ghost="isGhost"
    @click="handleClick"
  >
    <template #icon v-if="props.icon">
      <Icon :name="props.icon" />
    </template>
    <slot />
  </a-button>
  <!-- #endif -->

  <!-- 小程序端使用 Vant -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <van-button
    :type="vantType"
    :size="vantSize"
    :disabled="props.disabled"
    :loading="props.loading"
    :block="props.block"
    :round="isRound"
    @click="handleClick"
  >
    <slot />
  </van-button>
  <!-- #endif -->
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ButtonProps } from '../../types'
import { useAntButtonAdapter, useVantButtonAdapter } from '../../adapters/button'
import Icon from '../../../../components/ui/Icon.vue'

const props = withDefaults(defineProps<ButtonProps>(), {
  type: 'default',
  size: 'middle',
  disabled: false,
  loading: false,
  block: false,
  shape: 'default',
  htmlType: 'button'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

// 使用适配器
const { adaptedType, adaptedSize, isDanger, isGhost } = useAntButtonAdapter(props)
const { vantType, vantSize, isRound } = useVantButtonAdapter(props)

const handleClick = (e: MouseEvent) => {
  emit('click', e)
}
</script>

<style scoped>
/* #ifdef H5 */
:deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

:deep(.ant-btn-dangerous) {
  background: var(--oa-error);
  border-color: var(--oa-error);
  color: #fff;
}
/* #endif */
</style>
