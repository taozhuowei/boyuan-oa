<template>
  <!-- H5 端：完整 Shell (TopBar + LeftNav + Main) -->
  <!-- #ifdef H5 -->
  <view class="app-shell h5-shell">
    <!-- TopBar -->
    <view class="shell-topbar">
      <view class="topbar-left">
        <view class="logo-box">众维</view>
        <text class="logo-text">众维建筑</text>
      </view>
      
      <!-- 通知摘要（铃铛 + 最新一条通知文字） -->
      <view class="topbar-notice">
        <view class="notice-bell">
          <BellOutlined class="icon-btn" />
          <view class="badge-dot" />
        </view>
        <text class="notice-text">{{ latestNotice }}</text>
      </view>

      <view class="topbar-right">
        <!-- 用户信息 -->
        <view class="user-profile">
          <text class="user-name">{{ activeUser.displayName }}</text>
          <text class="user-divider">·</text>
          <text class="user-role">{{ activeUser.roleName }}</text>
        </view>
        
        <!-- 系统配置 (CEO 专属) -->
        <view v-if="activeUser.role === 'ceo'" class="action-item" @click="goTo('/pages/config/index')">
          <SettingOutlined class="icon-btn" />
        </view>
        
        <!-- 退出登录 -->
        <view class="action-item logout" @click="handleLogout">
          <LogoutOutlined class="icon-btn" />
        </view>
      </view>
    </view>

    <view class="shell-body">
      <!-- LeftNav -->
      <view class="shell-leftnav">
        <view class="nav-menu">
          <view 
            v-for="item in filteredMenus" 
            :key="item.path"
            class="nav-item"
            :class="{ active: currentPath === item.path }"
            @click="goTo(item.path)"
          >
            <component :is="item.icon" class="nav-icon" />
            <text class="nav-label">{{ item.label }}</text>
          </view>
        </view>
      </view>

      <!-- Main Content -->
      <view class="shell-main">
        <slot />
      </view>
    </view>
  </view>
  <!-- #endif -->

  <!-- MP 端：简版顶栏 + 内容 -->
  <!-- #ifndef H5 -->
  <view class="app-shell mp-shell">
    <view class="mp-topbar">
      <view class="mp-logo">众维</view>
      <text class="mp-title">{{ title || '工作台' }}</text>
      <view class="mp-actions">
        <text v-if="activeUser.role === 'ceo'" @click="goTo('/pages/config/index')">⚙️</text>
      </view>
    </view>
    <view class="mp-content">
      <slot />
    </view>
  </view>
  <!-- #endif -->
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, markRaw } from 'vue'
import { useUserStore } from '../stores'
import { roleNameMap } from '../utils/access'

/* #ifdef H5 */
import {
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
  BuildOutlined,
  TeamOutlined,
  SafetyOutlined,
  SettingOutlined,
  BellOutlined,
  LogoutOutlined,
  SolutionOutlined
} from '@ant-design/icons-vue'
/* #endif */

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
  /* #ifdef H5 */
  { label: '工作台', path: '/pages/index/index', icon: markRaw(HomeOutlined), roles: ['all'] },
  { label: '考勤管理', path: '/pages/attendance/index', icon: markRaw(CalendarOutlined), roles: ['all'] },
  { label: '薪资管理', path: '/pages/payroll/index', icon: markRaw(DollarOutlined), roles: ['ceo', 'finance', 'employee', 'worker'] },
  { label: '项目管理', path: '/pages/projects/index', icon: markRaw(BuildOutlined), roles: ['ceo', 'project_manager', 'worker'] },
  { label: '员工管理', path: '/pages/employees/index', icon: markRaw(TeamOutlined), roles: ['ceo', 'finance', 'project_manager'] },
  { label: '岗位管理', path: '/pages/positions/index', icon: markRaw(SolutionOutlined), roles: ['ceo', 'finance', 'project_manager'] },
  { label: '组织架构', path: '/pages/org/index', icon: markRaw(TeamOutlined), roles: ['ceo'] },
  { label: '角色管理', path: '/pages/role/index', icon: markRaw(SafetyOutlined), roles: ['ceo'] },
  { label: '系统配置', path: '/pages/config/index', icon: markRaw(SettingOutlined), roles: ['ceo'] },
  /* #endif */
  /* #ifndef H5 */
  { label: '工作台', path: '/pages/index/index', icon: '🏠', roles: ['all'] },
  { label: '考勤管理', path: '/pages/attendance/index', icon: '📅', roles: ['all'] },
  { label: '薪资管理', path: '/pages/payroll/index', icon: '💰', roles: ['ceo', 'finance', 'employee', 'worker'] },
  { label: '项目管理', path: '/pages/projects/index', icon: '🏗️', roles: ['ceo', 'project_manager', 'worker'] },
  { label: '员工管理', path: '/pages/employees/index', icon: '👥', roles: ['ceo', 'finance', 'project_manager'] },
  { label: '岗位管理', path: '/pages/positions/index', icon: '📋', roles: ['ceo', 'finance', 'project_manager'] },
  { label: '组织架构', path: '/pages/org/index', icon: '🏢', roles: ['ceo'] },
  { label: '角色管理', path: '/pages/role/index', icon: '🔐', roles: ['ceo'] },
  { label: '系统配置', path: '/pages/config/index', icon: '⚙️', roles: ['ceo'] }
  /* #endif */
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
// ── H5 Shell 样式 ────────────────────────────────────────────────────────
/* #ifdef H5 */
.h5-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--surface);

  .shell-topbar {
    height: 56px;
    background: var(--surface-lowest);
    border-bottom: 1px solid var(--surface-high);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
    flex-shrink: 0;

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 220px;

      .logo-box {
        width: 32px;
        height: 32px;
        background: var(--primary);
        color: var(--on-primary);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 700;
      }
      .logo-text {
        font-size: 16px;
        font-weight: 700;
        color: var(--primary);
        letter-spacing: 0.5px;
      }
    }

    .topbar-notice {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 24px;
      min-width: 0;

      .notice-bell {
        position: relative;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        color: var(--on-surface-variant);
        font-size: 16px;

        .badge-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--error);
          border: 1.5px solid var(--surface-lowest);
        }
      }

      .notice-text {
        font-size: 13px;
        color: var(--on-surface-variant);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 220px;
      justify-content: flex-end;

      .action-item {
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        color: var(--on-surface-variant);
        transition: all 0.2s;

        &:hover {
          background: var(--surface-low);
          color: var(--primary);
        }

        .icon-btn {
          font-size: 18px;
        }

        &.logout:hover {
          color: var(--error);
          background: #fff1f0;
        }
      }

      .user-profile {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: var(--on-surface);
        background: var(--surface-low);
        padding: 4px 12px;
        border-radius: 20px;

        .user-name { font-weight: 600; }
        .user-divider { color: var(--outline); }
        .user-role { font-size: 12px; color: var(--on-surface-variant); }
      }
    }
  }

  .shell-body {
    display: flex;
    flex: 1;
    overflow: hidden;

    .shell-leftnav {
      width: 220px;
      background: var(--surface-lowest);
      border-right: 1px solid #f0f0f0;
      padding: 12px 0;
      flex-shrink: 0;

      .nav-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 0 8px;
      }

      .nav-item {
        height: 44px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        color: var(--on-surface-variant);

        .nav-icon {
          font-size: 18px;
          color: var(--outline);
          transition: inherit;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
          transition: inherit;
        }

        &:hover {
          background: var(--surface);
          color: var(--primary);
        }

        &.active {
          background: rgba(0, 52, 102, 0.08);
          color: var(--primary);

          .nav-icon {
            color: var(--primary);
          }
          .nav-label {
            font-weight: 600;
          }
        }
      }
    }

    .shell-main {
      flex: 1;
      min-height: 0;       // 关键：防止 flex 子项膨胀撑破容器
      overflow: hidden;    // 不在此处滚动，由每个页面自行管理滚动
      background: var(--surface);
      // 注意：padding 移至各页面自行声明，保证 height:100% 精确计算
    }
  }
}
/* #endif */

// ── MP Shell 样式 ────────────────────────────────────────────────────────
/* #ifndef H5 */
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
/* #endif */
</style>
