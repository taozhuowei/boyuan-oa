<template>
  <!-- AttendanceUnitConfig: 考勤计量单位配置卡片 (请假/加班单位选择) -->
  <a-card title="考勤计量单位" class="config-card">
    <a-spin :spinning="loading">
      <div class="form-row">
        <span class="form-label">请假单位：</span>
        <template v-if="isCEO">
          <a-select
            v-model:value="leave_unit"
            style="width: 160px"
            :options="UNIT_OPTIONS"
            placeholder="请选择单位"
            data-catch="config-leave-unit-select"
          />
        </template>
        <template v-else>
          <span class="readonly-value">{{ getUnitLabel(leave_unit) }}</span>
        </template>
      </div>

      <div class="form-row">
        <span class="form-label">加班单位：</span>
        <template v-if="isCEO">
          <a-select
            v-model:value="overtime_unit"
            style="width: 160px"
            :options="UNIT_OPTIONS"
            placeholder="请选择单位"
          />
        </template>
        <template v-else>
          <span class="readonly-value">{{ getUnitLabel(overtime_unit) }}</span>
        </template>
      </div>

      <div v-if="isCEO" class="form-actions">
        <a-button
          type="primary"
          :loading="saving"
          data-catch="config-attendance-save-btn"
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
 * AttendanceUnitConfig — 考勤计量单位配置区块
 * 职责: 加载并保存请假/加班计量单位配置
 * API: GET/POST /config/attendance-unit
 */
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

interface AttendanceConfig {
  leaveUnit: string
  overtimeUnit: string
}

const props = defineProps<{
  isCEO: boolean
}>()

// Unit display options — shared inside this component
const UNIT_OPTIONS = [
  { value: 'HOUR', label: '小时' },
  { value: 'HALF_DAY', label: '半天' },
  { value: 'DAY', label: '天' },
]

const loading = ref(false)
const saving = ref(false)
const leave_unit = ref<string>('')
const overtime_unit = ref<string>('')

function getUnitLabel(value: string): string {
  const option = UNIT_OPTIONS.find((opt) => opt.value === value)
  return option?.label ?? value ?? '—'
}

async function loadConfig() {
  loading.value = true
  try {
    const data = await request<AttendanceConfig>({ url: '/config/attendance-unit' })
    leave_unit.value = data.leaveUnit ?? ''
    overtime_unit.value = data.overtimeUnit ?? ''
  } catch {
    message.warning('加载考勤配置失败')
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.isCEO) return
  saving.value = true
  try {
    await request({
      url: '/config/attendance-unit',
      method: 'POST',
      body: { leaveUnit: leave_unit.value, overtimeUnit: overtime_unit.value },
    })
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>
