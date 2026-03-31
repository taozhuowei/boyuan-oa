<template>
  <!-- H5 端使用 Ant Design -->
  <!-- #ifdef H5 -->
  <a-empty
    :description="props.description"
    :image="props.image"
    :image-style="props.imageStyle"
  >
    <slot />
  </a-empty>
  <!-- #endif -->

  <!-- 小程序端使用自定义实现 -->
  <!-- #ifdef MP-WEIXIN || APP-PLUS -->
  <view class="oa-empty">
    <view class="oa-empty__image" :style="imageStyle">
      <slot name="image">
        <view class="oa-empty__default-image">
          <view class="oa-empty__icon">
            <view class="oa-empty__box"></view>
          </view>
        </view>
      </slot>
    </view>
    <text class="oa-empty__description">{{ props.description }}</text>
    <view v-if="$slots.default" class="oa-empty__footer">
      <slot />
    </view>
  </view>
  <!-- #endif -->
</template>

<script setup lang="ts">
import type { EmptyProps } from '../../types'

const props = withDefaults(defineProps<EmptyProps>(), {
  description: '暂无数据'
})
</script>

<style scoped lang="scss">
/* #ifdef MP-WEIXIN || APP-PLUS */
.oa-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;

  &__image {
    margin-bottom: 16px;
  }

  &__default-image {
    width: 120px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__icon {
    position: relative;
    width: 64px;
    height: 40px;
  }

  &__box {
    width: 100%;
    height: 100%;
    border: 2px solid var(--oa-border-color);
    border-radius: 4px;
    position: relative;
    background: linear-gradient(180deg, var(--oa-bg-container) 0%, var(--oa-bg) 100%);

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24px;
      height: 2px;
      background: var(--oa-border-color);
      border-radius: 1px;
    }

    &::after {
      content: '';
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 2px;
      background: var(--oa-border-color);
      border-radius: 1px;
    }
  }

  &__description {
    font-size: 14px;
    color: var(--oa-text-secondary);
    text-align: center;
  }

  &__footer {
    margin-top: 16px;
  }
}
/* #endif */
</style>
