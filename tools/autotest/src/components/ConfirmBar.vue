<template>
  <div v-if="runnerStore.isPaused && currentCase" class="confirm-bar">
    <div class="confirm-content">
      <div class="confirm-message">
        <span class="confirm-label">用例 {{ currentCase.id }} 已完成，请确认结果</span>
      </div>

      <n-input
        v-model:value="note"
        type="textarea"
        placeholder="添加备注..."
        :rows="2"
      />

      <n-space justify="center">
        <n-button type="success" @click="confirm('pass')">
          通过
        </n-button>
        <n-button type="error" @click="confirm('fail')">
          失败
        </n-button>
        <n-button @click="confirm('skip')">
          跳过
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NSpace, NInput } from 'naive-ui'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore } from '../stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const note = ref('')

const currentCase = computed(() => {
  const caseId = runnerStore.currentCaseId
  if (!caseId) return null
  return resultsStore.cases.find((c) => c.id === caseId) ?? null
})

function confirm(result: 'pass' | 'fail' | 'skip') {
  const caseId = runnerStore.currentCaseId
  if (!caseId) return

  resultsStore.confirmCase(caseId, result, note.value.trim() || undefined)
  note.value = ''
  runnerStore.resume()
}
</script>

<style scoped>
.confirm-bar {
  padding: 16px;
  background: #f8fafc;
  border-top: 2px solid #3b82f6;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 600px;
  margin: 0 auto;
}

.confirm-message {
  text-align: center;
}

.confirm-label {
  font-size: 14px;
  color: #1e293b;
}
</style>
