<template>
  <!-- Todo center — lists all pending approval items for the current user -->
  <div class="todo-page">
    <h2 class="page-title">待办中心</h2>

    <a-alert
      v-if="approvalResult"
      data-catch="approval-result"
      :message="approvalResult"
      type="success"
      show-icon
      closable
      style="margin-bottom: 12px"
      @close="approvalResult = ''"
    />

    <a-card>
      <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane key="attendance">
          <template #tab>
            <span data-catch="todo-tab-approval">考勤审批</span>
          </template>
        </a-tab-pane>
        <a-tab-pane key="expense" tab="报销审批" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="filteredList"
        :loading="loading"
        :pagination="{ pageSize: 20, showTotal: (t: number) => `共 ${t} 条` }"
        row-key="id"
        size="small"
        :customRow="() => ({ 'data-catch': 'todo-item' }) as any"
      >
        <template #emptyText>
          <a-empty data-catch="todo-empty" description="暂无数据" />
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'submitTime'">
            {{ formatTime(record.submitTime) }}
          </template>
          <template v-if="column.key === 'summary'">
            {{ getSummary(record as FormRecord) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-button
              type="link"
              size="small"
              :data-catch="'todo-row-detail-btn-' + record.id"
              @click="viewApproval(record as FormRecord)"
            >
              查看审批
            </a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Approval detail modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="
        selectedRecord
          ? `审批 · ${selectedRecord.submitter} ${selectedRecord.formTypeName}`
          : '审批'
      "
      width="600px"
      :footer="null"
    >
      <div v-if="selectedRecord" class="approval-detail">
        <a-descriptions :column="2" size="small" bordered>
          <a-descriptions-item label="申请人">{{ selectedRecord.submitter }}</a-descriptions-item>
          <a-descriptions-item label="类型">{{ selectedRecord.formTypeName }}</a-descriptions-item>
          <a-descriptions-item label="提交时间">
            {{ formatTime(selectedRecord.submitTime) }}
          </a-descriptions-item>
          <a-descriptions-item label="状态">{{ selectedRecord.status }}</a-descriptions-item>
        </a-descriptions>

        <CustomizedApprovalTimeline :steps="approvalHistory" />

        <div class="modal-actions">
          <a-space>
            <a-input
              v-model:value="approvalComment"
              data-catch="approval-comment"
              placeholder="审批意见（选填）"
              style="width: 280px"
            />
            <a-button data-catch="approval-reject-btn" danger @click="handleReject">驳回</a-button>
            <a-button data-catch="approval-approve-btn" type="primary" @click="handleApprove">
              通过
            </a-button>
          </a-space>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import type { ApprovalStep } from '~/types/approval'
import { formatFormSummary } from '../../../shared/utils/formLabels'

interface FormRecord {
  id: number
  formType: string
  formTypeName: string
  submitter: string
  submitTime: string
  status: string
  formData?: Record<string, unknown>
}

const loading = ref(false)
const todoList = ref<FormRecord[]>([])
const activeTab = ref('all')
const modalVisible = ref(false)
const selectedRecord = ref<FormRecord | null>(null)
const approvalComment = ref('')
const approvalHistory = ref<ApprovalStep[]>([])
const approvalResult = ref('')

const columns = [
  { title: '类型', dataIndex: 'formTypeName', key: 'formTypeName', width: 100 },
  { title: '申请人', dataIndex: 'submitter', key: 'submitter', width: 100 },
  { title: '摘要', key: 'summary' },
  { title: '提交时间', key: 'submitTime', width: 160 },
  { title: '操作', key: 'action', width: 100 },
]

const ATTENDANCE_TYPES = ['LEAVE', 'OVERTIME', 'INJURY']
const EXPENSE_TYPES = ['EXPENSE']

const filteredList = computed(() => {
  if (activeTab.value === 'attendance') {
    return todoList.value.filter((r) => ATTENDANCE_TYPES.includes(r.formType))
  }
  if (activeTab.value === 'expense') {
    return todoList.value.filter((r) => EXPENSE_TYPES.includes(r.formType))
  }
  return todoList.value
})

function formatTime(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}

function getSummary(record: FormRecord): string {
  return formatFormSummary(record.formType, record.formData) || record.formTypeName
}

function onTabChange(key: string | number) {
  activeTab.value = String(key)
}

async function viewApproval(record: FormRecord) {
  selectedRecord.value = record
  approvalComment.value = ''
  approvalHistory.value = []
  approvalResult.value = ''
  modalVisible.value = true
  // Load approval history (best-effort; not blocking modal open)
  try {
    const detail = await request<{ history: ApprovalStep[] }>({ url: `/forms/${record.id}` })
    approvalHistory.value = detail?.history ?? []
  } catch {
    approvalHistory.value = []
  }
}

async function handleApprove() {
  if (!selectedRecord.value) return
  try {
    await request({
      url: `/forms/${selectedRecord.value.id}/approve`,
      method: 'POST',
      body: { action: 'APPROVE', comment: approvalComment.value },
    })
    approvalResult.value = '审批通过'
    modalVisible.value = false
    await loadTodo()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '操作失败'
    message.error(msg)
  }
}

async function handleReject() {
  if (!selectedRecord.value) return
  try {
    await request({
      url: `/forms/${selectedRecord.value.id}/reject`,
      method: 'POST',
      body: { action: 'REJECT', comment: approvalComment.value },
    })
    approvalResult.value = '已驳回'
    modalVisible.value = false
    await loadTodo()
  } catch (e: unknown) {
    const msg = (e as Error).message ?? '操作失败'
    message.error(msg)
  }
}

async function loadTodo() {
  loading.value = true
  try {
    const list = await request<FormRecord[]>({ url: '/forms/todo' })
    todoList.value = list ?? []
  } catch {
    todoList.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadTodo)
</script>

<style scoped>
.todo-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.approval-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
}

/* Removed flex constraints to allow natural content flow */
</style>
