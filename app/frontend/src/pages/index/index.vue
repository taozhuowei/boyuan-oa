<template>
  <view class="page workspace">
    <!-- 顶部用户信息区 -->
    <view class="hero-bar">
      <view class="hero-content">
        <component :is="UserInfo" v-if="UserInfo">
          <component :is="UserAvatar" v-if="UserAvatar" :name="activeUser.displayName" />
          <view class="user-meta">
            <text class="hero-greeting">欢迎，{{ activeUser.displayName }}</text>
            <text class="hero-role">{{ activeUser.roleName }} · {{ activeUser.department }}</text>
          </view>
        </component>
        <view class="hero-actions">
          <component
            :is="Button"
            v-if="Button"
            type="default"
            size="small"
            @click="goToLogin"
          >
            退出登录
          </component>
        </view>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="workspace-body">
      <component :is="Row" v-if="Row" :gutter="16">
        <!-- 左侧：待办 + 通知 -->
        <component :is="Col" v-if="Col" :span="8">
          <component :is="Card" v-if="Card" class="mb-16">
            <template #title>
              <view class="card-title-wrapper">
                <text>待办事项</text>
                <component :is="Badge" v-if="Badge" :count="pendingItems.length" />
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
                <component
                  :is="Badge"
                  v-if="Badge"
                  :status="getPriorityStatus(item.priority)"
                  :text="item.priority"
                />
              </view>
              <component :is="Empty" v-if="Empty && !pendingItems.length" description="暂无待办事项" />
            </view>
          </component>

          <component :is="Card" v-if="Card">
            <template #title>
              <view class="card-title-wrapper">
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
          </component>
        </component>

        <!-- 右侧：系统入口 + 快捷统计 -->
        <component :is="Col" v-if="Col" :span="16">
          <!-- 快捷统计 -->
          <component :is="Permission" v-if="Permission" :roles="['ceo', 'finance', 'project_manager']">
            <component :is="Row" v-if="Row" :gutter="16" class="mb-16">
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="员工总数"
                  :value="dashboardStats.employees"
                  icon="👥"
                  theme="primary"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="待审批"
                  :value="dashboardStats.pendingApprovals"
                  icon="📋"
                  theme="warning"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="进行中项目"
                  :value="dashboardStats.activeProjects"
                  icon="📁"
                  theme="success"
                />
              </component>
              <component :is="Col" v-if="Col" :span="6">
                <component
                  :is="StatCard"
                  v-if="StatCard"
                  title="本月支出"
                  :value="dashboardStats.monthlyPayroll"
                  icon="💰"
                  theme="purple"
                />
              </component>
            </component>
          </component>

          <!-- 系统入口 -->
          <component :is="Card" v-if="Card">
            <template #title>
              <view class="card-title-wrapper">
                <text>系统入口</text>
              </view>
            </template>
            <view class="system-grid">
              <component
                :is="ModuleCard"
                v-if="ModuleCard"
                v-for="item in visibleSystems"
                :key="item.key"
                :title="item.title"
                :description="item.description"
                :icon="item.icon"
                :icon-theme="item.iconTheme"
                :path="item.path"
                :badge="item.badge"
              />
            </view>
          </component>
        </component>
      </component>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getComponent } from '../../adapters'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'

// 异步获取组件
const UserInfo = ref(null)
const UserAvatar = ref(null)
const Permission = ref(null)
const StatCard = ref(null)
const ModuleCard = ref(null)
const Card = ref(null)
const Row = ref(null)
const Col = ref(null)
const Button = ref(null)
const Badge = ref(null)
const Empty = ref(null)

onMounted(async () => {
  UserInfo.value = await getComponent('UserInfo')
  UserAvatar.value = await getComponent('UserAvatar')
  Permission.value = await getComponent('Permission')
  StatCard.value = await getComponent('StatCard')
  ModuleCard.value = await getComponent('ModuleCard')
  Card.value = await getComponent('Card')
  Row.value = await getComponent('Row')
  Col.value = await getComponent('Col')
  Button.value = await getComponent('Button')
  Badge.value = await getComponent('Badge')
  Empty.value = await getComponent('Empty')
})

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
const isFinance = computed(() => activeUser.value.role === 'finance')
const isPM = computed(() => activeUser.value.role === 'project_manager')
const isWorker = computed(() => activeUser.value.role === 'worker')

// 根据角色过滤可见系统
const visibleSystems = computed(() => {
  const allSystems = [
    {
      key: 'attendance',
      title: '考勤管理',
      description: '请假、加班申请与审批',
      icon: '📅',
      iconTheme: 'primary' as const,
      path: '/pages/attendance/index',
      roles: ['ceo', 'finance', 'project_manager', 'employee', 'worker'],
      badge: 0
    },
    {
      key: 'payroll',
      title: '薪资档案',
      description: '薪资查询与结算管理',
      icon: '💰',
      iconTheme: 'success' as const,
      path: '/pages/payroll/index',
      roles: ['ceo', 'finance', 'employee', 'worker'],
      badge: 0
    },
    {
      key: 'projects',
      title: '施工日志',
      description: '项目管理与日志填报',
      icon: '🏗️',
      iconTheme: 'purple' as const,
      path: '/pages/projects/index',
      roles: ['ceo', 'project_manager', 'worker'],
      badge: 0
    },
    {
      key: 'employees',
      title: '员工管理',
      description: '员工信息与权限管理',
      icon: '👥',
      iconTheme: 'orange' as const,
      path: '/pages/employees/index',
      roles: ['ceo', 'finance', 'project_manager'],
      badge: 0
    },
    {
      key: 'role',
      title: '角色管理',
      description: '角色与权限配置',
      icon: '🔐',
      iconTheme: 'error' as const,
      path: '/pages/role/index',
      roles: ['ceo', 'finance'],
      badge: 0
    }
  ]

  return allSystems.filter(item => item.roles.includes(activeUser.value.role))
})

// 待办事项（根据角色动态生成）
const pendingItems = computed(() => {
  const items = []

  if (isCEO.value || isFinance.value) {
    items.push(
      { title: '薪资审批', category: '财务', priority: '高', path: '/pages/payroll/index' },
      { title: '请假审批', category: '考勤', priority: '中', path: '/pages/attendance/index' }
    )
  }

  if (isPM.value) {
    items.push(
      { title: '请假审批', category: '考勤', priority: '中', path: '/pages/attendance/index' },
      { title: '日志审核', category: '项目', priority: '低', path: '/pages/projects/index' }
    )
  }

  if (isWorker.value) {
    items.push(
      { title: '今日施工日志', category: '项目', priority: '高', path: '/pages/projects/index' }
    )
  }

  return items
})

// 系统通知
const noticeItems = ref([
  { title: '系统升级通知：本周六凌晨进行系统维护', time: '2小时前' },
  { title: '五一假期安排：5月1日至5月5日放假', time: '1天前' }
])

// 快捷统计（仅CEO可见全部）
const dashboardStats = ref({
  employees: 28,
  pendingApprovals: 5,
  activeProjects: 8,
  monthlyPayroll: '48.6万'
})

const getPriorityStatus = (priority: string) => {
  const map: Record<string, string> = {
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
  border-radius: var(--oa-radius-lg);
}

.hero-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 12px;
}

.hero-greeting {
  font-family: var(--oa-font-family-display);
  font-size: 20px;
  font-weight: 700;
}

.hero-role {
  font-size: 13px;
  opacity: 0.9;
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
    border-radius: var(--oa-radius-md);
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

.system-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mb-16 {
  margin-bottom: 16px;
}
</style>
