<template>
  <!--
    PayrollBonuses — 临时补贴/奖金管理面板
    职责：按周期查询补贴/奖金列表，录入新条目，删除条目
    数据来源：周期选项由父层传入；补贴/奖金列表由本组件自行拉取
  -->
  <div>
    <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
      <a-select
        :value="selectedBonusCycleId ?? undefined"
        placeholder="请选择工资周期"
        :options="cycleOptions"
        :loading="loadingCycles"
        style="width: 220px"
        @change="(v) => { selectedBonusCycleId = v as number; loadBonuses() }"
      />
      <a-button type="primary" size="small" :disabled="!selectedBonusCycleId || !isFinance" @click="openBonusModal">+ 录入</a-button>
      <a-tag v-if="bonusApprovalRequired" color="orange">需 CEO 审批</a-tag>
      <a-tag v-else color="green">直接生效（通知 CEO）</a-tag>
    </div>

    <a-table
      :columns="bonusColumns"
      :data-source="bonuses"
      :loading="loadingBonuses"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="record.type === 'EARNING' ? 'green' : 'red'">{{ record.type === 'EARNING' ? '补贴/奖金' : '扣款' }}</a-tag>
        </template>
        <template v-if="column.key === 'amount'">
          ¥{{ formatAmount(record.amount) }}
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="bonusStatusColor(record.status)">{{ bonusStatusLabel(record.status) }}</a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-popconfirm title="确定删除该条目？" @confirm="deleteBonus(record.id)">
            <a-button v-if="isFinance || role === 'ceo'" type="link" danger size="small">删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 录入 Modal -->
    <a-modal
      v-model:open="showBonusModal"
      title="录入临时补贴/奖金"
      :confirm-loading="creatingBonus"
      @ok="submitBonus"
      @cancel="showBonusModal = false"
      width="520px"
    >
      <a-form layout="vertical" :model="bonusForm">
        <a-form-item label="员工" required>
          <a-select
            v-model:value="bonusForm.employeeId"
            placeholder="选择员工"
            :options="employeeOptions"
            show-search
            option-filter-prop="label"
          />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input v-model:value="bonusForm.name" placeholder="如 春节奖金 / 罚款" />
        </a-form-item>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="类型" required>
              <a-select v-model:value="bonusForm.type">
                <a-select-option value="EARNING">补贴/奖金（加）</a-select-option>
                <a-select-option value="DEDUCTION">扣款（减）</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="金额" required>
              <a-input-number v-model:value="bonusForm.amount" :min="0.01" :precision="2" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="备注">
          <a-textarea v-model:value="bonusForm.remark" :rows="2" placeholder="可选" />
        </a-form-item>
        <a-alert
          v-if="bonusApprovalRequired"
          type="warning"
          show-icon
          message="本条目需经 CEO 审批通过后方可计入结算"
        />
        <a-alert
          v-else
          type="info"
          show-icon
          message="录入后立即生效；系统会通知 CEO 知晓"
        />
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * PayrollBonuses
 * 临时补贴/奖金管理面板：按周期查询、录入、删除
 * 周期选项和权限标志由父层传入；补贴列表和员工列表由本组件自行拉取
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

// ── 类型定义 ──────────────────────────────────────────────────

interface PayrollBonus {
  id: number
  cycleId: number
  employeeId: number
  name: string
  amount: number | string
  type: 'EARNING' | 'DEDUCTION'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  remark?: string
  formId?: number | null
  createdBy?: number
  createdAt?: string
}

interface EmployeeOption { id: number; name: string; employeeNo: string }

interface CycleOption {
  label: string
  value: number
}

// ── Props ─────────────────────────────────────────────────────
// cycleOptions: 父层从 cycles 列表映射的 { label, value } 选项
// loadingCycles: 父层加载周期时的 loading 状态
// isFinance: 当前用户是否为财务角色（控制录入按钮可用性和删除权限）
// role: 当前用户角色（CEO 也可删除）

const props = defineProps<{
  cycleOptions: CycleOption[]
  loadingCycles: boolean
  isFinance: boolean
  role: string
}>()

// ── 状态 ──────────────────────────────────────────────────────

const selectedBonusCycleId = ref<number | undefined>(undefined)
const bonuses = ref<PayrollBonus[]>([])
const loadingBonuses = ref(false)
const bonusApprovalRequired = ref(false)
const employeesForBonus = ref<EmployeeOption[]>([])
const employeeOptions = computed(() => employeesForBonus.value.map(e => ({
  value: e.id, label: `${e.name} (${e.employeeNo})`
})))
const showBonusModal = ref(false)
const creatingBonus = ref(false)
const bonusForm = ref<{
  employeeId: number | undefined
  name: string
  amount: number | undefined
  type: 'EARNING' | 'DEDUCTION'
  remark: string
}>({
  employeeId: undefined, name: '', amount: undefined, type: 'EARNING', remark: ''
})

// ── 表格列 ────────────────────────────────────────────────────

const bonusColumns = [
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId', width: 100 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', key: 'type', width: 110 },
  { title: '金额', key: 'amount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'action', width: 90 }
]

// ── 生命周期 ──────────────────────────────────────────────────

onMounted(() => {
  loadBonusApprovalConfig()
  loadEmployeesForBonus()
})

// ── 方法 ──────────────────────────────────────────────────────

async function loadBonusApprovalConfig() {
  try {
    const data = await request<{ approvalRequired: boolean }>({ url: '/payroll/bonus-approval-config' })
    bonusApprovalRequired.value = !!data.approvalRequired
  } catch {
    bonusApprovalRequired.value = false
  }
}

async function loadEmployeesForBonus() {
  try {
    const page = await request<{ content: EmployeeOption[] }>({ url: '/employees?size=500' })
    employeesForBonus.value = page?.content ?? []
  } catch {
    employeesForBonus.value = []
  }
}

async function loadBonuses() {
  if (!selectedBonusCycleId.value) { bonuses.value = []; return }
  loadingBonuses.value = true
  try {
    const data = await request<PayrollBonus[]>({ url: `/payroll/cycles/${selectedBonusCycleId.value}/bonuses` })
    bonuses.value = data ?? []
  } catch {
    bonuses.value = []
  } finally {
    loadingBonuses.value = false
  }
}

function openBonusModal() {
  bonusForm.value = { employeeId: undefined, name: '', amount: undefined, type: 'EARNING', remark: '' }
  showBonusModal.value = true
}

async function submitBonus() {
  if (!selectedBonusCycleId.value) { message.warning('请先选择周期'); return }
  if (!bonusForm.value.employeeId) { message.warning('请选择员工'); return }
  if (!bonusForm.value.name.trim()) { message.warning('请填写名称'); return }
  if (!bonusForm.value.amount || bonusForm.value.amount <= 0) { message.warning('金额必须为正数'); return }
  creatingBonus.value = true
  try {
    await request({
      url: `/payroll/cycles/${selectedBonusCycleId.value}/bonuses`,
      method: 'POST',
      body: bonusForm.value
    })
    message.success(bonusApprovalRequired.value ? '已提交，等待 CEO 审批' : '已录入并通知 CEO')
    showBonusModal.value = false
    await loadBonuses()
  } catch {
    // handled by request util
  } finally {
    creatingBonus.value = false
  }
}

async function deleteBonus(id: number) {
  try {
    await request({ url: `/payroll/bonuses/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadBonuses()
  } catch {
    // handled
  }
}

// ── 格式化工具 ─────────────────────────────────────────────────

function formatAmount(val: number | string | undefined): string {
  const n = Number(val ?? 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function bonusStatusLabel(s: string) {
  return ({ PENDING: '待审批', APPROVED: '已批准', REJECTED: '已驳回' } as Record<string, string>)[s] ?? s
}

function bonusStatusColor(s: string) {
  return ({ PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' } as Record<string, string>)[s] ?? 'default'
}
</script>
