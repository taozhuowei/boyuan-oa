<template>
  <view class="page projects-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="business" :size="28" />
          <text class="hero-title">项目</text>
        </view>
        <text class="hero-subtitle">项目管理与施工阶段跟踪</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ projects.length }}</text>
          <text class="stat-label">项目总数</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ activeCount }}</text>
          <text class="stat-label">进行中</text>
        </view>
        <view v-if="isProjectManager" class="hero-stat">
          <text class="stat-num">{{ pendingApprovalCount }}</text>
          <text class="stat-label">待审批</text>
        </view>
        <view v-if="isCEO" class="hero-stat">
          <text class="stat-num">{{ pendingConfirmCount }}</text>
          <text class="stat-label">待确认</text>
        </view>
      </view>
    </view>

    <view class="projects-container">
      <!-- 左侧项目列表 -->
      <view class="card sidebar">
        <!-- 发起项目 - 仅项目经理 -->
        <view v-if="isProjectManager" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="add-circle" :size="16" />
              <text>项目管理</text>
            </view>
          </view>
          <view class="action-list">
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'create-project' }"
              @click="activeTab = 'create-project'"
            >
              <Icon name="create" :size="18" />
              <text>发起项目</text>
            </view>
          </view>
        </view>

        <!-- 项目列表 -->
        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="list" :size="16" />
              <text>项目列表</text>
            </view>
            <Badge variant="info">{{ projects.length }}</Badge>
          </view>
          <view class="project-list">
            <view
              v-for="item in projects"
              :key="item.id"
              class="project-item"
              :class="{ active: selectedProject?.id === item.id }"
              @click="selectProject(item)"
            >
              <view class="project-main">
                <text class="project-name">{{ item.name }}</text>
                <text class="project-meta">{{ item.manager }} · 进度 {{ item.progress }}%</text>
              </view>
              <Badge :variant="item.status === 'ACTIVE' ? 'success' : 'default'">
                {{ item.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </Badge>
            </view>
          </view>
        </view>

        <!-- 发起施工阶段 - 员工可见 -->
        <view v-if="isEmployee" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="construction" :size="16" />
              <text>施工阶段</text>
            </view>
          </view>
          <view class="action-list">
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'create-phase' }"
              @click="activeTab = 'create-phase'"
            >
              <Icon name="add-circle" :size="18" />
              <text>发起阶段</text>
            </view>
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'my-phases' }"
              @click="activeTab = 'my-phases'"
            >
              <Icon name="receipt" :size="18" />
              <text>我的阶段</text>
            </view>
          </view>
        </view>

        <!-- 审批待办 - 项目经理 -->
        <view v-if="isProjectManager" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="schedule" :size="16" />
              <text>阶段审批</text>
            </view>
            <Badge v-if="pendingPhases.length" variant="warning">{{ pendingPhases.length }}</Badge>
          </view>
          <view v-if="pendingPhases.length" class="record-list">
            <view
              v-for="item in pendingPhases"
              :key="item.id"
              class="record-item"
              @click="selectPhase(item)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.projectName }}</text>
                <text class="record-meta">{{ item.phaseName }} · {{ item.submitter }}</text>
              </view>
              <Badge variant="warning">待审批</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待审批" />
        </view>

        <!-- 确认待办 - CEO -->
        <view v-if="isCEO" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="approval" :size="16" />
              <text>阶段确认</text>
            </view>
            <Badge v-if="pendingConfirmPhases.length" variant="warning">{{ pendingConfirmPhases.length }}</Badge>
          </view>
          <view v-if="pendingConfirmPhases.length" class="record-list">
            <view
              v-for="item in pendingConfirmPhases"
              :key="item.id"
              class="record-item"
              @click="selectPhase(item)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.projectName }}</text>
                <text class="record-meta">{{ item.phaseName }} · {{ item.submitter }}</text>
              </view>
              <Badge variant="warning">待确认</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待确认" />
        </view>
      </view>

      <!-- 右侧主内容 -->
      <view class="main-content">
        <!-- 发起项目表单 - 项目经理 -->
        <view v-if="activeTab === 'create-project' && isProjectManager" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="create" :size="20" />
              <text class="card-title">发起项目</text>
            </view>
          </view>
          <view class="content-body">
            <view class="form-field">
              <text class="field-label">项目名称 <text class="required">*</text></text>
              <input v-model="projectForm.name" class="field-input" placeholder="请输入项目名称" />
            </view>
            <view class="form-field">
              <text class="field-label">项目目标 <text class="required">*</text></text>
              <textarea v-model="projectForm.target" class="field-textarea" placeholder="请输入项目目标" />
            </view>
            <view class="form-field">
              <text class="field-label">开始日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onStartDateChange">
                <view class="picker-display">
                  <text>{{ projectForm.startDate || '请选择开始日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">结束日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onEndDateChange">
                <view class="picker-display">
                  <text>{{ projectForm.endDate || '请选择结束日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">日志格式配置</text>
              <view class="checkbox-group">
                <label class="checkbox-item">
                  <checkbox :checked="projectForm.logFields.includes('workContent')" @click="toggleLogField('workContent')" />
                  <text>工作内容</text>
                </label>
                <label class="checkbox-item">
                  <checkbox :checked="projectForm.logFields.includes('progress')" @click="toggleLogField('progress')" />
                  <text>完成进度</text>
                </label>
                <label class="checkbox-item">
                  <checkbox :checked="projectForm.logFields.includes('problems')" @click="toggleLogField('problems')" />
                  <text>存在问题</text>
                </label>
                <label class="checkbox-item">
                  <checkbox :checked="projectForm.logFields.includes('photos')" @click="toggleLogField('photos')" />
                  <text>现场照片</text>
                </label>
              </view>
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetProjectForm">重置</Button>
              <Button variant="primary" @click="submitProject">发起项目</Button>
            </view>
          </view>
        </view>

        <!-- 发起施工阶段 - 员工 -->
        <view v-if="activeTab === 'create-phase' && isEmployee" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="construction" :size="20" />
              <text class="card-title">发起施工阶段</text>
            </view>
          </view>
          <view class="content-body">
            <view class="form-field">
              <text class="field-label">所属项目 <text class="required">*</text></text>
              <picker class="field-picker" :range="projectNames" @change="onPhaseProjectChange">
                <view class="picker-display">
                  <text>{{ phaseForm.projectName || '请选择项目' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">阶段名称 <text class="required">*</text></text>
              <input v-model="phaseForm.name" class="field-input" placeholder="如：基础施工、主体建设等" />
            </view>
            <view class="form-field">
              <text class="field-label">工作内容 <text class="required">*</text></text>
              <textarea v-model="phaseForm.workContent" class="field-textarea" placeholder="请描述本阶段工作内容" />
            </view>
            <view class="form-field">
              <text class="field-label">计划工期（天） <text class="required">*</text></text>
              <input v-model="phaseForm.duration" class="field-input" type="number" placeholder="请输入计划工期" />
            </view>
            <view class="form-field">
              <text class="field-label">备注</text>
              <textarea v-model="phaseForm.remark" class="field-textarea" placeholder="其他需要说明的内容" />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetPhaseForm">重置</Button>
              <Button variant="primary" @click="submitPhase">提交申请</Button>
            </view>
          </view>
        </view>

        <!-- 我的施工阶段 -->
        <view v-if="activeTab === 'my-phases' && isEmployee" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="receipt" :size="20" />
              <text class="card-title">我的施工阶段</text>
            </view>
          </view>
          <view class="content-body">
            <view v-if="myPhases.length" class="phase-list">
              <view v-for="item in myPhases" :key="item.id" class="phase-item">
                <view class="phase-header">
                  <text class="phase-name">{{ item.phaseName }}</text>
                  <Badge :variant="phaseStatusVariant(item.status)">{{ phaseStatusText(item.status) }}</Badge>
                </view>
                <view class="phase-info">
                  <text class="phase-project">{{ item.projectName }}</text>
                  <text class="phase-content">{{ item.workContent }}</text>
                </view>
                <view class="phase-meta">
                  <text>计划工期：{{ item.duration }}天</text>
                  <text>提交时间：{{ item.submitTime }}</text>
                </view>
              </view>
            </view>
            <Empty v-else text="暂无施工阶段记录" />
          </view>
        </view>

        <!-- 项目详情 -->
        <view v-if="selectedProject && !activeTab" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="info" :size="20" />
              <text class="card-title">项目详情</text>
            </view>
            <view class="header-actions">
              <!-- 项目经理更新进度 -->
              <Button v-if="isProjectManager && selectedProject.status === 'ACTIVE'" variant="primary" size="small" @click="showUpdateProgress">
                更新进度
              </Button>
            </view>
          </view>
          <view class="content-body">
            <view class="project-detail-header">
              <view class="detail-title">{{ selectedProject.name }}</view>
              <Badge :variant="selectedProject.status === 'ACTIVE' ? 'success' : 'default'">
                {{ selectedProject.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </Badge>
            </view>

            <view class="progress-section">
              <view class="progress-header">
                <text class="progress-label">整体进度</text>
                <text class="progress-value">{{ selectedProject.progress }}%</text>
              </view>
              <view class="progress-bar-bg">
                <view class="progress-bar-fill" :style="{ width: `${selectedProject.progress}%` }" />
              </view>
            </view>

            <view class="info-grid">
              <view class="info-item">
                <text class="info-label">项目负责人</text>
                <text class="info-value">{{ selectedProject.manager }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">开始日期</text>
                <text class="info-value">{{ selectedProject.startDate }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">结束日期</text>
                <text class="info-value">{{ selectedProject.endDate }}</text>
              </view>
              <view class="info-item">
                <text class="info-label">所属部门</text>
                <text class="info-value">{{ selectedProject.department }}</text>
              </view>
            </view>

            <view class="target-section">
              <view class="section-title">项目目标</view>
              <text class="target-content">{{ selectedProject.target }}</text>
            </view>

            <!-- 施工阶段列表 -->
            <view class="phases-section">
              <view class="section-title">施工阶段</view>
              <view v-if="projectPhases.length" class="phases-timeline">
                <view v-for="(phase, index) in projectPhases" :key="phase.id" class="timeline-item">
                  <view class="timeline-marker" :class="phase.status.toLowerCase()" />
                  <view class="timeline-content">
                    <view class="phase-title-row">
                      <text class="phase-title">{{ index + 1 }}. {{ phase.phaseName }}</text>
                      <Badge :variant="phaseStatusVariant(phase.status)">{{ phaseStatusText(phase.status) }}</Badge>
                    </view>
                    <text class="phase-submitter">发起人：{{ phase.submitter }}</text>
                    <text class="phase-desc">{{ phase.workContent }}</text>
                  </view>
                </view>
              </view>
              <Empty v-else text="暂无施工阶段" />
            </view>
          </view>
        </view>

        <!-- 阶段审批详情 - 项目经理/CEO -->
        <view v-if="selectedPhase && !activeTab" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="assignment" :size="20" />
              <text class="card-title">阶段审批</text>
            </view>
          </view>
          <view class="content-body">
            <view class="phase-detail">
              <view class="detail-row">
                <text class="detail-label">所属项目</text>
                <text class="detail-value">{{ selectedPhase.projectName }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">阶段名称</text>
                <text class="detail-value">{{ selectedPhase.phaseName }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">发起人</text>
                <text class="detail-value">{{ selectedPhase.submitter }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">工作内容</text>
                <text class="detail-value">{{ selectedPhase.workContent }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">计划工期</text>
                <text class="detail-value">{{ selectedPhase.duration }}天</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">当前状态</text>
                <Badge :variant="phaseStatusVariant(selectedPhase.status)">{{ phaseStatusText(selectedPhase.status) }}</Badge>
              </view>
              <view v-if="selectedPhase.remark" class="detail-row">
                <text class="detail-label">备注</text>
                <text class="detail-value">{{ selectedPhase.remark }}</text>
              </view>
            </view>

            <!-- 审批操作 -->
            <view v-if="selectedPhase.status === 'PENDING' && isProjectManager" class="approval-actions">
              <Button variant="ghost" @click="rejectPhase">驳回</Button>
              <Button variant="primary" @click="approvePhase">通过</Button>
            </view>
            <view v-if="selectedPhase.status === 'APPROVING' && isCEO" class="approval-actions">
              <Button variant="ghost" @click="rejectPhase">驳回</Button>
              <Button variant="primary" @click="confirmPhase">确认</Button>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!selectedProject && !activeTab" class="card empty-card">
          <Empty text="请选择左侧项目或功能" />
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
const userName = computed(() => userStore.userInfo?.displayName || '张晓宁')

// 权限判断
const isProjectManager = computed(() => userRole.value === 'project_manager')
const isCEO = computed(() => userRole.value === 'ceo')
const isEmployee = computed(() => ['employee', 'worker'].includes(userRole.value))

// 状态
const activeTab = ref<string | null>(null)
const selectedProject = ref<any>(null)
const selectedPhase = ref<any>(null)

// Mock 数据 - 项目
const projects = ref([
  { id: 1, name: '绿地中心大厦装修项目', manager: '王建国', department: '项目一部', startDate: '2024-01-01', endDate: '2024-12-31', status: 'ACTIVE', progress: 65, target: '完成高层商业楼宇内部装修工程，包括水电改造、墙面粉刷、地板铺设等' },
  { id: 2, name: '科技园区基础设施改造', manager: '李华', department: '项目二部', startDate: '2024-03-01', endDate: '2024-10-30', status: 'ACTIVE', progress: 40, target: '完成园区道路、管网及绿化改造工程' }
])

// Mock 数据 - 施工阶段
const allPhases = ref([
  { id: 1, projectId: 1, projectName: '绿地中心大厦装修项目', phaseName: '基础拆除', submitter: '赵铁柱', workContent: '拆除原有装修，清理现场', duration: 15, status: 'COMPLETED', submitTime: '2024-01-05' },
  { id: 2, projectId: 1, projectName: '绿地中心大厦装修项目', phaseName: '水电改造', submitter: '刘大力', workContent: '重新布线，安装管道', duration: 20, status: 'COMPLETED', submitTime: '2024-02-01' },
  { id: 3, projectId: 1, projectName: '绿地中心大厦装修项目', phaseName: '墙面粉刷', submitter: '赵铁柱', workContent: '墙面找平、刷漆', duration: 25, status: 'APPROVING', submitTime: '2024-03-01' },
  { id: 4, projectId: 2, projectName: '科技园区基础设施改造', phaseName: '道路施工', submitter: '王小燕', workContent: '园区主干道铺设', duration: 30, status: 'PENDING', submitTime: '2024-03-20' }
])

// 表单数据
const projectForm = ref({ name: '', target: '', startDate: '', endDate: '', logFields: ['workContent', 'progress'] })
const phaseForm = ref({ projectId: null as number | null, projectName: '', name: '', workContent: '', duration: '', remark: '' })

// 计算属性
const activeCount = computed(() => projects.value.filter(p => p.status === 'ACTIVE').length)
const pendingPhases = computed(() => allPhases.value.filter(p => p.status === 'PENDING'))
const pendingConfirmPhases = computed(() => allPhases.value.filter(p => p.status === 'APPROVING'))
const pendingApprovalCount = computed(() => pendingPhases.value.length)
const pendingConfirmCount = computed(() => pendingConfirmPhases.value.length)
const projectNames = computed(() => projects.value.map(p => p.name))
const myPhases = computed(() => allPhases.value.filter(p => p.submitter === userName.value))
const projectPhases = computed(() => selectedProject.value ? allPhases.value.filter(p => p.projectId === selectedProject.value.id) : [])

// 状态显示
const phaseStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { 
    PENDING: 'warning', APPROVING: 'info', COMPLETED: 'success', REJECTED: 'danger' 
  }
  return map[status] || 'default'
}
const phaseStatusText = (status: string) => ({ 
  PENDING: '待审批', APPROVING: '待确认', COMPLETED: '已完成', REJECTED: '已驳回' 
}[status] || status)

// 方法
const selectProject = (project: any) => { selectedProject.value = project; selectedPhase.value = null; activeTab.value = null }
const selectPhase = (phase: any) => { selectedPhase.value = phase; selectedProject.value = null; activeTab.value = null }
const onStartDateChange = (e: any) => projectForm.value.startDate = e.detail.value
const onEndDateChange = (e: any) => projectForm.value.endDate = e.detail.value
const onPhaseProjectChange = (e: any) => { 
  const idx = e.detail.value
  phaseForm.value.projectName = projectNames.value[idx]
  phaseForm.value.projectId = projects.value[idx]?.id
}
const toggleLogField = (field: string) => {
  const idx = projectForm.value.logFields.indexOf(field)
  if (idx > -1) projectForm.value.logFields.splice(idx, 1)
  else projectForm.value.logFields.push(field)
}
const resetProjectForm = () => projectForm.value = { name: '', target: '', startDate: '', endDate: '', logFields: ['workContent', 'progress'] }
const resetPhaseForm = () => phaseForm.value = { projectId: null, projectName: '', name: '', workContent: '', duration: '', remark: '' }
const submitProject = () => {
  if (!projectForm.value.name || !projectForm.value.target || !projectForm.value.startDate || !projectForm.value.endDate) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '项目发起成功', icon: 'success' })
  resetProjectForm()
}
const submitPhase = () => {
  if (!phaseForm.value.projectName || !phaseForm.value.name || !phaseForm.value.workContent || !phaseForm.value.duration) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '阶段申请已提交', icon: 'success' })
  resetPhaseForm()
}
const showUpdateProgress = () => {
  uni.showModal({
    title: '更新项目进度',
    editable: true,
    placeholderText: '请输入新的进度百分比（0-100）',
    success: (res) => {
      if (res.confirm && res.content) {
        const progress = parseInt(res.content)
        if (progress >= 0 && progress <= 100) {
          selectedProject.value.progress = progress
          uni.showToast({ title: '进度更新成功', icon: 'success' })
        }
      }
    }
  })
}
const approvePhase = () => { selectedPhase.value.status = 'APPROVING'; uni.showToast({ title: '已通过', icon: 'success' }) }
const confirmPhase = () => { selectedPhase.value.status = 'COMPLETED'; uni.showToast({ title: '已确认', icon: 'success' }) }
const rejectPhase = () => { selectedPhase.value.status = 'REJECTED'; uni.showToast({ title: '已驳回', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.projects-page {
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

.projects-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  padding: 16px;
}

.sidebar {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.section {
  border-bottom: 1px solid var(--border-color);
  padding: 16px;
  &:last-child {
    border-bottom: none;
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

.action-list, .project-list, .record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item, .project-item, .record-item {
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

.project-main, .record-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-name, .record-title {
  font-weight: 500;
  font-size: 14px;
}

.project-meta, .record-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
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

.header-actions {
  display: flex;
  gap: 8px;
}

.content-body {
  padding: 24px;
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

.field-input, .field-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: 14px;
}

.field-textarea {
  min-height: 100px;
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

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.form-actions, .approval-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.project-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
}

.progress-section {
  margin-bottom: 24px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-value {
  font-size: 16px;
  font-weight: 600;
}

.progress-bar-bg {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #003466, #324963);
  border-radius: 4px;
  transition: width 0.3s;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.target-section, .phases-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.target-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.phases-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 12px;
}

.timeline-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  &.completed {
    background: var(--success-color);
  }
  &.approving {
    background: var(--warning-color);
  }
  &.pending {
    background: var(--text-secondary);
  }
}

.timeline-content {
  flex: 1;
}

.phase-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.phase-title {
  font-weight: 500;
  font-size: 14px;
}

.phase-submitter, .phase-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.phase-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phase-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.phase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.phase-name {
  font-weight: 600;
  font-size: 14px;
}

.phase-info {
  margin-bottom: 8px;
}

.phase-project {
  font-size: 13px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 4px;
}

.phase-content {
  font-size: 14px;
}

.phase-meta {
  display: flex;
  gap: 24px;
  font-size: 12px;
  color: var(--text-secondary);
}

.phase-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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
</style>
