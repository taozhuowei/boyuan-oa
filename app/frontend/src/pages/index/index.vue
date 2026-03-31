<template>
  <view class="page workspace">
    <!-- 顶部 Hero -->
    <view class="hero hero-bar">
      <view class="hero-content">
        <view>
          <text class="hero-greeting">欢迎，{{ activeUser.displayName }}</text>
          <text class="hero-role">{{ activeUser.roleName }} · {{ activeUser.department }}</text>
        </view>
        <view class="hero-actions">
          <button class="btn-icon" @click="goToLogin">
            <Icon name="logout" :size="20" />
          </button>
        </view>
      </view>
    </view>

    <!-- 主内容区 -->
    <view class="workspace-body">
      <!-- 左侧：待办 + 通知 -->
      <view class="workspace-side">
        <view class="card">
          <view class="card-header">
            <view class="card-title">
              <Icon name="assignment" :size="18" />
              <text>待办事项</text>
            </view>
            <text class="badge">{{ pendingItems.length }}</text>
          </view>
          <view class="card-body">
            <view v-for="item in pendingItems" :key="item.title" class="list-item">
              <view class="list-item-main">
                <text class="list-item-title">{{ item.title }}</text>
                <text class="list-item-desc">{{ item.category }}</text>
              </view>
              <text :class="['tag', item.priority === '高' ? 'tag-danger' : item.priority === '中' ? 'tag-warning' : 'tag-success']">{{ item.priority }}</text>
            </view>
          </view>
        </view>

        <view class="card">
          <view class="card-header">
            <view class="card-title">
              <Icon name="notifications" :size="18" />
              <text>系统通知</text>
            </view>
          </view>
          <view class="card-body">
            <view v-for="item in noticeItems" :key="item.title" class="list-item list-item-compact">
              <text class="list-item-title text-sm">{{ item.title }}</text>
              <text class="list-item-meta">{{ item.time }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 右侧：系统入口 -->
      <view class="workspace-main">
        <view class="card">
          <view class="card-header">
            <view class="card-title">
              <Icon name="dashboard" :size="18" />
              <text>系统入口</text>
            </view>
          </view>
          <view class="card-body">
            <view class="system-grid">
              <view
                v-for="item in visibleSystems"
                :key="item.key"
                class="system-item"
                @click="navigateTo(item.path)"
              >
                <view class="system-icon">
                  <Icon :name="item.icon" :size="28" />
                </view>
                <view class="system-info">
                  <text class="system-name">{{ item.title }}</text>
                  <text class="system-desc">{{ item.description }}</text>
                </view>
                <Icon name="arrow-forward" :size="16" class="system-arrow" />
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '../../components/ui'
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

// 根据角色过滤可见系统
const visibleSystems = computed(() => {
  return systemEntries.filter(item => item.roles.includes(activeUser.value.role))
})

// 根据角色获取待办事项
const pendingItems = computed(() => getPendingItems(activeUser.value.role))

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
  display: flex;
  flex-direction: column;
}

.hero-bar {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 20px 24px;
  margin: 16px 16px 0;
  border-radius: var(--radius-lg);
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

.btn-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.15);
  border-radius: var(--radius-md);
  color: #fff;
  border: none;
  cursor: pointer;
}

.workspace-body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  padding: 16px;
}

.workspace-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.badge {
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-body {
  padding: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  background: var(--bg-secondary);
  &:last-child {
    margin-bottom: 0;
  }
}

.list-item-compact {
  padding: 10px 12px;
}

.list-item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item-title {
  font-size: 14px;
  font-weight: 500;
  &.text-sm {
    font-size: 13px;
  }
}

.list-item-desc {
  font-size: 12px;
  color: var(--text-secondary);
}

.list-item-meta {
  font-size: 11px;
  color: var(--text-secondary);
}

.tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-danger {
  background: #fee2e2;
  color: #dc2626;
}

.tag-warning {
  background: #fef3c7;
  color: #d97706;
}

.tag-success {
  background: #d1fae5;
  color: #059669;
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
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: var(--primary-light);
    transform: translateX(4px);
  }
}

.system-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: #fff;
  border-radius: var(--radius-md);
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
  color: var(--text-secondary);
}

.system-arrow {
  color: var(--text-secondary);
}
</style>
