<template>
  <view class="page logs-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="construction" :size="28" />
          <text class="hero-title">施工日志</text>
        </view>
        <text class="hero-subtitle">施工日志提交与工伤申报管理</text>
      </view>
      <view class="hero-stats">
        <view v-if="isWorker" class="hero-stat">
          <text class="stat-num">{{ myLogCount }}</text>
          <text class="stat-label">我的日志</text>
        </view>
        <view v-if="isWorker" class="hero-stat">
          <text class="stat-num">{{ myInjuryCount }}</text>
          <text class="stat-label">工伤申报</text>
        </view>
        <view v-if="canApprove" class="hero-stat">
          <text class="stat-num">{{ todoCount }}</text>
          <text class="stat-label">待审批</text>
        </view>
      </view>
    </view>

    <view class="logs-container">
      <!-- 左侧边栏 -->
      <view class="card sidebar">
        <!-- 提交入口 - 仅劳工可见 -->
        <view v-if="isWorker" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="add-circle" :size="16" />
              <text>提交记录</text>
            </view>
          </view>
          <view class="action-list">
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'log' }"
              @click="switchTab('log')"
            >
              <Icon name="article" :size="18" />
              <text>施工日志</text>
            </view>
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'injury' }"
              @click="switchTab('injury')"
            >
              <Icon name="healing" :size="18" />
              <text>工伤申报</text>
            </view>
          </view>
        </view>

        <!-- 我的记录 - 仅劳工可见 -->
        <view v-if="isWorker" class="section">
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
                <text class="record-title">{{ item.type === 'LOG' ? '施工日志' : '工伤申报' }}</text>
                <text class="record-meta">{{ item.logDate }} · {{ item.projectName }}</text>
              </view>
              <Badge :variant="statusVariant(item.status)">{{ statusText(item.status) }}</Badge>
            </view>
          </view>
        </view>

        <!-- 审批待办 - 仅项目经理可见 -->
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
                <text class="record-title">{{ item.employeeName }}</text>
                <text class="record-meta">{{ item.type === 'LOG' ? '施工日志' : '工伤申报' }} · {{ item.logDate }}</text>
              </view>
              <Badge variant="warning">待审批</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待审批事项" />
        </view>
      </view>

      <!-- 右侧主内容 -->
      <view class="main-content">
        <!-- 施工日志表单 - 仅劳工可见 -->
        <view v-if="isWorker && activeTab === 'log' && !selectedRecord" class="card form-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="article" :size="20" />
              <text class="card-title">施工日志</text>
            </view>
          </view>
          <view class="form-body">
            <view class="form-field">
              <text class="field-label">日志日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onLogDateChange">
                <view class="picker-display">
                  <text>{{ form.logDate || '请选择日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">所属项目 <text class="required">*</text></text>
              <picker class="field-picker" :range="projects" @change="onProjectChange">
                <view class="picker-display">
                  <text>{{ form.projectName || '请选择项目' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">天气情况 <text class="required">*</text></text>
              <picker class="field-picker" :range="weatherTypes" @change="onWeatherChange">
                <view class="picker-display">
                  <text>{{ form.weather || '请选择天气' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">工作内容 <text class="required">*</text></text>
              <textarea 
                v-model="form.workContent" 
                class="field-textarea" 
                placeholder="请描述今日工作内容"
              />
            </view>
            <view class="form-field">
              <text class="field-label">完成进度 (%) <text class="required">*</text></text>
              <slider 
                :value="form.progress" 
                min="0" 
                max="100" 
                show-value
                @change="onProgressChange"
              />
            </view>
            <view class="form-field">
              <text class="field-label">存在问题</text>
              <textarea 
                v-model="form.problems" 
                class="field-textarea" 
                placeholder="如有问题请描述（选填）"
              />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetForm">重置</Button>
              <Button variant="primary" @click="submitLog">提交日志</Button>
            </view>
          </view>
        </view>

        <!-- 工伤申报表单 - 仅劳工可见 -->
        <view v-if="isWorker && activeTab === 'injury' && !selectedRecord" class="card form-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="healing" :size="20" />
              <text class="card-title">工伤申报</text>
            </view>
          </view>
          <view class="form-body">
            <view class="alert-box">
              <Icon name="warning" :size="16" />
              <text>请如实填写工伤情况，虚假信息将承担法律责任</text>
            </view>
            <view class="form-field">
              <text class="field-label">发生日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onInjuryDateChange">
                <view class="picker-display">
                  <text>{{ form.injuryDate || '请选择日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">发生地点 <text class="required">*</text></text>
              <input 
                v-model="form.injuryLocation" 
                class="field-input" 
                placeholder="请输入工伤发生地点"
              />
            </view>
            <view class="form-field">
              <text class="field-label">伤情描述 <text class="required">*</text></text>
              <textarea 
                v-model="form.injuryDesc" 
                class="field-textarea" 
                placeholder="请详细描述受伤经过和伤情"
              />
            </view>
            <view class="form-field">
              <text class="field-label">医疗费用（元）</text>
              <input 
                v-model="form.medicalFee" 
                class="field-input" 
                type="digit" 
                placeholder="请输入医疗费用"
              />
            </view>
            <view class="form-field">
              <text class="field-label">申请补偿金额（元）</text>
              <input 
                v-model="form.compensation" 
                class="field-input" 
                type="digit" 
                placeholder="请输入申请补偿金额"
              />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetForm">重置</Button>
              <Button variant="primary" @click="submitInjury">提交申报</Button>
            </view>
          </view>
        </view>

        <!-- 记录/审批详情 -->
        <view v-if="selectedRecord" class="card detail-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon :name="selectedRecord.type === 'LOG' ? 'article' : 'healing'" :size="20" />
              <text class="card-title">{{ selectedRecord.type === 'LOG' ? '日志详情' : '工伤详情' }}</text>
            </view>
            <Button variant="ghost" icon="close" @click="clearSelection">关闭</Button>
          </view>
          <view class="detail-body">
            <view class="detail-row">
              <text class="detail-label">提交人</text>
              <text class="detail-value">{{ selectedRecord.employeeName }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">日期</text>
              <text class="detail-value">{{ selectedRecord.logDate }}</text>
            </view>
            
            <!-- 施工日志详情 -->
            <template v-if="selectedRecord.type === 'LOG'">
              <view class="detail-row">
                <text class="detail-label">项目</text>
                <text class="detail-value">{{ selectedRecord.projectName }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">天气</text>
                <text class="detail-value">{{ selectedRecord.weather }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">工作内容</text>
                <text class="detail-value">{{ selectedRecord.workContent }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">进度</text>
                <text class="detail-value">{{ selectedRecord.progress }}%</text>
              </view>
              <view v-if="selectedRecord.problems" class="detail-row">
                <text class="detail-label">存在问题</text>
                <text class="detail-value">{{ selectedRecord.problems }}</text>
              </view>
            </template>
            
            <!-- 工伤详情 -->
            <template v-if="selectedRecord.type === 'INJURY'">
              <view class="detail-row">
                <text class="detail-label">发生地点</text>
                <text class="detail-value">{{ selectedRecord.injuryLocation }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">伤情描述</text>
                <text class="detail-value">{{ selectedRecord.injuryDesc }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">医疗费用</text>
                <text class="detail-value">¥{{ selectedRecord.medicalFee || 0 }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">申请补偿</text>
                <text class="detail-value">¥{{ selectedRecord.compensation || 0 }}</text>
              </view>
            </template>

            <view class="detail-row">
              <text class="detail-label">状态</text>
              <Badge :variant="statusVariant(selectedRecord.status)">{{ statusText(selectedRecord.status) }}</Badge>
            </view>
            <view v-if="selectedRecord.approver" class="detail-row">
              <text class="detail-label">审批人</text>
              <text class="detail-value">{{ selectedRecord.approver }}</text>
            </view>

            <!-- 审批操作 - 仅项目经理可见 -->
            <view v-if="canApprove && selectedRecord.status === 'PENDING'" class="detail-actions">
              <Button variant="ghost" @click="rejectRecord">驳回</Button>
              <Button variant="primary" @click="approveRecord">通过</Button>
            </view>
          </view>
        </view>

        <!-- 项目经理空状态 -->
        <view v-if="!isWorker && !selectedRecord" class="card empty-card">
          <Empty text="请选择左侧记录查看详情" />
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
const userRole = computed(() => userStore.userInfo?.role || 'worker')
const userName = computed(() => userStore.userInfo?.displayName || '')

// 权限判断
const isWorker = computed(() => userRole.value === 'worker')
const canApprove = computed(() => userRole.value === 'project_manager')

// 标签页状态
const activeTab = ref<'log' | 'injury' | null>('log')
const selectedRecord = ref<any>(null)

// 选项数据
const projects = ['绿地中心大厦', '科技园区改造', '地铁站出口工程']
const weatherTypes = ['晴', '多云', '阴', '雨']

// 表单数据
const form = ref({
  logDate: '',
  projectName: '',
  weather: '',
  workContent: '',
  progress: 0,
  problems: '',
  injuryDate: '',
  injuryLocation: '',
  injuryDesc: '',
  medicalFee: '',
  compensation: ''
})

// Mock 数据 - 我的记录（劳工）
const myRecords = ref([
  { id: 1, type: 'LOG', employeeName: userName.value, logDate: '2024-03-20', projectName: '绿地中心大厦', weather: '晴', workContent: '完成主体结构第三层钢筋绑扎', progress: 85, problems: '材料供应延迟', status: 'APPROVED', approver: '王建国' },
  { id: 2, type: 'LOG', employeeName: userName.value, logDate: '2024-03-19', projectName: '绿地中心大厦', weather: '多云', workContent: '进行混凝土浇筑作业', progress: 70, problems: '', status: 'APPROVED', approver: '王建国' }
])

// Mock 数据 - 待审批列表（项目经理）
const todoList = ref([
  { id: 3, type: 'LOG', employeeName: '赵铁柱', logDate: '2024-03-21', projectName: '绿地中心大厦', weather: '晴', workContent: '安装水电管线', progress: 60, problems: '', status: 'PENDING' },
  { id: 4, type: 'INJURY', employeeName: '刘大力', logDate: '2024-03-20', injuryLocation: '工地二楼', injuryDesc: '搬运材料时不慎扭伤腰部', medicalFee: 500, compensation: 1000, status: 'PENDING' }
])

// 统计
const myLogCount = computed(() => myRecords.value.filter(r => r.type === 'LOG').length)
const myInjuryCount = computed(() => myRecords.value.filter(r => r.type === 'INJURY').length)
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
const switchTab = (tab: 'log' | 'injury') => {
  activeTab.value = tab
  selectedRecord.value = null
}

const selectRecord = (record: any) => {
  selectedRecord.value = record
  activeTab.value = null
}

const clearSelection = () => {
  selectedRecord.value = null
  activeTab.value = 'log'
}

const resetForm = () => {
  form.value = { logDate: '', projectName: '', weather: '', workContent: '', progress: 0, problems: '', injuryDate: '', injuryLocation: '', injuryDesc: '', medicalFee: '', compensation: '' }
}

// Picker 事件
const onLogDateChange = (e: any) => form.value.logDate = e.detail.value
const onProjectChange = (e: any) => form.value.projectName = projects[e.detail.value]
const onWeatherChange = (e: any) => form.value.weather = weatherTypes[e.detail.value]
const onProgressChange = (e: any) => form.value.progress = e.detail.value
const onInjuryDateChange = (e: any) => form.value.injuryDate = e.detail.value

// 提交
const submitLog = () => {
  if (!form.value.logDate || !form.value.projectName || !form.value.weather || !form.value.workContent) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '提交成功', icon: 'success' })
  resetForm()
}

const submitInjury = () => {
  if (!form.value.injuryDate || !form.value.injuryLocation || !form.value.injuryDesc) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '申报成功', icon: 'success' })
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
.logs-page {
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

.logs-container {
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

.alert-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
  color: #856404;
  font-size: 13px;
}

.form-field {
  margin-bottom: 20px;
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
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-size: 14px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  max-width: 60%;
  text-align: right;
  word-break: break-all;
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
