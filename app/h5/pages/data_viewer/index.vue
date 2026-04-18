<template>
  <div>
    <h2 class="page-title">历史数据查看</h2>
    <a-card style="margin-bottom: 16px;">
      <p style="color: #888; margin-bottom: 12px;">上传从「数据导出」页面下载的 .obk 文件，查看其中的历史数据。</p>
      <input type="file" accept=".obk" style="display:none" ref="fileInput" @change="onFileChange" />
      <a-button @click="() => fileInput?.click()" data-catch="data-viewer-upload-btn">选择文件</a-button>
      <span v-if="fileName" style="margin-left: 12px; color: #555;">{{ fileName }}</span>
    </a-card>
    <template v-if="viewData">
      <a-card v-for="(rows, tableName) in viewData" :key="tableName" :title="String(tableName)" style="margin-bottom: 12px;">
        <a-table
          v-if="Array.isArray(rows) && rows.length > 0"
          :data-source="rows as Record<string, unknown>[]"
          :columns="getColumns(rows as Record<string, unknown>[])"
          :pagination="{ pageSize: 10 }"
          size="small"
        />
        <a-empty v-else description="暂无数据" />
      </a-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from 'ant-design-vue'

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const viewData = ref<Record<string, unknown[]> | null>(null)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  fileName.value = file.name
  const reader = new FileReader()

  if (file.name.endsWith('.obk')) {
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (data && typeof data === 'object') {
          viewData.value = data as Record<string, unknown[]>
        } else {
          message.error('文件格式不正确')
        }
      } catch {
        message.error('.obk 文件解析失败，请确认文件来自「数据导出」功能')
      }
    }
    reader.readAsText(file)
  } else {
    message.warning('请上传 .obk 格式文件（由「数据导出」页面生成）')
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function getColumns(rows: Record<string, unknown>[]) {
  const first = rows[0] || {}
  return Object.keys(first).map((key) => ({
    title: key,
    dataIndex: key,
    key,
    ellipsis: true
  }))
}
</script>

<style scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}
</style>
