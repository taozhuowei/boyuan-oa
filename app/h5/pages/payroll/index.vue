<template>
  <!-- 薪资管理页面
       员工/劳工：查看本人工资条列表，点击查看明细，可确认或提出异议
       财务/CEO：周期管理（创建、开窗、预检、结算），查看全员工资条 -->
  <div class="payroll-page">
    <h2 class="page-title">薪资管理</h2>

    <!-- 财务 / CEO 视图 -->
    <template v-if="isFinanceOrCeo">
      <a-card>
        <a-tabs
          v-model:activeKey="activeTab"
          @change="(key: string | number) => onTabChange(String(key))"
        >
          <a-tab-pane key="cycles" tab="周期管理" />
          <a-tab-pane key="settle" tab="结算操作" />
          <a-tab-pane key="slips" tab="工资条查看" />
          <a-tab-pane key="bonuses" tab="临时补贴/奖金" />
          <a-tab-pane key="corrections" tab="更正记录" />
        </a-tabs>

        <!-- 周期管理 -->
        <template v-if="activeTab === 'cycles'">
          <PayrollCycles
            @select-for-settle="onSelectCycleForSettle"
            @cycles-updated="onCyclesUpdated"
          />
        </template>

        <!-- 结算操作 -->
        <template v-if="activeTab === 'settle'">
          <PayrollSettle
            :settleableCycles="settleableCycles"
            :loadingCycles="loadingCycles"
            :preselectedCycleId="preselectedCycleId"
            @settled="onSettled"
          />
        </template>

        <!-- 工资条查看（Finance/CEO 按周期查全员） -->
        <template v-if="activeTab === 'slips'">
          <PayrollSlips
            :cycleOptions="cycleOptions"
            :loadingCycles="loadingCycles"
            @open-slip-detail="openSlipDetail"
          />
        </template>

        <!-- 临时补贴/奖金管理 -->
        <template v-if="activeTab === 'bonuses'">
          <PayrollBonuses
            :cycleOptions="cycleOptions"
            :loadingCycles="loadingCycles"
            :isFinance="isFinance"
            :role="role"
          />
        </template>

        <!-- 薪资更正记录 -->
        <template v-if="activeTab === 'corrections'">
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center">
            <a-button :loading="loadingCorrections" @click="loadCorrections">刷新</a-button>
            <a-button
              v-if="isFinance"
              type="primary"
              data-catch="payroll-correction-open-btn"
              @click="showCorrectionModal = true; loadSlipsForCorrection()"
            >
              发起更正
            </a-button>
            <span style="color: #999; font-size: 12px">列表会自动应用 CEO 已审批通过的更正</span>
          </div>
          <a-table
            :columns="correctionColumns"
            :data-source="corrections"
            :loading="loadingCorrections"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag
                  data-catch="correction-pending-badge"
                  :color="bonusStatusColor(record.status)"
                >
                  {{ bonusStatusLabel(record.status) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'applied'">
                <a-tag :color="record.applied ? 'green' : 'default'">
                  {{ record.applied ? '已应用' : '未应用' }}
                </a-tag>
              </template>
              <template v-if="column.key === 'createdAt'">
                {{ formatTime(record.createdAt) }}
              </template>
            </template>
          </a-table>
        </template>
      </a-card>
    </template>

    <!-- 员工 / 劳工视图 -->
    <template v-else>
      <a-card>
        <div style="margin-bottom: 12px">
          <span style="margin-right: 8px; font-weight: 500">工资条</span>
          <a-button size="small" :loading="loadingSlips" @click="loadMySlips">刷新</a-button>
        </div>

        <a-list
          data-catch="payroll-my-slips-list"
          :data-source="slips"
          :loading="loadingSlips"
          :locale="{ emptyText: '暂无工资条' }"
        >
          <template #renderItem="{ item }">
            <a-list-item style="cursor: pointer" @click="openSlipDetail(item)">
              <a-list-item-meta>
                <template #title>
                  <span>{{ item.period ?? '工资条' }}</span>
                  <a-tag :color="slipStatusColor(item.status)" style="margin-left: 8px">
                    {{ slipStatusLabel(item.status) }}
                  </a-tag>
                </template>
                <template #description>实发 ¥{{ formatAmount(item.netPay) }}</template>
              </a-list-item-meta>
              <template #extra>
                <a-button type="link" size="small">查看详情</a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </template>

    <!-- 工资条详情（含 PIN / 签名绑定 / 更正 Modal，财务和员工共用） -->
    <PayrollSlipDetail
      v-model:open="showSlipDetail"
      :slip="activeSlip"
      :isFinanceOrCeo="isFinanceOrCeo"
      :isFinance="isFinance"
      @slip-action-done="loadMySlips"
    />

    <!-- 薪资更正申请弹窗 -->
    <a-modal
      v-if="isFinance"
      v-model:open="showCorrectionModal"
      title="发起薪资更正申请"
      :confirm-loading="submittingCorrection"
      @ok="submitCorrection"
      @cancel="showCorrectionModal = false; correctionForm = { slipId: undefined, reason: '' }"
    >
      <template #footer>
        <a-button
          @click="showCorrectionModal = false; correctionForm = { slipId: undefined, reason: '' }"
        >
          取消
        </a-button>
        <a-button
          type="primary"
          data-catch="correction-submit-btn"
          :loading="submittingCorrection"
          @click="submitCorrection"
        >
          提交更正
        </a-button>
      </template>
      <a-form layout="vertical">
        <a-form-item label="工资条" required>
          <a-select
            v-model:value="correctionForm.slipId"
            :options="
              availableSlips.map((s) => ({
                value: s.id,
                label: `ID:${s.id}${s.period ? ' (' + s.period + ')' : ''}`,
              }))
            "
            placeholder="选择需要更正的工资条"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="更正原因" required>
          <a-textarea
            v-model:value="correctionForm.reason"
            data-catch="correction-reason-input"
            :rows="4"
            placeholder="请说明更正原因"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 薪资管理页面（父层）
 * 职责：分角色展示薪资功能；持有共享 cycles 状态；协调子组件间的 Tab 跳转
 * - 财务/CEO：周期管理、结算操作、工资条查看、临时补贴/奖金（均由子组件承载）
 *             + 更正记录（内联，逻辑简单）
 * - 员工/劳工：工资条列表（内联）
 * - 共用：工资条详情 Modal 组（PayrollSlipDetail）
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { useRoute, useRouter } from 'vue-router'
import PayrollCycles from './components/PayrollCycles.vue'
import PayrollSettle from './components/PayrollSettle.vue'
import PayrollSlips from './components/PayrollSlips.vue'
import PayrollBonuses from './components/PayrollBonuses.vue'
import PayrollSlipDetail from './components/PayrollSlipDetail.vue'

// ── 类型定义 ──────────────────────────────────────────────────

interface PayrollCycle {
  id: number
  period: string
  status: string
  windowStatus?: string
  windowStartDate?: string
  windowEndDate?: string
  startDate?: string
  endDate?: string
  payDate?: string
}

interface PayrollSlip {
  id: number
  cycleId: number
  employeeId: number
  status: string
  netPay: number | string
  period?: string // 前端拼接用
}

interface PayrollCorrection {
  id: number
  cycleId: number
  employeeId: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  slipId: number
  formId: number | null
  newSlipId: number | null
  applied: boolean
  createdAt?: string
}

// ── 角色 ──────────────────────────────────────────────────────

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isFinanceOrCeo = computed(() => ['finance', 'ceo'].includes(role.value))
const isFinance = computed(() => role.value === 'finance')

const route = useRoute()
const router = useRouter()

// ── 共享 Tab 状态 ──────────────────────────────────────────────

const VALID_PAYROLL_TABS = ['cycles', 'settle', 'slips', 'bonuses', 'corrections'] as const
type PayrollTabKey = (typeof VALID_PAYROLL_TABS)[number]

const initial_tab = (() => {
  const q = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  return typeof q === 'string' && (VALID_PAYROLL_TABS as readonly string[]).includes(q)
    ? (q as PayrollTabKey)
    : 'cycles'
})()

const activeTab = ref<PayrollTabKey>(initial_tab)

// ── 共享 cycles 状态（PayrollSettle / PayrollSlips / PayrollBonuses 需要） ──

const cycles = ref<PayrollCycle[]>([])
const loadingCycles = ref(false)

const cycleOptions = computed(() => cycles.value.map((c) => ({ label: c.period, value: c.id })))

const settleableCycles = computed(() =>
  cycles.value
    .filter((c) => ['OPEN', 'WINDOW_OPEN', 'WINDOW_CLOSED'].includes(c.status))
    .map((c) => ({ label: `${c.period}（${cycleStatusLabel(c.status)}）`, value: c.id }))
)

// PayrollCycles 子组件每次加载完成后更新此处共享列表
function onCyclesUpdated(updated: PayrollCycle[]) {
  cycles.value = updated
}

// PayrollCycles 子组件点击"结算"时通知父层切换 Tab 并预填周期
const preselectedCycleId = ref<number | undefined>(undefined)

function onSelectCycleForSettle(cycleId: number) {
  preselectedCycleId.value = cycleId
  activeTab.value = 'settle'
  router.replace({ query: { ...route.query, tab: 'settle' } })
}

// PayrollSettle 子组件结算成功后通知父层
async function onSettled() {
  preselectedCycleId.value = undefined
  // 刷新共享 cycles 列表，供 settleableCycles / cycleOptions 更新
  loadingCycles.value = true
  try {
    const data = await request<PayrollCycle[]>({ url: '/payroll/cycles' })
    cycles.value = data
  } catch {
    message.error('加载周期列表失败')
  } finally {
    loadingCycles.value = false
  }
  activeTab.value = 'cycles'
}

// ── Tab 切换 ─────────────────────────────────────────────────

function onTabChange(key: string) {
  activeTab.value = key as PayrollTabKey
  if (key === 'corrections') loadCorrections()
  router.replace({ query: { ...route.query, tab: key } })
}

// ── 员工视图：工资条列表 ────────────────────────────────────────

const slips = ref<PayrollSlip[]>([])
const loadingSlips = ref(false)

async function loadMySlips() {
  loadingSlips.value = true
  try {
    const data = await request<PayrollSlip[]>({ url: '/payroll/slips' })
    slips.value = data
  } catch {
    message.error('加载工资条失败')
  } finally {
    loadingSlips.value = false
  }
}

// ── 工资条详情入口（财务 / 员工共用，打开 PayrollSlipDetail） ──────

const showSlipDetail = ref(false)
const activeSlip = ref<PayrollSlip | null>(null)

function openSlipDetail(slip: PayrollSlip) {
  activeSlip.value = slip
  showSlipDetail.value = true
}

// ── 薪资更正记录（内联，逻辑简单） ────────────────────────────────

const showCorrectionModal = ref(false)
const submittingCorrection = ref(false)
const correctionForm = ref({ slipId: undefined as number | undefined, reason: '' })
const availableSlips = ref<{ id: number; period?: string; employeeId: number }[]>([])

async function loadSlipsForCorrection() {
  try {
    const data = await request<{ id: number; period?: string; employeeId: number }[]>({
      url: '/payroll/slips',
    })
    availableSlips.value = data ?? []
    if (availableSlips.value.length > 0 && !correctionForm.value.slipId) {
      correctionForm.value.slipId = availableSlips.value[0].id
    }
  } catch {
    availableSlips.value = []
  }
}

async function submitCorrection() {
  if (!correctionForm.value.slipId || !correctionForm.value.reason.trim()) {
    message.warning('请填写更正原因')
    return
  }
  submittingCorrection.value = true
  try {
    await request({
      url: `/payroll/slips/${correctionForm.value.slipId}/correction`,
      method: 'POST',
      body: { reason: correctionForm.value.reason },
    })
    showCorrectionModal.value = false
    correctionForm.value = { slipId: undefined, reason: '' }
    await loadCorrections()
    message.success('更正申请已提交')
  } catch (e: unknown) {
    message.error((e as Error).message ?? '提交失败')
  } finally {
    submittingCorrection.value = false
  }
}

const corrections = ref<PayrollCorrection[]>([])
const loadingCorrections = ref(false)

const correctionColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
  { title: '原工资条', dataIndex: 'slipId', key: 'slipId', width: 100 },
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId', width: 100 },
  { title: '原因', dataIndex: 'reason', key: 'reason' },
  { title: '状态', key: 'status', width: 100 },
  { title: '是否应用', key: 'applied', width: 100 },
  { title: '新工资条', dataIndex: 'newSlipId', key: 'newSlipId', width: 100 },
  { title: '发起时间', key: 'createdAt', width: 160 },
]

async function loadCorrections() {
  loadingCorrections.value = true
  try {
    const data = await request<PayrollCorrection[]>({ url: '/payroll/corrections' })
    corrections.value = data ?? []
  } catch {
    corrections.value = []
  } finally {
    loadingCorrections.value = false
  }
}

// ── 生命周期 ──────────────────────────────────────────────────

onMounted(() => {
  // cycles 由 PayrollCycles 子组件自行加载，onCyclesUpdated 回填共享状态
  if (!isFinanceOrCeo.value) {
    loadMySlips()
  }
})

// ── 格式化工具 ─────────────────────────────────────────────────

function formatAmount(val: number | string | undefined): string {
  const n = Number(val ?? 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cycleStatusLabel(status: string): string {
  return (
    (
      {
        OPEN: '待处理',
        WINDOW_OPEN: '申报中',
        WINDOW_CLOSED: '窗口已关闭',
        SETTLED: '已结算',
        LOCKED: '已锁定',
      } as Record<string, string>
    )[status] ?? status
  )
}

function slipStatusLabel(status: string): string {
  return (
    (
      {
        DRAFT: '草稿',
        PUBLISHED: '待确认',
        CONFIRMED: '已确认',
        DISPUTED: '异议中',
        SUPERSEDED: '已更正',
      } as Record<string, string>
    )[status] ?? status
  )
}

function slipStatusColor(status: string): string {
  return (
    (
      {
        DRAFT: 'default',
        PUBLISHED: 'blue',
        CONFIRMED: 'green',
        DISPUTED: 'red',
        SUPERSEDED: 'default',
      } as Record<string, string>
    )[status] ?? 'default'
  )
}

function bonusStatusLabel(s: string) {
  return (
    ({ PENDING: '待审批', APPROVED: '已批准', REJECTED: '已驳回' } as Record<string, string>)[s] ??
    s
  )
}

function bonusStatusColor(s: string) {
  return (
    ({ PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' } as Record<string, string>)[s] ??
    'default'
  )
}

function formatTime(t: string | undefined) {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 16)
}
</script>

<style scoped>
.payroll-page {
  /* Flow layout: natural top-to-bottom content flow */
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}
</style>
