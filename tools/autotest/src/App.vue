<template>
  <n-message-provider>
    <div id="app">
      <TopBar />
      <div class="main-layout">
        <aside class="left-column">
          <DirectoryTree />
        </aside>

        <main class="center-column">
          <BrowserToolbar />
          <div class="browser-stage">
            <div class="browser-overlay">
              <div class="hint-card">
                <span class="hint-label">LIVE PREVIEW</span>
                <strong>{{ runnerStore.projectName }}</strong>
                <span>{{ runnerStore.browser.current_url || '选择项目后自动启动并加载预览' }}</span>
              </div>
            </div>
          </div>
        </main>

        <aside class="right-column">
          <CaseList />
          <ActionPanel />
        </aside>
      </div>
    </div>
  </n-message-provider>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { NMessageProvider } from 'naive-ui'
import TopBar from './components/TopBar.vue'
import DirectoryTree from './components/DirectoryTree.vue'
import BrowserToolbar from './components/BrowserToolbar.vue'
import CaseList from './components/CaseList.vue'
import ActionPanel from './components/ActionPanel.vue'
import { useRunnerStore } from './stores/runner'

const runnerStore = useRunnerStore()

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
  background:
    radial-gradient(circle at top left, rgba(94, 184, 255, 0.12), transparent 24%),
    linear-gradient(180deg, rgba(28, 32, 39, 0.75), rgba(11, 13, 16, 1) 32%);
}

.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 380px;
  min-height: 0;
}

.left-column,
.right-column {
  min-height: 0;
}

.center-column {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.browser-stage {
  flex: 1;
  position: relative;
  min-height: 0;
  border-inline: 1px solid var(--line);
  background:
    linear-gradient(180deg, rgba(21, 24, 29, 0.72), rgba(11, 13, 16, 0.3)),
    repeating-linear-gradient(135deg, rgba(36, 40, 48, 0.25) 0 10px, transparent 10px 24px);
}

.browser-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 18px;
}

.hint-card {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
  padding: 14px 16px;
  border: 1px solid rgba(94, 184, 255, 0.18);
  border-radius: 14px;
  background: rgba(11, 13, 16, 0.72);
  backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.24);
}

.hint-label {
  color: var(--brand);
  font-size: 11px;
  letter-spacing: 0.14em;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.hint-card strong {
  font-size: 15px;
}

.hint-card span:last-child {
  color: var(--text-2);
  font-size: 12px;
  word-break: break-all;
}
</style>
