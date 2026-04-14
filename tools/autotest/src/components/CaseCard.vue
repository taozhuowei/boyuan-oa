<template>
  <article class="case-card" :class="[statusClass, { selected }]" @click="$emit('select', caseData.id)">
    <div class="card-top">
      <span class="case-id">{{ caseData.id }}</span>
      <n-tag size="small" round :type="priorityType">{{ caseData.priority }}</n-tag>
    </div>

    <div class="card-title">{{ caseData.title }}</div>
    <div class="card-desc" :class="{ expanded: selected }">{{ caseData.description }}</div>

    <div v-if="selected && status === 'waiting_confirm'" class="confirm-box" @click.stop>
      <n-input
        :value="confirmNote"
        size="small"
        placeholder="补充观察备注，便于生成失败报告"
        @update:value="(value) => $emit('update-note', value)"
      />
      <div class="confirm-actions">
        <n-button size="small" type="success" @click="$emit('confirm', 'pass')">通过</n-button>
        <n-button size="small" type="error" @click="$emit('confirm', 'fail')">不通过</n-button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NInput, NTag } from 'naive-ui'
import type { TestCase } from '../../runner/types'

const props = defineProps<{
  caseData: TestCase
  status: 'pending' | 'running' | 'pass' | 'fail' | 'skip' | 'waiting_confirm'
  selected: boolean
  confirmNote: string
}>()

defineEmits<{
  select: [caseId: string]
  confirm: [result: 'pass' | 'fail']
  'update-note': [value: string]
}>()

const statusClass = computed(() => `status-${props.status}`)
const priorityType = computed(() => {
  if (props.caseData.priority === 'P0') {
    return 'error'
  }
  if (props.caseData.priority === 'P1') {
    return 'warning'
  }
  return 'default'
})
</script>

<style scoped>
.case-card {
  padding: 12px;
  border-radius: 12px;
  border: 2px solid var(--line);
  background: linear-gradient(180deg, rgba(28, 32, 39, 0.88), rgba(21, 24, 29, 0.98));
  cursor: pointer;
  transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
}

.case-card:hover {
  transform: translateY(-1px);
}

.case-card.selected {
  background: linear-gradient(180deg, rgba(34, 40, 48, 0.96), rgba(21, 24, 29, 1));
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
}

.status-pending {
  border-color: var(--line);
}

.status-running {
  border-color: var(--running);
  animation: pulse 1.2s ease-in-out infinite;
}

.status-pass {
  border-color: var(--pass);
}

.status-fail {
  border-color: var(--fail);
}

.status-waiting_confirm {
  border-color: var(--pending);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.case-id {
  color: var(--text-2);
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  font-size: 11px;
}

.card-title {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
}

.card-desc {
  margin-top: 6px;
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc.expanded {
  white-space: pre-line;
}

.confirm-box {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 181, 71, 0.24);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confirm-actions {
  display: flex;
  gap: 8px;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(94, 184, 255, 0.18);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(94, 184, 255, 0);
  }
}
</style>
