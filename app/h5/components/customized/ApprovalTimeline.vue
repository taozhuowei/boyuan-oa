<template>
  <!--
    ApprovalTimeline — 审批历史时间轴组件
    用途：展示单个表单记录的完整审批历史，按时间顺序排列。
    使用方：todo/index.vue 审批详情弹窗、attendance/index.vue 历史详情。
    数据来源：父组件从 GET /attendance/:id/history 或嵌套在表单详情 API 中获取。
  -->
  <div class="approval-timeline">
    <div class="timeline-header">审批历史</div>
    <a-divider style="margin: 8px 0" />
    <a-timeline v-if="steps.length > 0">
      <a-timeline-item
        v-for="(step, index) in steps"
        :key="index"
        :color="getColor(step.action)"
      >
        <div class="step-content">
          <span class="step-time">{{ formatTime(step.time) }}</span>
          <span class="step-operator">{{ step.operator }}</span>
          <a-tag :color="getTagColor(step.action)" class="step-action">{{ step.action }}</a-tag>
          <span v-if="step.comment" class="step-comment">{{ step.comment }}</span>
        </div>
      </a-timeline-item>
    </a-timeline>
    <a-empty v-else description="暂无审批记录" :image="simpleImage" />
  </div>
</template>

<script setup lang="ts">
/**
 * ApprovalTimeline — 审批历史时间轴
 * props:
 *   steps: ApprovalStep[] — 审批步骤数组，按时间正序排列
 */
import { Empty } from 'ant-design-vue'
import type { ApprovalStep } from '~/types/approval'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

defineProps<{
  steps: ApprovalStep[]
}>()

/** 操作类型 → 时间轴节点颜色 */
function getColor(action: string): string {
  if (action === '通过') return 'green'
  if (action === '驳回') return 'red'
  if (action === '提交' || action === '修改') return 'blue'
  return 'gray'
}

/** 操作类型 → Tag 颜色 */
function getTagColor(action: string): string {
  if (action === '通过') return 'success'
  if (action === '驳回') return 'error'
  if (action === '修改') return 'warning'
  return 'processing'
}

/** 格式化时间，精确到分钟 */
function formatTime(t: string | undefined): string {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.approval-timeline {
  padding: 4px 0;
}

.timeline-header {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}

.step-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-time {
  font-size: 12px;
  color: #8c8c8c;
  min-width: 120px;
}

.step-operator {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
}

.step-action {
  font-size: 12px;
}

.step-comment {
  font-size: 12px;
  color: #595959;
  font-style: italic;
}
</style>
