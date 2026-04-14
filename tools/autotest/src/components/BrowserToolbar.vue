<template>
  <div class="browser-toolbar">
    <div class="button-group">
      <n-button text @click="goBack" :disabled="!runnerStore.browser.can_go_back">
        <template #icon>
          <n-icon><ArrowBackOutline /></n-icon>
        </template>
      </n-button>
      <n-button text @click="goForward" :disabled="!runnerStore.browser.can_go_forward">
        <template #icon>
          <n-icon><ArrowForwardOutline /></n-icon>
        </template>
      </n-button>
      <n-button text @click="reload">
        <template #icon>
          <n-icon><ReloadOutline /></n-icon>
        </template>
      </n-button>
      <n-button text @click="forceReload">
        <template #icon>
          <n-icon><RefreshCircleOutline /></n-icon>
        </template>
      </n-button>
    </div>

    <n-input
      v-model:value="url"
      class="url-input"
      clearable
      placeholder="输入地址后回车跳转"
      @keydown.enter="navigate"
    />

    <n-button text @click="toggleDevtools">
      <template #icon>
        <n-icon><CodeSlashOutline /></n-icon>
      </template>
    </n-button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NIcon, NInput } from 'naive-ui'
import {
  ArrowBackOutline,
  ArrowForwardOutline,
  ReloadOutline,
  RefreshCircleOutline,
  CodeSlashOutline,
} from '@vicons/ionicons5'
import { useRunnerStore } from '../stores/runner'

const runnerStore = useRunnerStore()
const url = ref('')

watch(
  () => runnerStore.browser.current_url,
  (value) => {
    url.value = value
  },
  { immediate: true }
)

const targetUrl = computed(() => url.value.trim())

async function navigate(): Promise<void> {
  if (!targetUrl.value) {
    return
  }
  await window.electronAPI.browserNavigate(targetUrl.value)
}

async function goBack(): Promise<void> {
  await window.electronAPI.browserBack()
}

async function goForward(): Promise<void> {
  await window.electronAPI.browserForward()
}

async function reload(): Promise<void> {
  await window.electronAPI.browserReload()
}

async function forceReload(): Promise<void> {
  await window.electronAPI.browserForceReload()
}

async function toggleDevtools(): Promise<void> {
  await window.electronAPI.devtoolsToggle()
}
</script>

<style scoped>
.browser-toolbar {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  background: rgba(21, 24, 29, 0.92);
  border-inline: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.button-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.url-input {
  flex: 1;
  font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;
}
</style>
