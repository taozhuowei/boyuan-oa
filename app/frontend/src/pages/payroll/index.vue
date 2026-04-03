<template>
  <!--
    薪资管理页 (pages/payroll/index.vue)
    - 财务/CEO 视图：结算周期列表，依据 UI_DESIGN.md §3
    - 员工/劳工 视图：我的工资条列表，依据 UI_DESIGN.md §3
    数据来源：Phase 1 使用 mock 数据
  -->
  <AppShell title="薪资管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">薪资管理</text>
          <text class="page-desc">{{ isCEOorFinance ? '结算周期管理与薪资结算' : '我的工资条' }}</text>
        </view>
        <view v-if="isCEOorFinance" class="header-stats">
          <view class="stat-item">
            <text class="stat-value">{{ stats.currentStatus }}</text>
            <text class="stat-label">当前周期状态</text>
          </view>
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="content-card full-panel">

        <!-- 财务/CEO：结算周期列表 -->
        <template v-if="isCEOorFinance">
          <view class="card-header">
            <text class="card-title">结算周期</text>
            <component
              :is="Button"
              v-if="Button && isFinance"
              type="primary"
              @click="handleAction"
            >
              手动发起新周期结算
            </component>
          </view>
          <view class="card-body scrollable">
            <view class="data-table">
              <view class="table-head">
                <text class="cell" style="flex: 1">周期</text>
                <text class="cell" style="flex: 1">状态</text>
                <text class="cell" style="width: 160px; text-align: center">操作</text>
              </view>
              <view
                v-for="item in cycleList"
                :key="item.id"
                class="table-row"
              >
                <text class="cell" style="flex: 1; font-weight: 500">{{ item.period }}</text>
                <view class="cell" style="flex: 1">
                  <view class="status-tag" :class="item.statusClass">{{ item.statusText }}</view>
                </view>
                <view class="cell" style="width: 160px; text-align: center">
                  <component
                    :is="Button"
                    v-if="Button"
                    type="link"
                    size="small"
                    @click="handleAction"
                  >
                    {{ item.action }}
                  </component>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 员工/劳工：我的工资条 -->
        <template v-else>
          <view class="card-header">
            <text class="card-title">我的工资条</text>
          </view>
          <view class="card-body scrollable">
            <view class="data-table">
              <view class="table-head">
                <text class="cell" style="flex: 1">周期</text>
                <text class="cell" style="width: 60px; text-align: center">版本</text>
                <text class="cell" style="flex: 1; text-align: right">实发工资</text>
                <text class="cell" style="width: 80px; text-align: center">状态</text>
                <text class="cell" style="width: 120px; text-align: center">操作</text>
              </view>
              <view
                v-for="item in slipList"
                :key="item.id"
                class="table-row"
              >
                <text class="cell" style="flex: 1; font-weight: 500">{{ item.period }}</text>
                <text class="cell" style="width: 60px; text-align: center; color: var(--on-surface-variant)">{{ item.version }}</text>
                <text class="cell highlight" style="flex: 1; text-align: right; font-weight: 600">¥{{ item.netPay.toLocaleString() }}</text>
                <view class="cell" style="width: 80px; text-align: center">
                  <view class="status-tag" :class="item.statusClass">{{ item.statusText }}</view>
                </view>
                <view class="cell" style="width: 120px; text-align: center">
                  <component
                    :is="Button"
                    v-if="Button"
                    type="link"
                    size="small"
                    @click="handleAction"
                  >
                    {{ item.action }}
                  </component>
                </view>
              </view>
            </view>
          </view>
        </template>

      </view>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

// 仅使用本页实际需要的组件
const { Button } = useComponent(['Button'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')

// 财务和 CEO 均看结算周期视图，依据 UI_DESIGN.md §3
const isCEOorFinance = computed(() => ['ceo', 'finance'].includes(userRole.value))
const isFinance = computed(() => userRole.value === 'finance')

// 当前周期状态摘要
const stats = ref({ currentStatus: '窗口期开放' })

// 结算周期 mock 数据，依据 UI_DESIGN.md §3 "财务 — 薪资周期列表"
// 状态值：窗口期开放 / 已结算
const cycleList = ref([
  { id: 1, period: '2026-04（本月）', statusText: '窗口期开放', statusClass: 'warning', action: '进入窗口期管理' },
  { id: 2, period: '2026-03',         statusText: '已结算',     statusClass: 'success', action: '查看工资条' },
  { id: 3, period: '2026-02',         statusText: '已结算',     statusClass: 'success', action: '查看工资条' },
  { id: 4, period: '2026-01',         statusText: '已结算',     statusClass: 'success', action: '查看工资条' }
])

// 工资条 mock 数据，依据 UI_DESIGN.md §3 "员工/劳工 — 我的工资条列表"
// 状态值：待确认 / 已确认 / 已废弃
const slipList = ref([
  { id: 1, period: '2026-04', version: 'v1', netPay: 7053, statusText: '待确认', statusClass: 'warning',  action: '查看并确认' },
  { id: 2, period: '2026-03', version: 'v2', netPay: 7200, statusText: '已确认', statusClass: 'success',  action: '查看' },
  { id: 3, period: '2026-03', version: 'v1', netPay: 7000, statusText: '已废弃', statusClass: 'disabled', action: '查看历史版本' }
])

// Phase 1 占位处理：功能页面在后续 Phase 实现
const handleAction = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
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
        font-size: 16px;
        font-weight: 600;
        color: var(--warning);
        display: block;
      }

      .stat-label {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

.full-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
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
    padding: 0 20px;

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

  &.success  { background: #f0f9eb; color: #2e7d32; }
  &.warning  { background: #fff7e6; color: #ed6c02; }
  &.disabled { background: var(--surface); color: var(--on-surface-variant); }
}

// 数据表格
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
      display: flex;
      align-items: center;

      &.highlight { color: var(--primary); }
    }
  }
}
</style>
