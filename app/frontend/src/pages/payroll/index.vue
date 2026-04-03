<template>
  <AppShell title="薪资档案">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">薪资档案</text>
          <text class="page-desc">{{ isCEO ? '全员工资管理与薪酬统计' : '本月薪资明细与历史记录' }}</text>
        </view>
        <view class="header-stats">
          <view v-if="!isCEO" class="stat-item">
            <text class="stat-value">{{ salaryData.month }}月</text>
            <text class="stat-label">当前月份</text>
          </view>
          <view v-if="!isCEO" class="stat-item">
            <text class="stat-value" :class="salaryData.status === '已发放' ? 'success' : 'warning'">{{ salaryData.status }}</text>
            <text class="stat-label">发放状态</text>
          </view>
          <view v-if="isCEO" class="stat-item">
            <text class="stat-value">{{ ceoStats.employeeCount }}</text>
            <text class="stat-label">发薪人数</text>
          </view>
          <view v-if="isCEO" class="stat-item">
            <text class="stat-value">{{ formatAmount(ceoStats.totalPayroll) }}</text>
            <text class="stat-label">本月总支出</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Select"
            v-if="Select"
            v-model="selectedMonth"
            :options="monthOptions"
            placeholder="选择月份"
            style="width: 140px"
          />
          <component
            :is="Select"
            v-if="Select"
            v-model="filterStatus"
            :options="payStatusOptions"
            placeholder="全部状态"
            style="width: 120px"
          />
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="searchKeyword"
            placeholder="搜索员工姓名"
            :prefix="'search'"
            style="width: 200px"
          />
          <component :is="Button" v-if="Button && isCEO" type="primary" @click="exportPayroll">导出工资表</component>
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="main-content">
        <!-- 普通员工视图 -->
        <template v-if="!isCEO">
          <!-- 左侧：薪资总览 -->
          <view class="left-panel content-card">
            <view class="card-header">
              <text class="card-title">薪资概览</text>
              <view 
                class="status-tag"
                :class="salaryData.status === '已发放' ? 'success' : 'warning'"
              >
                {{ salaryData.status }}
              </view>
            </view>
            <view class="card-body scrollable">
              <view class="salary-amount-section">
                <text class="amount-label">本月实发工资</text>
                <text class="amount-value">¥{{ salaryData.netPay.toLocaleString() }}</text>
                <text class="amount-date">发放日期: {{ salaryData.payDate || '待定' }}</text>
              </view>
              <view class="amount-divider" />
              <view class="salary-breakdown">
                <view class="breakdown-item">
                  <text class="breakdown-label">基本工资</text>
                  <text class="breakdown-value positive">+¥{{ salaryData.baseSalary.toLocaleString() }}</text>
                </view>
                <view class="breakdown-item">
                  <text class="breakdown-label">岗位津贴</text>
                  <text class="breakdown-value positive">+¥{{ salaryData.allowance.toLocaleString() }}</text>
                </view>
                <view class="breakdown-item">
                  <text class="breakdown-label">绩效奖金</text>
                  <text class="breakdown-value positive">+¥{{ salaryData.bonus.toLocaleString() }}</text>
                </view>
                <view class="breakdown-item">
                  <text class="breakdown-label">加班费</text>
                  <text class="breakdown-value positive">+¥{{ salaryData.overtime.toLocaleString() }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 右侧：薪资明细 -->
          <view class="right-panel content-card">
            <view class="card-header">
              <text class="card-title">薪资明细</text>
            </view>
            <view class="card-body scrollable">
              <view class="detail-section">
                <text class="section-title">应发项目</text>
                <view class="detail-row">
                  <text class="item-name">基本工资</text>
                  <text class="item-value positive">+¥{{ salaryData.baseSalary.toLocaleString() }}</text>
                </view>
                <view class="detail-row">
                  <text class="item-name">岗位津贴</text>
                  <text class="item-value positive">+¥{{ salaryData.allowance.toLocaleString() }}</text>
                </view>
                <view class="detail-row">
                  <text class="item-name">绩效奖金</text>
                  <text class="item-value positive">+¥{{ salaryData.bonus.toLocaleString() }}</text>
                </view>
                <view class="detail-row">
                  <text class="item-name">加班费</text>
                  <text class="item-value positive">+¥{{ salaryData.overtime.toLocaleString() }}</text>
                </view>
              </view>
              <view class="detail-section">
                <text class="section-title">应扣项目</text>
                <view class="detail-row">
                  <text class="item-name">个人所得税</text>
                  <text class="item-value negative">-¥{{ salaryData.tax.toLocaleString() }}</text>
                </view>
                <view class="detail-row">
                  <text class="item-name">社保公积金</text>
                  <text class="item-value negative">-¥{{ salaryData.insurance.toLocaleString() }}</text>
                </view>
                <view class="detail-row">
                  <text class="item-name">其他扣除</text>
                  <text class="item-value negative">-¥{{ salaryData.otherDeduction.toLocaleString() }}</text>
                </view>
              </view>
              <view class="detail-total">
                <text>实发工资</text>
                <text class="total-value">¥{{ salaryData.netPay.toLocaleString() }}</text>
              </view>
            </view>
          </view>
        </template>

        <!-- CEO 管理视图 -->
        <template v-else>
          <view class="full-panel content-card">
            <view class="card-header">
              <text class="card-title">员工薪资管理</text>
            </view>
            <view class="card-body scrollable">
              <view class="data-table">
                <view class="table-head">
                  <text class="cell" style="flex: 1">姓名</text>
                  <text class="cell" style="flex: 1">部门</text>
                  <text class="cell" style="flex: 1; text-align: right">基本工资</text>
                  <text class="cell" style="flex: 1; text-align: right">绩效</text>
                  <text class="cell" style="flex: 1; text-align: right">扣除</text>
                  <text class="cell" style="flex: 1; text-align: right">实发</text>
                  <text class="cell" style="width: 80px; text-align: center">状态</text>
                  <text class="cell" style="width: 100px; text-align: center">操作</text>
                </view>
                <view v-for="item in filteredPayrollList" :key="item.id" class="table-row">
                  <text class="cell" style="flex: 1; font-weight: 500">{{ item.name }}</text>
                  <text class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ item.department }}</text>
                  <text class="cell" style="flex: 1; text-align: right">¥{{ item.base.toLocaleString() }}</text>
                  <text class="cell" style="flex: 1; text-align: right">¥{{ item.bonus.toLocaleString() }}</text>
                  <text class="cell negative" style="flex: 1; text-align: right">¥{{ item.deduction.toLocaleString() }}</text>
                  <text class="cell highlight" style="flex: 1; text-align: right; font-weight: 600">¥{{ item.net.toLocaleString() }}</text>
                  <view class="cell" style="width: 80px; text-align: center">
                    <view 
                      class="status-tag"
                      :class="item.status === 'paid' ? 'success' : 'warning'"
                    >
                      {{ item.status === 'paid' ? '已发放' : '待发放' }}
                    </view>
                  </view>
                  <view class="cell" style="width: 100px; text-align: center">
                    <component
                      :is="Button"
                      v-if="Button && item.status === 'pending'"
                      type="primary"
                      size="small"
                      @click="confirmPay(item)"
                    >
                      确认发放
                    </component>
                    <text v-else class="text-muted" style="font-size: 12px">已发放</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </template>
      </view>

      <!-- 底部：审批流程/历史记录 -->
      <view v-if="!isCEO" class="bottom-section">
        <view class="content-card" style="flex: 1">
          <view class="card-header">
            <text class="card-title">审批流程</text>
          </view>
          <view class="card-body scrollable">
            <component :is="Timeline" v-if="Timeline">
              <component
                :is="TimelineItem"
                v-if="TimelineItem"
                v-for="(item, index) in approvalFlow"
                :key="index"
                :title="item.title"
                :description="item.description"
                :time="item.time"
                :status="item.status"
              />
            </component>
          </view>
        </view>
        <view class="content-card" style="flex: 1">
          <view class="card-header">
            <text class="card-title">历史薪资记录</text>
          </view>
          <view class="card-body scrollable">
            <view v-if="salaryHistory.length" class="history-list">
              <view v-for="item in salaryHistory" :key="item.id" class="history-item">
                <view class="history-info">
                  <text class="history-month">{{ item.month }}</text>
                  <view 
                    class="status-tag"
                    :class="item.status"
                  >
                    {{ item.statusText }}
                  </view>
                </view>
                <text class="history-amount">¥{{ item.amount.toLocaleString() }}</text>
              </view>
            </view>
            <view v-else class="empty-state">
              <text>暂无历史记录</text>
            </view>
          </view>
        </view>
      </view>

    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const { Card, Row, Col, Badge, Button, Input, Select, StatCard, Timeline, TimelineItem } = useComponent(['Card', 'Row', 'Col', 'Badge', 'Button', 'Input', 'Select', 'StatCard', 'Timeline', 'TimelineItem'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isFinance = computed(() => userRole.value === 'finance')

// 状态
const selectedMonth = ref('2024-03')
const filterStatus = ref('')
const searchKeyword = ref('')

// 选项
const monthOptions = [
  { label: '2024-03', value: '2024-03' },
  { label: '2024-02', value: '2024-02' },
  { label: '2024-01', value: '2024-01' }
]

const payStatusOptions = [
  { label: '全部', value: '' },
  { label: '已发放', value: 'paid' },
  { label: '待发放', value: 'pending' }
]

// 审批流程数据
const approvalFlow = ref([
  { title: '薪资计算完成', description: '系统自动计算', time: '2024-04-01 09:00', status: 'success' as const },
  { title: '部门审核', description: '人事部审核通过', time: '2024-04-02 14:30', status: 'success' as const },
  { title: '财务审核', description: '财务部复核中', time: '2024-04-03 10:00', status: 'processing' as const },
  { title: '薪资发放', description: '等待发放', time: '预计 2024-04-05', status: 'pending' as const }
])

// Mock 数据 - 员工视图
const salaryData = ref({
  month: 3,
  status: '已发放',
  payDate: '2024-04-05',
  baseSalary: 15000,
  allowance: 2000,
  bonus: 3000,
  overtime: 1500,
  tax: 2500,
  insurance: 1800,
  otherDeduction: 0,
  netPay: 17200
})

const salaryHistory = ref([
  { id: 1, month: '2024-02', amount: 16800, status: 'paid', statusText: '已发放' },
  { id: 2, month: '2024-01', amount: 17500, status: 'paid', statusText: '已发放' },
  { id: 3, month: '2023-12', amount: 17200, status: 'paid', statusText: '已发放' }
])

// CEO/财务 统计数据
const ceoStats = ref({
  totalPayroll: 486000,
  employeeCount: 28,
  avgSalary: 17357,
  pendingCount: 3
})

const payrollList = ref([
  { id: 1, name: '张晓宁', department: '技术部', base: 15000, bonus: 3000, deduction: 2800, net: 15200, status: 'paid' },
  { id: 2, name: '赵铁柱', department: '技术部', base: 18000, bonus: 4000, deduction: 3500, net: 18500, status: 'pending' },
  { id: 3, name: '王小花', department: '人事部', base: 12000, bonus: 2000, deduction: 1800, net: 12200, status: 'pending' },
  { id: 4, name: '李明', department: '销售部', base: 10000, bonus: 5000, deduction: 2000, net: 13000, status: 'pending' }
])

const filteredPayrollList = computed(() => {
  let result = payrollList.value
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  if (searchKeyword.value) {
    result = result.filter(item => item.name.includes(searchKeyword.value))
  }
  return result
})

const formatAmount = (val: number) => {
  return '¥' + val.toLocaleString()
}

const exportPayroll = () => {
  uni.showToast({ title: '导出成功', icon: 'success' })
}

const confirmPay = (item: any) => {
  item.status = 'paid'
  uni.showToast({ title: '已确认发放', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
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

        &.success { color: var(--success); }
        &.warning { color: var(--warning); }
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
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.bottom-section {
  flex: 0 0 280px;
  display: flex;
  gap: 16px;
}

.left-panel {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.full-panel {
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
  &.paid { background: #f0f9eb; color: #2e7d32; }
  &.pending { background: #fff7e6; color: #ed6c02; }
}

// 薪资概览
.salary-amount-section {
  text-align: center;
  padding: 24px 0;

  .amount-label {
    font-size: 13px;
    color: var(--on-surface-variant);
    display: block;
    margin-bottom: 8px;
  }

  .amount-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--primary);
    display: block;
    margin-bottom: 8px;
    font-family: var(--font-display, 'Manrope');
  }

  .amount-date {
    font-size: 12px;
    color: var(--on-surface-variant);
  }
}

.amount-divider {
  height: 1px;
  background: var(--surface-high);
  margin: 16px 0;
}

.salary-breakdown {
  .breakdown-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;

    .breakdown-label {
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .breakdown-value {
      font-size: 13px;
      font-weight: 500;

      &.positive { color: var(--success); }
      &.negative { color: var(--error); }
    }
  }
}

// 薪资明细
.detail-section {
  padding: 16px 0;
  border-bottom: 1px solid var(--surface);

  &:last-of-type {
    border-bottom: none;
  }

  .section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface);
    margin-bottom: 12px;
    display: block;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;

    .item-name {
      font-size: 13px;
      color: var(--on-surface);
    }

    .item-value {
      font-size: 13px;
      font-weight: 500;

      &.positive { color: var(--success); }
      &.negative { color: var(--error); }
    }
  }
}

.detail-total {
  display: flex;
  justify-content: space-between;
  padding: 20px 0 0;
  margin-top: 16px;
  border-top: 2px solid var(--surface-high);
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);

  .total-value {
    color: var(--primary);
    font-size: 18px;
    font-weight: 700;
  }
}

// 自定义表格
.data-table {
  width: 100%;

  .table-head {
    display: flex;
    padding: 10px 0;
    background: var(--surface-low);
    border-bottom: 1px solid var(--surface-high);
    font-size: 12px;
    font-weight: 600;
    color: var(--on-surface-variant);
    letter-spacing: 0.3px;
  }

  .table-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--surface);
    transition: background 0.15s;

    &:hover { background: var(--surface-low); }
    &:last-child { border-bottom: none; }

    .cell {
      font-size: 13px;
      color: var(--on-surface);

      &.negative { color: var(--error); }
      &.highlight { color: var(--primary); }
    }
  }
}

// 历史记录
.history-list {
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child { border-bottom: none; }

    .history-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .history-month {
        font-weight: 600;
        font-size: 14px;
        color: var(--on-surface);
      }
    }

    .history-amount {
      font-weight: 700;
      color: var(--primary);
      font-size: 15px;
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--on-surface-variant);
  font-size: 13px;
}

.text-muted {
  color: var(--outline);
}
</style>
