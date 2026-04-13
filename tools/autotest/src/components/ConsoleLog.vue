<template>
  <div class="console-log">
    <div class="console-header">
      <span class="console-title">执行日志</span>
      <n-button text size="tiny" @click="clearLog">
        清除
      </n-button>
    </div>

    <n-scrollbar ref="logContainer" class="log-container">
      <div
        v-for="(entry, index) in runnerStore.log"
        :key="index"
        class="log-entry"
      >
        <span class="log-timestamp">{{ formatTime(entry.timestamp) }}</span>
        <n-tag :type="getLogLevelType(entry.level)" size="tiny">
          {{ entry.level.toUpperCase() }}
        </n-tag>
        <span class="log-message">{{ entry.message }}</span>
      </div>

      <n-empty v-if="runnerStore.log.length === 0" description="暂无日志" />
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { NScrollbar, NButton, NTag, NEmpty } from 'naive-ui'
import { useRunnerStore } from '../stores/runner'

const runnerStore = useRunnerStore()
const logContainer = ref<InstanceType<typeof NScrollbar> | null>(null)

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

function getLogLevelType(level: string): 'info' | 'warning' | 'error' | 'default' {
  switch (level) {
    case 'info':
      return 'info'
    case 'warn':
      return 'warning'
    case 'error':
      return 'error'
    default:
      return 'default'
  }
}

function clearLog() {
  runnerStore.clearLog()
}

function scrollToBottom() {
  if (logContainer.value) {
    logContainer.value.scrollTo({ top: 999999, behavior: 'smooth' })
  }
}

watch(
  () => runnerStore.log.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<style scoped>
.console-log {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.console-title {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.log-container {
  flex: 1;
  padding: 8px;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 3px 8px;
  font-size: 12px;
}

.log-timestamp {
  flex-shrink: 0;
  color: #94a3b8;
  font-family: monospace;
}

.log-message {
  flex: 1;
  color: #475569;
  word-break: break-all;
}
</style>
