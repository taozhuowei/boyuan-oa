<template>
  <div class="control-bar">
    <div class="logo-section">
      <span class="logo-text">AutoTest</span>
    </div>

    <div class="controls-section">
      <n-space>
        <n-button
          type="primary"
          :disabled="!runnerStore.isIdle"
          @click="runAll"
        >
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          全部运行
        </n-button>
        <n-button
          :type="runnerStore.mode === 'case-confirm' ? 'primary' : 'default'"
          @click="toggleStepMode"
        >
          逐步模式
        </n-button>
        <n-button
          type="error"
          :disabled="runnerStore.isIdle"
          @click="stop"
        >
          <template #icon>
            <n-icon><StopOutline /></n-icon>
          </template>
          停止
        </n-button>
      </n-space>
    </div>

    <div class="status-section">
      <n-tag :type="runnerStore.mode === 'case-confirm' ? 'info' : 'success'">
        {{ runnerStore.mode === 'case-confirm' ? '逐步' : '自动' }}
      </n-tag>
      <n-button text @click="loadConfig">
        加载配置
      </n-button>
      <n-button text @click="exportReport" :disabled="!canExportReport">
        导出报告
      </n-button>
      <span class="project-name">{{ runnerStore.projectName }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NButton, NIcon, NSpace, NTag } from 'naive-ui'
import { PlayOutline, StopOutline } from '@vicons/ionicons5'
import { useRunnerStore } from '../stores/runner'
import { useResultsStore } from '../stores/results'
import type { AutotestConfig } from '../../runner/types'
import { computed } from 'vue'

const runnerStore = useRunnerStore()
const resultsStore = useResultsStore()

const canExportReport = computed(() => {
  return resultsStore.results.size > 0
})

async function runAll() {
  const config = runnerStore.config
  if (!config) {
    runnerStore.addLogEntry('error', '未加载配置，请先加载配置文件')
    return
  }

  try {
    if (!window.electronAPI) {
      runnerStore.addLogEntry('error', 'electronAPI 不可用，请在 Electron 桌面模式下运行')
      return
    }
    const result = await window.electronAPI.startRunner(config.cases_dir, config.base_url)
    if (result.success) {
      runnerStore.setStatus('running')
      runnerStore.addLogEntry('info', '运行器已启动')
      if (result.cdpEndpoint) {
        runnerStore.addLogEntry('info', `CDP endpoint: ${result.cdpEndpoint}`)
      }
    } else {
      runnerStore.addLogEntry('error', `启动失败: ${result.error}`)
    }
  } catch (error) {
    runnerStore.addLogEntry('error', `启动失败: ${error}`)
  }
}

function toggleStepMode() {
  runnerStore.toggleMode()
}

function stop() {
  runnerStore.stop()
}

async function loadConfig() {
  try {
    if (!window.electronAPI) {
      runnerStore.addLogEntry('error', 'electronAPI 不可用，请在 Electron 桌面模式下运行')
      return
    }
    const dialogResult = await window.electronAPI.openFileDialog()
    if (dialogResult.cancelled) return
    if (!dialogResult.success || !dialogResult.filePath) {
      throw new Error(dialogResult.error || 'Failed to open file dialog')
    }

    const loadResult = await window.electronAPI.loadConfig(dialogResult.filePath)
    if (!loadResult.success) {
      throw new Error(loadResult.error || 'Failed to load config')
    }
    const config = loadResult.config as AutotestConfig

    runnerStore.setConfig({
      name: config.name,
      base_url: config.base_url,
      cases_dir: (config as any)._casesDir || config.cases_dir,
    })

    const cases = loadResult.cases || []
    const testCases = cases.map((c: any) => ({
      id: c.id,
      title: c.title,
      module: c.module,
      priority: c.priority,
      tags: c.tags || [],
      steps: c.steps || [],
      expect: { result: 'pass' as const },
    }))
    resultsStore.setCases(testCases)

    runnerStore.addLogEntry('info', `已加载配置: ${config.name}，共 ${cases.length} 个用例`)
  } catch (error) {
    runnerStore.addLogEntry('error', `加载配置失败: ${error}`)
  }
}

async function exportReport() {
  try {
    // Generate HTML report
    const reportHtml = generateHTMLReport()
    
    if (typeof window !== 'undefined' && window.electronAPI) {
      const result = await window.electronAPI.saveReportDialog(reportHtml)
      if (result.success) {
        runnerStore.addLogEntry('info', `报告已保存: ${result.filePath}`)
      } else if (result.cancelled) {
        // User cancelled
      } else {
        throw new Error(result.error || 'Failed to save report')
      }
    } else {
      // Fallback: download in browser
      const blob = new Blob([reportHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'report.html'
      a.click()
      URL.revokeObjectURL(url)
      runnerStore.addLogEntry('info', '报告已下载')
    }
  } catch (error) {
    runnerStore.addLogEntry('error', `导出报告失败: ${error}`)
  }
}

function generateHTMLReport(): string {
  const stats = resultsStore.overallStats
  const modules = resultsStore.modules
  
  let casesHtml = ''
  for (const [moduleName, cases] of modules) {
    casesHtml += `
      <div class="module">
        <h2>${moduleName}</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>标题</th>
              <th>优先级</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            ${cases.map(c => `
              <tr class="status-${c.status}">
                <td>${c.id}</td>
                <td>${c.title}</td>
                <td>${c.priority}</td>
                <td>${getStatusText(c.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>测试报告 - ${runnerStore.projectName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 20px 0; }
    .stat-card { background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
    .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
    .module { margin-top: 30px; }
    .module h2 { color: #475569; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f1f5f9; font-weight: 600; }
    .status-pass { color: #22c55e; }
    .status-fail { color: #ef4444; }
    .status-skip { color: #94a3b8; }
    .status-pending { color: #64748b; }
    .timestamp { color: #94a3b8; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>测试报告 - ${runnerStore.projectName}</h1>
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">总计</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #22c55e;">${stats.pass}</div>
        <div class="stat-label">通过</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #ef4444;">${stats.fail}</div>
        <div class="stat-label">失败</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #94a3b8;">${stats.skip}</div>
        <div class="stat-label">跳过</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f59e0b;">${stats.waiting}</div>
        <div class="stat-label">待确认</div>
      </div>
    </div>
    ${casesHtml}
    <div class="timestamp">生成时间: ${new Date().toLocaleString()}</div>
  </div>
</body>
</html>
  `
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pass: '通过',
    fail: '失败',
    skip: '跳过',
    pending: '待测试',
    waiting_confirm: '待确认',
    running: '运行中'
  }
  return statusMap[status] || status
}
</script>

<style scoped>
.control-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #3b82f6;
  letter-spacing: 0.5px;
}

.controls-section {
  display: flex;
  align-items: center;
}

.status-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-name {
  font-size: 13px;
  color: #475569;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
