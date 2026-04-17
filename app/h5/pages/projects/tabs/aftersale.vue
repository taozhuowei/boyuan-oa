<template>
  <!-- 售后问题单 Tab — projects/tabs/aftersale.vue
       职责：售后问题单的创建、编辑、列表查看。
       数据来源：
         GET  /api/after-sale/types — 售后问题类型字典
         GET  /api/after-sale/tickets?projectId={id} — 问题单列表
         POST /api/after-sale/tickets — 创建问题单
         PUT  /api/after-sale/tickets/{id} — 更新问题单 -->
  <div>
    <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
      <a-button type="primary" @click="openTicketModal">+ 新建问题单</a-button>
      <a-button :loading="ticketsLoading" @click="loadTickets">刷新</a-button>
    </div>

    <a-table
      :columns="ticketColumns"
      :data-source="tickets"
      :loading="ticketsLoading"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'typeName'">{{ ticketTypeName(record.typeCode) }}</template>
        <template v-if="column.key === 'status'">
          <a-tag :color="record.status === 'CLOSED' ? 'green' : record.status === 'PROCESSING' ? 'blue' : 'orange'">
            {{ TICKET_STATUS_LABELS[record.status] ?? record.status }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button type="link" size="small" @click="openTicketEdit(record as AfterSaleTicket)">编辑</a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="showTicketModal"
      :title="editingTicketId ? '编辑问题单' : '新建问题单'"
      :confirm-loading="ticketSubmitting"
      @ok="submitTicket"
      @cancel="showTicketModal = false"
      width="600px"
    >
      <a-form layout="vertical" :model="ticketForm">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="问题类型" required>
              <a-select v-model:value="ticketForm.typeCode">
                <a-select-option v-for="t in ticketTypes" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="售后日期" required><a-input v-model:value="ticketForm.incidentDate" placeholder="YYYY-MM-DD" /></a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="问题描述" required><a-textarea v-model:value="ticketForm.description" :rows="3" /></a-form-item>
        <a-form-item label="客户反馈"><a-textarea v-model:value="ticketForm.customerFeedback" :rows="2" /></a-form-item>
        <a-form-item label="处理结果"><a-textarea v-model:value="ticketForm.resolution" :rows="2" /></a-form-item>
        <a-form-item label="状态">
          <a-select v-model:value="ticketForm.status">
            <a-select-option value="PENDING">待处理</a-select-option>
            <a-select-option value="PROCESSING">处理中</a-select-option>
            <a-select-option value="CLOSED">已关闭</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 售后问题单 Tab 子组件 — projects/tabs/aftersale.vue
 * 职责：问题单 CRUD（创建/编辑/列表）、问题类型字典缓存。
 * Props：project（父页面传入的项目详情）、projectId（项目 ID）
 */
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'
import { message } from 'ant-design-vue'
import type { ProjectDetail } from '../types'

// ── Props ──────────────────────────────────────────────
interface Props {
  project: ProjectDetail
  projectId: number
}
const props = defineProps<Props>()

// ── 常量 ───────────────────────────────────────────────
// 原因：Record<string, string> 断言用于 antd 模板 status map
const TICKET_STATUS_LABELS: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  CLOSED: '已关闭'
}

// ── 类型定义 ───────────────────────────────────────────
interface AfterSaleType  { code: string; name: string }
interface AfterSaleTicket {
  id: number
  projectId: number
  typeCode: string
  incidentDate: string
  description: string
  customerFeedback?: string
  resolution?: string
  status: string
}

// ── 问题类型字典 ────────────────────────────────────────
const ticketTypes = ref<AfterSaleType[]>([])

async function loadTicketTypes() {
  if (ticketTypes.value.length) return
  try {
    ticketTypes.value = await request<AfterSaleType[]>({ url: '/after-sale/types' }) ?? []
  } catch {
    ticketTypes.value = []
  }
}

function ticketTypeName(code: string) {
  return ticketTypes.value.find(t => t.code === code)?.name ?? code
}

// ── 问题单列表 ─────────────────────────────────────────
const tickets        = ref<AfterSaleTicket[]>([])
const ticketsLoading = ref(false)

const ticketColumns = [
  { title: '日期', dataIndex: 'incidentDate', key: 'incidentDate', width: 110 },
  { title: '类型', key: 'typeName', width: 130 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 80 }
]

async function loadTickets() {
  ticketsLoading.value = true
  try {
    tickets.value = await request<AfterSaleTicket[]>({ url: `/after-sale/tickets?projectId=${props.projectId}` }) ?? []
  } catch {
    tickets.value = []
  } finally {
    ticketsLoading.value = false
  }
}

// ── 创建/编辑问题单 ─────────────────────────────────────
const showTicketModal  = ref(false)
const ticketSubmitting = ref(false)
const editingTicketId  = ref<number | null>(null)
const ticketForm       = ref<{
  typeCode: string | undefined
  incidentDate: string
  description: string
  customerFeedback: string
  resolution: string
  status: string
}>({
  typeCode: undefined,
  incidentDate: new Date().toISOString().slice(0, 10),
  description: '',
  customerFeedback: '',
  resolution: '',
  status: 'PENDING'
})

function openTicketModal() {
  editingTicketId.value = null
  ticketForm.value = {
    typeCode: ticketTypes.value[0]?.code ?? undefined,
    incidentDate: new Date().toISOString().slice(0, 10),
    description: '',
    customerFeedback: '',
    resolution: '',
    status: 'PENDING'
  }
  showTicketModal.value = true
}

function openTicketEdit(record: AfterSaleTicket) {
  editingTicketId.value = record.id
  ticketForm.value = {
    typeCode:         record.typeCode,
    incidentDate:     record.incidentDate,
    description:      record.description,
    customerFeedback: record.customerFeedback ?? '',
    resolution:       record.resolution ?? '',
    status:           record.status
  }
  showTicketModal.value = true
}

async function submitTicket() {
  if (!ticketForm.value.typeCode || !ticketForm.value.incidentDate || !ticketForm.value.description) {
    message.warning('类型/日期/描述必填'); return
  }
  ticketSubmitting.value = true
  try {
    const body = { ...ticketForm.value, projectId: props.projectId }
    if (editingTicketId.value) {
      await request({ url: `/after-sale/tickets/${editingTicketId.value}`, method: 'PUT', body })
    } else {
      await request({ url: '/after-sale/tickets', method: 'POST', body })
    }
    message.success('已保存')
    showTicketModal.value = false
    await loadTickets()
  } catch {} finally { ticketSubmitting.value = false }
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadTicketTypes(), loadTickets()])
})
</script>
