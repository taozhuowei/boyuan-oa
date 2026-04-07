<template>
  <view class="at">
    <component :is="Timeline" v-if="Timeline">
      <component v-for="r in records" :key="r.id" :is="TimelineItem" v-if="TimelineItem" :color="colorMap[r.action]">
        <view class="at-node">
          <view class="at-node__top">
            <view class="at-node__who">
              <text class="at-node__name">{{ r.operatorName }}</text>
              <text v-if="r.operatorRole" class="at-node__role"> ({{ r.operatorRole }})</text>
            </view>
            <view class="at-node__badge" :class="'at-node__badge--'+r.action">{{ labelMap[r.action] }}</view>
          </view>
          <text v-if="r.comment" class="at-node__comment">{{ r.comment }}</text>
          <text class="at-node__time">{{ r.createdAt }}</text>
        </view>
      </component>
    </component>
  </view>
</template>

<script setup lang="ts">
import { useComponent } from '../../composables/useComponent'

export interface ApprovalRecord {
  id: string | number
  action: 'approve' | 'reject' | 'submit' | 'pending'
  operatorName: string
  operatorRole?: string
  comment?: string
  createdAt: string
}

defineProps<{ records: ApprovalRecord[] }>()

const { Timeline, TimelineItem } = useComponent(['Timeline', 'TimelineItem'])

const labelMap: Record<string,string> = { approve:'Approved', reject:'Rejected', submit:'Submitted', pending:'Pending' }
const colorMap: Record<string,string> = { approve:'#52c41a', reject:'#f5222d', submit:'#003466', pending:'#d9d9d9' }
</script>

<style lang="scss" scoped>
.at-node {
  padding: 2px 0 8px;
  &__top { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
  &__who { display:flex; align-items:center; }
  &__name { font-size:14px; font-weight:500; color:rgba(0,0,0,.85); }
  &__role { font-size:12px; color:rgba(0,0,0,.45); }
  &__badge { font-size:12px; padding:2px 8px; border-radius:10px; color:#fff;
    &--approve { background:#52c41a; }
    &--reject  { background:#f5222d; }
    &--submit  { background:#003466; }
    &--pending { background:#d9d9d9; color:rgba(0,0,0,.45); }
  }
  &__comment { display:block; font-size:13px; color:rgba(0,0,0,.65); margin-bottom:4px; }
  &__time    { display:block; font-size:11px; color:rgba(0,0,0,.35); }
}
</style>
