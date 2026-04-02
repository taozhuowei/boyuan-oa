<template>
  <view class="oa-steps" :class="'oa-steps--' + direction">
    <view
      v-for="(item, index) in normalizedItems"
      :key="index"
      class="oa-step"
      :class="'oa-step--' + item.status"
    >
      <!-- Connector line (not on last item) -->
      <view v-if="index < normalizedItems.length - 1" class="oa-step__connector" :class="{ 'oa-step__connector--done': index < current }" />
      <!-- Icon -->
      <view class="oa-step__icon">
        <text v-if="item.status === 'finish'">V</text>
        <text v-else-if="item.status === 'error'">X</text>
        <text v-else>{{ index + 1 }}</text>
      </view>
      <!-- Content -->
      <view class="oa-step__content">
        <text class="oa-step__title">{{ item.title }}</text>
        <text v-if="item.description" class="oa-step__desc">{{ item.description }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface StepItem {
  title: string
  description?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
}

const props = withDefaults(defineProps<{
  current?: number
  direction?: 'horizontal' | 'vertical'
  items?: StepItem[]
}>(), {
  current: 0,
  direction: 'horizontal',
  items: () => []
})

const normalizedItems = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    status: item.status ?? (index < props.current ? 'finish' : index === props.current ? 'process' : 'wait')
  }))
)
</script>

<style lang="scss" scoped>
.oa-steps {
  display: flex;
  &--horizontal { flex-direction: row; }
  &--vertical { flex-direction: column; }
}

.oa-step {
  position: relative;
  display: flex;
  &--horizontal { flex: 1; flex-direction: column; align-items: center; }
  &--vertical { flex-direction: row; align-items: flex-start; min-height: 60px; margin-bottom: 8px; }
}

.oa-step__connector {
  position: absolute;
  background: #d9d9d9;
  &--done { background: #003466; }
  .oa-steps--horizontal & {
    top: 14px; left: calc(50% + 16px);
    width: calc(100% - 32px); height: 1px;
  }
  .oa-steps--vertical & {
    left: 13px; top: 28px;
    width: 1px; height: calc(100% - 20px);
  }
}

.oa-step__icon {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; flex-shrink: 0;
  .oa-step--finish & { background: #003466; color: #fff; }
  .oa-step--process & { background: #fff; border: 2px solid #003466; color: #003466; }
  .oa-step--wait & { background: #f0f0f0; border: 2px solid #d9d9d9; color: rgba(0,0,0,0.45); }
  .oa-step--error & { background: #f5222d; color: #fff; }
}

.oa-step__content {
  .oa-steps--horizontal & { margin-top: 6px; text-align: center; }
  .oa-steps--vertical & { margin-left: 10px; }
}

.oa-step__title {
  font-size: 13px;
  .oa-step--finish &, .oa-step--process & { color: rgba(0,0,0,0.85); }
  .oa-step--process & { font-weight: 600; }
  .oa-step--wait & { color: rgba(0,0,0,0.45); }
  .oa-step--error & { color: #f5222d; }
}

.oa-step__desc {
  font-size: 12px;
  color: rgba(0,0,0,0.45);
  margin-top: 2px;
  display: block;
}
</style>
