<template>
  <view class="page attendance-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <text class="hero-title">考勤</text>
        </view>
        <text class="hero-subtitle">
          {{ isCEO || isPM ? '考勤数据总览与审批管理' : '请假、加班申请与审批' }}
        </text>
      </view>
      <view class="hero-stats">
        <view v-if="!isCEO && !isPM" class="hero-stat">
          <text class="stat-num">{{ myLeaveCount }}</text>
          <text class="stat-label">请假记录</text>
        </view>
        <view v-if="!isCEO && !isPM" class="hero-stat">
          <text class="stat-num">{{ myOvertimeCount }}</text>
          <text class="stat-label">加班记录</text>
        </view>
        <view v-if="isCEO || isPM" class="hero-stat">
          <text class="stat-num">{{ totalPending }}</text>
          <text class="stat-label">待审批</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ attendanceStats.completionRate }}</text>
          <text class="stat-label">完成率</text>
        </view>
      </view>
    </view>

    <!-- CEO/项目经理 审批视图 -->
    <view v-if="isCEO || isPM" class="attendance-container">
      <component :is="Row" v-if="Row" :gutter="16">
        <!-- 左侧：待审批列表 -->
        <component :is="Col" v-if="Col" :span="8">
          <component :is="Card" v-if="Card" title="待审批事项" :bordered="true">
            <view v-if="pendingList.length" class="approval-list">
              <view
                v-for="item in pendingList"
                :key="item.id"
                class="approval-item"
                :class="{ active: selectedItem?.id === item.id }"
                @click="selectItem(item)"
              >
                <view class="approval-info">
                  <text class="approval-title">{{ item.applicant }} - {{ item.type }}</text>
                  <text class="approval-meta">{{ item.date }} · {{ item.duration }}</text>
                </view>
                <component
                  :is="Badge"
                  v-if="Badge"
                  :status="item.urgency === 'high' ? 'error' : 'warning'"
                />
              </view>
            </view>
            <component :is="Empty" v-else-if="Empty" description="暂无待审批事项" />
          </component>
        </component>

        <!-- 右侧：审批详情/统计 -->
        <component :is="Col" v-if="Col" :span="16">
          <component :is="Card" v-if="Card && selectedItem" title="审批详情">
            <view class="detail-content">
              <view class="detail-row">
                <text class="label">申请人</text>
                <text class="value">{{ selectedItem.applicant }}</text>
              </view>
              <view class="detail-row">
                <text class="label">申请类型</text>
                <text class="value">{{ selectedItem.type }}</text>
              </view>
              <view class="detail-row">
                <text class="label">时间范围</text>
                <text class="value">{{ selectedItem.date }}</text>
              </view>
              <view class="detail-row">
                <text class="label">时长</text>
                <text class="value">{{ selectedItem.duration }}</text>
              </view>
              <view class="detail-row">
                <text class="label">原因</text>
                <text class="value">{{ selectedItem.reason }}</text>
              </view>

              <!-- 审批流程时间轴 -->
              <view class="detail-row">
                <text class="label">审批进度</text>
              </view>
              <component :is="Timeline" v-if="Timeline">
                <component
                  :is="TimelineItem"
                  v-if="TimelineItem"
                  title="提交申请"
                  :time="selectedItem.submitTime"
                  status="success"
                />
                <component
                  :is="TimelineItem"
                  v-if="TimelineItem"
                  title="项目经理审批"
                  :time="selectedItem.pmApproveTime"
                  :status="selectedItem.pmApproved ? 'success' : 'processing'"
                />
                <component
                  :is="TimelineItem"
                  v-if="TimelineItem && isCEO"
                  title="CEO审批"
                  :status="'pending'"
                />
              </component>

              <view class="detail-actions">
                <component :is="Button" v-if="Button" type="default" @click="rejectItem">驳回</component>
                <component :is="Button" v-if="Button" type="primary" @click="approveItem">通过</component>
              </view>
            </view>
          </component>

          <component :is="Card" v-else-if="Card" title="本月考勤统计">
            <component :is="Row" v-if="Row" :gutter="16" class="stats-grid">
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="总申请"
                  :value="attendanceStats.total"
                  theme="primary"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="已批准"
                  :value="attendanceStats.approved"
                  theme="success"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="待审批"
                  :value="attendanceStats.pending"
                  theme="warning"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="已驳回"
                  :value="attendanceStats.rejected"
                  theme="error"
                />
              </component>
            </component>
          </component>
        </component>
      </component>
    </view>

    <!-- 员工/劳工 申请视图 -->
    <view v-else class="attendance-container">
      <component :is="Row" v-if="Row" :gutter="16">
        <!-- 左侧：功能菜单 -->
        <component :is="Col" v-if="Col" :span="6">
          <component :is="Card" v-if="Card" :bordered="true">
            <view class="menu-list">
              <view
                class="menu-item"
                :class="{ active: activeTab === 'leave' }"
                @click="switchTab('leave')"
              >
                <text>请假申请</text>
              </view>
              <view
                class="menu-item"
                :class="{ active: activeTab === 'overtime' }"
                @click="switchTab('overtime')"
              >
                <text>加班申请</text>
              </view>
              <view
                class="menu-item"
                :class="{ active: activeTab === 'history' }"
                @click="switchTab('history')"
              >
                <text>我的记录</text>
              </view>
            </view>
          </component>
        </component>

        <!-- 右侧：表单/列表 -->
        <component :is="Col" v-if="Col" :span="18">
          <!-- 请假表单 -->
          <component :is="Card" v-if="Card && activeTab === 'leave'" title="请假申请">
            <component :is="Form" v-if="Form" :model="leaveForm">
              <component :is="Row" v-if="Row" :gutter="16">
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>请假类型 <text class="required">*</text></label>
                    <component
                      :is="Select"
                      v-if="Select"
                      v-model="leaveForm.type"
                      :options="leaveTypes"
                      placeholder="请选择请假类型"
                    />
                  </view>
                </component>
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>请假天数 <text class="required">*</text></label>
                    <component
                      :is="Input"
                      v-if="Input"
                      v-model="leaveForm.days"
                      type="number"
                      placeholder="请输入天数"
                    />
                  </view>
                </component>
              </component>
              <component :is="Row" v-if="Row" :gutter="16">
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>开始日期 <text class="required">*</text></label>
                    <component
                      :is="DatePicker"
                      v-if="DatePicker"
                      v-model="leaveForm.startDate"
                      placeholder="请选择开始日期"
                    />
                  </view>
                </component>
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>结束日期 <text class="required">*</text></label>
                    <component
                      :is="DatePicker"
                      v-if="DatePicker"
                      v-model="leaveForm.endDate"
                      placeholder="请选择结束日期"
                    />
                  </view>
                </component>
              </component>
              <view class="form-item">
                <label>请假原因 <text class="required">*</text></label>
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="leaveForm.reason"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入请假原因"
                />
              </view>
              <view class="form-actions">
                <component :is="Button" v-if="Button" type="default" @click="resetForm">重置</component>
                <component :is="Button" v-if="Button" type="primary" @click="submitLeave">提交申请</component>
              </view>
            </component>
          </component>

          <!-- 加班表单 -->
          <component :is="Card" v-else-if="Card && activeTab === 'overtime'" title="加班申请">
            <component :is="Form" v-if="Form" :model="overtimeForm">
              <component :is="Row" v-if="Row" :gutter="16">
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>加班日期 <text class="required">*</text></label>
                    <component
                      :is="DatePicker"
                      v-if="DatePicker"
                      v-model="overtimeForm.date"
                      placeholder="请选择加班日期"
                    />
                  </view>
                </component>
                <component :is="Col" v-if="Col" :span="12">
                  <view class="form-item">
                    <label>加班时长(小时) <text class="required">*</text></label>
                    <component
                      :is="Input"
                      v-if="Input"
                      v-model="overtimeForm.hours"
                      type="number"
                      placeholder="请输入小时数"
                    />
                  </view>
                </component>
              </component>
              <view class="form-item">
                <label>加班原因 <text class="required">*</text></label>
                <component
                  :is="Input"
                  v-if="Input"
                  v-model="overtimeForm.reason"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入加班原因"
                />
              </view>
              <view class="form-actions">
                <component :is="Button" v-if="Button" type="default" @click="resetForm">重置</component>
                <component :is="Button" v-if="Button" type="primary" @click="submitOvertime">提交申请</component>
              </view>
            </component>
          </component>

          <!-- 历史记录 -->
          <component :is="Card" v-else-if="Card" title="我的考勤记录">
            <view v-if="myRecords.length" class="record-list">
              <view
                v-for="item in myRecords"
                :key="item.id"
                class="record-item"
              >
                <view class="record-info">
                  <text class="record-title">{{ item.type }}</text>
                  <text class="record-date">{{ item.date }}</text>
                  <!-- 审批进度时间轴 -->
                  <component :is="Timeline" v-if="Timeline && item.showTimeline" class="record-timeline">
                    <component
                      :is="TimelineItem"
                      v-if="TimelineItem"
                      title="提交申请"
                      status="success"
                    />
                    <component
                      :is="TimelineItem"
                      v-if="TimelineItem"
                      title="项目经理审批"
                      :status="item.pmApproved ? 'success' : 'processing'"
                    />
                    <component
                      :is="TimelineItem"
                      v-if="TimelineItem"
                      title="CEO审批"
                      :status="item.ceoApproved ? 'success' : 'pending'"
                    />
                  </component>
                </view>
                <component
                  :is="Badge"
                  v-if="Badge"
                  :status="statusMap[item.status]"
                  :text="item.statusText"
                />
              </view>
            </view>
            <component :is="Empty" v-else-if="Empty" description="暂无记录" />
          </component>
        </component>
      </component>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'

const { Row, Col, Card, Button, Badge, Empty, Form, Input, Select, DatePicker, Timeline, TimelineItem, StatCard } = useComponent(['Row', 'Col', 'Card', 'Button', 'Badge', 'Empty', 'Form', 'Input', 'Select', 'DatePicker', 'Timeline', 'TimelineItem', 'StatCard'])

const userStore = useUserStore()

const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isPM = computed(() => userRole.value === 'project_manager')

// 标签页状态
const activeTab = ref('leave')
const selectedItem = ref<any>(null)

// 表单数据
const leaveForm = ref({
  type: '',
  days: '',
  startDate: '',
  endDate: '',
  reason: ''
})

const overtimeForm = ref({
  date: '',
  hours: '',
  reason: ''
})

// 选项数据
const leaveTypes = [
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '病假', value: 'sick' },
  { label: '婚假', value: 'marriage' },
  { label: '产假', value: 'maternity' }
]

// Mock 数据
const pendingList = ref([
  { id: 1, applicant: '张晓宁', type: '请假', date: '2024-04-01 至 2024-04-03', duration: '3天', reason: '回家探亲', urgency: 'normal', submitTime: '2024-03-28 09:00', pmApproved: true },
  { id: 2, applicant: '赵铁柱', type: '加班', date: '2024-03-30', duration: '4小时', reason: '项目赶进度', urgency: 'high', submitTime: '2024-03-29 18:00', pmApproved: false }
])

const myRecords = ref([
  { id: 1, type: '请假', date: '2024-03-15', status: 'approved', statusText: '已通过', pmApproved: true, ceoApproved: true, showTimeline: false },
  { id: 2, type: '加班', date: '2024-03-10', status: 'pending', statusText: '审批中', pmApproved: true, ceoApproved: false, showTimeline: true }
])

const attendanceStats = ref({
  total: 156,
  approved: 128,
  pending: 18,
  rejected: 10,
  completionRate: '82%'
})

// 计算属性
const myLeaveCount = computed(() => myRecords.value.filter(r => r.type === '请假').length)
const myOvertimeCount = computed(() => myRecords.value.filter(r => r.type === '加班').length)
const totalPending = computed(() => pendingList.value.length)

const statusMap: Record<string, string> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error'
}

// 方法
const switchTab = (tab: string) => {
  activeTab.value = tab
  selectedItem.value = null
}

const selectItem = (item: any) => {
  selectedItem.value = item
}

const resetForm = () => {
  if (activeTab.value === 'leave') {
    leaveForm.value = { type: '', days: '', startDate: '', endDate: '', reason: '' }
  } else {
    overtimeForm.value = { date: '', hours: '', reason: '' }
  }
}

const submitLeave = () => {
  uni.showToast({ title: '提交成功', icon: 'success' })
}

const submitOvertime = () => {
  uni.showToast({ title: '提交成功', icon: 'success' })
}

const approveItem = () => {
  uni.showToast({ title: '已通过', icon: 'success' })
  selectedItem.value = null
}

const rejectItem = () => {
  uni.showToast({ title: '已驳回', icon: 'none' })
  selectedItem.value = null
}
</script>

<style lang="scss" scoped>
.attendance-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-radius-lg);
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  gap: 32px;
  margin-top: 16px;
}

.hero-stat {
  text-align: center;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.attendance-container {
  :deep(.oa-card) {
    margin-bottom: 0;
  }
}

.menu-list {
  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    border-radius: var(--oa-radius-md);
    transition: all 0.2s;

    &:hover, &.active {
      background: var(--oa-primary-light);
      color: var(--oa-primary);
    }
  }
}

.form-item {
  margin-bottom: 24px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--oa-text-secondary);

    .required {
      color: var(--oa-error);
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--oa-border-split);
}

.approval-list {
  .approval-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--oa-border-split);
    cursor: pointer;
    transition: all 0.2s;

    &:hover, &.active {
      background: var(--oa-bg);
    }

    &:last-child {
      border-bottom: none;
    }
  }

  .approval-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .approval-title {
    font-weight: 500;
    font-size: 14px;
  }

  .approval-meta {
    font-size: 12px;
    color: var(--oa-text-tertiary);
  }
}

.detail-content {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }

    .label {
      color: var(--oa-text-secondary);
    }

    .value {
      font-weight: 500;
    }
  }
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.stats-grid {
  .stat-card {
    text-align: center;
    padding: 24px;
    background: var(--oa-bg);
    border-radius: var(--oa-radius-md);

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--oa-primary);
    }

    .stat-label {
      font-size: 14px;
      color: var(--oa-text-secondary);
      margin-top: 8px;
    }
  }
}

.record-list {
  .record-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }
  }

  .record-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .record-title {
    font-weight: 500;
  }

  .record-date {
    font-size: 12px;
    color: var(--oa-text-tertiary);
  }

  .record-timeline {
    margin-top: 8px;
  }
}
</style>
