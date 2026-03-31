<template>
  <view class="page payroll-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="attach-money" :size="28" />
          <text class="hero-title">薪酬系统</text>
        </view>
        <text class="hero-subtitle">{{ isAdmin ? '薪资管理与结算' : '工资条查看与确认' }}</text>
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
        <view v-if="isAdmin" class="hero-stat">
          <text class="stat-num">{{ disputeCount }}</text>
          <text class="stat-label">待处理异议</text>
        </view>
      </view>
    </view>

    <view class="payroll-container">
      <!-- 左侧周期列表 -->
      <view class="card period-list-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="schedule" :size="18" />
            <text class="card-title">工资周期</text>
          </view>
        </view>
        <view class="year-sections">
          <view v-for="year in groupedCycles" :key="year.year" class="year-section">
            <view class="year-header">
              <text class="year-text">{{ year.year }}年</text>
              <Badge variant="info">{{ year.cycles.length }} 期</Badge>
            </view>
            <view class="period-list">
              <view
                v-for="cycle in year.cycles"
                :key="cycle.id"
                class="period-item"
                :class="{ active: selectedCycle?.id === cycle.id }"
                @click="selectCycle(cycle)"
              >
                <view class="period-main">
                  <text class="period-month">{{ cycle.month }}月</text>
                  <text class="period-range">{{ cycle.dateRange }}</text>
                </view>
                <view class="period-status">
                  <Badge :variant="cycleStatusVariant(cycle.status)">{{ cycleStatusText(cycle.status) }}</Badge>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 右侧内容区 -->
      <view class="main-content">
        <!-- 员工视图：工资条详情 -->
        <view v-if="!isAdmin && selectedCycle" class="card slip-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="receipt" :size="20" />
              <text class="card-title">{{ selectedCycle.year }}年{{ selectedCycle.month }}月工资条</text>
            </view>
            <Badge :variant="slipStatusVariant(mySlip?.status)">{{ slipStatusText(mySlip?.status) }}</Badge>
          </view>
          <view class="slip-body">
            <!-- 实发工资卡片 -->
            <view class="net-salary-card">
              <text class="net-label">实发工资</text>
              <text class="net-amount">¥{{ formatAmount(mySlip?.netAmount || 0) }}</text>
              <text class="net-period">{{ selectedCycle.dateRange }}</text>
            </view>

            <!-- 收入明细 -->
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

            <!-- 扣除明细 -->
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

            <!-- 汇总 -->
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

            <!-- 操作按钮 -->
            <view v-if="mySlip?.status === 'PENDING'" class="slip-actions">
              <Button variant="ghost" @click="showDisputeDialog">提出异议</Button>
              <Button variant="primary" @click="confirmSlip">确认工资条</Button>
            </view>
          </view>
        </view>

        <!-- 财务/CEO视图：周期管理 -->
        <view v-if="isAdmin && selectedCycle" class="card admin-card">
          <view class="card-header">
            <view class="card-header-title">
              <Icon name="settings" :size="20" />
              <text class="card-title">周期管理</text>
            </view>
            <view class="header-actions">
              <Button 
                v-if="selectedCycle.status === 'DRAFT'" 
                variant="primary" 
                size="small"
                @click="precheckCycle"
              >
                预结算
              </Button>
              <Button 
                v-if="selectedCycle.status === 'PRECHECK'" 
                variant="primary" 
                size="small"
                @click="settleCycle"
              >
                正式结算
              </Button>
            </view>
          </view>
          <view class="admin-body">
            <view class="info-row">
              <text class="info-label">周期名称</text>
              <text class="info-value">{{ selectedCycle.name }}</text>
            </view>
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

            <!-- 员工工资列表 -->
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

        <!-- 空状态 -->
        <view v-if="!selectedCycle" class="card empty-card">
          <Empty text="选择左侧工资周期查看详情" />
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

// 选中的周期
const selectedCycle = ref<any>(null)

// Mock 数据 - 工资周期
const payrollCycles = ref([
  { id: 1, year: 2024, month: 3, name: '2024年3月', dateRange: '2024-03-01 至 2024-03-31', status: 'SETTLED' },
  { id: 2, year: 2024, month: 4, name: '2024年4月', dateRange: '2024-04-01 至 2024-04-30', status: 'PRECHECK' },
  { id: 3, year: 2024, month: 2, name: '2024年2月', dateRange: '2024-02-01 至 2024-02-29', status: 'SETTLED' }
])

// Mock 数据 - 工资单（员工视图）
const mySlips: Record<number, any> = {
  1: {
    id: 101,
    cycleId: 1,
    employeeName: userName.value,
    department: '综合管理部',
    grossAmount: 12500,
    netAmount: 10625,
    status: 'CONFIRMED',
    items: [
      { name: '基本工资', amount: 8000, type: 'income' },
      { name: '岗位津贴', amount: 2000, type: 'income' },
      { name: '绩效奖金', amount: 2500, type: 'income' },
      { name: '社保个人部分', amount: -1200, type: 'deduction' },
      { name: '公积金个人部分', amount: -675, type: 'deduction' }
    ]
  },
  2: {
    id: 102,
    cycleId: 2,
    employeeName: userName.value,
    department: '综合管理部',
    grossAmount: 12500,
    netAmount: 10625,
    status: 'PENDING',
    items: [
      { name: '基本工资', amount: 8000, type: 'income' },
      { name: '岗位津贴', amount: 2000, type: 'income' },
      { name: '绩效奖金', amount: 2500, type: 'income' },
      { name: '社保个人部分', amount: -1200, type: 'deduction' },
      { name: '公积金个人部分', amount: -675, type: 'deduction' }
    ]
  },
  3: {
    id: 103,
    cycleId: 3,
    employeeName: userName.value,
    department: '综合管理部',
    grossAmount: 12000,
    netAmount: 10200,
    status: 'CONFIRMED',
    items: [
      { name: '基本工资', amount: 8000, type: 'income' },
      { name: '岗位津贴', amount: 2000, type: 'income' },
      { name: '绩效奖金', amount: 2000, type: 'income' },
      { name: '社保个人部分', amount: -1200, type: 'deduction' },
      { name: '公积金个人部分', amount: -600, type: 'deduction' }
    ]
  }
}

// Mock 数据 - 周期工资单列表（财务视图）
const cycleSlipsMap: Record<number, any[]> = {
  1: [
    { id: 101, employeeName: '张晓宁', department: '综合管理部', netAmount: 10625, status: 'CONFIRMED' },
    { id: 102, employeeName: '赵铁柱', department: '施工一部', netAmount: 8500, status: 'CONFIRMED' },
    { id: 103, employeeName: '李静', department: '财务管理部', netAmount: 11500, status: 'CONFIRMED' }
  ],
  2: [
    { id: 201, employeeName: '张晓宁', department: '综合管理部', netAmount: 10625, status: 'PENDING' },
    { id: 202, employeeName: '赵铁柱', department: '施工一部', netAmount: 8500, status: 'PENDING' },
    { id: 203, employeeName: '李静', department: '财务管理部', netAmount: 11500, status: 'DISPUTED' }
  ],
  3: [
    { id: 301, employeeName: '张晓宁', department: '综合管理部', netAmount: 10200, status: 'CONFIRMED' },
    { id: 302, employeeName: '赵铁柱', department: '施工一部', netAmount: 8200, status: 'CONFIRMED' }
  ]
}

// 计算属性
const groupedCycles = computed(() => {
  const groups: Record<number, any[]> = {}
  payrollCycles.value.forEach(c => {
    if (!groups[c.year]) groups[c.year] = []
    groups[c.year].push(c)
  })
  return Object.entries(groups)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, cycles]) => ({ year: Number(year), cycles: cycles.sort((a, b) => b.month - a.month) }))
})

const mySlip = computed(() => {
  if (!selectedCycle.value) return null
  return mySlips[selectedCycle.value.id]
})

const incomeItems = computed(() => mySlip.value?.items.filter((i: any) => i.type === 'income') || [])
const deductionItems = computed(() => mySlip.value?.items.filter((i: any) => i.type === 'deduction') || [])
const totalIncome = computed(() => incomeItems.value.reduce((sum: number, i: any) => sum + i.amount, 0))
const totalDeduction = computed(() => Math.abs(deductionItems.value.reduce((sum: number, i: any) => sum + i.amount, 0)))

const pendingConfirmCount = computed(() => Object.values(mySlips).filter((s: any) => s.status === 'PENDING').length)
const disputeCount = computed(() => {
  let count = 0
  Object.values(cycleSlipsMap).forEach((slips: any[]) => {
    count += slips.filter(s => s.status === 'DISPUTED').length
  })
  return count
})

const cycleSlips = computed(() => {
  if (!selectedCycle.value) return []
  return cycleSlipsMap[selectedCycle.value.id] || []
})

const totalPayrollAmount = computed(() => cycleSlips.value.reduce((sum, s) => sum + s.netAmount, 0))

// 状态显示
const cycleStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { 
    DRAFT: 'default', PRECHECK: 'warning', SETTLED: 'success' 
  }
  return map[status] || 'default'
}
const cycleStatusText = (status: string) => {
  const map: Record<string, string> = { DRAFT: '草稿', PRECHECK: '预结算中', SETTLED: '已结算' }
  return map[status] || status
}
const slipStatusVariant = (status: string): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = { 
    PENDING: 'warning', CONFIRMED: 'success', DISPUTED: 'danger' 
  }
  return map[status] || 'default'
}
const slipStatusText = (status: string) => {
  const map: Record<string, string> = { PENDING: '待确认', CONFIRMED: '已确认', DISPUTED: '有异议' }
  return map[status] || status
}

// 方法
const formatAmount = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const selectCycle = (cycle: any) => {
  selectedCycle.value = cycle
}

const confirmSlip = () => {
  uni.showModal({
    title: '确认工资条',
    content: '确认后将无法修改，是否继续？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '确认成功', icon: 'success' })
        if (mySlip.value) mySlip.value.status = 'CONFIRMED'
      }
    }
  })
}

const showDisputeDialog = () => {
  uni.showModal({
    title: '提出异议',
    editable: true,
    placeholderText: '请输入异议原因',
    success: (res) => {
      if (res.confirm && res.content) {
        uni.showToast({ title: '异议已提交', icon: 'success' })
        if (mySlip.value) mySlip.value.status = 'DISPUTED'
      }
    }
  })
}

const precheckCycle = () => {
  uni.showToast({ title: '预结算完成', icon: 'success' })
  if (selectedCycle.value) selectedCycle.value.status = 'PRECHECK'
}

const settleCycle = () => {
  uni.showModal({
    title: '正式结算',
    content: '结算后员工将收到工资条，是否继续？',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({ title: '结算成功', icon: 'success' })
        if (selectedCycle.value) selectedCycle.value.status = 'SETTLED'
      }
    }
  })
}
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

.period-list-card {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
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

.year-sections {
  padding: 16px;
}

.year-section {
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
}

.year-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.year-text {
  font-weight: 600;
  font-size: 14px;
}

.period-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.period-item {
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

.period-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.period-month {
  font-weight: 500;
  font-size: 14px;
}

.period-range {
  font-size: 12px;
  color: var(--text-secondary);
}

.main-content {
  min-height: 600px;
}

.slip-card, .admin-card, .empty-card {
  height: 100%;
}

.slip-body, .admin-body {
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

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  flex: 1;
}

.section-total {
  font-weight: 600;
  color: var(--success-color);
  &.deduct {
    color: var(--danger-color);
  }
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

.slip-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
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
  .section-title {
    font-weight: 600;
    margin-bottom: 12px;
    display: block;
  }
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
</style>
