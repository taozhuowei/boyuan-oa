<!-- TopBar: 40px header with project name, config path, state pill, and mode toggle -->
<template>
  <div class="top-bar">
    <div class="left">
      <span class="project-name">{{ projectName || 'AutoTest' }}</span>
      <span v-if="configPath" class="config-path">{{ configPath }}</span>
    </div>
    <div class="right">
      <span class="state-pill" :class="status">{{ statusLabel }}</span>
      <n-button
        size="small"
        :type="mode === 'full-auto' ? 'primary' : 'default'"
        @click="toggleMode"
      >
        {{ mode === 'full-auto' ? '全自动' : '单步确认' }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton } from 'naive-ui'
import { useRunnerStore, type RunnerMode, type RunnerStatus } from '../stores/runner'
import { computed } from 'vue'

const runnerStore = useRunnerStore()

const projectName = computed(() => runnerStore.projectName)
const configPath = computed(() => runnerStore.config?.cases_dir ?? '')
const status = computed<RunnerStatus>(() => runnerStore.status)
const mode = computed<RunnerMode>(() => runnerStore.mode)

const statusLabel = computed(() => {
  const map: Record<RunnerStatus, string> = {
    idle: '空闲',
    running: '运行中',
    paused: '已暂停',
    done: '已完成',
  }
  return map[status.value]
})

function toggleMode() {
  runnerStore.toggleMode()
}
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-1);
  border-bottom: 1px solid var(--line);
}

.left {
  display: flex;
  align-items: center;
  gap: 12px;
  overflow: hidden;
}

.project-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
}

.config-path {
  font-size: 12px;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  color: var(--text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.state-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  background: var(--bg-2);
  color: var(--text-2);
  transition: background 150ms ease-out, color 150ms ease-out;
}

.state-pill.idle {
  background: var(--bg-2);
  color: var(--text-2);
}

.state-pill.running {
  background: rgba(94, 184, 255, 0.15);
  color: var(--running);
}

.state-pill.paused {
  background: rgba(255, 181, 71, 0.15);
  color: var(--pending);
}

.state-pill.done {
  background: rgba(92, 230, 141, 0.15);
  color: var(--pass);
}
</style>
