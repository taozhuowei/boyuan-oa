<template>
  <!-- 施工日志填报页（劳工专用）
       数据来源：POST /api/logs/construction-logs（提交）
                GET  /api/work-item-templates（加载模板）
                GET  /api/logs/records（查看历史） -->
  <div class="construction-log-page">
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 class="page-title" style="margin:0;">施工日志</h2>
      <a-button type="primary" @click="showSubmitModal = true">+ 填写日志</a-button>
    </div>

    <!-- 历史记录列表 -->
    <a-spin :spinning="loading">
      <a-card v-if="records.length === 0 && !loading">
        <a-empty description="暂无施工日志" />
      </a-card>
      <a-list v-else :data-source="records" :bordered="false">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="`${item.formTypeName} — ${item.formNo}`"
              :description="`提交于 ${formatTime(item.createdAt)}`"
            />
            <a-tag :color="statusColor(item.status)">{{ statusLabel(item.status) }}</a-tag>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <!-- 填写施工日志弹窗 -->
    <a-modal
      v-model:open="showSubmitModal"
      title="填写施工日志"
      width="680px"
      @ok="doSubmit"
      :confirm-loading="submitting"
      @cancel="resetForm"
      ok-text="提交"
    >
      <a-form :model="form" layout="vertical">
        <a-form-item label="日志日期" required>
          <a-date-picker v-model:value="form.logDate" style="width:100%;" placeholder="请选择日期" />
        </a-form-item>

        <!-- workItems 动态列表 -->
        <a-form-item label="工作项">
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <a-button size="small" @click="showTemplateModal = true">从模板填入</a-button>
            <a-button size="small" @click="addItem">+ 添加工作项</a-button>
          </div>
          <a-table
            :data-source="form.workItems"
            :columns="workItemColumns"
            :pagination="false"
            size="small"
            row-key="key"
          >
            <template #bodyCell="{ column, record: row, index }">
              <template v-if="column.key === 'name'">
                <a-input v-model:value="row.name" placeholder="工作项名称" />
              </template>
              <template v-if="column.key === 'quantity'">
                <a-input-number v-model:value="row.quantity" :min="0" style="width:100%;" />
              </template>
              <template v-if="column.key === 'unit'">
                <a-input v-model:value="row.unit" placeholder="单位" style="width:80px;" />
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" danger size="small" @click="removeItem(index)">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea v-model:value="form.remark" :rows="3" placeholder="情况说明（可选）" />
        </a-form-item>

        <a-form-item label="附件">
          <customized-file-upload
            ref="fileUploadRef"
            business-type="LOG"
            :max-count="5"
            accept="image/*,.pdf"
            hint="可上传照片或 PDF，最多 5 个，单个不超过 10MB"
            @change="onFilesChange"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 选择模板弹窗 -->
    <a-modal
      v-model:open="showTemplateModal"
      title="选择工作项模板"
      :footer="null"
    >
      <a-spin :spinning="templateLoading">
        <a-empty v-if="templates.length === 0" description="暂无模板" />
        <a-list v-else :data-source="templates" size="small">
          <template #renderItem="{ item: tmpl }">
            <a-list-item style="cursor:pointer;" @click="applyTemplate(tmpl)">
              <a-list-item-meta
                :title="tmpl.name"
                :description="`${(tmpl.items || []).length} 个工作项`"
              />
              <a-button type="link" size="small">使用</a-button>
            </a-list-item>
          </template>
        </a-list>
      </a-spin>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 施工日志填报页 — construction-log/index.vue
 * 劳工可提交施工日志（含动态 workItems 列表 + 附件）
 */
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import { message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'

interface WorkItem {
  key: string
  name: string
  quantity: number
  unit: string
}

interface Template {
  id: number
  name: string
  items: { name: string; defaultUnit: string }[]
}

interface LogRecord {
  id: number
  formNo: string
  formTypeName: string
  status: string
  createdAt: string
}

const loading = ref(false)
const submitting = ref(false)
const records = ref<LogRecord[]>([])
const templates = ref<Template[]>([])
const templateLoading = ref(false)

const showSubmitModal = ref(false)
const showTemplateModal = ref(false)
const fileUploadRef = ref<{ clear: () => void } | null>(null)

const form = ref({
  logDate: null as Dayjs | null,
  workItems: [] as WorkItem[],
  remark: '',
  attachmentIds: [] as number[]
})

const workItemColumns = [
  { title: '工作项名称', key: 'name', dataIndex: 'name' },
  { title: '数量', key: 'quantity', dataIndex: 'quantity', width: 100 },
  { title: '单位', key: 'unit', dataIndex: 'unit', width: 80 },
  { title: '操作', key: 'action', width: 70 }
]

function addItem() {
  form.value.workItems.push({ key: String(Date.now()), name: '', quantity: 1, unit: '天' })
}

function removeItem(index: number) {
  form.value.workItems.splice(index, 1)
}

function applyTemplate(tmpl: Template) {
  form.value.workItems = (tmpl.items || []).map(it => ({
    key: String(Date.now() + Math.random()),
    name: it.name,
    quantity: 1,
    unit: it.defaultUnit || '天'
  }))
  showTemplateModal.value = false
  message.success(`已填入模板「${tmpl.name}」的工作项`)
}

function onFilesChange(files: { attachmentId: number }[]) {
  form.value.attachmentIds = files.map(f => f.attachmentId)
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await request<LogRecord[]>({ url: '/logs/records', method: 'GET' })
    records.value = (res as LogRecord[]).filter((r: LogRecord) => r.formTypeName === '施工日志' || r.formNo?.startsWith('LOG'))
  } catch {
    message.error('加载记录失败')
  } finally {
    loading.value = false
  }
}

async function loadTemplates() {
  templateLoading.value = true
  try {
    templates.value = await request<Template[]>({ url: '/work-item-templates', method: 'GET' })
  } catch {
    // 模板加载失败不阻断主流程
  } finally {
    templateLoading.value = false
  }
}

async function doSubmit() {
  if (!form.value.logDate) {
    message.warning('请选择日志日期')
    return
  }
  submitting.value = true
  try {
    await request({
      url: '/logs/construction-logs',
      method: 'POST',
      body: {
        formData: {
          logDate: form.value.logDate.format('YYYY-MM-DD'),
          workItems: form.value.workItems,
          attachmentIds: form.value.attachmentIds
        },
        remark: form.value.remark
      }
    })
    message.success('施工日志已提交')
    showSubmitModal.value = false
    resetForm()
    await loadRecords()
  } catch {
    message.error('提交失败')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = { logDate: null, workItems: [], remark: '', attachmentIds: [] }
  fileUploadRef.value?.clear()
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '待审批', APPROVING: '审批中', APPROVED: '已通过',
    REJECTED: '已驳回', RECALLED: '已追溯'
  }
  return map[status] ?? status
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: 'orange', APPROVING: 'blue', APPROVED: 'green',
    REJECTED: 'red', RECALLED: 'default'
  }
  return map[status] ?? 'default'
}

function formatTime(t: string) {
  return t ? t.substring(0, 16).replace('T', ' ') : ''
}

onMounted(() => {
  loadRecords()
  loadTemplates()
})
</script>

<style scoped>
.construction-log-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}

/* Removed flex constraints to allow natural content flow */
</style>
