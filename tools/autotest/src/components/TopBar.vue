<template>
  <header class="top-bar">
    <div class="project-meta">
      <div class="brand-block">
        <span class="brand-kicker">AutoTest</span>
        <strong>{{ runnerStore.projectName }}</strong>
      </div>
      <div class="path-block">
        <span class="path-label">CONFIG</span>
        <span class="path-value">{{ runnerStore.configPath || '未选择项目' }}</span>
      </div>
      <div class="path-block">
        <span class="path-label">ROOT</span>
        <span class="path-value">{{ runnerStore.projectRoot || '未选择项目' }}</span>
      </div>
    </div>

    <div class="status-block">
      <span class="state-pill" :class="runnerStore.status">{{ statusLabel }}</span>
      <span class="mode-pill" :class="runnerStore.mode">{{ modeLabel }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRunnerStore } from '../stores/runner'

const runnerStore = useRunnerStore()

const statusLabel = computed(() => {
  const labels = {
    idle: '空闲',
    preparing: '准备中',
    running: '执行中',
    waiting_confirm: '待确认',
    stopped: '已停止',
    done: '已完成',
  }

  return labels[runnerStore.status]
})

const modeLabel = computed(() => (runnerStore.mode === 'auto' ? '自动进入下一条' : '手动继续'))
</script>

<style scoped>
.top-bar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 16px;
  background: rgba(21, 24, 29, 0.95);
  border-bottom: 1px solid var(--line);
  backdrop-filter: blur(12px);
}

.project-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 18px;
}

.brand-block,
.path-block {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.brand-kicker,
.path-label {
  color: var(--text-3);
  font-size: 11px;
  letter-spacing: 0.12em;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.brand-block strong {
  font-size: 15px;
  font-weight: 700;
}

.path-value {
  min-width: 0;
  max-width: 360px;
  color: var(--text-2);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-block {
  display: flex;
  align-items: center;
  gap: 10px;
}

.state-pill,
.mode-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  font-size: 11px;
  white-space: nowrap;
}

.state-pill.idle,
.state-pill.stopped {
  color: var(--text-2);
}

.state-pill.preparing {
  color: var(--pending);
  border-color: rgba(255, 181, 71, 0.35);
}

.state-pill.running {
  color: var(--running);
  border-color: rgba(94, 184, 255, 0.35);
}

.state-pill.waiting_confirm {
  color: var(--pending);
  border-color: rgba(255, 181, 71, 0.35);
}

.state-pill.done {
  color: var(--pass);
  border-color: rgba(92, 230, 141, 0.35);
}

.mode-pill.auto {
  color: var(--brand);
}

.mode-pill.manual {
  color: var(--text-2);
}
</style>
