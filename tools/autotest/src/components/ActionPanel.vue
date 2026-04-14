<template>
  <section class="action-panel">
    <div class="panel-block">
      <span class="block-title">操作区</span>
      <div class="button-row">
        <n-button type="primary" @click="runnerStore.startOrContinue()">
          {{ runnerStore.status === 'waiting_confirm' ? '继续测试' : '开始测试' }}
        </n-button>
        <n-button @click="runnerStore.stop()">停止</n-button>
        <n-button @click="runnerStore.reset()">重置</n-button>
      </div>
    </div>

    <div class="panel-block">
      <span class="block-title">配置区</span>
      <n-checkbox :checked="runnerStore.mode === 'auto'" @update:checked="toggleAuto">
        自动测试
      </n-checkbox>
      <p class="config-tip">
        是：人工确认当前用例后自动进入下一条。否：人工确认后，需要手动点击“继续测试”。
      </p>
    </div>

    <div class="panel-block report-block">
      <span class="block-title">报告输出</span>
      <span class="report-path">{{ runnerStore.latestReportPaths?.json || '测试结束后生成 JSON / HTML / Markdown 报告' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { NButton, NCheckbox } from 'naive-ui'
import { useRunnerStore } from '../stores/runner'

const runnerStore = useRunnerStore()

function toggleAuto(checked: boolean): void {
  runnerStore.setMode(checked ? 'auto' : 'manual')
}
</script>

<style scoped>
.action-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border-top: 1px solid var(--line);
  border-left: 1px solid var(--line);
  background: rgba(21, 24, 29, 0.98);
}

.panel-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-title {
  color: var(--text-3);
  font-size: 11px;
  letter-spacing: 0.12em;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.button-row {
  display: flex;
  gap: 8px;
}

.config-tip,
.report-path {
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.5;
}

.report-block {
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.report-path {
  word-break: break-all;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
</style>
