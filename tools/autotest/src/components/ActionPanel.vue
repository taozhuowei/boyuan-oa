<!-- ActionPanel: bottom fixed panel for mode toggle, run controls, and human confirmation -->
<template>
  <div class="action-panel">
    <div class="row">
      <n-button
        size="small"
        :type="runnerStore.mode === 'full-auto' ? 'primary' : 'default'"
        @click="runnerStore.toggleMode"
      >
        {{ runnerStore.mode === 'full-auto' ? '全自动' : '单步' }}
      </n-button>
    </div>
    <div class="row">
      <n-button type="primary" size="small" @click="runNext">
        <template #icon>
          <n-icon><PlayOutline /></n-icon>
        </template>
        执行下一个
      </n-button>
      <n-button size="small" @click="pause">
        <template #icon>
          <n-icon><PauseOutline /></n-icon>
        </template>
        暂停
      </n-button>
      <n-button type="error" size="small" @click="stop">
        <template #icon>
          <n-icon><StopOutline /></n-icon>
        </template>
        停止
      </n-button>
    </div>
    <div v-if="runnerStore.isPaused && selectedCaseId" class="row confirm-row">
      <n-button type="success" size="small" @click="confirm('pass')">
        <template #icon>
          <n-icon><CheckmarkOutline /></n-icon>
        </template>
        通过
      </n-button>
      <n-button type="error" size="small" @click="confirm('fail')">
        <template #icon>
          <n-icon><CloseOutline /></n-icon>
        </template>
        失败
      </n-button>
      <n-button size="small" @click="confirm('skip')">
        <template #icon>
          <n-icon><ArrowRedoOutline /></n-icon>
        </template>
        跳过
      </n-button>
      <n-input
        v-model:value="note"
        size="small"
        placeholder="备注"
        class="note-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NIcon, NInput } from 'naive-ui'
import { PlayOutline, PauseOutline, StopOutline, CheckmarkOutline, CloseOutline, ArrowRedoOutline } from '@vicons/ionicons5'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore } from '../stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const note = ref('')

const selectedCaseId = computed(() => resultsStore.selectedCaseId)

function runNext() {
  runnerStore.sendControl({ type: 'next-step' })
  runnerStore.setStatus('running')
}

function pause() {
  runnerStore.setStatus('paused')
}

function stop() {
  runnerStore.stop()
}

function confirm(result: 'pass' | 'fail' | 'skip') {
  const caseId = selectedCaseId.value
  if (!caseId) return
  resultsStore.confirmCase(caseId, result, note.value)
  runnerStore.sendControl({ type: 'confirm', caseId, result, note: note.value })
  note.value = ''
  runnerStore.setStatus('running')
}
</script>

<style scoped>
.action-panel {
  width: 320px;
  height: 140px;
  padding: 10px;
  background: var(--bg-1);
  border-left: 1px solid var(--line);
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.confirm-row {
  padding-top: 6px;
  border-top: 1px solid var(--line);
}

.note-input {
  flex: 1;
}
</style>
