<template>
  <!-- 施工日志审批 Tab — projects/tabs/logs.vue
       职责：查看施工日志列表，PM/CEO 进行审批/驳回/追溯，查看材料汇总。
       数据来源：
         GET   /api/logs/records — 施工日志列表
         POST  /api/logs/{id}/approve — 审批通过
         POST  /api/logs/{id}/reject — 驳回
         PATCH /api/logs/construction-logs/{id}/review — 保存批注
         POST  /api/logs/construction-logs/{id}/recall — CEO 追溯驳回
         GET   /api/projects/{id}/construction-log/materials-summary — 材料汇总 -->
  <div>
    <a-spin :spinning="loadingLogs">
      <div style="margin-bottom: 12px; display: flex; gap: 8px">
        <a-button :loading="loadingLogs" @click="loadLogs">刷新</a-button>
        <a-button @click="openMaterialsSummary">材料汇总（本期）</a-button>
      </div>

      <a-empty v-if="logRecords.length === 0" description="暂无施工日志" />
      <a-list v-else :data-source="logRecords" :bordered="false">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-list-item-meta
              :title="`${item.submitterName} — ${item.formNo}`"
              :description="`提交于 ${item.createdAt?.slice(0, 16).replace('T', ' ')}`"
            />
            <a-tag
              :color="
                item.status === 'PENDING' ? 'orange' : item.status === 'APPROVED' ? 'green' : 'red'
              "
            >
              {{ LOG_STATUS_LABELS[item.status] ?? item.status }}
            </a-tag>
            <a-space style="margin-left: 8px">
              <a-button size="small" @click="openReviewModal(item)">批注</a-button>
              <template v-if="item.status === 'PENDING' || item.status === 'APPROVING'">
                <a-button
                  type="primary"
                  size="small"
                  :loading="approveLoading"
                  @click="doApproveLog(item.id)"
                >
                  通过
                </a-button>
                <a-button danger size="small" @click="openRejectLog(item)">驳回</a-button>
              </template>
              <a-popconfirm
                v-if="isCeo && item.status === 'APPROVED'"
                title="确认追溯驳回此施工日志？"
                @confirm="doRecallLog(item.id)"
              >
                <a-button size="small" danger>追溯驳回</a-button>
              </a-popconfirm>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
    </a-spin>

    <!-- 批注弹窗 -->
    <a-modal
      v-model:open="showReviewModal"
      title="批注"
      @ok="doReviewLog"
      :confirm-loading="approveLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="批注内容">
          <a-textarea
            v-model:value="reviewNote"
            :rows="4"
            placeholder="输入批注（不影响审批状态）"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 驳回弹窗 -->
    <a-modal
      v-model:open="showRejectLogModal"
      title="驳回施工日志"
      @ok="doRejectLog"
      :confirm-loading="approveLoading"
    >
      <a-form layout="vertical">
        <a-form-item label="驳回原因">
          <a-textarea v-model:value="rejectLogComment" :rows="3" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 材料汇总弹窗 -->
    <a-modal
      v-model:open="showMaterialsSummaryModal"
      title="材料用量汇总（本期）"
      :footer="null"
      width="760px"
    >
      <div v-if="!materialsSummary.materials?.length" style="color: #999">本期无材料记录</div>
      <a-table
        v-else
        :columns="materialsSummaryColumns"
        :data-source="materialsSummary.materials"
        :pagination="false"
        row-key="name"
        size="small"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key && String(column.key).startsWith('d_')">
            {{ record.byDate?.[String(column.key).substring(2)] ?? '—' }}
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 施工日志审批 Tab 子组件 — projects/tabs/logs.vue
 * 职责：施工日志列表展示、审批/驳回/追溯操作、批注、材料汇总查看。
 * Props：project（父页面传入的项目详情）、projectId（项目 ID）
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import type { ProjectDetail } from '../types'

// ── Props ──────────────────────────────────────────────
interface Props {
  project: ProjectDetail
  projectId: number
}
const props = defineProps<Props>()

// ── 权限 ──────────────────────────────────────────────
const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isCeo = computed(() => role.value === 'ceo')

// ── 常量 ───────────────────────────────────────────────
// 原因：Record<string, string> 断言用于 antd 模板 status map
const LOG_STATUS_LABELS: Record<string, string> = {
  PENDING: '待审批',
  APPROVING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  RECALLED: '已追溯',
}

// ── 类型定义 ───────────────────────────────────────────
interface LogRecord {
  id: number
  formNo: string
  submitterName: string
  status: string
  createdAt: string
}

interface MaterialsSummary {
  materials: Array<{ name: string; unit: string; total: number; byDate: Record<string, number> }>
  dates: string[]
}

// ── 施工日志列表 ────────────────────────────────────────
const loadingLogs = ref(false)
const logRecords = ref<LogRecord[]>([])

async function loadLogs() {
  loadingLogs.value = true
  try {
    const res = await request<LogRecord[]>({ url: '/logs/records', method: 'GET' })
    logRecords.value = (res as LogRecord[]).filter((r: LogRecord) => r.formNo?.startsWith('LOG'))
  } catch {
    message.error('加载施工日志失败')
  } finally {
    loadingLogs.value = false
  }
}

// ── 审批操作 ───────────────────────────────────────────
const approveLoading = ref(false)
const showReviewModal = ref(false)
const showRejectLogModal = ref(false)
const reviewNote = ref('')
const rejectLogComment = ref('')
const reviewingLogId = ref<number | null>(null)
const rejectingLogId = ref<number | null>(null)

function openReviewModal(item: LogRecord) {
  reviewingLogId.value = item.id
  reviewNote.value = ''
  showReviewModal.value = true
}

function openRejectLog(item: LogRecord) {
  rejectingLogId.value = item.id
  rejectLogComment.value = ''
  showRejectLogModal.value = true
}

async function doReviewLog() {
  if (!reviewingLogId.value) return
  try {
    await request({
      url: `/logs/construction-logs/${reviewingLogId.value}/review`,
      method: 'PATCH',
      body: { pmNote: reviewNote.value },
    })
    message.success('批注已保存')
    showReviewModal.value = false
  } catch {
    message.error('保存失败')
  }
}

async function doApproveLog(id: number) {
  approveLoading.value = true
  try {
    await request({ url: `/logs/${id}/approve`, method: 'POST', body: { comment: '' } })
    message.success('已通过')
    await loadLogs()
  } catch {
    message.error('操作失败')
  } finally {
    approveLoading.value = false
  }
}

async function doRejectLog() {
  if (!rejectingLogId.value) return
  approveLoading.value = true
  try {
    await request({
      url: `/logs/${rejectingLogId.value}/reject`,
      method: 'POST',
      body: { comment: rejectLogComment.value },
    })
    message.success('已驳回')
    showRejectLogModal.value = false
    await loadLogs()
  } catch {
    message.error('操作失败')
  } finally {
    approveLoading.value = false
  }
}

async function doRecallLog(id: number) {
  try {
    await request({ url: `/logs/construction-logs/${id}/recall`, method: 'POST' })
    message.success('已追溯驳回')
    await loadLogs()
  } catch {
    message.error('操作失败')
  }
}

// ── 材料汇总 ───────────────────────────────────────────
const showMaterialsSummaryModal = ref(false)
const materialsSummary = ref<MaterialsSummary>({ materials: [], dates: [] })

const materialsSummaryColumns = computed(() => {
  const cols: Array<Record<string, unknown>> = [
    { title: '材料', dataIndex: 'name', key: 'name', width: 150, fixed: 'left' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
    { title: '合计', dataIndex: 'total', key: 'total', width: 100 },
  ]
  for (const d of materialsSummary.value.dates ?? []) {
    cols.push({ title: d.slice(5), key: 'd_' + d, align: 'right' })
  }
  return cols
})

async function openMaterialsSummary() {
  showMaterialsSummaryModal.value = true
  try {
    materialsSummary.value = (await request<MaterialsSummary>({
      url: `/projects/${props.projectId}/construction-log/materials-summary`,
    })) ?? { materials: [], dates: [] }
  } catch {
    materialsSummary.value = { materials: [], dates: [] }
  }
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(loadLogs)
</script>
