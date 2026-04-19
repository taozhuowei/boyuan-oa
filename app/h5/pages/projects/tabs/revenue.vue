<template>
  <!-- 营收 Tab — projects/tabs/revenue.vue
       职责：按里程碑展示营收信息，CEO/finance 可编辑合同金额与收款状态。
       数据来源：
         GET /api/projects/{id}/revenue — 营收行列表
         GET /api/projects/{id}/revenue/summary — 营收汇总（合同合计/已收/待收）
         PUT /api/projects/{id}/revenue/{rowId} — 更新营收行 -->
  <div>
    <div style="margin-bottom: 12px; display: flex; gap: 16px; align-items: center">
      <a-statistic
        title="合同合计"
        :value="revenueSummary.contractTotal ?? 0"
        :precision="2"
        prefix="¥"
      />
      <a-statistic
        title="已收款"
        :value="revenueSummary.received ?? 0"
        :precision="2"
        prefix="¥"
        :value-style="{ color: '#52c41a' }"
      />
      <a-statistic
        title="待收款"
        :value="revenueSummary.pending ?? 0"
        :precision="2"
        prefix="¥"
        :value-style="{ color: '#fa8c16' }"
      />
      <a-button style="margin-left: auto" :loading="revenueLoading" @click="loadRevenue">
        刷新
      </a-button>
    </div>

    <a-table
      :columns="revenueColumns"
      :data-source="revenueRows"
      :loading="revenueLoading"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'completed'">
          <a-tag :color="record.actualCompletionDate ? 'green' : 'default'">
            {{ record.actualCompletionDate ?? '未完成' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'receiptStatus'">
          <a-tag :color="record.receiptStatus === 'RECEIVED' ? 'green' : 'orange'">
            {{ record.receiptStatus === 'RECEIVED' ? '已收款' : '待收款' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button
            v-if="canEditRevenue"
            type="link"
            size="small"
            @click="openRevenueEdit(record as RevenueRow)"
          >
            编辑
          </a-button>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="showRevenueModal"
      :title="`编辑里程碑 — ${editingRevenue?.name ?? ''}`"
      :confirm-loading="revenueSaving"
      @ok="saveRevenue"
      @cancel="showRevenueModal = false"
      width="540px"
    >
      <a-form layout="vertical" :model="revenueForm">
        <a-form-item label="合同金额（元）">
          <a-input-number
            v-model:value="revenueForm.contractAmount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="收款状态">
          <a-select v-model:value="revenueForm.receiptStatus">
            <a-select-option value="PENDING">待收款</a-select-option>
            <a-select-option value="RECEIVED">已收款</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="实际收款金额（元）">
          <a-input-number
            v-model:value="revenueForm.actualReceiptAmount"
            :precision="2"
            :min="0"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="收款日期">
          <a-input v-model:value="revenueForm.receiptDate" placeholder="YYYY-MM-DD" />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea v-model:value="revenueForm.receiptRemark" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 营收 Tab 子组件 — projects/tabs/revenue.vue
 * 职责：展示项目营收汇总与按里程碑明细，CEO/finance 可编辑收款信息。
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
const canEditRevenue = computed(() => ['ceo', 'finance'].includes(role.value))

// ── 类型定义 ───────────────────────────────────────────
interface RevenueRow {
  id: number
  name: string
  sort: number
  actualCompletionDate?: string | null
  contractAmount?: number | null
  receiptStatus?: string
  actualReceiptAmount?: number | null
  receiptDate?: string | null
  receiptRemark?: string | null
}

// ── 状态 ───────────────────────────────────────────────
const revenueRows = ref<RevenueRow[]>([])
const revenueLoading = ref(false)
const revenueSummary = ref<{ contractTotal?: number; received?: number; pending?: number }>({})
const showRevenueModal = ref(false)
const revenueSaving = ref(false)
const editingRevenue = ref<RevenueRow | null>(null)
const revenueForm = ref<{
  contractAmount: number | undefined
  receiptStatus: string
  actualReceiptAmount: number | undefined
  receiptDate: string
  receiptRemark: string
}>({
  contractAmount: undefined,
  receiptStatus: 'PENDING',
  actualReceiptAmount: undefined,
  receiptDate: '',
  receiptRemark: '',
})

const revenueColumns = [
  { title: '里程碑', dataIndex: 'name', key: 'name' },
  { title: '完成日期', key: 'completed', width: 130 },
  { title: '合同金额', dataIndex: 'contractAmount', key: 'contractAmount', width: 110 },
  { title: '收款状态', key: 'receiptStatus', width: 100 },
  { title: '实收', dataIndex: 'actualReceiptAmount', key: 'actualReceiptAmount', width: 110 },
  { title: '收款日期', dataIndex: 'receiptDate', key: 'receiptDate', width: 110 },
  { title: '操作', key: 'action', width: 80 },
]

async function loadRevenue() {
  revenueLoading.value = true
  try {
    const [list, sum] = await Promise.all([
      request<RevenueRow[]>({ url: `/projects/${props.projectId}/revenue` }),
      request<{ contractTotal: number; received: number; pending: number }>({
        url: `/projects/${props.projectId}/revenue/summary`,
      }),
    ])
    revenueRows.value = list ?? []
    revenueSummary.value = sum ?? {}
  } catch {
    revenueRows.value = []
    revenueSummary.value = {}
  } finally {
    revenueLoading.value = false
  }
}

function openRevenueEdit(record: RevenueRow) {
  editingRevenue.value = record
  revenueForm.value = {
    contractAmount: record.contractAmount ?? undefined,
    receiptStatus: record.receiptStatus ?? 'PENDING',
    actualReceiptAmount: record.actualReceiptAmount ?? undefined,
    receiptDate: record.receiptDate ?? '',
    receiptRemark: record.receiptRemark ?? '',
  }
  showRevenueModal.value = true
}

async function saveRevenue() {
  if (!editingRevenue.value) return
  revenueSaving.value = true
  try {
    await request({
      url: `/projects/${props.projectId}/revenue/${editingRevenue.value.id}`,
      method: 'PUT',
      body: revenueForm.value,
    })
    message.success('已保存')
    showRevenueModal.value = false
    await loadRevenue()
  } catch {
  } finally {
    revenueSaving.value = false
  }
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(loadRevenue)
</script>
