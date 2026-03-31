<template>
  <view class="page workspace">
    <!-- 顶部 Hero -->
    <view class="hero hero-bar">
      <view class="hero-content">
        <view>
          <text class="hero-greeting">欢迎回来，{{ activeUser.displayName }}</text>
          <text class="hero-role">{{ displayRole }} · {{ activeUser.department }}</text>
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

      <!-- 右侧：数据 + 功能 -->
      <view class="workspace-main">
        <!-- 统计卡片 -->
        <view class="stats-row">
          <view v-for="stat in progressStats" :key="stat.label" class="card stat-card">
            <text class="stat-label">{{ stat.label }}</text>
            <text class="stat-value">{{ stat.value }}</text>
            <text class="stat-note">{{ stat.note }}</text>
          </view>
        </view>

        <!-- 功能模块 -->
        <view class="card">
          <view class="card-header">
            <view class="card-title">
              <Icon name="dashboard" :size="18" />
              <text>功能模块</text>
            </view>
          </view>
          <view class="card-body">
            <view class="module-grid">
              <view
                v-for="item in visibleModules"
                :key="item.key"
                class="module-item"
                :class="{ 'module-disabled': !item.path }"
                @click="handleModuleClick(item)"
              >
                <view class="module-icon">
                  <Icon :name="item.icon" :size="24" />
                </view>
                <text class="module-name">{{ item.title }}</text>
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
import { moduleEntries, noticeItems, pendingItems, progressStats, userProfile } from './workbench-data'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'

const userStore = useUserStore()

const activeUser = computed(() => {
  if (userStore.userInfo) return userStore.userInfo
  return {
    username: userProfile.username,
    displayName: userProfile.name,
    role: userProfile.role,
    roleName: roleNameMap[userProfile.role] ?? '首席经营者',
    department: userProfile.department,
    employeeType: userProfile.employeeType
  }
})

const displayRole = computed(() => activeUser.value.roleName ?? roleNameMap[activeUser.value.role] ?? activeUser.value.role)

const visibleModules = computed(() =>
  moduleEntries.filter((item) => !item.roles || item.roles.includes(activeUser.value.role))
)

const goToLogin = () => uni.navigateTo({ url: '/pages/login/index' })

const handleModuleClick = (item: { path?: string }) => {
  if (item.path) uni.navigateTo({ url: item.path })
  else uni.showToast({ title: '建设中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.workspace {
  display: flex;
  flex-direction: column;
}

.hero-bar {
  padding: 20px;
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
  color: var(--on-primary);
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
  background: var(--surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--surface-high);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--on-surface);
}

.card-body {
  padding: 12px;
}

.badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-container);
  color: var(--on-primary);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border-radius: var(--radius-sm);
  transition: background 0.15s ease;
}

.list-item:active {
  background: var(--surface-low);
}

.list-item-compact {
  padding: 10px 12px;
}

.list-item-main {
  flex: 1;
  min-width: 0;
}

.list-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
  display: block;
}

.list-item-desc {
  font-size: 12px;
  color: var(--on-surface-variant);
  margin-top: 2px;
  display: block;
}

.list-item-meta {
  font-size: 12px;
  color: var(--outline);
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.tag-danger {
  background: var(--error-container);
  color: var(--error);
}

.tag-warning {
  background: #fff3e0;
  color: #ed6c02;
}

.tag-success {
  background: #e8f5e9;
  color: var(--success);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  padding: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--on-surface-variant);
  display: block;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
  color: var(--primary);
  margin-top: 8px;
  display: block;
}

.stat-note {
  font-size: 12px;
  color: var(--outline);
  margin-top: 4px;
  display: block;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 8px;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-low);
  transition: all 0.15s ease;
}

.module-item:active:not(.module-disabled) {
  background: var(--surface-high);
  transform: scale(0.98);
}

.module-disabled {
  opacity: 0.5;
}

.module-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%);
  color: var(--on-primary);
  border-radius: var(--radius-md);
}

.module-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface);
}

@media (max-width: 960px) {
  .workspace-body {
    grid-template-columns: 1fr;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .module-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .module-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-content {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
