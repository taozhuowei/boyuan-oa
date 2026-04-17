<template>
  <div>
    <h2 class="page-title">数据导出</h2>
    <a-card title="新建导出任务" style="margin-bottom: 16px;">
      <a-form layout="inline">
        <a-form-item label="开始日期">
          <a-date-picker v-model:value="exportForm.startDate" placeholder="开始日期" />
        </a-form-item>
        <a-form-item label="结束日期">
          <a-date-picker v-model:value="exportForm.endDate" placeholder="结束日期" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" :loading="exporting" @click="startExport" data-catch="data-export-btn">
            开始导出
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
    <a-card title="导出历史">
      <a-spin :spinning="loading">
        <a-empty v-if="tasks.length === 0" description="暂无导出记录" />
        <a-list v-else :data-source="tasks" row-key="id">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta
                :title="'导出任务 #' + item.id"
                :description="item.createdAt?.slice(0, 16).replace('T', ' ')"
              />
              <a-space>
                <a-tag :color="item.status === 'DONE' ? 'green' : item.status === 'FAILED' ? 'red' : 'blue'">{{ item.status }}</a-tag>
                <a-button
                  v-if="item.status === 'DONE' && item.downloadToken"
                  type="link" size="small"
                  @click="downloadExport(item.downloadToken)"
                  data-catch="data-export-download-btn"
                >下载</a-button>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'

interface ExportTask {
  id: number
  status: string
  downloadToken: string | null
  createdAt: string
}

const loading = ref(false)
const exporting = ref(false)
const tasks = ref<ExportTask[]>([])
const exportForm = ref<{ startDate: Dayjs | undefined; endDate: Dayjs | undefined }>({
  startDate: undefined, endDate: undefined
})

async function loadTasks() {
  loading.value = true
  try {
    const list = await request<ExportTask[]>({ url: '/export-tasks' })
    tasks.value = list ?? []
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

async function startExport() {
  if (!exportForm.value.startDate || !exportForm.value.endDate) {
    message.warning('请选择导出时间范围')
    return
  }
  exporting.value = true
  try {
    await request({
      url: '/export-tasks',
      method: 'POST',
      body: {
        startDate: exportForm.value.startDate.format('YYYY-MM-DD'),
        endDate: exportForm.value.endDate.format('YYYY-MM-DD')
      }
    })
    message.success('导出任务已创建，请稍后刷新查看')
    exportForm.value = { startDate: undefined, endDate: undefined }
    await loadTasks()
  } catch {
    message.error('创建导出任务失败')
  } finally {
    exporting.value = false
  }
}

function downloadExport(token: string) {
  window.open('/api/retention/export/' + token + '/download', '_blank')
}

onMounted(loadTasks)
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}
</style>
