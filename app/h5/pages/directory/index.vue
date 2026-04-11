<template>
  <div class="directory-import-page">
    <h2 class="page-title">通讯录导入</h2>

    <a-card>
      <a-steps :current="currentStep" class="steps">
        <a-step title="上传数据" />
        <a-step title="预览确认" />
        <a-step title="导入完成" />
      </a-steps>

      <!-- Step 1: Upload -->
      <div v-if="currentStep === 0" class="step-content">
        <a-textarea
          v-model:value="csvInput"
          :rows="10"
          placeholder="在此粘贴 CSV 数据，每行一条，格式：姓名,手机号,部门&#10;示例：&#10;张三,13800138000,工程部&#10;李四,13900139000,财务部"
        />
        <div class="step-actions">
          <a-button type="primary" :loading="previewLoading" @click="handlePreview">
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="statistics">
          <a-card class="stat-card">
            <a-statistic title="共计" :value="previewData?.totalCount ?? 0" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="有效" :value="previewData?.validCount ?? 0" value-style="color: #52c41a" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="无效" :value="previewData?.invalidCount ?? 0" value-style="color: #ff4d4f" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="重复" :value="previewData?.duplicateCount ?? 0" value-style="color: #fa8c16" />
          </a-card>
        </div>

        <a-table
          :data-source="previewData?.items ?? []"
          :columns="columns"
          :row-selection="rowSelection"
          row-key="rowIndex"
          size="small"
          :pagination="false"
          :scroll="{ y: 400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ record.status }}
              </a-tag>
            </template>
          </template>
        </a-table>

        <div class="step-actions">
          <a-button @click="handleBack">上一步</a-button>
          <a-button type="primary" :loading="importLoading" @click="handleImport">
            确认导入
          </a-button>
        </div>
      </div>

      <!-- Step 3: Done -->
      <div v-if="currentStep === 2" class="step-content">
        <a-result status="success" title="导入成功" :sub-title="importMessage">
          <template #extra>
            <a-button type="primary" @click="handleReset">
              再次导入
            </a-button>
          </template>
        </a-result>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

interface DirectoryRecord {
  name: string
  phone: string
  department: string
}

interface PreviewItem {
  rowIndex: number
  name: string
  phone: string
  department: string
  status: 'VALID' | 'INVALID' | 'DUPLICATE'
  message: string
}

interface PreviewResponse {
  totalCount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
  items: PreviewItem[]
}

const currentStep = ref(0)
const csvInput = ref('')
const previewLoading = ref(false)
const importLoading = ref(false)
const previewData = ref<PreviewResponse | null>(null)
const selectedRowKeys = ref<number[]>([])
const importMessage = ref('')

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '状态', key: 'status', width: 80 },
  { title: '说明', dataIndex: 'message', key: 'message', ellipsis: true }
]

const rowSelection = computed(() => ({
  selectedRowKeys: selectedRowKeys.value,
  onChange: (keys: number[]) => {
    selectedRowKeys.value = keys
  },
  getCheckboxProps: (record: PreviewItem) => ({
    disabled: record.status === 'INVALID'
  })
}))

function getStatusColor(status: string): string {
  switch (status) {
    case 'VALID':
      return 'success'
    case 'INVALID':
      return 'error'
    case 'DUPLICATE':
      return 'warning'
    default:
      return 'default'
  }
}

function parseCsvInput(input: string): DirectoryRecord[] {
  const lines = input.split('\n')
  const records: DirectoryRecord[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(',')
    if (parts.length >= 3) {
      records.push({
        name: parts[0].trim(),
        phone: parts[1].trim(),
        department: parts[2].trim()
      })
    }
  }

  return records
}

async function handlePreview() {
  if (!csvInput.value.trim()) {
    message.warning('请输入 CSV 数据')
    return
  }

  const records = parseCsvInput(csvInput.value)
  if (records.length === 0) {
    message.warning('未找到有效数据，请检查输入格式')
    return
  }

  previewLoading.value = true
  try {
    const data = await request<PreviewResponse>({
      url: '/directory/import-preview',
      method: 'POST',
      body: { records }
    })
    previewData.value = data

    // Pre-select all VALID rows by default
    selectedRowKeys.value = data.items
      .filter(item => item.status === 'VALID')
      .map(item => item.rowIndex)

    currentStep.value = 1
  } catch {
    message.error('预览失败，请重试')
  } finally {
    previewLoading.value = false
  }
}

async function handleImport() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请至少选择一条记录进行导入')
    return
  }

  importLoading.value = true
  try {
    const result = await request<string>({
      url: '/directory/import-apply',
      method: 'POST',
      body: { selectedIndices: selectedRowKeys.value }
    })
    importMessage.value = result
    currentStep.value = 2
  } catch {
    message.error('导入失败，请重试')
  } finally {
    importLoading.value = false
  }
}

function handleBack() {
  currentStep.value = 0
  previewData.value = null
  selectedRowKeys.value = []
}

function handleReset() {
  currentStep.value = 0
  csvInput.value = ''
  previewData.value = null
  selectedRowKeys.value = []
  importMessage.value = ''
}
</script>

<style scoped>
.directory-import-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #003466;
}

.steps {
  margin-bottom: 24px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.stat-card {
  text-align: center;
}

.step-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
