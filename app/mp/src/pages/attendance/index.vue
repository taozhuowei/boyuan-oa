<template>
  <AppShell title="考勤管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">考勤管理</text>
          <text class="page-desc">{{ isCEO || isPM ? '考勤数据总览与审批管理' : isFinance ? '全员考勤记录查询' : '请假、加班申请与审批' }}</text>
        </view>
        <view class="header-stats">
          <!-- 员工/劳工：个人统计 -->
          <view v-if="!isCEO && !isPM && !isFinance" class="stat-item">
            <text class="stat-value">{{ myLeaveCount }}</text>
            <text class="stat-label">请假记录</text>
          </view>
          <view v-if="!isCEO && !isPM && !isFinance" class="stat-item">
            <text class="stat-value">{{ myOvertimeCount }}</text>
            <text class="stat-label">加班记录</text>
          </view>
          <!-- CEO/PM：待审批数 -->
          <view v-if="isCEO || isPM" class="stat-item">
            <text class="stat-value">{{ totalPending }}</text>
            <text class="stat-label">待审批</text>
          </view>
          <!-- 财务：全员总记录数 -->
          <view v-if="isFinance" class="stat-item">
            <text class="stat-value">{{ totalRecords }}</text>
            <text class="stat-label">考勤记录</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ attendanceStats.completionRate }}</text>
            <text class="stat-label">完成率</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <!-- CEO/PM 视图：状态筛选 -->
          <template v-if="isCEO || isPM">
            <component
              :is="Select"
              v-if="Select"
              v-model="filterStatus"
              :options="statusOptions"
              placeholder="全部状态"
              style="width: 140px"
            />
          </template>
          <!-- 财务视图：无 Tab，搜索框已在 toolbar-right -->
          <template v-else-if="isFinance">
            <text style="font-size: 13px; color: var(--on-surface-variant)">全员考勤记录（只读）</text>
          </template>
          <!-- 员工/劳工视图：Tab 切换 -->
          <template v-else>
            <view class="tab-group">
              <view
                class="tab-item"
                :class="{ active: activeTab === 'leave' }"
                @click="switchTab('leave')"
              >
                请假申请
              </view>
              <view
                class="tab-item"
                :class="{ active: activeTab === 'overtime' }"
                @click="switchTab('overtime')"
              >
                加班申请
              </view>
              <view
                class="tab-item"
                :class="{ active: activeTab === 'history' }"
                @click="switchTab('history')"
              >
                我的记录
              </view>
            </view>
          </template>
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="searchKeyword"
            placeholder="搜索申请人"
            :prefix="'search'"
            style="width: 200px"
          />
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="main-content">
        <!-- 财务视图：全员考勤历史（只读，无审批） -->
        <template v-if="isFinance">
          <view class="full-panel content-card">
            <view class="card-header">
              <text class="card-title">全员考勤记录</text>
            </view>
            <view class="card-body scrollable">
              <view v-if="allRecords.length" class="record-list">
                <view
                  v-for="item in allRecords"
                  :key="item.id"
                  class="record-item"
                >
                  <view class="record-info">
                    <view class="record-line">
                      <text class="record-title">{{ item.applicant }} · {{ item.type }}</text>
                      <view class="status-tag" :class="statusClassMap[item.status]">
                        {{ item.statusText }}
                      </view>
                    </view>
                    <text class="record-date">{{ item.date }} · {{ item.duration }}</text>
                  </view>
                </view>
              </view>
              <view v-else class="empty-state">
                <text>暂无记录</text>
              </view>
            </view>
          </view>
        </template>

        <!-- CEO/PM 审批视图：双栏 -->
        <template v-else-if="isCEO || isPM">
          <!-- 左栏：待审批列表 -->
          <view class="left-panel content-card">
            <view class="card-header">
              <text class="card-title">待处理（{{ pendingList.length }}）</text>
            </view>
            <view class="card-body scrollable">
              <view v-if="pendingList.length" class="approval-list">
                <view
                  v-for="item in pendingList"
                  :key="item.id"
                  class="approval-item"
                  :class="{ active: selectedItem?.id === item.id }"
                  @click="selectItem(item)"
                >
                  <view class="approval-info">
                    <view class="approval-line">
                      <text class="approval-title">{{ item.applicant }}</text>
                      <text class="approval-type">{{ item.type }}</text>
                    </view>
                    <text class="approval-meta">{{ item.date }} · {{ item.duration }}</text>
                  </view>
                  <view 
                    class="priority-dot"
                    :class="item.urgency === 'high' ? 'high' : 'mid'"
                  />
                </view>
              </view>
              <view v-else class="empty-state">
                <text>暂无待审批事项</text>
              </view>
            </view>
          </view>

          <!-- 右栏：审批详情 -->
          <view class="right-panel content-card">
            <template v-if="selectedItem">
              <view class="card-header">
                <text class="card-title">审批详情</text>
                <view class="header-actions">
                  <component :is="Button" v-if="Button" type="primary" size="small" @click="openApprovalModal">审批</component>
                </view>
              </view>
              <view class="card-body scrollable">
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
                  <view class="detail-section">
                    <text class="section-title">审批进度</text>
                    <view class="approval-steps">
                      <!-- 步骤 1：提交申请（始终完成） -->
                      <view class="step done">
                        <view class="step-dot" />
                        <text class="step-label">提交申请</text>
                        <text class="step-time">{{ selectedItem.submitTime }}</text>
                      </view>
                      <view class="step-line done" />
                      <!-- 步骤 2：项目经理审批 -->
                      <view class="step" :class="selectedItem.pmApproved ? 'done' : 'active'">
                        <view class="step-dot" />
                        <text class="step-label">项目经理审批</text>
                        <text class="step-time">{{ selectedItem.pmApproved ? selectedItem.pmApproveTime : '待审批' }}</text>
                      </view>
                      <!-- 步骤 3：CEO 终审（仅 CEO 视图显示） -->
                      <template v-if="isCEO">
                        <view class="step-line" :class="selectedItem.pmApproved ? 'done' : ''" />
                        <view class="step" :class="selectedItem.pmApproved ? 'active' : 'pending'">
                          <view class="step-dot" />
                          <text class="step-label">CEO 终审</text>
                          <text class="step-time">{{ selectedItem.pmApproved ? '待终审' : '—' }}</text>
                        </view>
                      </template>
                    </view>
                  </view>
                </view>
              </view>
            </template>
            <template v-else>
              <view class="card-header">
                <text class="card-title">本月考勤统计</text>
              </view>
              <view class="card-body scrollable">
                <view class="stats-grid">
                  <view class="stat-card primary">
                    <text class="stat-num">{{ attendanceStats.total }}</text>
                    <text class="stat-label">总申请</text>
                  </view>
                  <view class="stat-card success">
                    <text class="stat-num">{{ attendanceStats.approved }}</text>
                    <text class="stat-label">已批准</text>
                  </view>
                  <view class="stat-card warning">
                    <text class="stat-num">{{ attendanceStats.pending }}</text>
                    <text class="stat-label">待审批</text>
                  </view>
                  <view class="stat-card error">
                    <text class="stat-num">{{ attendanceStats.rejected }}</text>
                    <text class="stat-label">已驳回</text>
                  </view>
                </view>
              </view>
            </template>
          </view>
        </template>

        <!-- 员工/劳工 申请视图 -->
        <template v-else>
          <!-- 左栏：菜单 -->
          <view class="left-panel menu-panel content-card">
            <view class="menu-list">
              <view
                class="menu-item"
                :class="{ active: activeTab === 'leave' }"
                @click="switchTab('leave')"
              >
                <text class="menu-icon">✎</text>
                <text>请假申请</text>
              </view>
              <view
                class="menu-item"
                :class="{ active: activeTab === 'overtime' }"
                @click="switchTab('overtime')"
              >
                <text class="menu-icon">◷</text>
                <text>加班申请</text>
              </view>
              <view
                class="menu-item"
                :class="{ active: activeTab === 'history' }"
                @click="switchTab('history')"
              >
                <text class="menu-icon">≡</text>
                <text>我的记录</text>
              </view>
            </view>
          </view>

          <!-- 右栏：表单/列表 -->
          <view class="right-panel content-card">
            <!-- 请假表单 -->
            <template v-if="activeTab === 'leave'">
              <view class="card-header">
                <text class="card-title">请假申请</text>
              </view>
              <view class="card-body scrollable">
                <component :is="Form" v-if="Form" :model="leaveForm">
                  <view class="form-row">
                    <view class="form-item half">
                      <label>请假类型 <text class="required">*</text></label>
                      <component
                        :is="Select"
                        v-if="Select"
                        v-model="leaveForm.type"
                        :options="leaveTypes"
                        placeholder="请选择请假类型"
                      />
                    </view>
                    <view class="form-item half">
                      <label>请假天数 <text class="required">*</text></label>
                      <component
                        :is="Input"
                        v-if="Input"
                        v-model="leaveForm.days"
                        type="number"
                        placeholder="请输入天数"
                      />
                    </view>
                  </view>
                  <view class="form-row">
                    <view class="form-item half">
                      <label>开始日期 <text class="required">*</text></label>
                      <component
                        :is="DatePicker"
                        v-if="DatePicker"
                        v-model="leaveForm.startDate"
                        placeholder="请选择开始日期"
                      />
                    </view>
                    <view class="form-item half">
                      <label>结束日期 <text class="required">*</text></label>
                      <component
                        :is="DatePicker"
                        v-if="DatePicker"
                        v-model="leaveForm.endDate"
                        placeholder="请选择结束日期"
                      />
                    </view>
                  </view>
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
                    <component :is="Button" v-if="Button" @click="resetForm">重置</component>
                    <component :is="Button" v-if="Button" type="primary" @click="submitLeave">提交申请</component>
                  </view>
                </component>
              </view>
            </template>

            <!-- 加班表单 -->
            <template v-else-if="activeTab === 'overtime'">
              <view class="card-header">
                <text class="card-title">加班申请</text>
              </view>
              <view class="card-body scrollable">
                <component :is="Form" v-if="Form" :model="overtimeForm">
                  <view class="form-row">
                    <view class="form-item half">
                      <label>加班日期 <text class="required">*</text></label>
                      <component
                        :is="DatePicker"
                        v-if="DatePicker"
                        v-model="overtimeForm.date"
                        placeholder="请选择加班日期"
                      />
                    </view>
                    <view class="form-item half">
                      <label>加班时长(小时) <text class="required">*</text></label>
                      <component
                        :is="Input"
                        v-if="Input"
                        v-model="overtimeForm.hours"
                        type="number"
                        placeholder="请输入小时数"
                      />
                    </view>
                  </view>
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
                    <component :is="Button" v-if="Button" @click="resetForm">重置</component>
                    <component :is="Button" v-if="Button" type="primary" @click="submitOvertime">提交申请</component>
                  </view>
                </component>
              </view>
            </template>

            <!-- 历史记录 -->
            <template v-else>
              <view class="card-header">
                <text class="card-title">我的考勤记录</text>
              </view>
              <view class="card-body scrollable">
                <view v-if="myRecords.length" class="record-list">
                  <view
                    v-for="item in myRecords"
                    :key="item.id"
                    class="record-item"
                  >
                    <view class="record-info">
                      <view class="record-line">
                        <text class="record-title">{{ item.type }}</text>
                        <view 
                          class="status-tag"
                          :class="statusClassMap[item.status]"
                        >
                          {{ item.statusText }}
                        </view>
                      </view>
                      <text class="record-date">{{ item.date }}</text>
                    </view>
                  </view>
                </view>
                <view v-else class="empty-state">
                  <text>暂无记录</text>
                </view>
              </view>
            </template>
          </view>
        </template>
      </view>

    </view>

    <!-- 审批意见弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      :open="approvalModalVisible"
      title="填写审批意见"
      :footer="null"
      @cancel="closeApprovalModal"
    >
      <view class="approval-modal-body">
        <view class="modal-form-item">
          <label class="modal-label">驳回原因（可选）</label>
          <component
            :is="Textarea"
            v-if="Textarea"
            v-model:value="approvalComment"
            :rows="4"
            placeholder="请输入审批意见或驳回原因，通过时可留空"
            :maxlength="500"
          />
          <textarea
            v-else
            v-model="approvalComment"
            class="fallback-textarea"
            rows="4"
            placeholder="请输入审批意见或驳回原因，通过时可留空"
          />
        </view>
        <view class="modal-actions">
          <component :is="Button" v-if="Button" danger @click="confirmReject">驳回</component>
          <component :is="Button" v-if="Button" type="primary" @click="confirmApprove">通过审批</component>
        </view>
      </view>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const { Row, Col, Card, Button, Badge, Empty, Form, Input, Select, DatePicker, StatCard, Modal, Textarea } = useComponent(['Row', 'Col', 'Card', 'Button', 'Badge', 'Empty', 'Form', 'Input', 'Select', 'DatePicker', 'StatCard', 'Modal', 'Textarea'])

const userStore = useUserStore()

const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isPM = computed(() => userRole.value === 'project_manager')
const isFinance = computed(() => userRole.value === 'finance')

// 标签页状态
const activeTab = ref('leave')
const selectedItem = ref<any>(null)
const filterStatus = ref('')
const searchKeyword = ref('')

// 审批弹窗状态
const approvalModalVisible = ref(false)
const approvalComment = ref('')

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

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' }
]

// Mock 数据
const pendingList = ref([
  { id: 1, applicant: '张晓宁', type: '请假', date: '2024-04-01 至 2024-04-03', duration: '3天', reason: '回家探亲', urgency: 'normal', submitTime: '2024-03-28 09:00', pmApproved: true },
  { id: 2, applicant: '赵铁柱', type: '加班', date: '2024-03-30', duration: '4小时', reason: '项目赶进度', urgency: 'high', submitTime: '2024-03-29 18:00', pmApproved: false }
])

const myRecords = ref([
  { id: 1, type: '请假', date: '2024-03-15', status: 'approved', statusText: '已通过', pmApproved: true, ceoApproved: true },
  { id: 2, type: '加班', date: '2024-03-10', status: 'pending', statusText: '审批中', pmApproved: true, ceoApproved: false }
])

const attendanceStats = ref({
  total: 156,
  approved: 128,
  pending: 18,
  rejected: 10,
  completionRate: '82%'
})

// Finance：全员考勤记录（只读，无审批权限）
const allRecords = ref([
  { id: 1, applicant: '张晓宁', type: '请假', date: '2024-04-01 至 2024-04-03', duration: '3天', status: 'approved', statusText: '已通过' },
  { id: 2, applicant: '赵铁柱', type: '加班', date: '2024-03-30', duration: '4小时', status: 'pending', statusText: '审批中' },
  { id: 3, applicant: '李建国', type: '请假', date: '2024-03-20', duration: '1天', status: 'rejected', statusText: '已驳回' },
  { id: 4, applicant: '王芳', type: '加班', date: '2024-03-18', duration: '3小时', status: 'approved', statusText: '已通过' }
])

// 计算属性
const myLeaveCount = computed(() => myRecords.value.filter(r => r.type === '请假').length)
const myOvertimeCount = computed(() => myRecords.value.filter(r => r.type === '加班').length)
const totalPending = computed(() => pendingList.value.length)
const totalRecords = computed(() => allRecords.value.length)

const statusClassMap: Record<string, string> = {
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

const openApprovalModal = () => {
  approvalComment.value = ''
  approvalModalVisible.value = true
}

const closeApprovalModal = () => {
  approvalModalVisible.value = false
  approvalComment.value = ''
}

const confirmApprove = () => {
  approvalModalVisible.value = false
  approvalComment.value = ''
  uni.showToast({ title: '审批已通过', icon: 'success' })
  selectedItem.value = null
}

const confirmReject = () => {
  approvalModalVisible.value = false
  approvalComment.value = ''
  uni.showToast({ title: '已驳回', icon: 'none' })
  selectedItem.value = null
}
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }

  .page-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-top: 2px;
    display: block;
  }

  .header-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      text-align: right;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary);
        display: block;
        font-family: var(--font-display, 'Manrope');
      }

      .stat-label {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tab-group {
    display: flex;
    gap: 4px;
    background: var(--surface-low);
    padding: 4px;
    border-radius: var(--radius-md);

    .tab-item {
      padding: 6px 16px;
      font-size: 13px;
      color: var(--on-surface-variant);
      cursor: pointer;
      border-radius: var(--radius-sm);
      transition: all 0.2s;

      &:hover {
        color: var(--on-surface);
      }

      &.active {
        background: var(--surface-lowest);
        color: var(--primary);
        font-weight: 600;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
    }
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.full-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.left-panel {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;

  &.menu-panel {
    flex: 0 0 200px;
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-card {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-high);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-surface);
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;
    padding: 16px 20px;

    &.scrollable {
      overflow-y: auto;
    }
  }
}

// 审批列表
.approval-list {
  .approval-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);
    cursor: pointer;
    transition: background 0.15s;

    &:hover, &.active {
      background: var(--surface-low);
      margin: 0 -20px;
      padding-left: 20px;
      padding-right: 20px;
    }

    &:last-child {
      border-bottom: none;
    }

    .approval-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .approval-line {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .approval-title {
        font-weight: 600;
        font-size: 14px;
        color: var(--on-surface);
      }

      .approval-type {
        font-size: 12px;
        padding: 2px 8px;
        background: rgba(0,52,102,0.08);
        color: var(--primary);
        border-radius: 4px;
      }

      .approval-meta {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

// 优先级圆点
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.high { background: var(--error); }
  &.mid { background: var(--warning); }
  &.low { background: var(--success); }
}

// 状态标签
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.success { background: #f0f9eb; color: #2e7d32; }
  &.warning { background: #fff7e6; color: #ed6c02; }
  &.error { background: #fff1f0; color: #ba1a1a; }
}

// 详情内容
.detail-content {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .value {
      font-size: 13px;
      font-weight: 500;
      color: var(--on-surface);
    }
  }

  .detail-section {
    margin-top: 24px;

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--on-surface);
      margin-bottom: 16px;
      display: block;
    }

    // 横向审批步骤条
    .approval-steps {
      display: flex;
      align-items: flex-start;
      gap: 0;
      margin-top: 4px;

      .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        min-width: 80px;

        .step-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--surface-high);
          background: var(--surface);
          flex-shrink: 0;
        }

        .step-label {
          font-size: 11px;
          color: var(--on-surface-variant);
          text-align: center;
          white-space: nowrap;
        }

        .step-time {
          font-size: 10px;
          color: var(--on-surface-variant);
          text-align: center;
          white-space: nowrap;
        }

        &.done {
          .step-dot {
            background: var(--success, #2e7d32);
            border-color: var(--success, #2e7d32);
          }
          .step-label { color: var(--on-surface); font-weight: 600; }
        }

        &.active {
          .step-dot {
            background: var(--primary);
            border-color: var(--primary);
          }
          .step-label { color: var(--primary); font-weight: 600; }
        }

        &.pending {
          .step-dot {
            background: var(--surface);
            border-color: var(--surface-high);
          }
        }
      }

      .step-line {
        flex: 1;
        height: 2px;
        background: var(--surface-high);
        margin-top: 9px; // 垂直居中对齐圆点中心
        align-self: flex-start;

        &.done { background: var(--success, #2e7d32); }
      }
    }
  }
}

// 统计卡片
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .stat-card {
    text-align: center;
    padding: 24px 16px;
    background: var(--surface);
    border-radius: var(--radius-md);

    .stat-num {
      font-size: 28px;
      font-weight: 700;
      color: var(--on-surface);
      font-family: var(--font-display, 'Manrope');
      display: block;
    }

    .stat-label {
      font-size: 12px;
      color: var(--on-surface-variant);
      margin-top: 4px;
      display: block;
    }

    &.primary { background: rgba(0,52,102,0.08); .stat-num { color: var(--primary); } }
    &.success { background: #f0f9eb; .stat-num { color: var(--success); } }
    &.warning { background: #fff7e6; .stat-num { color: var(--warning); } }
    &.error   { background: #fff1f0; .stat-num { color: var(--error); } }
  }
}

// 菜单面板
.menu-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;

  .menu-item {
    height: 44px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--on-surface-variant);

    .menu-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    &:hover {
      background: var(--surface-low);
      color: var(--on-surface);
    }

    &.active {
      background: rgba(0,52,102,0.08);
      color: var(--primary);
      font-weight: 500;
    }
  }
}

// 记录列表
.record-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .record-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child {
      border-bottom: none;
    }

    .record-info {
      flex: 1;
      min-width: 0;

      .record-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 4px;

        .record-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--on-surface);
        }
      }

      .record-date {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

// 表单样式
.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;

  .form-item {
    flex: 1;

    &.half {
      flex: 1;
    }

    label {
      display: block;
      font-size: 13px;
      color: var(--on-surface-variant);
      margin-bottom: 6px;

      .required {
        color: var(--error);
      }
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

// 弹窗样式
.approval-modal-body {
  .modal-form-item {
    margin-bottom: 16px;

    .modal-label {
      display: block;
      font-size: 13px;
      color: var(--on-surface-variant);
      margin-bottom: 8px;
    }
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
  }
}

.fallback-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--on-surface);
  background: var(--surface-lowest);
  box-sizing: border-box;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
}

// 空状态
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px;
  color: var(--on-surface-variant);
  font-size: 14px;
}
</style>
