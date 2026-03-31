<template>
  <view class="forms-page oa-page">
    <view class="forms-hero oa-surface-hero">
      <view class="hero-copy">
        <text class="hero-kicker">表单中心</text>
        <text class="hero-title">统一发起业务单据，按角色跟进审批闭环</text>
        <text class="hero-subtitle">
          {{ heroSubtitle }}
        </text>
      </view>

      <view class="hero-aside">
        <view class="hero-metric">
          <text class="metric-label">我的历史单据</text>
          <text class="metric-value">{{ historyRecords.length }}</text>
          <text class="metric-note">已归档、审批中与已驳回统一查看</text>
        </view>
        <view class="hero-metric" v-if="canApprove">
          <text class="metric-label">待我审批</text>
          <text class="metric-value">{{ todoRecords.length }}</text>
          <text class="metric-note">项目经理处理初审，CEO 处理终审</text>
        </view>
      </view>
    </view>

    <view class="forms-shell">
      <view class="forms-sidebar oa-panel">
        <view class="sidebar-block">
          <view class="section-head">
            <text class="section-title">可发起单据</text>
            <text class="section-note">{{ availableFormOptions.length }} 种</text>
          </view>
          <view class="type-grid">
            <view
              v-for="item in availableFormOptions"
              :key="item.code"
              class="type-card"
              :class="{ active: selectedFormType === item.code }"
              @click="handleSelectFormType(item.code)"
            >
              <text class="type-name">{{ item.name }}</text>
              <text class="type-description">{{ item.description }}</text>
            </view>
          </view>
        </view>

        <view class="sidebar-block" v-if="canApprove">
          <view class="section-head">
            <text class="section-title">审批待办</text>
            <text class="section-note">{{ todoRecords.length }} 项</text>
          </view>
          <view v-if="todoRecords.length" class="record-list">
            <view
              v-for="item in todoRecords"
              :key="item.id"
              class="record-card"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="handleSelectRecord(item.id)"
            >
              <text class="record-title">{{ item.formTypeName }}</text>
              <text class="record-meta">{{ item.submitter }} · {{ item.currentNode }}</text>
              <text class="record-tag">{{ statusTextMap[item.status] ?? item.status }}</text>
            </view>
          </view>
          <view v-else class="empty-block">当前没有待审批事项。</view>
        </view>

        <view class="sidebar-block">
          <view class="section-head">
            <text class="section-title">我的历史</text>
            <text class="section-note">最近 {{ historyRecords.length }} 条</text>
          </view>
          <view v-if="historyRecords.length" class="record-list">
            <view
              v-for="item in historyRecords"
              :key="item.id"
              class="record-card"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="handleSelectRecord(item.id)"
            >
              <text class="record-title">{{ item.formTypeName }}</text>
              <text class="record-meta">{{ item.submitTimeText }}</text>
              <text class="record-tag">{{ statusTextMap[item.status] ?? item.status }}</text>
            </view>
          </view>
          <view v-else class="empty-block">提交后的单据会显示在这里。</view>
        </view>
      </view>

      <view class="forms-main">
        <view class="oa-panel form-panel">
          <view class="section-head">
            <view>
              <text class="section-title">{{ currentFormLabel }}</text>
              <text class="section-note-block">{{ currentFormDescription }}</text>
            </view>
            <button class="ghost-button" @click="goBack">返回工作台</button>
          </view>

          <view v-if="formConfig" class="field-list">
            <view v-for="field in orderedFields" :key="field.fieldCode" class="field-block">
              <view class="field-row">
                <text class="field-label">{{ field.fieldName }}</text>
                <text v-if="field.required" class="field-required">必填</text>
              </view>

              <picker
                v-if="field.fieldType === 'SELECT'"
                class="picker-shell"
                :range="field.options ?? []"
                @change="handleSelectOption(field.fieldCode, field.options ?? [], $event)"
              >
                <view class="picker-value">
                  {{ stringifyValue(formValues[field.fieldCode]) || field.placeholder || '请选择' }}
                </view>
              </picker>

              <textarea
                v-else-if="field.fieldType === 'TEXTAREA'"
                v-model="formValues[field.fieldCode]"
                class="field-textarea"
                :placeholder="field.placeholder || '请输入内容'"
              />

              <input
                v-else
                v-model="formValues[field.fieldCode]"
                class="field-input"
                :type="resolveInputType(field.fieldType)"
                :placeholder="field.placeholder || '请输入内容'"
              />
            </view>

            <view class="field-block">
              <view class="field-row">
                <text class="field-label">备注说明</text>
                <text class="field-required muted">选填</text>
              </view>
              <textarea
                v-model="remark"
                class="field-textarea compact"
                placeholder="补充审批背景、项目说明或提醒事项"
              />
            </view>

            <view class="flow-block">
              <text class="flow-title">审批链路</text>
              <view class="flow-list">
                <view v-for="node in formConfig.flow.nodes" :key="node.order" class="flow-item">
                  <text class="flow-order">0{{ node.order }}</text>
                  <view class="flow-copy">
                    <text class="flow-name">{{ node.nodeName }}</text>
                    <text class="flow-role">{{ roleTextMap[node.handlerRole] ?? node.handlerRole }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="action-row">
              <button class="ghost-button" @click="resetForm">清空表单</button>
              <button class="primary-button" @click="handleSubmit">提交单据</button>
            </view>
          </view>

          <view v-else class="empty-block">正在加载表单配置...</view>
        </view>

        <view class="oa-panel detail-panel">
          <view class="section-head">
            <view>
              <text class="section-title">单据详情</text>
              <text class="section-note-block">支持查看详情、审批轨迹与当前节点状态。</text>
            </view>
          </view>

          <view v-if="selectedRecord" class="detail-body">
            <view class="detail-summary">
              <view>
                <text class="detail-title">{{ selectedRecord.formTypeName }}</text>
                <text class="detail-meta">
                  {{ selectedRecord.submitter }} · {{ selectedRecord.department }} · {{ selectedRecord.submitTimeText }}
                </text>
              </view>
              <text class="detail-status">{{ statusTextMap[selectedRecord.status] ?? selectedRecord.status }}</text>
            </view>

            <view class="detail-grid">
              <view v-for="item in detailEntries" :key="item.label" class="detail-item">
                <text class="detail-key">{{ item.label }}</text>
                <text class="detail-value">{{ item.value }}</text>
              </view>
            </view>

            <view v-if="selectedRecord.history.length" class="timeline-block">
              <text class="timeline-title">审批记录</text>
              <view class="timeline-list">
                <view v-for="item in selectedRecord.history" :key="`${item.nodeName}-${item.time}`" class="timeline-item">
                  <text class="timeline-node">{{ item.nodeName }}</text>
                  <view class="timeline-copy">
                    <text class="timeline-meta">
                      {{ item.approver }} · {{ actionTextMap[item.action] ?? item.action }} · {{ formatTime(item.time) }}
                    </text>
                    <text class="timeline-comment">{{ item.comment || '无补充说明' }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view v-if="canReviewSelected" class="review-box">
              <textarea
                v-model="reviewComment"
                class="field-textarea compact"
                placeholder="填写审批说明，便于提交人查看处理意见"
              />
              <view class="action-row compact">
                <button class="ghost-button danger" @click="handleReview('reject')">驳回单据</button>
                <button class="primary-button" @click="handleReview('approve')">审批通过</button>
              </view>
            </view>
          </view>

          <view v-else class="empty-block">从左侧选择一条待办或历史记录后，可在此查看详情。</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'
import {
  approveFormRecord,
  fetchFormConfig,
  fetchFormDetail,
  fetchFormHistory,
  fetchTodoForms,
  getAvailableFormOptions,
  rejectFormRecord,
  submitForm,
  type FormConfig,
  type FormField,
  type FormRecord
} from '../../utils/forms'

interface DisplayRecord extends FormRecord {
  submitTimeText: string
}

const roleTextMap: Record<string, string> = {
  EMPLOYEE: '员工',
  WORKER: '劳工',
  PROJECT_MANAGER: '项目经理',
  CEO: '首席经营者'
}

const statusTextMap: Record<string, string> = {
  PENDING: '待初审',
  APPROVING: '待终审',
  ARCHIVED: '已归档',
  REJECTED: '已驳回'
}

const actionTextMap: Record<string, string> = {
  APPROVE: '审批通过',
  REJECT: '审批驳回'
}

const userStore = useUserStore()

const selectedFormType = ref('LEAVE')
const formConfig = ref<FormConfig | null>(null)
const remark = ref('')
const reviewComment = ref('')
const todoRecords = ref<DisplayRecord[]>([])
const historyRecords = ref<DisplayRecord[]>([])
const selectedRecord = ref<DisplayRecord | null>(null)
const formValues = reactive<Record<string, string>>({})

const activeUser = computed(() => {
  return (
    userStore.userInfo ?? {
      username: 'employee.demo',
      displayName: '张晓宁',
      role: 'employee',
      roleName: roleNameMap.employee,
      department: '综合管理部',
      employeeType: '普通员工',
      status: '在线值守'
    }
  )
})

const availableFormOptions = computed(() => getAvailableFormOptions(activeUser.value))
const currentFormOption = computed(
  () => availableFormOptions.value.find((item) => item.code === selectedFormType.value) ?? availableFormOptions.value[0]
)
const currentFormLabel = computed(() => currentFormOption.value?.name ?? '表单配置')
const currentFormDescription = computed(
  () => currentFormOption.value?.description ?? '根据业务类型自动加载字段和审批流程。'
)
const heroSubtitle = computed(() => {
  const roleName = activeUser.value.roleName ?? roleNameMap[activeUser.value.role] ?? '员工'
  return `${activeUser.value.displayName} · ${roleName} · ${activeUser.value.department}，在统一表单中心发起单据、查看处理进度与审批轨迹。`
})
const canApprove = computed(() => ['project_manager', 'ceo'].includes(activeUser.value.role))
const orderedFields = computed(() =>
  [...(formConfig.value?.fields ?? [])].sort((left, right) => left.order - right.order)
)
const detailEntries = computed(() => {
  if (!selectedRecord.value) {
    return []
  }

  return Object.entries(selectedRecord.value.formData ?? {}).map(([label, value]) => ({
    label,
    value: stringifyValue(value)
  }))
})
const canReviewSelected = computed(() => {
  if (!canApprove.value || !selectedRecord.value) {
    return false
  }

  const status = selectedRecord.value.status
  const role = activeUser.value.role

  return (role === 'project_manager' && status === 'PENDING') || (role === 'ceo' && status === 'APPROVING')
})

function withTimeText(records: FormRecord[]) {
  return records.map((item) => ({
    ...item,
    submitTimeText: formatTime(item.submitTime)
  }))
}

function formatTime(value: string) {
  if (!value) {
    return '未知时间'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

function stringifyValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join('、')
  }

  if (value === null || value === undefined || value === '') {
    return ''
  }

  return String(value)
}

function resolveInputType(fieldType: string) {
  if (fieldType === 'NUMBER') {
    return 'number'
  }

  return 'text'
}

function showToast(title: string, icon: 'success' | 'none' = 'none') {
  if (typeof uni === 'undefined') {
    return
  }

  uni.showToast({
    title,
    icon
  })
}

function resetFormValues(fields: FormField[]) {
  for (const key of Object.keys(formValues)) {
    delete formValues[key]
  }

  fields.forEach((field) => {
    formValues[field.fieldCode] = field.defaultValue ?? ''
  })
}

async function loadFormConfig() {
  formConfig.value = await fetchFormConfig(selectedFormType.value, userStore.token)
  resetFormValues(formConfig.value.fields)
  remark.value = ''
}

async function loadRecords() {
  const [todo, history] = await Promise.all([
    canApprove.value ? fetchTodoForms(userStore.token) : Promise.resolve([]),
    fetchFormHistory(userStore.token)
  ])

  todoRecords.value = withTimeText(todo)
  historyRecords.value = withTimeText(history)

  if (!selectedRecord.value) {
    const first = todoRecords.value[0] ?? historyRecords.value[0]
    if (first) {
      await handleSelectRecord(first.id)
    }
  }
}

async function handleSelectRecord(id: number) {
  const detail = await fetchFormDetail(id, userStore.token)
  selectedRecord.value = {
    ...detail,
    submitTimeText: formatTime(detail.submitTime)
  }
}

function handleSelectOption(fieldCode: string, options: string[], event: { detail: { value: string } }) {
  const index = Number(event.detail.value)
  formValues[fieldCode] = options[index] ?? ''
}

function normalizePayload() {
  return orderedFields.value.reduce<Record<string, unknown>>((result, field) => {
    const rawValue = formValues[field.fieldCode]
    const value = field.fieldType === 'NUMBER' && rawValue !== '' ? Number(rawValue) : rawValue
    result[field.fieldCode] = value
    return result
  }, {})
}

function validateForm() {
  for (const field of orderedFields.value) {
    if (!field.required) {
      continue
    }

    const value = stringifyValue(formValues[field.fieldCode]).trim()
    if (!value) {
      throw new Error(`请填写${field.fieldName}`)
    }
  }
}

async function handleSubmit() {
  try {
    validateForm()
    const response = await submitForm(selectedFormType.value, normalizePayload(), remark.value.trim(), userStore.token)
    await loadRecords()
    selectedRecord.value = {
      ...response,
      submitTimeText: formatTime(response.submitTime)
    }
    showToast('单据已提交', 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : '提交失败')
  }
}

async function handleReview(action: 'approve' | 'reject') {
  if (!selectedRecord.value) {
    return
  }

  try {
    const response =
      action === 'approve'
        ? await approveFormRecord(selectedRecord.value.id, reviewComment.value.trim(), userStore.token)
        : await rejectFormRecord(selectedRecord.value.id, reviewComment.value.trim(), userStore.token)

    selectedRecord.value = {
      ...response,
      submitTimeText: formatTime(response.submitTime)
    }
    reviewComment.value = ''
    await loadRecords()
    showToast(action === 'approve' ? '审批已通过' : '单据已驳回', 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : '审批失败')
  }
}

function resetForm() {
  resetFormValues(formConfig.value?.fields ?? [])
  remark.value = ''
}

function handleSelectFormType(code: string) {
  selectedFormType.value = code
}

function goBack() {
  if (typeof uni === 'undefined') {
    return
  }

  uni.navigateBack()
}

watch(
  availableFormOptions,
  (value) => {
    if (!value.some((item) => item.code === selectedFormType.value) && value[0]) {
      selectedFormType.value = value[0].code
    }
  },
  { immediate: true }
)

watch(
  selectedFormType,
  () => {
    loadFormConfig().catch(() => {
      showToast('表单配置加载失败')
    })
  },
  { immediate: true }
)

onMounted(() => {
  loadRecords().catch(() => {
    showToast('表单记录加载失败')
  })
})
</script>

<style lang="scss" scoped>
.forms-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
}

.forms-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(260px, 0.8fr);
  gap: 20px;
  margin-bottom: 18px;
  padding: clamp(22px, 3vw, 30px);
}

.hero-copy,
.hero-aside,
.forms-main {
  display: grid;
  gap: 16px;
}

.hero-kicker {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.72);
}

.hero-title {
  display: block;
  max-width: 16ch;
  font-family: var(--oa-font-display);
  font-size: clamp(28px, 3vw, 40px);
  line-height: 1.08;
  color: var(--oa-text-inverse);
}

.hero-subtitle {
  max-width: 60ch;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 250, 243, 0.86);
}

.hero-aside {
  align-content: start;
}

.hero-metric {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 240, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.18);
}

.metric-label,
.metric-note {
  display: block;
}

.metric-label {
  font-size: 12px;
  color: rgba(255, 247, 234, 0.72);
}

.metric-value {
  display: block;
  margin: 8px 0 10px;
  font-family: var(--oa-font-display);
  font-size: 34px;
  color: var(--oa-text-inverse);
}

.metric-note {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 250, 243, 0.84);
}

.forms-shell {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 18px;
}

.forms-sidebar,
.form-panel,
.detail-panel {
  display: grid;
  gap: 18px;
}

.sidebar-block {
  display: grid;
  gap: 14px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.section-title {
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.section-note,
.section-note-block {
  font-size: 12px;
  color: var(--oa-text-muted);
}

.section-note-block {
  display: block;
  margin-top: 6px;
  line-height: 1.7;
}

.type-grid,
.record-list,
.field-list,
.flow-list,
.detail-grid,
.timeline-list {
  display: grid;
  gap: 12px;
}

.type-card,
.record-card,
.detail-item,
.flow-item,
.timeline-item {
  border-radius: var(--oa-radius-md);
  border: 1px solid var(--oa-border-strong);
}

.type-card,
.record-card {
  padding: 14px 15px;
  background: var(--oa-surface-soft);
}

.type-card.active,
.record-card.active {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
  box-shadow: 0 12px 24px rgba(121, 58, 27, 0.08);
}

.type-name,
.record-title,
.detail-title,
.flow-title,
.timeline-title {
  display: block;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.type-description,
.record-meta,
.detail-meta,
.timeline-meta,
.timeline-comment {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--oa-text-secondary);
}

.record-tag,
.detail-status,
.field-required {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(164, 91, 56, 0.12);
  color: var(--oa-accent-deep);
  font-size: 12px;
}

.field-required.muted {
  background: rgba(63, 83, 112, 0.08);
  color: var(--oa-text-muted);
}

.field-list,
.detail-body {
  display: grid;
  gap: 16px;
}

.field-block,
.flow-block,
.timeline-block,
.review-box {
  display: grid;
  gap: 10px;
}

.field-row,
.detail-summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.field-label,
.detail-key,
.flow-order,
.timeline-node {
  color: var(--oa-text-primary);
  font-size: 13px;
}

.field-input,
.field-textarea,
.picker-shell {
  width: 100%;
  border-radius: var(--oa-radius-md);
  border: 1px solid var(--oa-border-strong);
  background: var(--oa-surface-soft);
  color: var(--oa-text-primary);
  font-size: 14px;
}

.field-input,
.picker-shell {
  min-height: 48px;
  padding: 0 14px;
}

.picker-shell {
  display: flex;
  align-items: center;
}

.picker-value {
  line-height: 48px;
  color: var(--oa-text-primary);
}

.field-textarea {
  min-height: 112px;
  padding: 14px;
}

.field-textarea.compact {
  min-height: 96px;
}

.flow-list {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.flow-item {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(180deg, rgba(255, 248, 242, 0.92) 0%, rgba(247, 240, 234, 0.92) 100%);
}

.flow-order {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(164, 91, 56, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.flow-role {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.action-row.compact {
  justify-content: flex-start;
}

.primary-button,
.ghost-button {
  min-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
}

.primary-button {
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  box-shadow: var(--oa-shadow-accent);
}

.ghost-button {
  background: rgba(255, 247, 240, 0.72);
  color: var(--oa-text-primary);
  border: 1px solid rgba(151, 167, 186, 0.24);
}

.ghost-button.danger {
  color: #9b4239;
}

.detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item {
  padding: 14px;
  background: rgba(255, 249, 243, 0.72);
}

.detail-value {
  display: block;
  margin-top: 8px;
  color: var(--oa-text-primary);
  line-height: 1.7;
}

.timeline-item {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  background: rgba(249, 243, 237, 0.72);
}

.empty-block {
  padding: 18px;
  border-radius: var(--oa-radius-md);
  background: rgba(255, 250, 246, 0.76);
  border: 1px dashed rgba(162, 177, 196, 0.36);
  color: var(--oa-text-secondary);
  line-height: 1.7;
}

@media (max-width: 1120px) {
  .forms-hero,
  .forms-shell,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .forms-page {
    padding: 16px;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .field-row,
  .detail-summary,
  .action-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .timeline-item {
    grid-template-columns: 1fr;
  }
}
</style>
