<template>
  <div class="step-list">
    <div v-if="selectedCase" class="case-header">
      <div class="case-id-row">
        <span class="case-id">{{ selectedCase.id }}</span>
        <n-tag
          :type="selectedCase.priority === 'P0' ? 'error' : selectedCase.priority === 'P1' ? 'warning' : 'default'"
          size="small"
        >
          {{ selectedCase.priority }}
        </n-tag>
      </div>
      <h3 class="case-title">{{ selectedCase.title }}</h3>
      <span class="case-module">{{ selectedCase.module }}</span>
    </div>

    <n-scrollbar v-if="selectedCase && caseResult" class="steps-container">
      <div
        v-for="(step, index) in selectedCase.steps"
        :key="step.id"
        class="step-row"
        :class="getStepStatusClass(step.id)"
      >
        <span class="step-number">{{ index + 1 }}</span>

        <n-icon
          :class="getStepStatusClass(step.id)"
          :component="getStepIcon(step.id)"
          :size="16"
        />

        <span class="step-desc">{{ step.desc }}</span>

        <span v-if="getStepDuration(step.id) > 0" class="step-duration">
          {{ formatDuration(getStepDuration(step.id)) }}
        </span>

        <div v-if="getStepError(step.id)" class="error-details">
          <n-collapse>
            <n-collapse-item title="错误详情">
              <pre>{{ getStepError(step.id) }}</pre>
            </n-collapse-item>
          </n-collapse>
        </div>
      </div>
    </n-scrollbar>

    <div v-else class="empty-state">
      <n-empty :description="!selectedCase ? '选择用例查看步骤' : '暂无结果'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag, NScrollbar, NEmpty, NCollapse, NCollapseItem, NIcon } from 'naive-ui'
import {
  CheckmarkCircleOutline,
  CloseCircleOutline,
  RemoveCircleOutline,
  EllipseOutline
} from '@vicons/ionicons5'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore } from '../stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const selectedCase = computed(() => resultsStore.selectedCase)
const caseResult = computed(() => resultsStore.selectedCaseResult)

function getStepStatus(stepId: number): string {
  const stepResult = caseResult.value?.steps.find((s) => s.stepId === stepId)
  return stepResult?.status ?? 'pending'
}

function getStepStatusClass(stepId: number): string {
  const status = getStepStatus(stepId)
  if (runnerStore.currentStepId === stepId && runnerStore.isRunning) {
    return 'step-running'
  }
  return `step-${status}`
}

function getStepIcon(stepId: number) {
  const status = getStepStatus(stepId)
  if (runnerStore.currentStepId === stepId && runnerStore.isRunning) {
    return EllipseOutline
  }
  switch (status) {
    case 'pass':
      return CheckmarkCircleOutline
    case 'fail':
      return CloseCircleOutline
    case 'skip':
      return RemoveCircleOutline
    default:
      return EllipseOutline
  }
}

function getStepDuration(stepId: number): number {
  const stepResult = caseResult.value?.steps.find((s) => s.stepId === stepId)
  return stepResult?.durationMs ?? 0
}

function getStepError(stepId: number): string | undefined {
  const stepResult = caseResult.value?.steps.find((s) => s.stepId === stepId)
  return stepResult?.error
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  }
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<style scoped>
.step-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.case-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.case-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.case-id {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
  font-family: monospace;
}

.case-title {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
}

.case-module {
  font-size: 12px;
  color: #64748b;
}

.steps-container {
  flex: 1;
  padding: 8px;
}

.step-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin-bottom: 2px;
  border-radius: 4px;
  transition: background 0.15s;
}

.step-row:hover {
  background: #f8fafc;
}

.step-row.step-pass {
  border-left: 3px solid #22c55e;
}

.step-row.step-fail {
  border-left: 3px solid #ef4444;
}

.step-row.step-running {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.step-number {
  width: 20px;
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.step-desc {
  flex: 1;
  font-size: 13px;
  color: #475569;
}

.step-duration {
  padding: 2px 6px;
  font-size: 11px;
  color: #94a3b8;
  background: #f1f5f9;
  border-radius: 4px;
  font-family: monospace;
}

.step-pending {
  color: #94a3b8;
}

.step-pass {
  color: #22c55e;
}

.step-fail {
  color: #ef4444;
}

.step-skip {
  color: #94a3b8;
}

.step-running {
  color: #3b82f6;
}

.error-details {
  width: 100%;
  margin-top: 4px;
}

.error-details pre {
  margin: 0;
  padding: 8px 12px;
  font-size: 11px;
  color: #ef4444;
  background: #fef2f2;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
