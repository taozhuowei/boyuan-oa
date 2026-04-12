<template>
  <!-- 薪资管理页面
       员工/劳工：查看本人工资条列表，点击查看明细，可确认或提出异议
       财务/CEO：周期管理（创建、开窗、预检、结算），查看全员工资条 -->
  <div class="payroll-page">
    <h2 class="page-title">薪资管理</h2>

    <!-- 财务 / CEO 视图 -->
    <template v-if="isFinanceOrCeo">
      <a-card>
        <a-tabs v-model:activeKey="activeTab" @change="(key: string | number) => onTabChange(String(key))">
          <a-tab-pane key="cycles" tab="周期管理" />
          <a-tab-pane key="settle" tab="结算操作" />
          <a-tab-pane key="slips" tab="工资条查看" />
        </a-tabs>

        <!-- 周期管理 -->
        <template v-if="activeTab === 'cycles'">
          <div class="tab-actions" style="margin-bottom: 12px;">
            <a-button type="primary" @click="showCreateCycleModal = true">+ 创建周期</a-button>
            <a-button style="margin-left: 8px;" @click="loadCycles" :loading="loadingCycles">刷新</a-button>
          </div>
          <a-table
            :columns="cycleColumns"
            :data-source="cycles"
            :loading="loadingCycles"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="cycleStatusColor(record.status)">{{ cycleStatusLabel(record.status) }}</a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button
                  v-if="record.status === 'OPEN'"
                  type="link"
                  size="small"
                  @click="doOpenWindow(record.id as number)"
                >开放申报窗口</a-button>
                <a-button
                  v-if="['OPEN','WINDOW_OPEN','WINDOW_CLOSED'].includes(record.status as string)"
                  type="link"
                  size="small"
                  @click="selectCycleForSettle(record as unknown as PayrollCycle)"
                >结算</a-button>
              </template>
            </template>
          </a-table>
        </template>

        <!-- 结算操作 -->
        <template v-if="activeTab === 'settle'">
          <div style="max-width: 480px; margin-top: 8px;">
            <a-form layout="vertical">
              <a-form-item label="选择周期">
                <a-select
                  :value="selectedCycleId ?? undefined"
                  placeholder="请选择工资周期"
                  :options="settleableCycles"
                  :loading="loadingCycles"
                  @change="(v) => { selectedCycleId = v as number; precheckResult = null }"
                />
              </a-form-item>
            </a-form>

            <a-space>
              <a-button
                :disabled="!selectedCycleId"
                :loading="precheckLoading"
                @click="doPrecheck"
              >预结算检查</a-button>
              <a-button
                type="primary"
                :disabled="!selectedCycleId || !precheckPassed"
                :loading="settleLoading"
                @click="doSettle"
              >正式结算</a-button>
            </a-space>

            <template v-if="precheckResult !== null">
              <a-divider />
              <a-alert
                :type="precheckPassed ? 'success' : 'warning'"
                :message="precheckPassed ? '所有检查项通过，可执行结算' : '存在未通过检查项'"
                show-icon
                style="margin-bottom: 12px;"
              />
              <a-list size="small" :data-source="precheckResult">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-space>
                      <span :style="{ color: item.pass ? '#52c41a' : '#ff4d4f' }">
                        {{ item.pass ? '✓' : '✗' }}
                      </span>
                      <span>{{ item.label }}</span>
                      <span v-if="!item.pass" style="color: #ff4d4f; font-size: 12px;">{{ item.message }}</span>
                    </a-space>
                  </a-list-item>
                </template>
              </a-list>
            </template>
          </div>
        </template>

        <!-- 工资条查看（Finance/CEO 按周期查全员） -->
        <template v-if="activeTab === 'slips'">
          <div style="margin-bottom: 12px;">
            <a-select
              :value="selectedCycleIdForSlips ?? undefined"
              placeholder="请选择工资周期"
              :options="cycleOptions"
              :loading="loadingCycles"
              style="width: 200px; margin-right: 8px;"
              @change="(v) => { selectedCycleIdForSlips = v as number; loadSlipsByCycle() }"
            />
            <a-button :loading="loadingSlips" @click="loadSlipsByCycle" :disabled="!selectedCycleIdForSlips">查询</a-button>
          </div>
          <a-table
            :columns="financeSlipColumns"
            :data-source="slips"
            :loading="loadingSlips"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="slipStatusColor(record.status)">{{ slipStatusLabel(record.status) }}</a-tag>
              </template>
              <template v-if="column.key === 'netPay'">
                ¥{{ formatAmount(record.netPay) }}
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openSlipDetail(record as unknown as PayrollSlip)">详情</a-button>
              </template>
            </template>
          </a-table>
        </template>
      </a-card>
    </template>

    <!-- 员工 / 劳工视图 -->
    <template v-else>
      <a-card>
        <div style="margin-bottom: 12px;">
          <span style="margin-right: 8px; font-weight: 500;">工资条</span>
          <a-button size="small" :loading="loadingSlips" @click="loadMySlips">刷新</a-button>
        </div>

        <a-list
          :data-source="slips"
          :loading="loadingSlips"
          :locale="{ emptyText: '暂无工资条' }"
        >
          <template #renderItem="{ item }">
            <a-list-item style="cursor: pointer;" @click="openSlipDetail(item)">
              <a-list-item-meta>
                <template #title>
                  <span>{{ item.period ?? '工资条' }}</span>
                  <a-tag :color="slipStatusColor(item.status)" style="margin-left: 8px;">
                    {{ slipStatusLabel(item.status) }}
                  </a-tag>
                </template>
                <template #description>
                  实发 ¥{{ formatAmount(item.netPay) }}
                </template>
              </a-list-item-meta>
              <template #extra>
                <a-button type="link" size="small">查看详情</a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </template>

    <!-- 创建周期 Modal -->
    <a-modal
      v-model:open="showCreateCycleModal"
      title="创建工资周期"
      :confirm-loading="creatingCycle"
      @ok="doCreateCycle"
      @cancel="createCycleForm.period = ''"
    >
      <a-form layout="vertical">
        <a-form-item label="周期（格式：YYYY-MM）">
          <a-input v-model:value="createCycleForm.period" placeholder="例：2026-04" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- PIN 输入 Modal -->
    <a-modal
      v-model:open="showPinModal"
      title="请输入 PIN 码确认"
      :confirm-loading="confirmingSlip"
      @ok="submitPinConfirm"
      @cancel="closePinModal"
    >
      <a-form layout="vertical">
        <a-form-item
          label="PIN 码"
          :validate-status="pinError ? 'error' : ''"
          :help="pinError"
        >
          <a-input
            v-model:value="pinInput"
            type="password"
            placeholder="请输入您的 PIN 码"
            maxlength="6"
            @press-enter="submitPinConfirm"
          />
        </a-form-item>
      </a-form>
      <p class="pin-hint">
        首次确认工资条需要先
        <a @click="goToSignatureBind">绑定签名</a>
      </p>
    </a-modal>

    <!-- 签名绑定提示 Modal -->
    <a-modal
      v-model:open="showBindPromptModal"
      title="需要绑定签名"
      :footer="null"
    >
      <a-result status="warning" title="您尚未绑定签名">
        <template #subtitle>
          <p>确认工资条需要先绑定手写签名并设置 PIN 码</p>
        </template>
        <template #extra>
          <a-button type="primary" @click="goToSignatureBind">去绑定签名</a-button>
          <a-button @click="showBindPromptModal = false">稍后再说</a-button>
        </template>
      </a-result>
    </a-modal>

    <!-- 工资条详情 Modal -->
    <a-modal
      v-model:open="showSlipDetail"
      :title="`工资条详情`"
      :footer="null"
      width="560px"
    >
      <template v-if="slipDetail">
        <a-descriptions bordered size="small" :column="1" style="margin-bottom: 12px;">
          <a-descriptions-item label="周期">{{ slipDetail.slip.cycleId }}</a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="slipStatusColor(slipDetail.slip.status)">
              {{ slipStatusLabel(slipDetail.slip.status) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="实发合计">
            <strong>¥{{ formatAmount(slipDetail.slip.netPay) }}</strong>
          </a-descriptions-item>
        </a-descriptions>

        <!-- 明细列表 -->
        <a-divider style="margin: 8px 0;" />
        <div v-for="item in slipDetail.items" :key="item.id" class="slip-item-row">
          <span class="slip-item-name">{{ item.name }}</span>
          <span
            class="slip-item-amount"
            :style="{ color: Number(item.amount) < 0 ? '#ff4d4f' : '#333' }"
          >
            {{ Number(item.amount) > 0 ? '+' : '' }}¥{{ formatAmount(item.amount) }}
          </span>
        </div>
        <a-divider style="margin: 8px 0;" />
        <div class="slip-item-row slip-total">
          <span>实发合计</span>
          <strong>¥{{ formatAmount(slipDetail.slip.netPay) }}</strong>
        </div>

        <!-- 员工操作按钮（仅 PUBLISHED 状态，且为自己的工资条） -->
        <template v-if="!isFinanceOrCeo && slipDetail.slip.status === 'PUBLISHED'">
          <a-divider style="margin: 12px 0;" />
          <a-space style="width: 100%; justify-content: center;">
            <a-button type="primary" :loading="confirmingSlip" @click="doConfirm">确认收到</a-button>
            <a-button danger :loading="disputingSlip" @click="showDisputeInput = !showDisputeInput">提出异议</a-button>
          </a-space>
          <template v-if="showDisputeInput">
            <a-textarea
              v-model:value="disputeReason"
              placeholder="请说明异议原因"
              :rows="3"
              style="margin-top: 8px;"
            />
            <a-button
              type="primary"
              danger
              block
              style="margin-top: 8px;"
              :disabled="!disputeReason.trim()"
              :loading="disputingSlip"
              @click="doDispute"
            >提交异议</a-button>
          </template>
        </template>
      </template>
      <a-spin v-else :spinning="loadingSlipDetail" tip="加载中..." />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 薪资管理页面
 * 职责：分角色展示薪资功能
 * - 财务/CEO：创建周期、开放申报窗口、预结算检查、正式结算、查看全员工资条
 * - 员工/劳工：查看本人工资条列表与详情，支持确认与异议
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

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
  period?: string  // 前端拼接用
}

interface SlipItem {
  id: number
  itemDefId: number
  name: string
  type: string
  amount: number | string
  remark: string
}

interface SlipDetail {
  slip: PayrollSlip
  items: SlipItem[]
}

interface PrecheckItem {
  key: string
  label: string
  pass: boolean
  message?: string
}

// ── 状态 ─────────────────────────────────────────────────────

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isFinanceOrCeo = computed(() => ['finance', 'ceo'].includes(role.value))

const activeTab = ref('cycles')

// 周期管理
const cycles = ref<PayrollCycle[]>([])
const loadingCycles = ref(false)
const showCreateCycleModal = ref(false)
const creatingCycle = ref(false)
const createCycleForm = ref({ period: '' })

// 结算操作
const selectedCycleId = ref<number | null>(null)
const precheckLoading = ref(false)
const settleLoading = ref(false)
const precheckResult = ref<PrecheckItem[] | null>(null)
const precheckPassed = computed(() =>
  precheckResult.value !== null && precheckResult.value.every(i => i.pass)
)

// 工资条
const slips = ref<PayrollSlip[]>([])
const loadingSlips = ref(false)
const selectedCycleIdForSlips = ref<number | null>(null)

// 工资条详情
const showSlipDetail = ref(false)
const slipDetail = ref<SlipDetail | null>(null)
const loadingSlipDetail = ref(false)
const confirmingSlip = ref(false)
const disputingSlip = ref(false)
const showDisputeInput = ref(false)
const disputeReason = ref('')

// PIN 确认相关
const showPinModal = ref(false)
const pinInput = ref('')
const pinError = ref('')

// 签名绑定提示
const showBindPromptModal = ref(false)

// ── 表格列定义 ─────────────────────────────────────────────

const cycleColumns = [
  { title: '周期', dataIndex: 'period', key: 'period' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '申报窗口截止', dataIndex: 'windowEndDate', key: 'windowEndDate' },
  { title: '发薪日', dataIndex: 'payDate', key: 'payDate' },
  { title: '操作', key: 'action' },
]

const financeSlipColumns = [
  { title: '工资条 ID', dataIndex: 'id', key: 'id' },
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '实发', dataIndex: 'netPay', key: 'netPay' },
  { title: '操作', key: 'action' },
]

// ── 生命周期 ──────────────────────────────────────────────

onMounted(() => {
  if (isFinanceOrCeo.value) {
    loadCycles()
  } else {
    loadMySlips()
  }
})

function onTabChange(key: string) {
  activeTab.value = key
  if (key === 'cycles' && cycles.value.length === 0) loadCycles()
  if (key === 'slips' && cycles.value.length === 0) loadCycles()
}

// ── 周期管理 ──────────────────────────────────────────────

async function loadCycles() {
  loadingCycles.value = true
  try {
    const data = await request<PayrollCycle[]>({ url: '/payroll/cycles' })
    cycles.value = data
  } catch {
    message.error('加载周期列表失败')
  } finally {
    loadingCycles.value = false
  }
}

async function doCreateCycle() {
  const period = createCycleForm.value.period.trim()
  if (!period) { message.warning('请填写周期，格式：YYYY-MM'); return }
  creatingCycle.value = true
  try {
    await request({ url: '/payroll/cycles', method: 'POST', body: { period } })
    message.success('周期创建成功')
    showCreateCycleModal.value = false
    createCycleForm.value.period = ''
    await loadCycles()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '创建失败')
  } finally {
    creatingCycle.value = false
  }
}

async function doOpenWindow(cycleId: number) {
  try {
    await request({ url: `/payroll/cycles/${cycleId}/open-window`, method: 'POST' })
    message.success('申报窗口已开放')
    await loadCycles()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '操作失败')
  }
}

function selectCycleForSettle(cycle: PayrollCycle) {
  selectedCycleId.value = cycle.id
  activeTab.value = 'settle'
  precheckResult.value = null
}

// ── 结算 ──────────────────────────────────────────────────

async function doPrecheck() {
  if (!selectedCycleId.value) return
  precheckLoading.value = true
  precheckResult.value = null
  try {
    const res = await request<{ pass: boolean; items: PrecheckItem[] }>({
      url: `/payroll/cycles/${selectedCycleId.value}/precheck`,
      method: 'POST',
    })
    precheckResult.value = res.items
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '预检请求失败')
  } finally {
    precheckLoading.value = false
  }
}

async function doSettle() {
  if (!selectedCycleId.value || !precheckPassed.value) return
  settleLoading.value = true
  try {
    await request({ url: `/payroll/cycles/${selectedCycleId.value}/settle`, method: 'POST' })
    message.success('结算完成')
    precheckResult.value = null
    selectedCycleId.value = null
    await loadCycles()
    activeTab.value = 'cycles'
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '结算失败')
  } finally {
    settleLoading.value = false
  }
}

// ── 工资条（Finance/CEO） ──────────────────────────────────

async function loadSlipsByCycle() {
  if (!selectedCycleIdForSlips.value) return
  loadingSlips.value = true
  try {
    const data = await request<PayrollSlip[]>({
      url: `/payroll/slips?cycleId=${selectedCycleIdForSlips.value}`,
    })
    slips.value = data
  } catch {
    message.error('加载工资条失败')
  } finally {
    loadingSlips.value = false
  }
}

// ── 工资条（员工/劳工） ─────────────────────────────────────

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

// ── 工资条详情 ─────────────────────────────────────────────

async function openSlipDetail(slip: PayrollSlip) {
  showSlipDetail.value = true
  slipDetail.value = null
  showDisputeInput.value = false
  disputeReason.value = ''
  loadingSlipDetail.value = true
  try {
    const detail = await request<SlipDetail>({ url: `/payroll/slips/${slip.id}` })
    slipDetail.value = detail
  } catch {
    message.error('加载工资条详情失败')
    showSlipDetail.value = false
  } finally {
    loadingSlipDetail.value = false
  }
}

/**
 * 处理确认工资条按钮点击
 * 先检查签名绑定状态，再决定显示 PIN 输入框或绑定提示
 */
async function doConfirm() {
  if (!slipDetail.value) return

  // 先检查签名绑定状态
  try {
    const statusRes = await request<{ bound: boolean }>({
      url: '/signature/status',
      method: 'GET',
    })

    if (!statusRes.bound) {
      // 未绑定，显示绑定提示
      showBindPromptModal.value = true
      return
    }

    // 已绑定，显示 PIN 输入框
    pinInput.value = ''
    pinError.value = ''
    showPinModal.value = true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '检查签名状态失败')
  }
}

/**
 * 提交 PIN 码确认工资条
 * POST /payroll/slips/{id}/confirm
 */
async function submitPinConfirm() {
  if (!slipDetail.value || !pinInput.value) {
    pinError.value = '请输入 PIN 码'
    return
  }

  confirmingSlip.value = true
  pinError.value = ''

  try {
    const res = await request<{ slip: PayrollSlip }>({
      url: `/payroll/slips/${slipDetail.value.slip.id}/confirm`,
      method: 'POST',
      body: { pin: pinInput.value },
    })
    slipDetail.value.slip.status = res.slip.status
    message.success('工资条已确认')
    showPinModal.value = false
    await loadMySlips()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusCode?: number }

    if (err.statusCode === 400) {
      // PIN 码错误
      pinError.value = err.data?.message ?? 'PIN 码错误'
    } else if (err.statusCode === 403) {
      // 未绑定签名
      showPinModal.value = false
      showBindPromptModal.value = true
      message.error('您尚未绑定签名，请先绑定')
    } else {
      message.error(err.data?.message ?? '确认失败')
    }
  } finally {
    confirmingSlip.value = false
  }
}

/**
 * 关闭 PIN 输入框
 */
function closePinModal() {
  showPinModal.value = false
  pinInput.value = ''
  pinError.value = ''
}

/**
 * 跳转到签名绑定页面
 */
function goToSignatureBind() {
  showBindPromptModal.value = false
  showPinModal.value = false
  navigateTo('/payroll/signature-bind')
}

async function doDispute() {
  if (!slipDetail.value || !disputeReason.value.trim()) return
  disputingSlip.value = true
  try {
    const res = await request<{ slip: PayrollSlip }>({
      url: `/payroll/slips/${slipDetail.value.slip.id}/dispute`,
      method: 'POST',
      body: { reason: disputeReason.value.trim() },
    })
    slipDetail.value.slip.status = res.slip.status
    showDisputeInput.value = false
    disputeReason.value = ''
    message.success('异议已提交')
    await loadMySlips()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '提交异议失败')
  } finally {
    disputingSlip.value = false
  }
}

// ── 辅助选项 ──────────────────────────────────────────────

const cycleOptions = computed(() =>
  cycles.value.map(c => ({ label: c.period, value: c.id }))
)

const settleableCycles = computed(() =>
  cycles.value
    .filter(c => ['OPEN', 'WINDOW_OPEN', 'WINDOW_CLOSED'].includes(c.status))
    .map(c => ({ label: `${c.period}（${cycleStatusLabel(c.status)}）`, value: c.id }))
)

// ── 格式化工具 ─────────────────────────────────────────────

function formatAmount(val: number | string | undefined): string {
  const n = Number(val ?? 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function cycleStatusLabel(status: string): string {
  return {
    OPEN: '待处理',
    WINDOW_OPEN: '申报中',
    WINDOW_CLOSED: '窗口已关闭',
    SETTLED: '已结算',
    LOCKED: '已锁定',
  }[status] ?? status
}

function cycleStatusColor(status: string): string {
  return {
    OPEN: 'default',
    WINDOW_OPEN: 'blue',
    WINDOW_CLOSED: 'orange',
    SETTLED: 'green',
    LOCKED: 'purple',
  }[status] ?? 'default'
}

function slipStatusLabel(status: string): string {
  return {
    DRAFT: '草稿',
    PUBLISHED: '待确认',
    CONFIRMED: '已确认',
    DISPUTED: '异议中',
    SUPERSEDED: '已更正',
  }[status] ?? status
}

function slipStatusColor(status: string): string {
  return {
    DRAFT: 'default',
    PUBLISHED: 'blue',
    CONFIRMED: 'green',
    DISPUTED: 'red',
    SUPERSEDED: 'default',
  }[status] ?? 'default'
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

/* Removed flex constraints to allow natural content flow */
.slip-item-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 14px;
}
.slip-item-name {
  color: #555;
}
.slip-item-amount {
  font-variant-numeric: tabular-nums;
}
.slip-total {
  font-weight: 600;
  font-size: 15px;
}

.pin-hint {
  margin-top: 8px;
  font-size: 13px;
  color: #666;
  text-align: center;
}

.pin-hint a {
  color: #1890ff;
  cursor: pointer;
}
</style>
