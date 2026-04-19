<template>
  <!--
    PayrollSettle — 结算操作面板
    职责：选择周期、执行预结算检查、执行正式结算
    数据来源：周期选项由父层通过 props 传入（避免重复拉取）；
              预检 / 结算 API 由本组件自行调用
    事件输出：settled — 结算成功后通知父层刷新周期列表并跳回 cycles Tab
  -->
  <div style="max-width: 480px; margin-top: 8px">
    <a-form layout="vertical">
      <a-form-item label="选择周期">
        <a-select
          :value="selectedCycleId ?? undefined"
          placeholder="请选择工资周期"
          :options="settleableCycles"
          :loading="loadingCycles"
          @change="
            (v) => {
              selectedCycleId = v as number
              precheckResult = null
            }
          "
        />
      </a-form-item>
    </a-form>

    <a-space>
      <a-button
        data-catch="payroll-settle-precheck-btn"
        :disabled="!selectedCycleId"
        :loading="precheckLoading"
        @click="doPrecheck"
      >
        预结算检查
      </a-button>
      <a-button
        data-catch="payroll-settle-run-btn"
        type="primary"
        :disabled="!selectedCycleId || !precheckPassed"
        :loading="settleLoading"
        @click="doSettle"
      >
        正式结算
      </a-button>
    </a-space>

    <template v-if="precheckResult !== null">
      <a-divider />
      <a-alert
        :type="precheckPassed ? 'success' : 'warning'"
        :message="precheckPassed ? '所有检查项通过，可执行结算' : '存在未通过检查项'"
        show-icon
        style="margin-bottom: 12px"
      />
      <a-list size="small" :data-source="precheckResult">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-space>
              <span :style="{ color: item.pass ? '#52c41a' : '#ff4d4f' }">
                {{ item.pass ? '✓' : '✗' }}
              </span>
              <span>{{ item.label }}</span>
              <span v-if="!item.pass" style="color: #ff4d4f; font-size: 12px">
                {{ item.message }}
              </span>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * PayrollSettle
 * 结算操作面板：选周期 → 预检 → 正式结算
 * 周期选项由父层传入；预检和结算 API 由本组件自行调用
 */
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

// ── 类型定义 ──────────────────────────────────────────────────

interface PrecheckItem {
  key: string
  label: string
  pass: boolean
  message?: string
}

interface CycleOption {
  label: string
  value: number
}

// ── Props ─────────────────────────────────────────────────────
// settleableCycles: 父层从 cycles 列表过滤出可结算的周期选项
// loadingCycles: 父层加载周期时的 loading 状态，传入给 Select 显示
// preselectedCycleId: 从 cycles Tab 点击"结算"按钮时父层传入的预填周期 ID

const props = defineProps<{
  settleableCycles: CycleOption[]
  loadingCycles: boolean
  preselectedCycleId?: number
}>()

// ── 事件 ──────────────────────────────────────────────────────
// settled: 结算成功，通知父层刷新周期列表并切换回 cycles Tab

const emit = defineEmits<{
  (e: 'settled'): void
}>()

// ── 状态 ──────────────────────────────────────────────────────

const selectedCycleId = ref<number | undefined>(props.preselectedCycleId)
const precheckLoading = ref(false)
const settleLoading = ref(false)
const precheckResult = ref<PrecheckItem[] | null>(null)

const precheckPassed = computed(
  () => precheckResult.value !== null && precheckResult.value.every((i) => i.pass)
)

// 父层通过 preselectedCycleId 传入预填值时同步到本地状态
watch(
  () => props.preselectedCycleId,
  (id) => {
    if (id !== undefined) {
      selectedCycleId.value = id
      precheckResult.value = null
    }
  }
)

// ── 方法 ──────────────────────────────────────────────────────

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
    selectedCycleId.value = undefined
    emit('settled')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '结算失败')
  } finally {
    settleLoading.value = false
  }
}
</script>
