<template>
  <!--
    PayrollSlipDetail — 工资条详情容器（含相关操作 Modal）
    职责：展示工资条明细；员工可确认/提异议（含 PIN + 签名绑定流程）；财务可发起更正
    数据来源：slip 由父层传入触发加载；详情由本组件自行拉取 /payroll/slips/{id}
    事件输出：
      close — 请求父层关闭（对外不强制，由 v-model:open 控制，此事件供父层感知）
      slip-action-done — 确认/异议/更正提交成功，通知父层刷新列表
  -->
  <div>
    <!-- 工资条详情 Modal -->
    <a-modal
      :open="open"
      :title="`工资条详情`"
      :footer="null"
      width="560px"
      @update:open="(v: boolean) => emit('update:open', v)"
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

        <!-- 明细列表（设计 §6.5：分两段展示，应发 / 扣减 / 实发） -->
        <a-divider style="margin: 8px 0;">应发收入</a-divider>
        <div v-for="item in earningItems" :key="'e-' + item.id" class="slip-item-row">
          <span class="slip-item-name">{{ item.name }}</span>
          <span class="slip-item-amount" style="color: #333">+¥{{ formatAmount(item.amount) }}</span>
        </div>
        <div v-if="earningItems.length === 0" class="slip-empty-tip">无</div>
        <div class="slip-item-row slip-subtotal">
          <span>应发合计</span>
          <strong>¥{{ formatAmount(earningTotal) }}</strong>
        </div>

        <a-divider style="margin: 12px 0;">扣减项</a-divider>
        <div v-for="item in deductionItems" :key="'d-' + item.id" class="slip-item-row">
          <span class="slip-item-name">{{ item.name }}</span>
          <span class="slip-item-amount" style="color: #ff4d4f">-¥{{ formatAmount(Math.abs(Number(item.amount))) }}</span>
        </div>
        <div v-if="deductionItems.length === 0" class="slip-empty-tip">无</div>
        <div class="slip-item-row slip-subtotal">
          <span>扣减合计</span>
          <strong style="color: #ff4d4f">¥{{ formatAmount(deductionTotal) }}</strong>
        </div>

        <a-divider style="margin: 12px 0;" />
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

        <!-- 财务操作按钮：发起更正（PUBLISHED/CONFIRMED/DISPUTED 状态可发起；SUPERSEDED 不可） -->
        <template v-if="isFinance && ['PUBLISHED','CONFIRMED','DISPUTED'].includes(slipDetail.slip.status)">
          <a-divider style="margin: 12px 0;" />
          <a-space style="width: 100%; justify-content: center;">
            <a-button data-catch="payroll-correction-open-btn" @click="openCorrectionModal">发起更正</a-button>
          </a-space>
        </template>
      </template>
      <a-spin v-else :spinning="loadingSlipDetail" tip="加载中..." />
    </a-modal>

    <!-- PIN 输入 Modal -->
    <a-modal
      v-model:open="showPinModal"
      title="请输入 PIN 码确认"
      :confirm-loading="confirmingSlip"
      @ok="submitPinConfirm"
      @cancel="closePinModal"
      <!-- 原因：antd ButtonProps 无 data-* 索引签名，data-catch 测试锚点需断言 -->
      :okButtonProps="({ 'data-catch': 'payroll-sign-confirm-btn' } as unknown as ButtonProps)"
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
            :maxlength="6"
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
        <template #subTitle>
          <p>确认工资条需要先绑定手写签名并设置 PIN 码</p>
        </template>
        <template #extra>
          <a-button type="primary" @click="goToSignatureBind">去绑定签名</a-button>
          <a-button @click="showBindPromptModal = false">稍后再说</a-button>
        </template>
      </a-result>
    </a-modal>

    <!-- 薪资更正发起 Modal -->
    <a-modal
      v-model:open="showCorrectionModal"
      title="发起薪资更正"
      :confirm-loading="submittingCorrection"
      width="640px"
      <!-- 原因：antd ButtonProps 无 data-* 索引签名，data-catch 测试锚点需断言 -->
      :okButtonProps="({ 'data-catch': 'correction-submit-btn' } as unknown as ButtonProps)"
      @ok="submitCorrection"
      @cancel="showCorrectionModal = false"
    >
      <p style="color: #999; margin-bottom: 12px;">
        修改下方任意工资项的金额（保持空白则不变），并填写更正原因。提交后由 CEO 审批通过后生效，原工资条将被标记 SUPERSEDED，新版本号 +1。
      </p>
      <div v-for="row in correctionRows" :key="row.itemDefId" class="correction-row">
        <span class="correction-name">{{ row.name }}</span>
        <a-input-number
          v-model:value="row.newAmount"
          :precision="2"
          :placeholder="`原 ${row.originalAmount}`"
          style="width: 160px"
        />
        <a-input v-model:value="row.remark" placeholder="备注（可选）" style="flex: 1; margin-left: 8px;" />
      </div>
      <a-form-item label="更正原因" required style="margin-top: 16px;">
        <a-textarea data-catch="correction-reason-input" v-model:value="correctionReason" :rows="3" placeholder="必填" />
      </a-form-item>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * PayrollSlipDetail
 * 工资条详情容器：展示明细 + 员工确认/异议流程（含 PIN + 签名绑定）+ 财务发起更正
 * open 通过 v-model 控制；slip 通过 prop 传入触发数据拉取
 */
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { ButtonProps } from 'ant-design-vue'
import { request } from '~/utils/http'

// ── 类型定义 ──────────────────────────────────────────────────

interface PayrollSlip {
  id: number
  cycleId: number
  employeeId: number
  status: string
  netPay: number | string
  period?: string
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

interface CorrectionRow {
  itemDefId: number
  name: string
  originalAmount: string | number
  newAmount: number | undefined
  remark: string
}

// ── Props ─────────────────────────────────────────────────────
// open: 控制主 Modal 显示（v-model）
// slip: 要查看详情的工资条（触发加载）
// isFinanceOrCeo: 控制员工操作按钮显隐
// isFinance: 控制财务发起更正按钮显隐

const props = defineProps<{
  open: boolean
  slip: PayrollSlip | null
  isFinanceOrCeo: boolean
  isFinance: boolean
}>()

// ── 事件 ──────────────────────────────────────────────────────
// update:open — v-model 支持，父层通过此事件同步关闭状态
// slip-action-done — 确认/异议/更正提交成功，通知父层刷新工资条列表

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'slip-action-done'): void
}>()

// ── 状态 ──────────────────────────────────────────────────────

const slipDetail = ref<SlipDetail | null>(null)
const loadingSlipDetail = ref(false)

const earningItems = computed<SlipItem[]>(() =>
  (slipDetail.value?.items ?? []).filter(it => it.type === 'EARNING' && Number(it.amount) > 0)
)
const deductionItems = computed<SlipItem[]>(() =>
  (slipDetail.value?.items ?? []).filter(it => it.type === 'DEDUCTION' || Number(it.amount) < 0)
)
const earningTotal = computed(() =>
  earningItems.value.reduce((s, it) => s + Number(it.amount), 0)
)
const deductionTotal = computed(() =>
  deductionItems.value.reduce((s, it) => s + Math.abs(Number(it.amount)), 0)
)

const confirmingSlip = ref(false)
const disputingSlip = ref(false)
const showDisputeInput = ref(false)
const disputeReason = ref('')

const showPinModal = ref(false)
const pinInput = ref('')
const pinError = ref('')

const showBindPromptModal = ref(false)

const showCorrectionModal = ref(false)
const submittingCorrection = ref(false)
const correctionRows = ref<CorrectionRow[]>([])
const correctionReason = ref('')
const correctionTargetSlipId = ref<number | undefined>(undefined)

// ── 监听 slip 变化触发加载 ─────────────────────────────────────

watch(() => props.slip, async (slip) => {
  if (!slip) return
  slipDetail.value = null
  showDisputeInput.value = false
  disputeReason.value = ''
  loadingSlipDetail.value = true
  try {
    const detail = await request<SlipDetail>({ url: `/payroll/slips/${slip.id}` })
    slipDetail.value = detail
  } catch {
    message.error('加载工资条详情失败')
    emit('update:open', false)
  } finally {
    loadingSlipDetail.value = false
  }
})

// ── 确认工资条流程 ──────────────────────────────────────────────

/**
 * 处理确认工资条按钮点击
 * 先检查签名绑定状态，再决定显示 PIN 输入框或绑定提示
 */
async function doConfirm() {
  if (!slipDetail.value) return
  try {
    const statusRes = await request<{ bound: boolean }>({
      url: '/signature/status',
      method: 'GET',
    })
    if (!statusRes.bound) {
      showBindPromptModal.value = true
      return
    }
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
    emit('slip-action-done')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }; statusCode?: number }
    if (err.statusCode === 400) {
      pinError.value = err.data?.message ?? 'PIN 码错误'
    } else if (err.statusCode === 403) {
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

function closePinModal() {
  showPinModal.value = false
  pinInput.value = ''
  pinError.value = ''
}

function goToSignatureBind() {
  showBindPromptModal.value = false
  showPinModal.value = false
  navigateTo('/payroll/signature_bind')
}

// ── 异议流程 ───────────────────────────────────────────────────

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
    emit('slip-action-done')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '提交异议失败')
  } finally {
    disputingSlip.value = false
  }
}

// ── 薪资更正流程 ───────────────────────────────────────────────

function openCorrectionModal() {
  if (!slipDetail.value) return
  correctionTargetSlipId.value = slipDetail.value.slip.id
  correctionReason.value = ''
  correctionRows.value = slipDetail.value.items.map(it => ({
    itemDefId: it.itemDefId,
    name: it.name,
    originalAmount: formatAmount(it.amount),
    newAmount: undefined,
    remark: ''
  }))
  showCorrectionModal.value = true
}

async function submitCorrection() {
  if (!correctionTargetSlipId.value) return
  if (!correctionReason.value.trim()) {
    message.warning('请填写更正原因')
    return
  }
  const dirty = correctionRows.value.filter(r => r.newAmount != null || (r.remark && r.remark.trim() !== ''))
  if (dirty.length === 0) {
    message.warning('请至少修改一项金额或备注')
    return
  }
  submittingCorrection.value = true
  try {
    await request({
      url: `/payroll/slips/${correctionTargetSlipId.value}/correction`,
      method: 'POST',
      body: {
        reason: correctionReason.value,
        corrections: dirty.map(r => ({
          itemDefId: r.itemDefId,
          amount: r.newAmount,
          remark: r.remark
        }))
      }
    })
    message.success('已发起更正，待 CEO 审批')
    showCorrectionModal.value = false
    emit('update:open', false)
  } catch {
    // handled
  } finally {
    submittingCorrection.value = false
  }
}

// ── 格式化工具 ─────────────────────────────────────────────────

function formatAmount(val: number | string | undefined): string {
  const n = Number(val ?? 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function slipStatusLabel(status: string): string {
  return ({
    DRAFT: '草稿',
    PUBLISHED: '待确认',
    CONFIRMED: '已确认',
    DISPUTED: '异议中',
    SUPERSEDED: '已更正',
  } as Record<string, string>)[status] ?? status
}

function slipStatusColor(status: string): string {
  return ({
    DRAFT: 'default',
    PUBLISHED: 'blue',
    CONFIRMED: 'green',
    DISPUTED: 'red',
    SUPERSEDED: 'default',
  } as Record<string, string>)[status] ?? 'default'
}
</script>

<style scoped>
.slip-item-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
.slip-item-name { color: #555; }
.slip-item-amount { font-variant-numeric: tabular-nums; }
.slip-total { font-weight: 600; font-size: 15px; }
.slip-subtotal { font-weight: 500; font-size: 14px; border-top: 1px dashed #eee; margin-top: 4px; padding-top: 6px; }
.slip-empty-tip { color: #aaa; font-size: 12px; padding: 4px 0; }
.pin-hint { margin-top: 8px; font-size: 13px; color: #666; text-align: center; }
.pin-hint a { color: #1890ff; cursor: pointer; }
.correction-row { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px solid #f0f0f0; }
.correction-name { width: 110px; color: #333; }
</style>
