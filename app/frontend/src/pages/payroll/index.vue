<template>
  <view class="page payroll-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="attach-money" :size="28" />
          <text class="hero-title">薪酬</text>
        </view>
        <text class="hero-subtitle">{{ isAdmin ? '工资条、工伤申报与薪资管理' : '工资条查看与工伤申报' }}</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ payrollCycles.length }}</text>
          <text class="stat-label">工资周期</text>
        </view>
        <view v-if="!isAdmin" class="hero-stat">
          <text class="stat-num">{{ pendingConfirmCount }}</text>
          <text class="stat-label">待确认</text>
        </view>
        <view v-if="!isAdmin" class="hero-stat">
          <text class="stat-num">{{ myInjuryCount }}</text>
          <text class="stat-label">工伤申报</text>
        </view>
        <view v-if="isAdmin" class="hero-stat">
          <text class="stat-num">{{ disputeCount }}</text>
          <text class="stat-label">待处理异议</text>
        </view>
      </view>
    </view>

    <view class="payroll-container">
      <!-- 左侧导航 -->
      <view class="card sidebar">
        <!-- 工资条入口 -->
        <view class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="receipt" :size="16" />
              <text>工资条</text>
            </view>
          </view>
          <view class="period-list">
            <view
              v-for="cycle in payrollCycles"
              :key="cycle.id"
              class="period-item"
              :class="{ active: activeTab === 'payroll' && selectedCycle?.id === cycle.id }"
              @click="selectCycle(cycle)"
            >
              <view class="period-main">
                <text class="period-name">{{ cycle.name }}</text>
                <text class="period-range">{{ cycle.dateRange }}</text>
              </view>
              <Badge :variant="cycleStatusVariant(cycle.status)">{{ cycleStatusText(cycle.status) }}</Badge>
            </view>
          </view>
        </view>

        <!-- 工伤申报入口 - 员工和劳工可见 -->
        <view v-if="canSubmitInjury" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="healing" :size="16" />
              <text>工伤申报</text>
            </view>
          </view>
          <view class="action-list">
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'injury-submit' }"
              @click="activeTab = 'injury-submit'"
            >
              <Icon name="add-circle" :size="18" />
              <text>新增申报</text>
            </view>
            <view 
              class="action-item" 
              :class="{ active: activeTab === 'injury-list' }"
              @click="activeTab = 'injury-list'"
            >
              <Icon name="list" :size="18" />
              <text>我的申报</text>
              <Badge variant="info">{{ myInjuryRecords.length }}</Badge>
            </view>
          </view>
        </view>

        <!-- 工伤审批入口 - 财务和CEO可见 -->
        <view v-if="isAdmin" class="section">
          <view class="section-header">
            <view class="section-title">
              <Icon name="approval" :size="16" />
              <text>工伤审批</text>
            </view>
            <Badge v-if="pendingInjuryCount" variant="warning">{{ pendingInjuryCount }}</Badge>
          </view>
          <view v-if="pendingInjuryList.length" class="record-list">
            <view
              v-for="item in pendingInjuryList"
              :key="item.id"
              class="record-item"
              @click="selectInjury(item)"
            >
              <view class="record-main">
                <text class="record-title">{{ item.employeeName }}</text>
                <text class="record-meta">{{ item.injuryDate }}</text>
              </view>
              <Badge variant="warning">待审批</Badge>
            </view>
          </view>
          <Empty v-else text="暂无待审批" />
        </view>
      </view>

      <!-- 右侧内容区 -->
      <view class="main-content">
        <!-- 工资条详情 -->
        <view v-if="activeTab === 'payroll' && selectedCycle" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="receipt" :size="20" />
              <text class="card-title">{{ selectedCycle.name }}工资条</text>
            </view>
            <Badge :variant="slipStatusVariant(mySlip?.status)">{{ slipStatusText(mySlip?.status) }}</Badge>
          </view>
          <view class="content-body">
            <!-- 员工视图：个人工资条 -->
            <view v-if="!isAdmin" class="slip-detail">
              <view class="net-salary-card">
                <text class="net-label">实发工资</text>
                <text class="net-amount">¥{{ formatAmount(mySlip?.netAmount || 0) }}</text>
                <text class="net-period">{{ selectedCycle.dateRange }}</text>
              </view>

              <view class="section">
                <view class="section-header">
                  <Icon name="trending-up" :size="16" />
                  <text class="section-title">收入构成</text>
                  <text class="section-total">+¥{{ formatAmount(totalIncome) }}</text>
                </view>
                <view class="items-list">
                  <view v-for="item in incomeItems" :key="item.name" class="item-row">
                    <text class="item-name">{{ item.name }}</text>
                    <text class="item-value income">+¥{{ formatAmount(item.amount) }}</text>
                  </view>
                </view>
              </view>

              <view class="section">
                <view class="section-header">
                  <Icon name="trending-down" :size="16" />
                  <text class="section-title">扣除项目</text>
                  <text class="section-total deduct">-¥{{ formatAmount(totalDeduction) }}</text>
                </view>
                <view class="items-list">
                  <view v-for="item in deductionItems" :key="item.name" class="item-row">
                    <text class="item-name">{{ item.name }}</text>
                    <text class="item-value deduct">-¥{{ formatAmount(Math.abs(item.amount)) }}</text>
                  </view>
                </view>
              </view>

              <view class="summary-section">
                <view class="summary-row">
                  <text class="summary-label">应发合计</text>
                  <text class="summary-value">¥{{ formatAmount(totalIncome) }}</text>
                </view>
                <view class="summary-row">
                  <text class="summary-label">扣除合计</text>
                  <text class="summary-value deduct">-¥{{ formatAmount(totalDeduction) }}</text>
                </view>
                <view class="summary-divider" />
                <view class="summary-row final">
                  <text class="summary-label">实发工资</text>
                  <text class="summary-value final">¥{{ formatAmount(mySlip?.netAmount || 0) }}</text>
                </view>
              </view>

              <view v-if="mySlip?.status === 'PENDING'" class="slip-actions">
                <Button variant="ghost" @click="showDisputeDialog">提出异议</Button>
                <Button variant="primary" @click="confirmSlip">确认工资条</Button>
              </view>
            </view>

            <!-- 财务视图：周期管理 -->
            <view v-else class="admin-view">
              <view class="admin-header">
                <view class="info-row">
                  <text class="info-label">日期范围</text>
                  <text class="info-value">{{ selectedCycle.dateRange }}</text>
                </view>
                <view class="info-row">
                  <text class="info-label">当前状态</text>
                  <Badge :variant="cycleStatusVariant(selectedCycle.status)">{{ cycleStatusText(selectedCycle.status) }}</Badge>
                </view>
                <view class="info-row">
                  <text class="info-label">员工人数</text>
                  <text class="info-value">{{ cycleSlips.length }} 人</text>
                </view>
                <view class="info-row">
                  <text class="info-label">薪资总额</text>
                  <text class="info-value">¥{{ formatAmount(totalPayrollAmount) }}</text>
                </view>
                <view v-if="selectedCycle.status === 'DRAFT'" class="admin-actions">
                  <Button variant="primary" @click="precheckCycle">预结算</Button>
                </view>
                <view v-if="selectedCycle.status === 'PRECHECK'" class="admin-actions">
                  <Button variant="primary" @click="settleCycle">正式结算</Button>
                </view>
              </view>

              <view class="slip-list-section">
                <view class="section-title">员工工资明细</view>
                <view class="slip-list">
                  <view v-for="slip in cycleSlips" :key="slip.id" class="slip-item">
                    <view class="slip-info">
                      <text class="slip-name">{{ slip.employeeName }}</text>
                      <text class="slip-dept">{{ slip.department }}</text>
                    </view>
                    <view class="slip-amount">
                      <text class="amount-net">¥{{ formatAmount(slip.netAmount) }}</text>
                      <Badge :variant="slipStatusVariant(slip.status)">{{ slipStatusText(slip.status) }}</Badge>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 工伤申报表单 -->
        <view v-if="activeTab === 'injury-submit'" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="healing" :size="20" />
              <text class="card-title">工伤申报</text>
            </view>
          </view>
          <view class="content-body">
            <view class="alert-box">
              <Icon name="warning" :size="16" />
              <text>请如实填写工伤情况，虚假信息将承担法律责任</text>
            </view>
            <view class="form-field">
              <text class="field-label">发生日期 <text class="required">*</text></text>
              <picker class="field-picker" mode="date" @change="onInjuryDateChange">
                <view class="picker-display">
                  <text>{{ injuryForm.date || '请选择日期' }}</text>
                  <Icon name="arrow-forward" :size="14" />
                </view>
              </picker>
            </view>
            <view class="form-field">
              <text class="field-label">发生地点 <text class="required">*</text></text>
              <input v-model="injuryForm.location" class="field-input" placeholder="请输入工伤发生地点" />
            </view>
            <view class="form-field">
              <text class="field-label">伤情描述 <text class="required">*</text></text>
              <textarea v-model="injuryForm.description" class="field-textarea" placeholder="请详细描述受伤经过和伤情" />
            </view>
            <view class="form-field">
              <text class="field-label">医疗费用（元）</text>
              <input v-model="injuryForm.medicalFee" class="field-input" type="digit" placeholder="请输入医疗费用" />
            </view>
            <view class="form-field">
              <text class="field-label">申请补偿金额（元）</text>
              <input v-model="injuryForm.compensation" class="field-input" type="digit" placeholder="请输入申请补偿金额" />
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="resetInjuryForm">重置</Button>
              <Button variant="primary" @click="submitInjury">提交申报</Button>
            </view>
          </view>
        </view>

        <!-- 我的工伤申报列表 -->
        <view v-if="activeTab === 'injury-list'" class="card content-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="list" :size="20" />
              <text class="card-title">我的工伤申报</text>
            </view>
          </view>
          <view class="content-body">
            <view v-if="myInjuryRecords.length" class="injury-list">
              <view v-for="item in myInjuryRecords" :key="item.id" class="injury-item">
                <view class="injury-header">
                  <text class="injury-date">{{ item.injuryDate }}</text>
                  <Badge :variant="injuryStatusVariant(item.status)">{{ injuryStatusText(item.status) }}</Badge>
                </view>
                <view class="injury-info">
                  <text class="injury-location">{{ item.injuryLocation }}</text>
                  <text class="injury-desc">{{ item.injuryDesc }}</text>
                </view>
                <view class="injury-amounts">
                  <text>医疗费用：¥{{ item.medicalFee || 0 }}</text>
                  <text>申请补偿：¥{{ item.compensation || 0 }}</text>
                </view>
              </view>
            </view>
            <Empty v-else text="暂无工伤申报记录" />
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!activeTab && !selectedCycle" class="card empty-card">
          <Empty text="请选择左侧功能查看详情" />
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
const isAdmin = computed(() => ['finance', 'ceo'].includes(userRole.value))
const canSubmitInjury = computed(() => ['employee', 'worker'].includes(userRole.value))

// 标签页状态
const activeTab = ref<'payroll' | 'injury-submit' | 'injury-list' | null>('payroll')
const selectedCycle = ref<any>(null)

// Mock 数据 - 工资周期
const payrollCycles = ref([
  { id: 1, year: 2024, month: 3, name: '2024年3月', dateRange: '2024-03-01 至 2024-03-31', status: 'SETTLED' },
  { id: 2, year: 2024, month: 4, name: '2024年4月', dateRange: '2024-04-01 至 2024-04-30', status: 'PRECHECK' },
  { id: 3, year: 2024, month: 2, name: '2024年2月', dateRange: '2024-02-01 至 2024-02-29', status: 'SETTLED' }
])

// Mock 数据 - 工资单
const mySlips: Record<number, any> = {
  1: { id: 101, employeeName: userName.value, department: '综合管理部', netAmount: 10625, status: 'CONFIRMED', items: [{ name: '基本工资', amount: 8000, type: 'income' }, { name: '岗位津贴', amount: 2000, type: 'income' }, { name: '绩效奖金', amount: 2500, type: 'income' }, { name: '社保个人部分', amount: -1200, type: 'deduction' }, { name: '公积金个人部分', amount: -675, type: 'deduction' }] },
  2: { id: 102, employeeName: userName.value, department: '综合管理部', netAmount: 10625, status: 'PENDING', items: [{ name: '基本工资', amount: 8000, type: 'income' }, { name: '岗位津贴', amount: 2000, type: 'income' }, { name: '绩效奖金', amount: 2500, type: 'income' }, { name: '社保个人部分', amount: -1200, type: 'deduction' }, { name: '公积金个人部分', amount: -675, type: 'deduction' }] },
  3: { id: 103, employeeName: userName.value, department: '综合管理部', netAmount: 10200, status: 'CONFIRMED', items: [{ name: '基本工资', amount: 8000, type: 'income' }, { name: '岗位津贴', amount: 2000, type: 'income' }, { name: '绩效奖金', amount: 2000, type: 'income' }, { name: '社保个人部分', amount: -1200, type: 'deduction' }, { name: '公积金个人部分', amount: -600, type: 'deduction' }] }
}

// Mock 数据 - 周期工资单（财务视图）
const cycleSlipsMap: Record<number, any[]> = {
  1: [{ id: 101, employeeName: '张晓宁', department: '综合管理部', netAmount: 10625, status: 'CONFIRMED' }, { id: 102, employeeName: '赵铁柱', department: '施工一部', netAmount: 8500, status: 'CONFIRMED' }],
  2: [{ id: 201, employeeName: '张晓宁', department: '综合管理部', netAmount: 10625, status: 'PENDING' }, { id: 202, employeeName: '赵铁柱', department: '施工一部', netAmount: 8500, status: 'DISPUTED' }]
}

// Mock 数据 - 工伤申报
const myInjuryRecords = ref([
  { id: 1, employeeName: userName.value, injuryDate: '2024-03-10', injuryLocation: '工地二楼', injuryDesc: '搬运材料时扭伤腰部', medicalFee: 500, compensation: 1000, status: 'APPROVED' }
])

const pendingInjuryList = ref([
  { id: 2, employeeName: '赵铁柱', injuryDate: '2024-03-20', injuryLocation: '施工现场', injuryDesc: '高空作业时跌落', medicalFee: 2000, compensation: 5000, status: 'PENDING' }
])

// 工伤申报表单
const injuryForm = ref({ date: '', location: '', description: '', medicalFee: '', compensation: '' })

// 计算属性
const mySlip = computed(() => selectedCycle.value ? mySlips[selectedCycle.value.id] : null)
const incomeItems = computed(() => mySlip.value?.items.filter((i: any) => i.type === 'income') || [])
const deductionItems = computed(() => mySlip.value?.items.filter((i: any) => i.type === 'deduction') || [])
const totalIncome = computed(() => incomeItems.value.reduce((sum: number, i: any) => sum + i.amount, 0))
const totalDeduction = computed(() => Math.abs(deductionItems.value.reduce((sum: number, i: any) => sum + i.amount, 0)))
const pendingConfirmCount = computed(() => Object.values(mySlips).filter((s: any) => s.status === 'PENDING').length)
const myInjuryCount = computed(() => myInjuryRecords.value.length)
const disputeCount = computed(() => 1)
const pendingInjuryCount = computed(() => pendingInjuryList.value.length)
const cycleSlips = computed(() => selectedCycle.value ? (cycleSlipsMap[selectedCycle.value.id] || []) : [])
const totalPayrollAmount = computed(() => cycleSlips.value.reduce((sum, s) => sum + s.netAmount, 0))

// 状态显示函数
const cycleStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { DRAFT: 'default', PRECHECK: 'warning', SETTLED: 'success' }
  return map[status] || 'default'
}
const cycleStatusText = (status: string) => ({ DRAFT: '草稿', PRECHECK: '预结算中', SETTLED: '已结算' }[status] || status)
const slipStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { PENDING: 'warning', CONFIRMED: 'success', DISPUTED: 'danger' }
  return map[status] || 'default'
}
const slipStatusText = (status: string) => ({ PENDING: '待确认', CONFIRMED: '已确认', DISPUTED: '有异议' }[status] || status)
const injuryStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }
  return map[status] || 'default'
}
const injuryStatusText = (status: string) => ({ PENDING: '审批中', APPROVED: '已通过', REJECTED: '已驳回' }[status] || status)

// 方法
const formatAmount = (amount: number) => amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const selectCycle = (cycle: any) => { activeTab.value = 'payroll'; selectedCycle.value = cycle }
const onInjuryDateChange = (e: any) => injuryForm.value.date = e.detail.value
const resetInjuryForm = () => injuryForm.value = { date: '', location: '', description: '', medicalFee: '', compensation: '' }
const submitInjury = () => {
  if (!injuryForm.value.date || !injuryForm.value.location || !injuryForm.value.description) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  uni.showToast({ title: '申报成功', icon: 'success' })
  resetInjuryForm()
}
const selectInjury = (item: any) => uni.showModal({ title: '工伤申报详情', content: `${item.employeeName} - ${item.injuryDesc}`, showCancel: false })
const confirmSlip = () => uni.showModal({ title: '确认工资条', content: '确认后将无法修改，是否继续？', success: (res) => { if (res.confirm) uni.showToast({ title: '确认成功', icon: 'success' }) } })
const showDisputeDialog = () => uni.showModal({ title: '提出异议', editable: true, placeholderText: '请输入异议原因', success: (res) => { if (res.confirm && res.content) uni.showToast({ title: '异议已提交', icon: 'success' }) } })
const precheckCycle = () => uni.showToast({ title: '预结算完成', icon: 'success' })
const settleCycle = () => uni.showModal({ title: '正式结算', content: '结算后员工将收到工资条，是否继续？', success: (res) => { if (res.confirm) uni.showToast({ title: '结算成功', icon: 'success' }) } })
</script>

<style lang="scss" scoped>
.payroll-page {
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

.payroll-container {
  display: grid;
  grid-template-columns: 300px 1fr;
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

.period-list, .action-list, .record-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-item, .action-item, .record-item {
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

.period-main, .record-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-name, .record-title {
  font-weight: 500;
  font-size: 14px;
}

.period-range, .record-meta {
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

.content-body {
  padding: 24px;
}

.net-salary-card {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 32px;
  border-radius: var(--radius-lg);
  text-align: center;
  margin-bottom: 24px;
}

.net-label {
  font-size: 14px;
  opacity: 0.9;
  display: block;
  margin-bottom: 8px;
}

.net-amount {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  display: block;
  margin-bottom: 8px;
}

.net-period {
  font-size: 12px;
  opacity: 0.8;
}

.section {
  margin-bottom: 20px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.item-name {
  font-size: 14px;
  color: var(--text-secondary);
}

.item-value {
  font-size: 14px;
  font-weight: 500;
  &.income {
    color: var(--success-color);
  }
  &.deduct {
    color: var(--danger-color);
  }
}

.summary-section {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: var(--radius-md);
  margin-top: 24px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  &.final {
    padding-top: 12px;
    margin-top: 8px;
    border-top: 2px solid var(--border-color);
    .summary-label, .summary-value {
      font-size: 16px;
      font-weight: 700;
    }
  }
}

.summary-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.summary-value {
  font-size: 14px;
  font-weight: 500;
  &.deduct {
    color: var(--danger-color);
  }
  &.final {
    color: var(--primary-color);
  }
}

.slip-actions, .form-actions, .admin-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
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

.admin-view .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.slip-list-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.slip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slip-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.slip-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slip-name {
  font-weight: 500;
  font-size: 14px;
}

.slip-dept {
  font-size: 12px;
  color: var(--text-secondary);
}

.slip-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.amount-net {
  font-weight: 600;
  font-size: 14px;
}

.injury-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.injury-item {
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.injury-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.injury-date {
  font-weight: 600;
  font-size: 14px;
}

.injury-info {
  margin-bottom: 12px;
}

.injury-location {
  font-size: 14px;
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.injury-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.injury-amounts {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
