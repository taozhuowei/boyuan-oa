<template>
  <view class="page workspace">
    <!-- 顶部 Hero -->
    <view class="hero-bar">
      <view class="hero-content">
        <view>
          <text class="hero-greeting">欢迎，{{ activeUser.displayName }}</text>
          <text class="hero-role">{{ activeUser.roleName }} · {{ activeUser.department }}</text>
        </view>
        <view class="hero-actions">
          <oa-button type="default" size="small" @click="goToLogin">
            <Icon name="logout" :size="16" />
            退出登录
          </oa-button>
        </view>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="workspace-body">
      <oa-row :gutter="16">
        <!-- 左侧：待办 + 通知 -->
        <oa-col :span="8">
          <oa-card class="mb-16">
            <template #title>
              <view class="card-title-wrapper">
                <Icon name="assignment" :size="18" />
                <text>待办事项</text>
                <oa-badge :count="pendingItems.length" />
              </view>
            </template>
            <view class="todo-list">
              <view 
                v-for="item in pendingItems" 
                :key="item.title" 
                class="todo-item"
                @click="handleTodo(item)"
              >
                <view class="todo-main">
                  <text class="todo-title">{{ item.title }}</text>
                  <text class="todo-category">{{ item.category }}</text>
                </view>
                <oa-badge 
                  :status="getPriorityStatus(item.priority)" 
                  :text="item.priority" 
                />
              </view>
              <oa-empty v-if="!pendingItems.length" description="暂无待办事项" />
            </view>
          </oa-card>

          <oa-card>
            <template #title>
              <view class="card-title-wrapper">
                <Icon name="notifications" :size="18" />
                <text>系统通知</text>
              </view>
            </template>
            <view class="notice-list">
              <view 
                v-for="item in noticeItems" 
                :key="item.title" 
                class="notice-item"
              >
                <view class="notice-dot" />
                <view class="notice-content">
                  <text class="notice-title">{{ item.title }}</text>
                  <text class="notice-time">{{ item.time }}</text>
                </view>
              </view>
            </view>
          </oa-card>
        </oa-col>

        <!-- 右侧：系统入口 + 快捷统计 -->
        <oa-col :span="16">
          <!-- 快捷统计（CEO可见） -->
          <oa-row v-if="isCEO" :gutter="16" class="mb-16">
            <oa-col :span="6">
              <view class="quick-stat">
                <Icon name="groups" :size="24" />
                <view class="stat-info">
                  <text class="stat-value">{{ dashboardStats.employees }}</text>
                  <text class="stat-label">员工总数</text>
                </view>
              </view>
            </oa-col>
            <oa-col :span="6">
              <view class="quick-stat">
                <Icon name="pending-actions" :size="24" />
                <view class="stat-info">
                  <text class="stat-value">{{ dashboardStats.pendingApprovals }}</text>
                  <text class="stat-label">待审批</text>
                </view>
              </view>
            </oa-col>
            <oa-col :span="6">
              <view class="quick-stat">
                <Icon name="folder-open" :size="24" />
                <view class="stat-info">
                  <text class="stat-value">{{ dashboardStats.activeProjects }}</text>
                  <text class="stat-label">进行中项目</text>
                </view>
              </view>
            </oa-col>
            <oa-col :span="6">
              <view class="quick-stat">
                <Icon name="payments" :size="24" />
                <view class="stat-info">
                  <text class="stat-value">{{ dashboardStats.monthlyPayroll }}</text>
                  <text class="stat-label">本月支出</text>
                </view>
              </view>
            </oa-col>
          </oa-row>

          <!-- 系统入口 -->
          <oa-card>
            <template #title>
              <view class="card-title-wrapper">
                <Icon name="dashboard" :size="18" />
                <text>系统入口</text>
              </view>
            </template>
            <view class="system-grid">
              <view
                v-for="item in visibleSystems"
                :key="item.key"
                class="system-item"
                @click="navigateTo(item.path)"
              >
                <view class="system-icon" :class="item.key">
                  <Icon :name="item.icon" :size="28" />
                </view>
                <view class="system-info">
                  <text class="system-name">{{ item.title }}</text>
                  <text class="system-desc">{{ item.description }}</text>
                </view>
                <Icon name="arrow-forward" :size="16" class="system-arrow" />
              </view>
            </view>
          </oa-card>
        </oa-col>
      </oa-row>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '../../components/ui'
import {
  OaCard, OaRow, OaCol, OaBadge,
  OaButton, OaEmpty
} from '../../components/ui-kit'
import { systemEntries, getPendingItems, noticeItems } from './workbench-data'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'

const userStore = useUserStore()

const activeUser = computed(() => {
  if (userStore.userInfo) {
    return {
      ...userStore.userInfo,
      roleName: userStore.userInfo.roleName || roleNameMap[userStore.userInfo.role] || userStore.userInfo.role
    }
  }
  return {
    username: '',
    displayName: '未登录',
    role: 'employee',
    roleName: '员工',
    department: '未分配部门'
  }
})

const isCEO = computed(() => activeUser.value.role === 'ceo')

// 根据角色过滤可见系统
const visibleSystems = computed(() => {
  return systemEntries.filter(item => item.roles.includes(activeUser.value.role))
})

// 根据角色获取待办事项
const pendingItems = computed(() => getPendingItems(activeUser.value.role))

// 快捷统计数据（仅CEO）
const dashboardStats = computed(() => ({
  employees: 28,
  pendingApprovals: 5,
  activeProjects: 8,
  monthlyPayroll: '48.6万'
}))

const getPriorityStatus = (priority: string) => {
  const map: Record<string, any> = {
    '高': 'error',
    '中': 'warning',
    '低': 'success'
  }
  return map[priority] || 'default'
}

const handleTodo = (item: any) => {
  if (item.path) {
    uni.navigateTo({ url: item.path })
  }
}

const goToLogin = () => {
  userStore.logout()
  uni.navigateTo({ url: '/pages/login/index' })
}

const navigateTo = (path: string) => {
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss" scoped>
.workspace {
  min-height: 100vh;
  background: var(--oa-bg);
}

.hero-bar {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 20px 24px;
  margin: 16px 16px 0;
  border-radius: var(--oa-border-radius-lg);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-greeting {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  display: block;
}

.hero-role {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 4px;
  display: block;
}

.hero-actions {
  display: flex;
  gap: 8px;
}

.workspace-body {
  padding: 16px;
}

.card-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.todo-list {
  .todo-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-radius: var(--oa-border-radius-md);
    margin-bottom: 8px;
    background: var(--oa-bg);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--oa-primary-light);
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .todo-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .todo-title {
    font-size: 14px;
    font-weight: 500;
  }

  .todo-category {
    font-size: 12px;
    color: var(--oa-text-secondary);
  }
}

.notice-list {
  .notice-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }
  }

  .notice-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--oa-primary);
    margin-top: 8px;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .notice-title {
    font-size: 13px;
    line-height: 1.5;
  }

  .notice-time {
    font-size: 11px;
    color: var(--oa-text-tertiary);
  }
}

.quick-stat {
  background: #fff;
  border-radius: var(--oa-border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--oa-primary);

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: var(--oa-text);
  }

  .stat-label {
    font-size: 12px;
    color: var(--oa-text-secondary);
    margin-top: 4px;
  }
}

.system-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.system-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: var(--oa-bg);
  border-radius: var(--oa-border-radius-lg);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--oa-primary-light);
    transform: translateX(4px);
  }
}

.system-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: var(--oa-border-radius-md);

  &.attendance {
    background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  }

  &.payroll {
    background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
  }

  &.projects {
    background: linear-gradient(135deg, #722ed1 0%, #531dab 100%);
  }

  &.employees {
    background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
  }
}

.system-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.system-name {
  font-size: 16px;
  font-weight: 600;
}

.system-desc {
  font-size: 13px;
  color: var(--oa-text-secondary);
}

.system-arrow {
  color: var(--oa-text-tertiary);
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
