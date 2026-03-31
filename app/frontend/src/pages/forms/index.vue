<template>
  <view class="page forms-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="assignment" :size="28" />
          <text class="hero-title">表单中心</text>
        </view>
        <text class="hero-subtitle">统一发起业务单据，按角色跟进审批闭环</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ historyRecords.length }}</text>
          <text class="stat-label">历史单据</text>
        </view>
        <view v-if="canApprove" class="hero-stat">
          <text class="stat-num">{{ todoRecords.length }}</text>
          <text class="stat-label">待审批</text>
        </view>
      </view>
    </view>

    <view class="forms-container">
      <!-- 左侧列表 -->
      <view class="card sidebar">
        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="folder" :size="16" />
              <text>可发起单据</text>
            </view>
            <Badge variant="info">{{ availableFormOptions.length }}</Badge>
          </view>
          <view class="type-list">
            <view
              v-for="item in availableFormOptions"
              :key="item.code"
              class="type-item"
              :class="{ active: selectedFormType === item.code }"
              @click="handleSelectFormType(item.code)"
            >
              <Icon :name="item.icon || 'assignment'" :size="18" />
              <view class="type-info">
                <text class="type-name">{{ item.name }}</text>
                <text class="type-desc">{{ item.description }}</text>
              </view>
            </view>
          </view>
        </view>

        <view v-if="canApprove" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="schedule" :size="16" />
              <text>审批待办</text>
            </view>
            <Badge v-if="todoRecords.length" variant="warning">{{ todoRecords.length }}</Badge>
          </view>
          <view v-if="todoRecords.length" class="record-list">
            <view
              v-for="item in todoRecords"
              :key="item.id"
              class="record-item"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="handleSelectRecord(item.id)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.formTypeName }}</text>
                <text class="record-meta">{{ item.submitter }} · {{ item.currentNode }}</text>
              </view>
              <Badge :variant="badgeVariant(item.status)">{{ statusTextMap[item.status] }}</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待审批事项" />
        </view>

        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="receipt" :size="16" />
              <text>我的历史</text>
            </view>
          </view>
          <view v-if="historyRecords.length" class="record-list">
            <view
              v-for="item in historyRecords"
              :key="item.id"
              class="record-item"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="handleSelectRecord(item.id)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.formTypeName }}</text>
                <text class="record-meta">{{ item.submitTimeText }}</text>
              </view>
              <Badge :variant="badgeVariant(item.status)">{{ statusTextMap[item.status] }}</Badge>
            </view>
          </view>
          <Empty v-else text="暂无历史记录" />
        </view>
      </view>

      <!-- 右侧主内容 -->
      <view class="main-content">
        <!-- 表单填写 -->
        <view class="card form-card">
          <view class="card-header">
            <view class="card-header-title">
              <text class="card-title">{{ currentFormLabel }}</text>
              <text class="card-subtitle">{{ currentFormDescription }}</text>
            </view>
            <Button variant="ghost" icon="arrow-back" @click="goBack">返回</Button>
          </view>

          <view v-if="formConfig" class="form-body">
            <view class="form-fields">
              <view v-for="field in orderedFields" :key="field.fieldCode" class="field">
                <view class="field-label-row">
                  <text class="field-label">{{ field.fieldName }}</text>
                  <text v-if="field.required" class="field-required">*</text>
                </view>

                <picker
                  v-if="field.fieldType === 'SELECT'"
                  class="field-picker"
                  :range="field.options ?? []"
                  @change="handleSelectOption(field.fieldCode, field.options ?? [], $event)"
                >
                  <view class="picker-display">
                    <text>{{ stringifyValue(formValues[field.fieldCode]) || field.placeholder || '请选择' }}</text>
                    <Icon name="arrow-forward" :size="14" />
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

              <view class="field">
                <view class="field-label-row">
                  <text class="field-label">备注说明</text>
                  <text class="field-optional">选填</text>
                </view>
                <textarea
                  v-model="remark"
                  class="field-textarea"
                  placeholder="补充审批背景、项目说明或提醒事项"
                />
              </view>
            </view>

            <view class="flow-section">
              <text class="flow-title">审批链路</text>
              <view class="flow-list">
                <view v-for="node in formConfig.flow.nodes" :key="node.order" class="flow-item">
                  <view class="flow-order">{{ node.order }}</view>
                  <view class="flow-info">
                    <text class="flow-name">{{ node.nodeName }}</text>
                    <text class="flow-role">{{ roleTextMap[node.handlerRole] ?? node.handlerRole }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view class="form-actions">
              <Button variant="ghost" @click="resetForm">重置</Button>
              <Button variant="primary" icon="check" @click="handleSubmit">提交单据</Button>
            </view>
          </view>

          <Empty v-else text="正在加载表单配置..." />
        </view>

        <!-- 单据详情 -->
        <view class="card detail-card">
          <view class="card-header">
            <view class="card-header-title">
              <text class="card-title">单据详情</text>
              <text class="card-subtitle">查看审批轨迹与当前节点状态</text>
            </view>
          </view>

          <view v-if="selectedRecord" class="detail-body">
            <view class="detail-header">
              <view class="detail-main">
                <text class="detail-title">{{ selectedRecord.formTypeName }}</text>
                <text class="detail-meta">{{ selectedRecord.submitter }} · {{ selectedRecord.department }} · {{ selectedRecord.submitTimeText }}</text>
              </view>
              <Badge size="lg" :variant="badgeVariant(selectedRecord.status)">{{ statusTextMap[selectedRecord.status] }}</Badge>
            </view>

            <view class="detail-grid">
              <view v-for="item in detailEntries" :key="item.label" class="detail-item">
                <text class="detail-item-label">{{ item.label }}</text>
                <text class="detail-item-value">{{ item.value }}</text>
              </view>
            </view>

            <view v-if="selectedRecord.history.length" class="timeline-section">
              <text class="timeline-title">审批记录</text>
              <view class="timeline-list">
                <view v-for="item in selectedRecord.history" :key="`${item.nodeName}-${item.time}`" class="timeline-item">
                  <view class="timeline-dot" />
                  <view class="timeline-content">
                    <view class="timeline-header">
                      <text class="timeline-node">{{ item.nodeName }}</text>
                      <text class="timeline-action" :class="item.action">{{ actionTextMap[item.action] ?? item.action }}</text>
                    </view>
                    <text class="timeline-meta">{{ item.approver }} · {{ formatTime(item.time) }}</text>
                    <text v-if="item.comment" class="timeline-comment">{{ item.comment }}</text>
                  </view>
                </view>
              </view>
            </view>

            <view v-if="canReviewSelected" class="review-section">
              <textarea
                v-model="reviewComment"
                class="field-textarea"
                placeholder="填写审批说明，便于提交人查看处理意见"
              />
              <view class="review-actions">
                <Button variant="danger" icon="cancel" @click="handleReview('reject')">驳回</Button>
                <Button variant="primary" icon="check-circle" @click="handleReview('approve')">通过</Button>
              </view>
            </view>
          </view>

          <Empty v-else text="从左侧选择一条记录查看详情" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'
import { Icon, Button, Badge, Empty } from '../../components/ui'
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

const badgeVariant = (status: string) => {
  switch (status) {
    case 'ARCHIVED': return 'success'
    case 'REJECTED': return 'danger'
    case 'APPROVING': return 'warning'
    default: return 'default'
  }
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
  uni.showToast({ title, icon })
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
  padding: 16px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  border-radius: var(--radius-lg);
  color: var(--on-primary);
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  gap: 24px;
}

.hero-stat {
  text-align: center;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  display: block;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.forms-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
}

.card {
  background: var(--surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:not(:last-child) {
    border-bottom: 1px solid var(--surface-high);
    padding-bottom: 16px;
  }
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--on-surface);
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  background: var(--surface-low);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover, &.active {
    background: rgba(0, 52, 102, 0.08);
  }

  &.active {
    border: 1px solid var(--primary);
  }
}

.type-info {
  flex: 1;
  min-width: 0;
}

.type-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  display: block;
}

.type-desc {
  font-size: 12px;
  color: var(--on-surface-variant);
  display: block;
  margin-top: 2px;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover, &.active {
    background: var(--surface-low);
  }

  &.active {
    border: 1px solid var(--primary);
  }
}

.record-main {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
  display: block;
}

.record-meta {
  font-size: 12px;
  color: var(--on-surface-variant);
  display: block;
  margin-top: 4px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card, .detail-card {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--surface-high);
}

.card-header-title {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--on-surface);
}

.card-subtitle {
  font-size: 13px;
  color: var(--on-surface-variant);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}

.field-required {
  color: var(--error);
}

.field-optional {
  font-size: 12px;
  color: var(--outline);
}

.field-input,
.field-textarea,
.field-picker {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface-low);
  border: 1px solid var(--surface-high);
  color: var(--on-surface);
  font-size: 14px;

  &:focus {
    border-color: var(--primary);
  }
}

.field-textarea {
  min-height: 100px;
  resize: vertical;
}

.field-picker {
  cursor: pointer;
}

.picker-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flow-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--surface-low);
  border-radius: var(--radius-md);
}

.flow-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.flow-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.flow-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-lowest);
  border-radius: var(--radius-md);
  border: 1px solid var(--surface-high);
}

.flow-order {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.flow-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.flow-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}

.flow-role {
  font-size: 12px;
  color: var(--on-surface-variant);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--surface-high);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-main {
  flex: 1;
}

.detail-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--on-surface);
  display: block;
}

.detail-meta {
  font-size: 13px;
  color: var(--on-surface-variant);
  display: block;
  margin-top: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-item {
  padding: 14px;
  background: var(--surface-low);
  border-radius: var(--radius-md);
}

.detail-item-label {
  font-size: 12px;
  color: var(--on-surface-variant);
  display: block;
}

.detail-item-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
  display: block;
  margin-top: 6px;
}

.timeline-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 6px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    background: var(--surface-high);
  }
}

.timeline-item {
  display: flex;
  gap: 16px;
  position: relative;
  padding-left: 4px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--surface-lowest);
  flex-shrink: 0;
  z-index: 1;
}

.timeline-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-node {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.timeline-action {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;

  &.APPROVE {
    background: rgba(46, 125, 50, 0.12);
    color: var(--success);
  }

  &.REJECT {
    background: rgba(186, 26, 26, 0.12);
    color: var(--error);
  }
}

.timeline-meta {
  font-size: 12px;
  color: var(--on-surface-variant);
}

.timeline-comment {
  font-size: 13px;
  color: var(--on-surface);
  padding: 8px 12px;
  background: var(--surface-low);
  border-radius: var(--radius-sm);
  margin-top: 4px;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--surface-high);
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 960px) {
  .forms-container {
    grid-template-columns: 1fr;
  }

  .hero {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .forms-page {
    padding: 12px;
  }

  .hero-title {
    font-size: 20px;
  }

  .hero-stats {
    width: 100%;
    justify-content: space-around;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
  }

  .form-actions,
  .review-actions {
    flex-direction: column;
  }
}
</style>
