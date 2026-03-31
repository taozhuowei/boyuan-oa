<template>
  <view class="page payroll-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="payments" :size="28" />
          <text class="hero-title">薪资</text>
        </view>
        <text class="hero-subtitle">
          {{ isCEO ? '全员工资管理与薪酬统计' : '本月薪资明细与历史记录' }}
        </text>
      </view>
      <view v-if="!isCEO" class="hero-amount">
        <text class="amount-label">本月实发工资</text>
        <text class="amount-value">¥{{ salaryData.netPay.toLocaleString() }}</text>
      </view>
    </view>

    <!-- 普通员工视图 -->
    <view v-if="!isCEO" class="payroll-container">
      <oa-row :gutter="16">
        <!-- 左侧：工资卡 -->
        <oa-col :span="8">
          <view class="salary-card">
            <view class="card-header">
              <text class="card-title">{{ salaryData.month }}月薪资</text>
              <oa-badge :status="salaryData.status === '已发放' ? 'success' : 'warning'" :text="salaryData.status" />
            </view>
            <view class="card-body">
              <text class="salary-amount">¥{{ salaryData.netPay.toLocaleString() }}</text>
              <text class="salary-label">实发工资</text>
            </view>
            <view class="card-footer">
              <text>发放日期: {{ salaryData.payDate || '待定' }}</text>
            </view>
          </view>
        </oa-col>

        <!-- 右侧：薪资明细 -->
        <oa-col :span="16">
          <oa-card title="薪资明细">
            <view class="salary-detail">
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
          </oa-card>
        </oa-col>
      </oa-row>

      <oa-row :gutter="16" class="mt-16">
        <oa-col :span="24">
          <oa-card title="历史薪资记录">
            <view class="history-list">
              <view v-for="item in salaryHistory" :key="item.id" class="history-item">
                <view class="history-info">
                  <text class="history-month">{{ item.month }}</text>
                  <text class="history-status" :class="item.status">{{ item.statusText }}</text>
                </view>
                <text class="history-amount">¥{{ item.amount.toLocaleString() }}</text>
              </view>
            </view>
          </oa-card>
        </oa-col>
      </oa-row>
    </view>

    <!-- CEO 管理视图 -->
    <view v-else class="payroll-container">
      <oa-row :gutter="16">
        <oa-col :span="6">
          <view class="stat-card primary">
            <text class="stat-value">¥{{ ceoStats.totalPayroll.toLocaleString() }}</text>
            <text class="stat-label">本月总支出</text>
          </view>
        </oa-col>
        <oa-col :span="6">
          <view class="stat-card">
            <text class="stat-value">{{ ceoStats.employeeCount }}</text>
            <text class="stat-label">发薪人数</text>
          </view>
        </oa-col>
        <oa-col :span="6">
          <view class="stat-card">
            <text class="stat-value">¥{{ ceoStats.avgSalary.toLocaleString() }}</text>
            <text class="stat-label">平均薪资</text>
          </view>
        </oa-col>
        <oa-col :span="6">
          <view class="stat-card">
            <text class="stat-value">{{ ceoStats.pendingCount }}</text>
            <text class="stat-label">待发放</text>
          </view>
        </oa-col>
      </oa-row>

      <oa-row :gutter="16" class="mt-16">
        <oa-col :span="24">
          <oa-card title="员工薪资管理">
            <template #extra>
              <view class="toolbar">
                <oa-input
                  v-model="searchKeyword"
                  placeholder="搜索员工姓名"
                  :prefix="'search'"
                  style="width: 200px"
                />
                <oa-button type="primary" @click="exportPayroll">
                  <Icon name="download" :size="14" />
                  导出工资表
                </oa-button>
              </view>
            </template>
            
            <view class="payroll-table">
              <view class="table-header">
                <text class="cell">姓名</text>
                <text class="cell">部门</text>
                <text class="cell">基本工资</text>
                <text class="cell">绩效</text>
                <text class="cell">扣除</text>
                <text class="cell">实发</text>
                <text class="cell">状态</text>
                <text class="cell">操作</text>
              </view>
              <view v-for="item in filteredPayrollList" :key="item.id" class="table-row">
                <text class="cell">{{ item.name }}</text>
                <text class="cell">{{ item.department }}</text>
                <text class="cell">¥{{ item.base.toLocaleString() }}</text>
                <text class="cell">¥{{ item.bonus.toLocaleString() }}</text>
                <text class="cell negative">¥{{ item.deduction.toLocaleString() }}</text>
                <text class="cell highlight">¥{{ item.net.toLocaleString() }}</text>
                <text class="cell">
                  <oa-badge :status="item.status === 'paid' ? 'success' : 'warning'" />
                </text>
                <text class="cell">
                  <oa-button 
                    v-if="item.status === 'pending'" 
                    type="primary" 
                    size="small"
                    @click="confirmPay(item)"
                  >
                    确认发放
                  </oa-button>
                  <text v-else class="text-muted">已发放</text>
                </text>
              </view>
            </view>
          </oa-card>
        </oa-col>
      </oa-row>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '../../components/ui'
import { 
  OaCard, OaRow, OaCol, OaBadge, 
  OaButton, OaInput 
} from '../../components/ui-kit'
import { useUserStore } from '../../stores'

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')

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

// CEO 统计数据
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

const searchKeyword = ref('')

const filteredPayrollList = computed(() => {
  if (!searchKeyword.value) return payrollList.value
  return payrollList.value.filter(item => 
    item.name.includes(searchKeyword.value)
  )
})

const exportPayroll = () => {
  uni.showToast({ title: '导出成功', icon: 'success' })
}

const confirmPay = (item: any) => {
  item.status = 'paid'
  uni.showToast({ title: '已确认发放', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.payroll-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-border-radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.hero-amount {
  text-align: right;
}

.amount-label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
}

.salary-card {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-radius: var(--oa-border-radius-lg);
  color: #fff;
  padding: 24px;
  height: 100%;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .card-title {
    font-size: 14px;
    opacity: 0.9;
  }

  .card-body {
    text-align: center;
    padding: 24px 0;
  }

  .salary-amount {
    font-size: 36px;
    font-weight: 700;
    display: block;
  }

  .salary-label {
    font-size: 12px;
    opacity: 0.8;
    margin-top: 8px;
  }

  .card-footer {
    text-align: center;
    font-size: 12px;
    opacity: 0.8;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.2);
  }
}

.salary-detail {
  .detail-section {
    padding: 16px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-of-type {
      border-bottom: none;
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--oa-text-secondary);
    margin-bottom: 16px;
    display: block;
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
  }

  .item-value {
    font-weight: 500;

    &.positive {
      color: var(--oa-success);
    }

    &.negative {
      color: var(--oa-error);
    }
  }

  .detail-total {
    display: flex;
    justify-content: space-between;
    padding: 24px 0 0;
    margin-top: 16px;
    border-top: 2px solid var(--oa-border);
    font-size: 16px;
    font-weight: 600;

    .total-value {
      color: var(--oa-primary);
      font-size: 20px;
    }
  }
}

.history-list {
  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }
  }

  .history-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .history-month {
    font-weight: 500;
  }

  .history-status {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;

    &.paid {
      background: var(--oa-success-light);
      color: var(--oa-success);
    }

    &.pending {
      background: var(--oa-warning-light);
      color: var(--oa-warning);
    }
  }

  .history-amount {
    font-weight: 600;
    color: var(--oa-primary);
  }
}

.stat-card {
  background: #fff;
  padding: 24px;
  border-radius: var(--oa-border-radius-lg);
  text-align: center;

  &.primary {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
    color: #fff;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    display: block;
  }

  .stat-label {
    font-size: 12px;
    color: var(--oa-text-secondary);
    margin-top: 8px;
    display: block;
  }
}

.toolbar {
  display: flex;
  gap: 12px;
}

.payroll-table {
  .table-header {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    padding: 12px 16px;
    background: var(--oa-bg);
    border-radius: var(--oa-border-radius-md) var(--oa-border-radius-md) 0 0;
    font-weight: 500;
    font-size: 14px;
    color: var(--oa-text-secondary);
  }

  .table-row {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    padding: 16px;
    border-bottom: 1px solid var(--oa-border-split);
    align-items: center;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--oa-bg);
    }
  }

  .cell {
    font-size: 14px;

    &.negative {
      color: var(--oa-error);
    }

    &.highlight {
      font-weight: 600;
      color: var(--oa-primary);
    }
  }
}

.mt-16 {
  margin-top: 16px;
}

.text-muted {
  color: var(--oa-text-tertiary);
}
</style>
