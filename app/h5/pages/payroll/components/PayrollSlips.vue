<template>
  <!--
    PayrollSlips — 工资条查看面板（Finance / CEO 视角）
    职责：按周期查询全员工资条列表；点击详情冒泡给父层打开统一的工资条详情 Modal
    数据来源：周期选项由父层传入；工资条列表由本组件自行拉取
    事件输出：open-slip-detail(slip) — 通知父层打开工资条详情 Modal
  -->
  <div>
    <div style="margin-bottom: 12px">
      <a-select
        data-catch="payroll-slips-cycle-select"
        :value="selectedCycleIdForSlips ?? undefined"
        placeholder="请选择工资周期"
        :options="cycleOptions"
        :loading="loadingCycles"
        style="width: 200px; margin-right: 8px"
        @change="
          (v) => {
            selectedCycleIdForSlips = v as number
            loadSlipsByCycle()
          }
        "
      />
      <a-button
        :loading="loadingSlips"
        @click="loadSlipsByCycle"
        :disabled="!selectedCycleIdForSlips"
      >
        查询
      </a-button>
    </div>

    <a-table
      data-catch="payroll-all-slips-table"
      :columns="financeSlipColumns"
      :data-source="slips"
      :loading="loadingSlips"
      row-key="id"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'status'">
          <a-tag :color="slipStatusColor(record.status)">
            {{ slipStatusLabel(record.status) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'netPay'">¥{{ formatAmount(record.netPay) }}</template>
        <template v-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            :data-catch="'payroll-slip-row-detail-btn-' + record.id"
            @click="emit('open-slip-detail', record as unknown as PayrollSlip)"
          >
            详情
          </a-button>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
/**
 * PayrollSlips
 * 工资条查看面板（Finance / CEO）：按周期查询全员工资条
 * 周期选项由父层传入；点击"详情"冒泡给父层统一处理 Modal
 */
import { ref } from 'vue'
import { message } from 'ant-design-vue'
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

interface CycleOption {
  label: string
  value: number
}

// ── Props ─────────────────────────────────────────────────────
// cycleOptions: 父层从 cycles 列表映射的 { label, value } 选项
// loadingCycles: 父层加载周期时的 loading 状态

defineProps<{
  cycleOptions: CycleOption[]
  loadingCycles: boolean
}>()

// ── 事件 ──────────────────────────────────────────────────────
// open-slip-detail: 用户点击"详情"，通知父层打开统一的工资条详情 Modal

const emit = defineEmits<{
  (e: 'open-slip-detail', slip: PayrollSlip): void
}>()

// ── 状态 ──────────────────────────────────────────────────────

const slips = ref<PayrollSlip[]>([])
const loadingSlips = ref(false)
const selectedCycleIdForSlips = ref<number | undefined>(undefined)

// ── 表格列 ────────────────────────────────────────────────────

const financeSlipColumns = [
  { title: '工资条 ID', dataIndex: 'id', key: 'id' },
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '实发', dataIndex: 'netPay', key: 'netPay' },
  { title: '操作', key: 'action' },
]

// ── 方法 ──────────────────────────────────────────────────────

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

// ── 格式化工具 ─────────────────────────────────────────────────

function formatAmount(val: number | string | undefined): string {
  const n = Number(val ?? 0)
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
</script>
