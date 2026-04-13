<template>
  <div class="case-tree">
    <div class="search-bar">
      <n-input
        v-model:value="searchQuery"
        placeholder="按ID或标题筛选..."
        clearable
        size="small"
      >
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
    </div>

    <n-scrollbar>
      <div v-for="[moduleName, moduleCases] in filteredModules" :key="moduleName" class="module-group">
        <div class="module-header" @click="toggleModule(moduleName)">
          <span>{{ expandedModules.has(moduleName) ? '▼' : '▶' }} {{ moduleName }}</span>
          <span class="module-stats">
            <span class="stat-pass">{{ getModulePassCount(moduleName) }}</span>
            <span class="stat-separator">/</span>
            <span class="stat-total">{{ moduleCases.length }}</span>
          </span>
        </div>
        <div v-show="expandedModules.has(moduleName)" class="module-cases">
          <div
            v-for="testCase in moduleCases"
            :key="testCase.id"
            class="case-item"
            :class="{ active: selectedCaseId === testCase.id }"
            @click="selectCase(testCase.id)"
          >
            <n-icon
              :class="getStatusClass(testCase)"
              :component="getStatusIcon(testCase)"
              :size="16"
            />
            <n-tag
              :type="testCase.priority === 'P0' ? 'error' : testCase.priority === 'P1' ? 'warning' : 'default'"
              size="small"
            >
              {{ testCase.priority }}
            </n-tag>
            <span class="case-title">{{ testCase.title }}</span>
            <span class="case-id">{{ testCase.id }}</span>
          </div>
        </div>
      </div>

      <n-empty v-if="filteredModules.size === 0" description="未找到用例" />
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NIcon, NTag, NScrollbar, NEmpty } from 'naive-ui'
import {
  SearchOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  RemoveCircleOutline,
  EllipseOutline
} from '@vicons/ionicons5'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore, type CaseWithStatus } from '../stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const searchQuery = ref('')
const expandedModules = ref<Set<string>>(new Set())

const selectedCaseId = computed(() => resultsStore.selectedCaseId)

const filteredModules = computed(() => {
  const filter = searchQuery.value.toLowerCase().trim()
  const filtered = new Map<string, CaseWithStatus[]>()

  for (const [moduleName, cases] of resultsStore.modules) {
    const filteredCases = filter
      ? cases.filter(
          (c) =>
            c.id.toLowerCase().includes(filter) ||
            c.title.toLowerCase().includes(filter)
        )
      : cases

    if (filteredCases.length > 0) {
      filtered.set(moduleName, filteredCases)
    }
  }

  return filtered
})

function toggleModule(moduleName: string) {
  if (expandedModules.value.has(moduleName)) {
    expandedModules.value.delete(moduleName)
  } else {
    expandedModules.value.add(moduleName)
  }
}

function selectCase(caseId: string) {
  resultsStore.selectCase(caseId)
}

function getCaseStatus(caseId: string) {
  return resultsStore.getCaseStatus(caseId)
}

function getStatusClass(testCase: CaseWithStatus): string {
  const status = testCase.status
  if (runnerStore.currentCaseId === testCase.id && runnerStore.isRunning) {
    return 'status-running'
  }
  return `status-${status}`
}

function getStatusIcon(testCase: CaseWithStatus) {
  const status = getCaseStatus(testCase.id)
  if (runnerStore.currentCaseId === testCase.id && runnerStore.isRunning) {
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

function getModulePassCount(moduleName: string): number {
  const stats = resultsStore.moduleStats.get(moduleName)
  return stats?.pass ?? 0
}
</script>

<style scoped>
.case-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.module-group {
  margin-bottom: 4px;
}

.module-header {
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  color: #475569;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.module-header:hover {
  background: #f1f5f9;
}

.module-stats {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
}

.stat-pass {
  color: #22c55e;
}

.stat-separator {
  color: #94a3b8;
}

.stat-total {
  color: #64748b;
}

.module-cases {
  padding-left: 8px;
}

.case-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.case-item:hover {
  background: #f1f5f9;
}

.case-item.active {
  background: #eff6ff;
  border-left: 2px solid #3b82f6;
}

.case-title {
  flex: 1;
  font-size: 13px;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.case-id {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}

.status-pending {
  color: #94a3b8;
}

.status-pass {
  color: #22c55e;
}

.status-fail {
  color: #ef4444;
}

.status-skip {
  color: #94a3b8;
}

.status-running {
  color: #3b82f6;
  animation: pulse 1s ease-in-out infinite;
}

.status-waiting_confirm {
  color: #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
