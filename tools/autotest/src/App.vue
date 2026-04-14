<!-- AutoTest root: 3-column + topbar layout (TopBar / DirectoryTree | Browser+DevTools | CaseList + ActionPanel) -->
<template>
  <div id="app">
    <TopBar />
    <div class="main-layout">
      <div class="left-col">
        <DirectoryTree />
      </div>

      <!-- Middle column is mostly covered by Electron BrowserView (managed from main process).
           We only render the top toolbar and a placeholder hint; the BrowserView overlays the rest. -->
      <div class="middle-col">
        <BrowserToolbar />
        <div class="browser-placeholder">
          <span>浏览器内嵌区域 · DevTools 嵌于底部</span>
        </div>
      </div>

      <div class="right-col">
        <div class="case-list-wrap">
          <CaseList @select="onCaseSelect" />
        </div>
        <ActionPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import TopBar from './components/TopBar.vue'
import DirectoryTree from './components/DirectoryTree.vue'
import BrowserToolbar from './components/BrowserToolbar.vue'
import CaseList from './components/CaseList.vue'
import ActionPanel from './components/ActionPanel.vue'
import { useRunnerStore } from './stores/runner'
import { useResultsStore } from './stores/results'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

function onCaseSelect(caseId: string) {
  resultsStore.selectCase(caseId)
}

onMounted(() => {
  runnerStore.setupElectronListeners()
})

onUnmounted(() => {
  runnerStore.cleanupElectronListeners()
})
</script>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-0);
  color: var(--text-1);
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.left-col {
  width: 260px;
  flex-shrink: 0;
}

.middle-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-0);
}

.browser-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-3);
  font-size: 12px;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
  background:
    linear-gradient(var(--bg-0), var(--bg-0)) padding-box,
    repeating-linear-gradient(45deg, var(--line) 0 1px, transparent 1px 14px) border-box;
}

.right-col {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.case-list-wrap {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}
</style>
