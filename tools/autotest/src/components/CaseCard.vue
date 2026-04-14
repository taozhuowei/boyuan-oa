<!-- CaseCard: single test case card with status border and expandable description -->
<template>
  <div
    class="case-card"
    :class="[statusClass, { selected }]"
    @click="$emit('click')"
  >
    <div class="top-row">
      <span class="case-id">{{ caseData.id }}</span>
      <n-tag :type="priorityType" size="small" round>{{ caseData.priority }}</n-tag>
    </div>
    <div class="title">{{ caseData.title }}</div>
    <div class="description" :class="{ expanded: selected }">
      {{ caseData.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NTag } from 'naive-ui'
import type { TestCase } from '../../runner/types'

type CaseStatusUI = 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'waiting_confirm'

const props = defineProps<{
  caseData: TestCase
  status: CaseStatusUI
  selected: boolean
}>()

defineEmits<{
  click: []
}>()

const statusClass = computed(() => `status-${props.status}`)

const priorityType = computed(() => {
  const map: Record<string, 'error' | 'warning' | 'default'> = {
    P0: 'error',
    P1: 'warning',
    P2: 'default',
  }
  return map[props.caseData.priority] ?? 'default'
})
</script>

<style scoped>
.case-card {
  padding: 10px 12px;
  background: var(--bg-2);
  border: 2px solid var(--line);
  border-radius: 6px;
  cursor: pointer;
  transition: border-width 200ms, border-color 200ms, background 150ms ease-out;
}

.case-card:hover {
  background: #232830;
}

.case-card.selected {
  border-width: 3px;
}

.case-card.status-pending {
  border-color: var(--line);
}

.case-card.status-pass {
  border-color: var(--pass);
}

.case-card.status-fail {
  border-color: var(--fail);
}

.case-card.status-skip {
  border-color: var(--text-3);
}

.case-card.status-waiting_confirm {
  border-color: var(--pending);
}

.case-card.status-running {
  border-color: var(--running);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(94, 184, 255, 0.25);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(94, 184, 255, 0);
  }
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.case-id {
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 12px;
  color: var(--text-2);
}

.title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 4px;
  line-height: 1.3;
}

.description {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description.expanded {
  white-space: pre-line;
  overflow: visible;
  text-overflow: clip;
}
</style>
