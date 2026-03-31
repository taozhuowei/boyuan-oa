<template>
  <view class="page attendance-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="schedule" :size="28" />
          <text class="hero-title">考勤</text>
        </view>
        <text class="hero-subtitle">请假、加班申请与审批</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ myLeaveCount }}</text>
          <text class="stat-label">请假记录</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ myOvertimeCount }}</text>
          <text class="stat-label">加班记录</text>
        </view>
        <view v-if="canApprove" class="hero-stat">
          <text class="stat-num">{{ todoCount }}</text>
          <text class="stat-label">待审批</text>
        </view>
      </view>
    </view>

    <view class="attendance-container">
      <!-- 左侧边栏 -->
      <view class="card sidebar">
        <!-- 申请入口 -->
        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="add-circle" :size="16" />
              <text>发起申请</text>
            </view>
          </view>
          <view class="action-list">
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'leave' }"
              @click="switchTab('leave')"
            >
              <Icon name="event-busy" :size="18" />
              <text>请假申请</text>
            </view>
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'overtime' }"
              @click="switchTab('overtime')"
            >
              <Icon name="more-time" :size="18" />
              <text>加班申请</text>
            </view>
          </view>
        </view>

        <!-- 我的记录 -->
        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="receipt" :size="16" />
              <text>我的记录</text>
            </view>
            <Badge variant="info">{{ myRecords.length }}</Badge>
          </view>
          <view class="record-list">
            <view
              v-for="item in myRecords"
              :key="item.id"
              class="record-item"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="selectRecord(item)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.type === 'LEAVE' ? '请假' : '加班' }}</text>
                <text class="record-meta">{{ item.createTime }}</text>
              </view>
              <Badge :variant="statusVariant(item.status)">{{ statusText(item.status) }}</Badge>
            </view>
          </view>
        </view>

        <!-- 审批待办 - 仅审批角色可见 -->
        <view v-if="canApprove" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="approval" :size="16" />
              <text>审批待办</text>
            </view>
            <Badge v-if="todoList.length" variant="warning">{{ todoList.length }}</Badge>
          </view>
          <view v-if="todoList.length" class="record-list">
            <view
              v-for="item in todoList"
              :key="item.id"
              class="record-item"
              :class="{ active: selectedRecord?.id === item.id }"
              @click="selectRecord(item)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.employeeName }} - {{ item.type === 'LEAVE' ? '请假' : '加班' }}</text>
                <text class="record-meta">{{ item.createTime }}</text>
              </view>
              <Badge variant="warning">待审批</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待审批事项" />
        </view>
      </view>

      <!-- 右侧主内容 -->
      <view class="main-content">
        <!-- 请假申请表单 -->
        <view v-if="activeTab === 'leave' && !selectedRecord" class="card form-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="event-busy" :size="20" />
              <text class="card-title">请假申请</text>
            </view>
          </view>
          <view class="form-body">
            <view class="form-field">
              <text class="field-label">请假类型 <text class="required">*</text></text>
              <picker class="field-picker" :range="leaveTypes" @change="onLeaveTypeChange">
                <view class="picker-display">
                  <text>{{ form.leaveType || '请选择请假类型' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">开始日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onStartDateChange">
                <view class="picker-display">
                  <text>{{ form.startDate || '请选择开始日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">结束日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onEndDateChange">
                <view class="picker-display">
                  <text>{{ form.endDate || '请选择结束日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">请假天数 <text class="required">*</text></text>
              <input 
                v-model="form.duration" 
                class="field-input" 
                type="digit" 
                placeholder="请输入天数"
              />
            </view>
            <view class="form-field">
              <text class="field-label">请假原因 <text class="required">*</text></text>
              <textarea 
                v-model="form.reason" 
                class="field-textarea" 
                placeholder="请输入请假原因"
              />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetForm">重置</Button>
              <Button variant="primary" @click="submitLeave">提交申请</Button>
            </view>
          </view>
        </view>

        <!-- 加班申请表单 -->
        <view v-if="activeTab === 'overtime' && !selectedRecord" class="card form-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="more-time" :size="20" />
              <text class="card-title">加班申请</text>
            </view>
          </view>
          <view class="form-body">
            <view class="form-field">
              <text class="field-label">加班日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onOvertimeDateChange">
                <view class="picker-display">
                  <text>{{ form.overtimeDate || '请选择加班日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-row">
              <view class="form-field half">
                <text class="field-label">开始时间 <text class="required">*</text></text>
                <picker class="field-picker" mode="time" @change="onStartTimeChange">
                  <view class="picker-display">
                    <text>{{ form.startTime || '开始时间' }}</text>
                    <Icon name="arrow-forward" :size="14" />
                  </view>
                </picker>
              </view>
              <view class="form-field half">
                <text class="field-label">结束时间 <text class="required">*</text></text>
                <picker class="field-picker" mode="time" @change="onEndTimeChange">
                  <view class="picker-display">
                    <text>{{ form.endTime || '结束时间' }}</text>
                    <Icon name="arrow-forward" :size="14" />
                  </view>
                </picker>
              </view>
            </view>
            <view class="form-field">
              <text class="field-label">加班时长（小时） <text class="required">*</text></text>
              <input 
                v-model="form.duration" 
                class="field-input" 
                type="digit" 
                placeholder="请输入小时数"
              />
            </view>
            <view class="form-field">
              <text class="field-label">加班原因 <text class="required">*</text></text>
              <textarea 
                v-model="form.reason" 
                class="field-textarea" 
                placeholder="请输入加班原因"
              />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetForm">重置</Button>
              <Button variant="primary" @click="submitOvertime">提交申请</Button>
            </view>
          </view>
        </view>

        <!-- 记录/审批详情 -->
        <view v-if="selectedRecord" class="card detail-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon :name="selectedRecord.type === 'LEAVE' ? 'event-busy' : 'more-time'" :size="20" />
              <text class="card-title">{{ selectedRecord.type === 'LEAVE' ? '请假详情' : '加班详情' }}</text>
            </view>
            <Button variant="ghost" icon="close" @click="clearSelection">关闭</Button>
          </view>
          <view class="detail-body">
            <view class="detail-row">
              <text class="detail-label">申请人</text>
              <text class="detail-value">{{ selectedRecord.employeeName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">部门</text>
              <text class="detail-value">{{ selectedRecord.department }}</text>
            </view>
            <view v-if="selectedRecord.type === 'LEAVE'" class="detail-row">
              <text class="detail-label">请假类型</text>
              <text class="detail-value">{{ selectedRecord.leaveType }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">{{ selectedRecord.type === 'LEAVE' ? '请假时间' : '加班时间' }}</text>
              <text class="detail-value">{{ selectedRecord.timeRange }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">{{ selectedRecord.type === 'LEAVE' ? '天数' : '时长' }}</text>
              <text class="detail-value">{{ selectedRecord.duration }}{{ selectedRecord.type === 'LEAVE' ? '天' : '小时' }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">原因</text>
              <text class="detail-value">{{ selectedRecord.reason }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">状态</text>
              <Badge :variant="statusVariant(selectedRecord.status)">{{ statusText(selectedRecord.status) }}</Badge>
            </view>
            <view v-if="selectedRecord.approver" class="detail-row">
              <text class="detail-label">审批人</text>
              <text class="detail-value">{{ selectedRecord.approver }}</text>
            </view>
            <view v-if="selectedRecord.approveTime" class="detail-row">
              <text class="detail-label">审批时间</text>
              <text class="detail-value">{{ selectedRecord.approveTime }}</text>
            </view>

            <!-- 审批操作 - 仅审批角色可见 -->
            <view v-if="canApprove && selectedRecord.status === 'PENDING'" class="detail-actions">
              <Button variant="ghost" @click="rejectRecord">驳回</Button>
              <Button variant="primary" @click="approveRecord">通过</Button>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!activeTab && !selectedRecord" class="card empty-card">
          <Empty text="请选择左侧功能开始" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon, Button, Badge, Empty } from '../../components/ui'
import { useUserStore } from '../../stores'

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const userName = computed(() => userStore.userInfo?.displayName || '')

// 权限判断
const canApprove = computed(() => ['project_manager', 'ceo'].includes(userRole.value))

// 标签页状态
const activeTab = ref<'leave' | 'overtime' | null>('leave')
const selectedRecord = ref<any>(null)

// 表单数据
const leaveTypes = ['年假', '事假', '病假', '婚假', '产假']
const form = ref({
  leaveType: '',
  startDate: '',
  endDate: '',
  overtimeDate: '',
  startTime: '',
  endTime: '',
  duration: '',
  reason: ''
})

// Mock 数据 - 我的记录
const myRecords = ref([
  { id: 1, type: 'LEAVE', leaveType: '年假', employeeName: userName.value, department: '综合管理部', timeRange: '2024-03-20 至 2024-03-22', duration: 3, reason: '回家探亲', status: 'APPROVED', approver: '王建国', approveTime: '2024-03-18 10:30', createTime: '2024-03-15' },
  { id: 2, type: 'OVERTIME', employeeName: userName.value, department: '综合管理部', timeRange: '2024-03-10 18:00-21:00', duration: 3, reason: '项目赶进度', status: 'PENDING', createTime: '2024-03-10' }
])

// Mock 数据 - 待审批列表
const todoList = ref([
  { id: 3, type: 'LEAVE', leaveType: '病假', employeeName: '张晓宁', department: '综合管理部', timeRange: '2024-03-25 至 2024-03-26', duration: 2, reason: '身体不适', status: 'PENDING', createTime: '2024-03-24' },
  { id: 4, type: 'OVERTIME', employeeName: '赵铁柱', department: '施工一部', timeRange: '2024-03-20 19:00-22:00', duration: 3, reason: '赶工期', status: 'PENDING', createTime: '2024-03-20' }
])

// 统计
const myLeaveCount = computed(() => myRecords.value.filter(r => r.type === 'LEAVE').length)
const myOvertimeCount = computed(() => myRecords.value.filter(r => r.type === 'OVERTIME').length)
const todoCount = computed(() => todoList.value.length)

// 状态显示
const statusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { 
    PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' 
  }
  return map[status] || 'default'
}
const statusText = (status: string) => {
  const map: Record<string, string> = { PENDING: '审批中', APPROVED: '已通过', REJECTED: '已驳回' }
  return map[status] || status
}

// 方法
const switchTab = (tab: 'leave' | 'overtime') => {
  activeTab.value = tab
  selectedRecord.value = null
}

const selectRecord = (record: any) => {
  selectedRecord.value = record
  activeTab.value = null
}

const clearSelection = () => {
  selectedRecord.value = null
  activeTab.value = 'leave'
}

const resetForm = () => {
  form.value = { leaveType: '', startDate: '', endDate: '', overtimeDate: '', startTime: '', endTime: '', duration: '', reason: '' }
}

// Picker 事件处理
const onLeaveTypeChange = (e: any) => form.value.leaveType = leaveTypes[e.detail.value]
const onStartDateChange = (e: any) => form.value.startDate = e.detail.value
const onEndDateChange = (e: any) => form.value.endDate = e.detail.value
const onOvertimeDateChange = (e: any) => form.value.overtimeDate = e.detail.value
const onStartTimeChange = (e: any) => form.value.startTime = e.detail.value
const onEndTimeChange = (e: any) => form.value.endTime = e.detail.value

// 提交
const submitLeave = () => {
  if (!form.value.leaveType || !form.value.startDate || !form.value.endDate || !form.value.duration || !form.value.reason) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '提交成功', icon: 'success' })
  resetForm()
}

const submitOvertime = () => {
  if (!form.value.overtimeDate || !form.value.startTime || !form.value.endTime || !form.value.duration || !form.value.reason) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '提交成功', icon: 'success' })
  resetForm()
}

// 审批
const approveRecord = () => {
  uni.showToast({ title: '审批通过', icon: 'success' })
  selectedRecord.value.status = 'APPROVED'
}

const rejectRecord = () => {
  uni.showToast({ title: '已驳回', icon: 'none' })
  selectedRecord.value.status = 'REJECTED'
}
</script>

<style lang="scss" scoped>
.attendance-page {
  display: flex;
  flex-direction: column;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin: 16px 16px 0;
  border-radius: var(--radius-lg);
}

.hero-main {
  margin-bottom: 16px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
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
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.attendance-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  padding: 16px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.section {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 16px;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: var(--bg-secondary);
  }
  &.active {
    background: var(--primary-color);
    color: #fff;
  }
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: var(--bg-secondary);
  }
  &.active {
    background: var(--primary-light);
  }
}

.record-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-title {
  font-weight: 500;
  font-size: 14px;
}

.record-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.main-content {
  min-height: 600px;
}

.form-card, .detail-card, .empty-card {
  height: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.form-body {
  padding: 24px;
}

.form-field {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  .form-field.half {
    flex: 1;
  }
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  .required {
    color: var(--danger-color);
  }
}

.field-picker {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.picker-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
}

.field-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: 14px;
}

.field-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.detail-body {
  padding: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  max-width: 60%;
  text-align: right;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
</style>
