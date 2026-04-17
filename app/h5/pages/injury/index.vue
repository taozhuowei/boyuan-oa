<template>
  <!-- 工伤补偿申请页（劳工专用，含 PM 代录入口）
       数据来源：POST /api/logs/injury（提交工伤申报）
                GET  /api/logs/records（查看历史）
                POST /api/injury-claims（财务录入理赔，仅 finance 角色可见） -->
  <div class="injury-page">
    <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 class="page-title" style="margin:0;">工伤补偿</h2>
      <a-space>
        <!-- 劳工/PM 均可发起（PM 代录使用下面的 proxyFor 字段） -->
        <a-button type="primary" @click="openApply" data-catch="injury-apply-btn">+ 发起申报</a-button>
        <!-- 财务：录入理赔按钮 -->
        <a-button v-if="isFinance" @click="showClaimModal = true; loadApprovedInjuries()" data-catch="injury-fill-amount-btn">录入理赔</a-button>
      </a-space>
    </div>

    <!-- 历史记录 -->
    <a-spin :spinning="loading">
      <a-card v-if="records.length === 0 && !loading">
        <a-empty description="暂无工伤申报记录" />
      </a-card>
      <a-list v-else :data-source="records" :bordered="false">
        <template #renderItem="{ item }">
          <a-list-item :data-catch="item.status === 'APPROVED' ? 'injury-row-archived' : undefined">
            <a-list-item-meta
              :title="`工伤申报 — ${item.formNo}`"
              :description="`提交：${formatTime(item.createdAt)}${item.formData?.injuryDate ? ' | 受伤日期：' + item.formData.injuryDate : ''}`"
            />
            <a-space>
              <a-tag :color="statusColor(item.status)">{{ statusLabel(item.status) }}</a-tag>
              <a-button
                v-if="isFinance && item.status === 'APPROVED'"
                size="small"
                type="link"
                @click="showClaimModal = true; loadApprovedInjuries()"
                data-catch="injury-fill-amount-btn"
              >录入金额</a-button>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
      <!-- TODO data-catch: injury-approve-btn — element not found -->
      <!-- TODO data-catch: injury-approve-modal-ok — element not found -->
    </a-spin>

    <!-- 工伤申报弹窗（不含补偿金额） -->
    <a-modal
      v-model:open="showApplyModal"
      title="发起工伤补偿申报"
      @ok="doApply"
      :confirm-loading="applying"
      @cancel="resetApplyForm"
      ok-text="提交"
      :ok-button-props="({ 'data-catch': 'injury-apply-modal-submit' } as any)"
    >
      <a-form :model="applyForm" layout="vertical">
        <!-- PM 代录：选择受伤员工 -->
        <a-form-item v-if="isPm" label="代录员工（留空则表示本人发起）">
          <a-select
            v-model:value="applyForm.proxyEmployeeId"
            placeholder="选择被代录员工"
            allow-clear
            :options="workerOptions"
            show-search
            option-filter-prop="label"
            data-catch="injury-proxy-select"
          />
        </a-form-item>

        <a-form-item label="受伤日期" required>
          <a-date-picker v-model:value="applyForm.injuryDate" style="width:100%;" placeholder="请选择日期" data-catch="injury-date" />
        </a-form-item>

        <a-form-item label="受伤时间" required>
          <a-time-picker v-model:value="applyForm.injuryTime" format="HH:mm" style="width:100%;" placeholder="请选择受伤时间" data-catch="injury-time" />
        </a-form-item>

        <a-form-item label="事故经过" required>
          <a-textarea
            v-model:value="applyForm.description"
            :rows="4"
            placeholder="请描述事故发生经过和受伤部位"
            data-catch="injury-accident"
          />
        </a-form-item>

        <a-form-item label="医生诊断结果" required>
          <a-textarea v-model:value="applyForm.medicalDiagnosis" :rows="3" placeholder="请填写医生诊断结论（如骨折、软组织挫伤等）" data-catch="injury-diagnosis" />
        </a-form-item>

        <a-form-item label="附件（受伤照片/医疗证明）">
          <customized-file-upload
            ref="injuryFileRef"
            business-type="INJURY"
            :max-count="5"
            accept="image/*,.pdf"
            hint="可上传照片或医疗证明，最多 5 个"
            @change="onInjuryFilesChange"
            data-catch="injury-file-upload"
          />
        </a-form-item>

        <a-form-item label="备注">
          <a-textarea v-model:value="applyForm.remark" :rows="2" placeholder="其他说明（可选）" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 财务录入理赔弹窗 -->
    <a-modal
      v-if="isFinance"
      v-model:open="showClaimModal"
      title="录入工伤理赔"
      @ok="doCreateClaim"
      :confirm-loading="claiming"
      @cancel="resetClaimForm"
      ok-text="提交理赔"
      :ok-button-props="({ 'data-catch': 'injury-amount-submit' } as any)"
    >
      <a-form :model="claimForm" layout="vertical">
        <a-form-item label="选择已通过的申报单" required>
          <a-select
            v-model:value="claimForm.formRecordId"
            placeholder="选择工伤申报单"
            show-search
            option-filter-prop="label"
            :options="approvedInjuryRecords.map(r => ({ label: r.formNo + (r.submitter ? ' — ' + r.submitter : ''), value: r.id }))"
            @change="claimForm.formRecordId = $event as number"
          />
        </a-form-item>
        <a-form-item label="受伤日期" required>
          <a-date-picker v-model:value="claimForm.injuryDate" style="width:100%;" placeholder="请选择日期" />
        </a-form-item>
        <a-form-item label="理赔金额（元）" required>
          <a-input-number
            v-model:value="claimForm.compensationAmount"
            :min="0"
            :precision="2"
            style="width:100%;"
            placeholder="0.00"
            data-catch="injury-amount-input"
          />
        </a-form-item>
        <a-form-item label="财务备注">
          <a-textarea v-model:value="claimForm.financeNote" :rows="2" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 工伤补偿申请页 — injury/index.vue
 * 劳工申报（不含金额）→ PM 初审 → CEO 终审；PM 可代录（触发 skipCondition）
 * 财务角色可录入理赔（POST /injury-claims）
 */
import { ref, computed, onMounted, h } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import type { Dayjs } from 'dayjs'

interface InjuryRecord {
  id: number
  formNo: string
  formTypeName: string
  status: string
  createdAt: string
  formData?: { injuryDate?: string; description?: string }
}

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isFinance = computed(() => role.value === 'finance')
const isPm = computed(() => role.value === 'project_manager')

const loading = ref(false)
const applying = ref(false)
const claiming = ref(false)

const records = ref<InjuryRecord[]>([])
const workerOptions = ref<{ label: string; value: number }[]>([])

const showApplyModal = ref(false)
const showClaimModal = ref(false)
const injuryFileRef = ref<{ clear: () => void } | null>(null)

const approvedInjuryRecords = ref<{ id: number; formNo: string; submitter?: string }[]>([])
const selectedApprovedRecord = ref<{ id: number; formNo: string; employeeId?: number } | null>(null)

const applyForm = ref({
  proxyEmployeeId: undefined as number | undefined,
  injuryDate: undefined as Dayjs | undefined,
  injuryTime: undefined as Dayjs | undefined,
  description: '',
  medicalDiagnosis: '',
  accidentDescription: '',
  remark: '',
  attachmentIds: [] as number[]
})

const claimForm = ref({
  formRecordId: undefined as number | undefined,
  employeeId: undefined as number | undefined,
  injuryDate: undefined as Dayjs | undefined,
  compensationAmount: undefined as number | undefined,
  financeNote: ''
})

function openApply() {
  showApplyModal.value = true
  if (isPm.value) loadWorkers()
}

async function loadWorkers() {
  try {
    const res = await request<{ content: { id: number; name: string }[] }>(
      { url: '/employees?page=0&size=200', method: 'GET' }
    )
    workerOptions.value = (res.content || []).map((e: { id: number; name: string }) => ({ label: e.name, value: e.id }))
  } catch { /* 加载失败不阻断流程 */ }
}

async function loadApprovedInjuries() {
  try {
    const res = await request<{ id: number; formNo: string; formData?: Record<string, unknown>; submitter?: string }[]>(
      { url: '/logs/records?status=APPROVED', method: 'GET' }
    )
    approvedInjuryRecords.value = (res as typeof res)
      .filter((r: { formNo?: string }) => r.formNo?.startsWith('INJ'))
      .map(r => ({ id: r.id, formNo: r.formNo, submitter: r.submitter }))
  } catch {
    approvedInjuryRecords.value = []
  }
}

async function loadRecords() {
  loading.value = true
  try {
    const res = await request<InjuryRecord[]>({ url: '/logs/records', method: 'GET' })
    records.value = (res as InjuryRecord[]).filter((r: InjuryRecord) => r.formTypeName === '工伤补偿' || r.formNo?.startsWith('INJ'))
  } catch {
    message.error('加载记录失败')
  } finally {
    loading.value = false
  }
}

function onInjuryFilesChange(files: { attachmentId: number }[]) {
  applyForm.value.attachmentIds = files.map(f => f.attachmentId)
}

async function doApply() {
  if (!applyForm.value.injuryDate) {
    message.warning('请选择受伤日期')
    return
  }
  if (!applyForm.value.description.trim()) {
    message.warning('请填写伤情描述')
    return
  }
  if (!applyForm.value.injuryTime) {
    message.warning('请选择受伤时间')
    return
  }
  if (!applyForm.value.medicalDiagnosis.trim()) {
    message.warning('请填写医生诊断结果')
    return
  }
  applying.value = true
  try {
    const formData: Record<string, unknown> = {
      injuryDate: applyForm.value.injuryDate.format('YYYY-MM-DD'),
      accidentDescription: applyForm.value.description,
      injuryTime: applyForm.value.injuryTime.format('HH:mm'),
      medicalDiagnosis: applyForm.value.medicalDiagnosis,
      attachmentIds: applyForm.value.attachmentIds
    }
    if (applyForm.value.proxyEmployeeId) {
      formData.proxyEmployeeId = applyForm.value.proxyEmployeeId
    }
    await request({
      url: '/logs/injury',
      method: 'POST',
      body: { formData, remark: applyForm.value.remark }
    })
    message.success('工伤申报已提交，等待审批')
    showApplyModal.value = false
    resetApplyForm()
    await loadRecords()
  } catch {
    message.error('提交失败')
  } finally {
    applying.value = false
  }
}

function resetApplyForm() {
  applyForm.value = { proxyEmployeeId: undefined, injuryDate: undefined, injuryTime: undefined, description: '', medicalDiagnosis: '', accidentDescription: '', remark: '', attachmentIds: [] }
  injuryFileRef.value?.clear()
}

async function doCreateClaim() {
  if (!claimForm.value.formRecordId ||
      !claimForm.value.injuryDate || !claimForm.value.compensationAmount) {
    message.warning('请填写完整理赔信息')
    return
  }
  claiming.value = true
  try {
    await request({
      url: '/injury-claims',
      method: 'POST',
      body: {
        formRecordId: claimForm.value.formRecordId,
        employeeId: claimForm.value.employeeId,
        injuryDate: claimForm.value.injuryDate.format('YYYY-MM-DD'),
        compensationAmount: claimForm.value.compensationAmount,
        financeNote: claimForm.value.financeNote
      }
    })
    message.success(h('span', { 'data-catch': 'injury-amount-success' }, '理赔已录入'))
    showClaimModal.value = false
    resetClaimForm()
  } catch {
    message.error('录入失败')
  } finally {
    claiming.value = false
  }
}

function resetClaimForm() {
  claimForm.value = { formRecordId: undefined, employeeId: undefined, injuryDate: undefined, compensationAmount: undefined, financeNote: '' }
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '待审批', APPROVING: '审批中', APPROVED: '已通过', REJECTED: '已驳回'
  }
  return map[status] ?? status
}

function statusColor(status: string) {
  const map: Record<string, string> = {
    PENDING: 'orange', APPROVING: 'blue', APPROVED: 'green', REJECTED: 'red'
  }
  return map[status] ?? 'default'
}

function formatTime(t: string) {
  return t ? t.substring(0, 16).replace('T', ' ') : ''
}

onMounted(() => loadRecords())
</script>

<style scoped>
.injury-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}

/* Removed flex constraints to allow natural content flow */
</style>
