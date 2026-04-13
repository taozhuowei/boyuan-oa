<template>
  <div id="app">
    <ControlBar />
    <div class="main-layout">
      <div class="left-panel">
        <CaseTree />
      </div>
      <div class="right-panel">
        <div class="step-section">
          <StepList />
        </div>
        <div class="console-section">
          <ConsoleLog />
        </div>
      </div>
    </div>
    <ConfirmBar v-if="runnerStore.isPaused" class="confirm-bar" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import ControlBar from './components/ControlBar.vue'
import CaseTree from './components/CaseTree.vue'
import StepList from './components/StepList.vue'
import ConfirmBar from './components/ConfirmBar.vue'
import ConsoleLog from './components/ConsoleLog.vue'
import { useRunnerStore } from './stores/runner'

const runnerStore = useRunnerStore()

onMounted(() => {
  // Setup Electron IPC listeners
  runnerStore.setupElectronListeners()
  
  // Try to launch preview if Tauri API is available (legacy)
  if (typeof window !== 'undefined' && (window as any).__TAURI__) {
    import('@tauri-apps/api/core').then(({ invoke }) => {
      invoke('launch_preview').catch(() => {})
    })
  }
})

onUnmounted(() => {
  runnerStore.cleanupElectronListeners()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>

<style scoped>
#app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow: hidden;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-section {
  flex: 1;
  overflow: hidden;
  background: #ffffff;
}

.console-section {
  height: 180px;
  flex-shrink: 0;
  background: #1e1e1e;
  border-top: 1px solid #333;
}

.confirm-bar {
  position: fixed;
  bottom: 200px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  padding: 16px 24px;
}
</style>
