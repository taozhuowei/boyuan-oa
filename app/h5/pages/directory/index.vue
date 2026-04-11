<template>
  <div class="directory-import-page">
    <h2 class="page-title">Directory Import</h2>

    <a-card>
      <a-steps :current="currentStep" class="steps">
        <a-step title="Upload" />
        <a-step title="Preview" />
        <a-step title="Done" />
      </a-steps>

      <!-- Step 1: Upload -->
      <div v-if="currentStep === 0" class="step-content">
        <a-textarea
          v-model:value="csvInput"
          :rows="10"
          placeholder="Paste CSV data here (one per line: name,phone,department)&#10;Example:&#10;John Doe,13800138000,Engineering&#10;Jane Smith,13900139000,HR"
        />
        <div class="step-actions">
          <a-button type="primary" :loading="previewLoading" @click="handlePreview">
            Next
          </a-button>
        </div>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="statistics">
          <a-card class="stat-card">
            <a-statistic title="Total" :value="previewData?.total ?? 0" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="Valid" :value="previewData?.valid ?? 0" value-style="color: #52c41a" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="Invalid" :value="previewData?.invalid ?? 0" value-style="color: #ff4d4f" />
          </a-card>
          <a-card class="stat-card">
            <a-statistic title="Duplicate" :value="previewData?.duplicate ?? 0" value-style="color: #fa8c16" />
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
          <a-button @click="handleBack">Back</a-button>
          <a-button type="primary" :loading="importLoading" @click="handleImport">
            Confirm Import
          </a-button>
        </div>
      </div>

      <!-- Step 3: Done -->
      <div v-if="currentStep === 2" class="step-content">
        <a-result status="success" title="Import Successful" :sub-title="importMessage">
          <template #extra>
            <a-button type="primary" @click="handleReset">
              Import Again
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
  total: number
  valid: number
  invalid: number
  duplicate: number
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
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Phone', dataIndex: 'phone', key: 'phone' },
  { title: 'Department', dataIndex: 'department', key: 'department' },
  { title: 'Status', key: 'status', width: 100 },
  { title: 'Message', dataIndex: 'message', key: 'message', ellipsis: true }
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
    message.warning('Please enter CSV data')
    return
  }

  const records = parseCsvInput(csvInput.value)
  if (records.length === 0) {
    message.warning('No valid records found. Please check your input format.')
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
    message.error('Failed to preview import data')
  } finally {
    previewLoading.value = false
  }
}

async function handleImport() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('Please select at least one record to import')
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
    message.error('Failed to import records')
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
