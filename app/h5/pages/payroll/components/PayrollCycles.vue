<template>
  <!--
    PayrollCycles — 周期管理面板
    职责：展示工资周期列表，支持创建周期、开放申报窗口、发起结算跳转
    数据来源：自行调用 /payroll/cycles；创建/开窗后向父层冒泡最新列表
    事件输出：select-for-settle(cycleId) — 通知父层切换到结算 Tab 并预填周期
  -->
  <div>
    <div class="tab-actions" style="margin-bottom: 12px">
      <a-button type="primary" @click="showCreateCycleModal = true">+ 创建周期</a-button>
      <a-button style="margin-left: 8px" @click="handleRefresh" :loading="loadingCycles">
        刷新
      </a-button>
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
          <a-tag data-catch="payroll-cycle-status" :color="cycleStatusColor(record.status)">
            {{ cycleStatusLabel(record.status) }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button
            v-if="record.status === 'OPEN'"
            type="link"
            size="small"
            :data-catch="'payroll-cycle-open-btn-' + record.id"
            @click="doOpenWindow(record.id as number)"
          >
            开放申报窗口
          </a-button>
          <a-button
            v-if="['OPEN', 'WINDOW_OPEN', 'WINDOW_CLOSED'].includes(record.status as string)"
            type="link"
            size="small"
            @click="emit('select-for-settle', record.id as number)"
          >
            结算
          </a-button>
        </template>
      </template>
    </a-table>

    <!-- 创建周期 Modal -->
    <a-modal
      v-model:open="showCreateCycleModal"
      title="创建工资周期"
      :confirm-loading="creatingCycle"
      @ok="doCreateCycle"
      @cancel="createCycleForm.period = ''"
      :okButtonProps="{ 'data-catch': 'payroll-cycle-create-ok' } as unknown as ButtonProps"
    >
      <a-form layout="vertical">
        <a-form-item label="周期（格式：YYYY-MM）">
          <a-input v-model:value="createCycleForm.period" placeholder="例：2026-04" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * PayrollCycles
 * 周期管理面板：列表 + 创建周期 + 开放申报窗口
 * 数据：自行拉取 /payroll/cycles，操作后重新拉取并通过 cycles-updated 通知父层
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { ButtonProps } from 'ant-design-vue'
import { request } from '~/utils/http'

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

// ── 事件 ──────────────────────────────────────────────────────
// select-for-settle: 用户点击"结算"按钮，通知父层切换 Tab 并预填周期 ID
// cycles-updated: 列表发生变化（创建/开窗）后，向父层传递最新列表供共享使用

const emit = defineEmits<{
  (e: 'select-for-settle', cycleId: number): void
  (e: 'cycles-updated', cycles: PayrollCycle[]): void
}>()

// ── 状态 ──────────────────────────────────────────────────────

const cycles = ref<PayrollCycle[]>([])
const loadingCycles = ref(false)
const showCreateCycleModal = ref(false)
const creatingCycle = ref(false)
const createCycleForm = ref({ period: '' })

// ── 表格列 ────────────────────────────────────────────────────

const cycleColumns = [
  { title: '周期', dataIndex: 'period', key: 'period' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '申报窗口截止', dataIndex: 'windowEndDate', key: 'windowEndDate' },
  { title: '发薪日', dataIndex: 'payDate', key: 'payDate' },
  { title: '操作', key: 'action' },
]

// ── 生命周期 ──────────────────────────────────────────────────

onMounted(loadCycles)

// ── 方法 ──────────────────────────────────────────────────────

async function loadCycles() {
  loadingCycles.value = true
  try {
    const data = await request<PayrollCycle[]>({ url: '/payroll/cycles' })
    cycles.value = data
    emit('cycles-updated', data)
  } catch {
    message.error('加载周期列表失败')
  } finally {
    loadingCycles.value = false
  }
}

function handleRefresh() {
  loadCycles()
}

async function doCreateCycle() {
  const period = createCycleForm.value.period.trim()
  if (!period) {
    message.warning('请填写周期，格式：YYYY-MM')
    return
  }
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

// ── 格式化工具 ─────────────────────────────────────────────────

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

function cycleStatusColor(status: string): string {
  return (
    (
      {
        OPEN: 'default',
        WINDOW_OPEN: 'blue',
        WINDOW_CLOSED: 'orange',
        SETTLED: 'green',
        LOCKED: 'purple',
      } as Record<string, string>
    )[status] ?? 'default'
  )
}
</script>
