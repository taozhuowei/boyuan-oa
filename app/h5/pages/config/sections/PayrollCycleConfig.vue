<template>
  <!-- PayrollCycleConfig: 薪资周期配置卡片 (发薪日 + 结算截止日) -->
  <a-card title="薪资周期配置" class="config-card">
    <a-spin :spinning="loading">
      <div class="form-row">
        <span class="form-label">发薪日：</span>
        <template v-if="isCEO">
          <a-input-number
            v-model:value="payday"
            :min="1"
            :max="28"
            style="width: 120px"
            data-catch="config-payday-input"
          />
          <span style="margin-left: 8px; color: #888">日（每月，建议 15 日）</span>
        </template>
        <template v-else>
          <span class="readonly-value">每月 {{ payday }} 日</span>
        </template>
      </div>

      <div class="form-row" style="margin-top: 12px">
        <span class="form-label">结算截止日：</span>
        <template v-if="isCEO">
          <a-input-number
            v-model:value="settlement_cutoff"
            :min="1"
            :max="15"
            style="width: 120px"
          />
          <span style="margin-left: 8px; color: #888">天前（发薪日前 N 天）</span>
        </template>
        <template v-else>
          <span class="readonly-value">发薪日前 {{ settlement_cutoff }} 天</span>
        </template>
      </div>

      <div v-if="isCEO" class="form-actions">
        <a-button
          type="primary"
          :loading="saving"
          data-catch="config-payroll-cycle-save-btn"
          @click="handleSave"
        >
          保存
        </a-button>
      </div>
    </a-spin>
  </a-card>
</template>

<script setup lang="ts">
/**
 * PayrollCycleConfig — 薪资周期配置区块
 * 职责: 加载并保存发薪日与结算截止日配置
 * API: GET /config/payroll-cycle, PUT /config/payroll-cycle
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

const props = defineProps<{
  isCEO: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const payday = ref<number>(15)
const settlement_cutoff = ref<number>(5)

async function loadConfig() {
  loading.value = true
  try {
    const data = await request<{ payday: number; settlementCutoff: number }>({
      url: '/config/payroll-cycle',
    })
    payday.value = data.payday ?? 15
    settlement_cutoff.value = data.settlementCutoff ?? 5
  } catch {
    // keep defaults
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.isCEO) return
  saving.value = true
  try {
    await request({
      url: '/config/payroll-cycle',
      method: 'PUT',
      body: { payday: payday.value, settlementCutoff: settlement_cutoff.value },
    })
    message.success('薪资周期已保存')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
