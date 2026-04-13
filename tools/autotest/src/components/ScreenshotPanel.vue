<template>
  <div class="screenshot-panel">
    <div class="panel-header">
      <span class="panel-title">Screenshots</span>
      <span v-if="currentCaseId" class="case-tag">{{ currentCaseId }}</span>
    </div>
    <div v-if="currentScreenshot" class="screenshot-view">
      <img :src="screenshotSrc" />
    </div>
    <div v-else class="empty-state">No screenshots yet</div>
    <div v-if="stepScreenshots.length > 0" class="step-nav">
      <button
        v-for="s in stepScreenshots"
        :key="s.stepId"
        class="step-btn"
        :class="{ active: s.stepId === viewingStepId }"
        @click="viewStep(s.stepId)"
      >
        {{ s.stepId }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore } from '../stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const viewingStepId = ref<number | null>(null)

const currentCaseId = computed(() => runnerStore.activeCaseId || resultsStore.selectedCaseId || null)

const caseResult = computed(() => {
  if (!currentCaseId.value) return null
  return resultsStore.results.get(currentCaseId.value) ?? null
})

const stepScreenshots = computed(() => {
  if (!caseResult.value) return []
  return caseResult.value.steps.filter(s => s.screenshot).map(s => ({
    stepId: s.stepId,
    screenshot: s.screenshot!
  }))
})

const currentScreenshot = computed(() => {
  const viewing = stepScreenshots.value.find(s => s.stepId === viewingStepId.value)
  if (viewing) return viewing.screenshot
  if (stepScreenshots.value.length > 0) return stepScreenshots.value[stepScreenshots.value.length - 1].screenshot
  return null
})

const screenshotSrc = computed(() => currentScreenshot.value ? 'data:image/png;base64,' + currentScreenshot.value : '')

watch(() => runnerStore.activeStepId, (val) => {
  if (val !== null) viewingStepId.value = val
})

function viewStep(id: number) {
  viewingStepId.value = id
}
</script>

<style scoped>
.screenshot-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #16213e;
  border-bottom: 1px solid #0f3460;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.case-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: #0f3460;
  color: #3b82f6;
  border-radius: 4px;
  font-family: monospace;
}

.screenshot-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
}

.screenshot-view img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
}

.step-nav {
  display: flex;
  gap: 4px;
  padding: 8px 16px;
  background: #16213e;
  border-top: 1px solid #0f3460;
  flex-wrap: wrap;
}

.step-btn {
  width: 32px;
  height: 28px;
  font-size: 11px;
  background: #0f3460;
  color: #a0aec0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.step-btn:hover {
  background: #1a365d;
  color: #fff;
}

.step-btn.active {
  background: #3b82f6;
  color: #fff;
}
</style>
