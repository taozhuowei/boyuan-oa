<template>
  <!-- RetentionConfig: 数据保留期配置卡片 -->
  <a-card title="数据保留期" class="config-card">
    <a-spin :spinning="loading">
      <div class="form-row">
        <span class="form-label">全局保留期：</span>
        <template v-if="isCEO">
          <a-select
            v-model:value="retention_days"
            style="width: 160px"
            data-catch="config-retention-select"
          >
            <a-select-option :value="365">1 年（365 天）</a-select-option>
            <a-select-option :value="730">2 年（730 天）</a-select-option>
            <a-select-option :value="1095">3 年（1095 天，默认）</a-select-option>
            <a-select-option :value="1825">5 年（1825 天）</a-select-option>
          </a-select>
        </template>
        <template v-else>
          <span class="readonly-value">{{ retention_days }} 天</span>
        </template>
      </div>
      <div class="form-hint">
        超过保留期的历史数据将在下次自动清理任务时删除，或可在数据保留页手动清理。
      </div>
      <div v-if="isCEO" class="form-actions">
        <a-button
          type="primary"
          :loading="saving"
          data-catch="config-retention-save-btn"
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
 * RetentionConfig — 数据保留期配置区块
 * 职责: 加载并保存全局历史数据保留天数
 * API: GET /config/retention-period, PUT /config/retention-period
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

const props = defineProps<{
  isCEO: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const retention_days = ref<number>(1095)

async function loadConfig() {
  loading.value = true
  try {
    const data = await request<{ days: number }>({ url: '/config/retention-period' })
    retention_days.value = data.days ?? 1095
  } catch {
    // keep default
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.isCEO) return
  saving.value = true
  try {
    await request({
      url: '/config/retention-period',
      method: 'PUT',
      body: { days: retention_days.value }
    })
    message.success('保留期已更新')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
