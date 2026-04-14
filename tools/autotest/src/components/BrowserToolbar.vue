<!-- BrowserToolbar: 40px bar above browser area with navigation and devtools toggle -->
<template>
  <div class="browser-toolbar">
    <n-button text size="small" @click="goBack">
      <template #icon>
        <n-icon><ArrowBackOutline /></n-icon>
      </template>
    </n-button>
    <n-button text size="small" @click="goForward">
      <template #icon>
        <n-icon><ArrowForwardOutline /></n-icon>
      </template>
    </n-button>
    <n-button text size="small" @click="reload">
      <template #icon>
        <n-icon><ReloadOutline /></n-icon>
      </template>
    </n-button>
    <n-input
      v-model:value="url"
      size="small"
      class="url-input"
      placeholder="输入 URL 后回车跳转"
      @keydown.enter="navigate"
    />
    <div class="devtools-toggle">
      <span class="toggle-label">DevTools</span>
      <n-switch size="small" @update:value="toggleDevtools" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NIcon, NInput, NSwitch } from 'naive-ui'
import { ArrowBackOutline, ArrowForwardOutline, ReloadOutline } from '@vicons/ionicons5'

const url = ref('')

async function goBack() {
  if (window.electronAPI?.browserBack) {
    await window.electronAPI.browserBack()
  }
}

async function goForward() {
  if (window.electronAPI?.browserForward) {
    await window.electronAPI.browserForward()
  }
}

async function reload() {
  if (window.electronAPI?.browserReload) {
    await window.electronAPI.browserReload()
  }
}

async function navigate() {
  if (window.electronAPI?.browserNavigate && url.value) {
    await window.electronAPI.browserNavigate(url.value)
  }
}

async function toggleDevtools() {
  if (window.electronAPI?.devtoolsToggle) {
    await window.electronAPI.devtoolsToggle()
  }
}
</script>

<style scoped>
.browser-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 10px;
  background: var(--bg-1);
  border-bottom: 1px solid var(--line);
}

.url-input {
  flex: 1;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}

.devtools-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 8px;
  border-left: 1px solid var(--line);
}

.toggle-label {
  font-size: 11px;
  color: var(--text-2);
  white-space: nowrap;
}
</style>
