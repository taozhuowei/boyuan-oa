<template>
  <div class="config-page">
    <h2 class="page-title">系统配置</h2>

    <div class="cards-container">
      <!-- Section 1: Attendance Unit Config -->
      <a-card title="考勤计量单位" class="config-card">
        <a-spin :spinning="attendanceLoading">
          <div class="form-row">
            <span class="form-label">请假单位：</span>
            <template v-if="isCEO">
              <a-select
                v-model:value="leaveUnit"
                style="width: 160px"
                :options="unitOptions"
                placeholder="请选择单位"
              />
            </template>
            <template v-else>
              <span class="readonly-value">{{ getUnitLabel(leaveUnit) }}</span>
            </template>
          </div>

          <div class="form-row">
            <span class="form-label">加班单位：</span>
            <template v-if="isCEO">
              <a-select
                v-model:value="overtimeUnit"
                style="width: 160px"
                :options="unitOptions"
                placeholder="请选择单位"
              />
            </template>
            <template v-else>
              <span class="readonly-value">{{ getUnitLabel(overtimeUnit) }}</span>
            </template>
          </div>

          <div v-if="isCEO" class="form-actions">
            <a-button type="primary" :loading="saving" @click="saveAttendanceConfig">
              保存
            </a-button>
          </div>
        </a-spin>
      </a-card>

      <!-- Section 2: Approval Flow Config -->
      <a-card title="审批流配置" class="config-card">
        <a-spin :spinning="flowsLoading">
          <a-table
            :columns="flowColumns"
            :data-source="approvalFlows"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #emptyText>
              <span v-if="flowsError">无法加载审批流配置</span>
              <span v-else>暂无审批流配置</span>
            </template>
          </a-table>
        </a-spin>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

// User store for role checking
const userStore = useUserStore()
const isCEO = computed(() => userStore.userInfo?.role === 'ceo')

// Attendance Unit Config
interface AttendanceConfig {
  leaveUnit: string
  overtimeUnit: string
}

const attendanceLoading = ref(false)
const saving = ref(false)
const leaveUnit = ref<string>('')
const overtimeUnit = ref<string>('')

const unitOptions = [
  { value: 'HOUR', label: '小时' },
  { value: 'HALF_DAY', label: '半天' },
  { value: 'DAY', label: '天' }
]

function getUnitLabel(value: string): string {
  const option = unitOptions.find(opt => opt.value === value)
  return option?.label ?? value ?? '—'
}

async function loadAttendanceConfig() {
  attendanceLoading.value = true
  try {
    const data = await request<AttendanceConfig>({
      url: '/config/attendance-unit'
    })
    leaveUnit.value = data.leaveUnit ?? ''
    overtimeUnit.value = data.overtimeUnit ?? ''
  } catch {
    message.warning('加载考勤配置失败')
  } finally {
    attendanceLoading.value = false
  }
}

async function saveAttendanceConfig() {
  if (!isCEO.value) return

  saving.value = true
  try {
    await request({
      url: '/config/attendance-unit',
      method: 'POST',
      body: {
        leaveUnit: leaveUnit.value,
        overtimeUnit: overtimeUnit.value
      }
    })
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}

// Approval Flow Config — API returns [{flow:{...}, nodes:[...]}]
interface ApprovalFlowItem {
  id: number
  businessType: string
  isActive: boolean
  nodeCount: number
}

const flowsLoading = ref(false)
const flowsError = ref(false)
const approvalFlows = ref<ApprovalFlowItem[]>([])

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  LEAVE: '请假',
  OVERTIME: '加班',
  LOG: '施工日志',
  INJURY: '工伤'
}

const flowColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType',
    customRender: ({ text }: { text: string }) => BUSINESS_TYPE_LABELS[text] ?? text },
  { title: '审批节点数', dataIndex: 'nodeCount', key: 'nodeCount', width: 110 },
  { title: '状态', dataIndex: 'isActive', key: 'isActive', width: 80,
    customRender: ({ text }: { text: boolean }) => text ? '启用' : '禁用' }
]

async function loadApprovalFlows() {
  flowsLoading.value = true
  flowsError.value = false
  try {
    const data = await request<Array<{ flow: { id: number; businessType: string; isActive: boolean }; nodes: unknown[] }>>({
      url: '/approval/flows'
    })
    approvalFlows.value = (data ?? []).map(item => ({
      id: item.flow.id,
      businessType: item.flow.businessType,
      isActive: item.flow.isActive,
      nodeCount: item.nodes?.length ?? 0
    }))
  } catch {
    approvalFlows.value = []
    flowsError.value = true
  } finally {
    flowsLoading.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadAttendanceConfig()
  loadApprovalFlows()
})
</script>

<style scoped>
.config-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.config-card {
  flex: 1;
  min-width: 320px;
  min-height: 200px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-label {
  width: 100px;
  color: #666;
}

.readonly-value {
  color: #333;
  font-weight: 500;
}

.form-actions {
  margin-top: 24px;
}
</style>
