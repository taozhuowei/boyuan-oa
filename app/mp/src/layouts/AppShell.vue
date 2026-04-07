<template>
  <!-- MP 端：简版顶栏 + 内容 -->
  <view class="app-shell mp-shell">
    <view class="mp-topbar">
      <view class="mp-logo">众维</view>
      <text class="mp-title">{{ title || '工作台' }}</text>
      <view class="mp-actions">
        <view v-if="activeUser.role === 'ceo'" class="mp-setting-btn" @click="goTo('/pages/config/index')">
        </view>
      </view>
    </view>
    <view class="mp-content">
      <slot />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, markRaw } from 'vue'
import { useUserStore } from '../stores'
import { roleNameMap } from '@shared/types'

const props = defineProps<{
  title?: string  // 保留兼容，不再渲染于顶栏中央
}>()

// Phase 1 mock：后续接入通知 store
const latestNotice = '系统维护：本周六凌晨 02:00 例行维护，请提前保存工作'

const userStore = useUserStore()

// ── 用户信息 ───────────────────────────────────────────────────────────────
const activeUser = computed(() => {
  const u = userStore.userInfo
  if (!u) return { displayName: '未登录', role: 'employee', roleName: '员工' }
  return {
    ...u,
    roleName: u.roleName || roleNameMap[u.role] || u.role
  }
})

// ── 菜单定义 ───────────────────────────────────────────────────────────────
const allMenus = [
  // MP 端导航暂未渲染，icon 字段预留 Vant icon name，待 MP 导航组件实现时接入
  { label: '工作台',  path: '/pages/index/index',       icon: 'home-o',        roles: ['all'] },
  { label: '考勤管理', path: '/pages/attendance/index',  icon: 'calendar-o',    roles: ['all'] },
  { label: '薪资管理', path: '/pages/payroll/index',     icon: 'balance-o',     roles: ['ceo', 'finance', 'employee', 'worker'] },
  { label: '项目管理', path: '/pages/projects/index',    icon: 'cluster-o',     roles: ['ceo', 'project_manager', 'worker'] },
  { label: '员工管理', path: '/pages/employees/index',   icon: 'friends-o',     roles: ['ceo', 'finance', 'project_manager'] },
  { label: '岗位管理', path: '/pages/positions/index',   icon: 'manager-o',     roles: ['ceo', 'finance', 'project_manager'] },
  { label: '组织架构', path: '/pages/org/index',         icon: 'department-o',  roles: ['ceo'] },
  { label: '角色管理', path: '/pages/role/index',        icon: 'shield-o',      roles: ['ceo'] },
  { label: '系统配置', path: '/pages/config/index',      icon: 'setting-o',     roles: ['ceo'] }
]

const filteredMenus = computed(() => {
  const role = activeUser.value.role
  return allMenus.filter(m => m.roles.includes('all') || m.roles.includes(role))
})

// ── 当前路径 ───────────────────────────────────────────────────────────────
const currentPath = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    currentPath.value = `/${currentPage.route}`
  }
})

// ── 交互 ───────────────────────────────────────────────────────────────────
// tabBar 页必须用 switchTab，其余页用 redirectTo（替换当前页，避免堆栈）
const TAB_PAGES = ['/pages/index/index', '/pages/login/index']

function goTo(path: string) {
  if (currentPath.value === path) return
  if (TAB_PAGES.includes(path)) {
    uni.switchTab({ url: path })
  } else {
    uni.redirectTo({ url: path })
  }
}

function handleLogout() {
  userStore.logout()
  uni.switchTab({ url: '/pages/login/index' })
}
</script>

<style lang="scss" scoped>
// ── MP Shell 样式 ────────────────────────────────────────────────────────
.mp-shell {
  min-height: 100vh;
  background: var(--surface);

  .mp-topbar {
    height: 44px;
    background: var(--surface-lowest);
    display: flex;
    align-items: center;
    padding: 0 16px;
    border-bottom: 1px solid var(--surface-high);
    position: sticky;
    top: 0;
    z-index: 100;

    .mp-logo {
      width: 24px;
      height: 24px;
      background: var(--primary);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      margin-right: 8px;
    }

    .mp-title {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
    }

    .mp-actions {
      font-size: 18px;
    }
  }
}
</style>
