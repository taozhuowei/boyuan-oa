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
                data-catch="config-leave-unit-select"
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
            <a-button type="primary" :loading="saving" data-catch="config-attendance-save-btn" @click="saveAttendanceConfig">
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
            data-catch="config-approval-flows-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'action' && isCEO">
                <a-button type="link" size="small" @click="openFlowEditor(record.businessType)">编辑节点</a-button>
              </template>
            </template>
            <template #emptyText>
              <span v-if="flowsError">无法加载审批流配置</span>
              <span v-else>暂无审批流配置</span>
            </template>
          </a-table>
        </a-spin>
      </a-card>

      <!-- Approval flow editor modal -->
      <a-modal
        v-model:open="flowEditorOpen"
        :title="`编辑审批流 — ${editingBusinessType}`"
        :confirm-loading="savingFlow"
        width="640px"
        @ok="saveFlow"
        @cancel="flowEditorOpen = false"
      >
        <p style="color: #999; margin-bottom: 12px;">按从上到下顺序执行节点；保存即覆盖（旧节点软删，新节点全量插入）。</p>
        <div v-for="(n, idx) in editingNodes" :key="idx" class="flow-node-row">
          <span class="node-no">#{{ idx + 1 }}</span>
          <a-input v-model:value="n.nodeName" placeholder="节点名" style="width: 130px" />
          <a-select v-model:value="n.approverType" style="width: 160px">
            <a-select-option value="DIRECT_SUPERVISOR">直系领导</a-select-option>
            <a-select-option value="ROLE">角色</a-select-option>
            <a-select-option value="DESIGNATED">指定员工</a-select-option>
          </a-select>
          <a-input v-model:value="n.approverRef" placeholder="角色code 或员工 ID" style="flex: 1" />
          <a-button type="link" danger @click="removeNode(idx)">删除</a-button>
        </div>
        <a-button type="dashed" block @click="addNode">+ 添加节点</a-button>
      </a-modal>

      <!-- Section 3: Payroll Bonus Approval Switch -->
      <a-card title="临时薪资调整审批" class="config-card">
        <a-spin :spinning="bonusConfigLoading">
          <div class="form-row">
            <span class="form-label">是否需要 CEO 审批：</span>
            <template v-if="isCEO">
              <a-switch
                v-model:checked="bonusApprovalRequired"
                checked-children="需要"
                un-checked-children="不需要"
                data-catch="config-bonus-approval-switch"
              />
            </template>
            <template v-else>
              <span class="readonly-value">{{ bonusApprovalRequired ? '需要' : '不需要' }}</span>
            </template>
          </div>
          <div class="form-hint">
            开启后，财务录入的临时补贴/扣款需 CEO 审批通过后方可计入结算；关闭时直接生效，仅发送通知给 CEO。
          </div>
          <div v-if="isCEO" class="form-actions">
            <a-button type="primary" :loading="bonusConfigSaving" data-catch="config-bonus-approval-save-btn" @click="saveBonusApprovalConfig">
              保存
            </a-button>
          </div>
        </a-spin>
      </a-card>

      <!-- Section 4: Company Name -->
      <a-card title="企业信息" class="config-card">
        <a-spin :spinning="companyNameLoading">
          <div class="form-row">
            <span class="form-label">企业名称：</span>
            <template v-if="isCEO">
              <a-input v-model:value="companyName" style="width: 240px" placeholder="请输入企业名称" data-catch="config-company-name-input" />
            </template>
            <template v-else>
              <span class="readonly-value">{{ companyName || '—' }}</span>
            </template>
          </div>
          <div v-if="isCEO" class="form-actions">
            <a-button type="primary" :loading="savingCompanyName" data-catch="config-company-name-save-btn" @click="saveCompanyName">
              保存
            </a-button>
          </div>
        </a-spin>
      </a-card>

      <!-- Section 5: Payroll Cycle -->
      <a-card title="薪资周期配置" class="config-card">
        <a-spin :spinning="payrollCycleLoading">
          <div class="form-row">
            <span class="form-label">发薪日：</span>
            <template v-if="isCEO">
              <a-input-number v-model:value="payrollPayday" :min="1" :max="28" style="width: 120px" data-catch="config-payday-input" />
              <span style="margin-left:8px;color:#888;">日（每月，建议 15 日）</span>
            </template>
            <template v-else>
              <span class="readonly-value">每月 {{ payrollPayday }} 日</span>
            </template>
          </div>
          <div class="form-row" style="margin-top:12px;">
            <span class="form-label">结算截止日：</span>
            <template v-if="isCEO">
              <a-input-number v-model:value="settlementCutoff" :min="1" :max="15" style="width: 120px" />
              <span style="margin-left:8px;color:#888;">天前（发薪日前 N 天）</span>
            </template>
            <template v-else>
              <span class="readonly-value">发薪日前 {{ settlementCutoff }} 天</span>
            </template>
          </div>
          <div v-if="isCEO" class="form-actions">
            <a-button type="primary" :loading="savingPayrollCycle" data-catch="config-payroll-cycle-save-btn" @click="savePayrollCycle">
              保存
            </a-button>
          </div>
        </a-spin>
      </a-card>

      <!-- Section 6: Retention Period -->
      <a-card title="数据保留期" class="config-card">
        <a-spin :spinning="retentionLoading">
          <div class="form-row">
            <span class="form-label">全局保留期：</span>
            <template v-if="isCEO">
              <a-select v-model:value="retentionDays" style="width: 160px" data-catch="config-retention-select">
                <a-select-option :value="365">1 年（365 天）</a-select-option>
                <a-select-option :value="730">2 年（730 天）</a-select-option>
                <a-select-option :value="1095">3 年（1095 天，默认）</a-select-option>
                <a-select-option :value="1825">5 年（1825 天）</a-select-option>
              </a-select>
            </template>
            <template v-else>
              <span class="readonly-value">{{ retentionDays }} 天</span>
            </template>
          </div>
          <div class="form-hint">超过保留期的历史数据将在下次自动清理任务时删除，或可在数据保留页手动清理。</div>
          <div v-if="isCEO" class="form-actions">
            <a-button type="primary" :loading="savingRetention" data-catch="config-retention-save-btn" @click="saveRetentionPeriod">
              保存
            </a-button>
          </div>
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
  INJURY: '工伤',
  EXPENSE: '报销申请'
}

const flowColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '业务类型', dataIndex: 'businessType', key: 'businessType',
    customRender: ({ text }: { text: string }) => BUSINESS_TYPE_LABELS[text] ?? text },
  { title: '审批节点数', dataIndex: 'nodeCount', key: 'nodeCount', width: 110 },
  { title: '状态', dataIndex: 'isActive', key: 'isActive', width: 80,
    customRender: ({ text }: { text: boolean }) => text ? '启用' : '禁用' },
  { title: '操作', key: 'action', width: 100 }
]

interface FlowNode { nodeName: string; approverType: string; approverRef: string; skipCondition?: string | null }
const flowEditorOpen = ref(false)
const savingFlow = ref(false)
const editingBusinessType = ref('')
const editingNodes = ref<FlowNode[]>([])

async function openFlowEditor(businessType: string) {
  editingBusinessType.value = businessType
  flowEditorOpen.value = true
  try {
    const data = await request<{ flow: { businessType: string }, nodes: FlowNode[] }>({ url: `/approval/flows/${businessType}` })
    editingNodes.value = (data?.nodes ?? []).map(n => ({ ...n, approverRef: n.approverRef ?? '' }))
  } catch {
    editingNodes.value = []
  }
}

function addNode() {
  editingNodes.value.push({ nodeName: '', approverType: 'ROLE', approverRef: '', skipCondition: null })
}

function removeNode(idx: number) {
  editingNodes.value.splice(idx, 1)
}

async function saveFlow() {
  if (editingNodes.value.some(n => !n.nodeName?.trim() || !n.approverType)) {
    message.warning('节点名和审批人类型必填')
    return
  }
  savingFlow.value = true
  try {
    await request({
      url: `/approval/flows/${editingBusinessType.value}`,
      method: 'PUT',
      body: { nodes: editingNodes.value }
    })
    message.success('已保存')
    flowEditorOpen.value = false
    await loadApprovalFlows()
  } catch {} finally { savingFlow.value = false }
}

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

// Payroll Bonus Approval Config
const bonusConfigLoading = ref(false)
const bonusConfigSaving = ref(false)
const bonusApprovalRequired = ref(false)

async function loadBonusApprovalConfig() {
  bonusConfigLoading.value = true
  try {
    const data = await request<{ approvalRequired: boolean }>({
      url: '/payroll/bonus-approval-config'
    })
    bonusApprovalRequired.value = !!data.approvalRequired
  } catch {
    bonusApprovalRequired.value = false
  } finally {
    bonusConfigLoading.value = false
  }
}

async function saveBonusApprovalConfig() {
  if (!isCEO.value) return
  bonusConfigSaving.value = true
  try {
    await request({
      url: '/payroll/bonus-approval-config',
      method: 'PUT',
      body: { approvalRequired: bonusApprovalRequired.value }
    })
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  } finally {
    bonusConfigSaving.value = false
  }
}

// Company Name Config
const companyNameLoading = ref(false)
const savingCompanyName = ref(false)
const companyName = ref<string>('')

async function loadCompanyName() {
  companyNameLoading.value = true
  try {
    const data = await request<{ companyName: string | null }>({ url: '/config/company-name' })
    companyName.value = data.companyName ?? ''
  } catch {
    // ignore
  } finally {
    companyNameLoading.value = false
  }
}

async function saveCompanyName() {
  if (!isCEO.value) return
  savingCompanyName.value = true
  try {
    await request({ url: '/config/company-name', method: 'PUT', body: { companyName: companyName.value } })
    message.success('企业名称已保存')
    // Update shared state so sidebar logo reflects the change immediately
    const sharedCompanyName = useState<string | null>('company-name')
    sharedCompanyName.value = companyName.value || null
  } catch {
    message.error('保存失败')
  } finally {
    savingCompanyName.value = false
  }
}

// Payroll Cycle Config
const payrollCycleLoading = ref(false)
const savingPayrollCycle = ref(false)
const payrollPayday = ref<number>(15)
const settlementCutoff = ref<number>(5)

async function loadPayrollCycle() {
  payrollCycleLoading.value = true
  try {
    const data = await request<{ payday: number; settlementCutoff: number }>({ url: '/config/payroll-cycle' })
    payrollPayday.value = data.payday ?? 15
    settlementCutoff.value = data.settlementCutoff ?? 5
  } catch {
    // keep defaults
  } finally {
    payrollCycleLoading.value = false
  }
}

async function savePayrollCycle() {
  if (!isCEO.value) return
  savingPayrollCycle.value = true
  try {
    await request({ url: '/config/payroll-cycle', method: 'PUT', body: { payday: payrollPayday.value, settlementCutoff: settlementCutoff.value } })
    message.success('薪资周期已保存')
  } catch {
    message.error('保存失败')
  } finally {
    savingPayrollCycle.value = false
  }
}

// Data Retention Config
const retentionLoading = ref(false)
const savingRetention = ref(false)
const retentionDays = ref<number>(1095)

async function loadRetentionPeriod() {
  retentionLoading.value = true
  try {
    const data = await request<{ days: number }>({ url: '/config/retention-period' })
    retentionDays.value = data.days ?? 1095
  } catch {
    // keep default
  } finally {
    retentionLoading.value = false
  }
}

async function saveRetentionPeriod() {
  if (!isCEO.value) return
  savingRetention.value = true
  try {
    await request({ url: '/config/retention-period', method: 'PUT', body: { days: retentionDays.value } })
    message.success('保留期已更新')
  } catch {
    message.error('保存失败')
  } finally {
    savingRetention.value = false
  }
}

// Load data on mount
onMounted(() => {
  loadAttendanceConfig()
  loadApprovalFlows()
  loadBonusApprovalConfig()
  loadCompanyName()
  loadPayrollCycle()
  loadRetentionPeriod()
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

.form-hint {
  color: #999;
  font-size: 12px;
  margin: 4px 0 0 116px;
  max-width: 420px;
  line-height: 1.5;
}

.flow-node-row {
  display: flex; gap: 8px; align-items: center;
  padding: 6px 0; border-bottom: 1px solid #f0f0f0;
}

.node-no { color: #999; width: 30px; }
</style>
