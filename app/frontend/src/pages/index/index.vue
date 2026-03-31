<template>
  <view class="workspace-page oa-page">
    <view class="topbar">
      <view class="hero-panel oa-surface-hero">
        <view class="hero-copy">
          <text class="hero-kicker">众维</text>
          <text class="title">OA</text>
        </view>
      </view>

      <view class="user-status oa-panel" data-testid="user-status">
        <view class="user-identity">
          <view>
            <text class="user-name">{{ activeUser.displayName }}</text>
            <text class="user-note">{{ activeUser.department }} · {{ employeeTypeText }}</text>
          </view>
          <text class="user-role">{{ displayRole }}</text>
        </view>
        <view class="user-actions">
          <text class="user-state">{{ activeUser.status }}</text>
          <text class="action-link" @click="goToLogin">切换账号</text>
        </view>
      </view>
    </view>

    <view class="workspace-shell" data-testid="workspace-shell">
      <view class="workspace-left column oa-panel" data-testid="workspace-left">
        <view class="section-block">
          <view class="section-head">
            <text class="section-title">当前未办</text>
            <text class="section-note">{{ pendingItems.length }} 项</text>
          </view>
          <view v-for="item in pendingItems" :key="item.title" class="pending-item">
            <view class="item-main">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-meta">{{ item.category }} · {{ item.owner }}</text>
            </view>
            <view class="item-side">
              <text class="priority" :class="`priority-${item.priority}`">{{ item.priority }}</text>
              <text class="deadline">{{ item.deadline }}</text>
            </view>
          </view>
        </view>

        <view class="section-block">
          <view class="section-head">
            <text class="section-title">提醒摘要</text>
            <text class="section-note">{{ reminderItems.length }} 项</text>
          </view>
          <view v-for="item in reminderItems" :key="item.category" class="reminder-item">
            <text class="reminder-level" :class="`reminder-${item.level}`">{{ item.level }}</text>
            <view class="reminder-copy">
              <text class="item-title">{{ item.category }}</text>
              <text class="item-meta">{{ item.detail }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="workspace-right column" data-testid="workspace-right">
        <view class="oa-panel section-card">
          <view class="section-head">
            <text class="section-title">进度总览</text>
          </view>
          <view class="stats-grid">
            <view v-for="stat in progressStats" :key="stat.label" class="stat-card">
              <text class="stat-label">{{ stat.label }}</text>
              <text class="stat-value">{{ stat.value }}</text>
              <text class="stat-note">{{ stat.note }}</text>
            </view>
          </view>
        </view>

        <view class="oa-panel section-card">
          <view class="section-head">
            <text class="section-title">模块</text>
          </view>
          <view class="module-grid">
            <view
              v-for="item in visibleModules"
              :key="item.key"
              class="module-card"
              @click="handleModuleClick(item)"
            >
              <view class="module-head">
                <text class="module-title">{{ item.title }}</text>
                <text class="module-dot" :class="item.path ? 'dot-ready' : 'dot-pending'"></text>
              </view>
            </view>
          </view>
        </view>

        <view class="oa-panel section-card">
          <view class="section-head">
            <text class="section-title">通知</text>
            <text class="section-note">{{ noticeItems.length }} 条</text>
          </view>
          <view v-for="item in noticeItems" :key="item.title" class="notice-item">
            <view class="item-main">
              <text class="item-title">{{ item.title }}</text>
              <text class="item-meta">{{ item.source }}</text>
            </view>
            <text class="deadline">{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { moduleEntries, noticeItems, pendingItems, progressStats, reminderItems, userProfile } from './workbench-data'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'

const userStore = useUserStore()

const activeUser = computed(() => {
  if (userStore.userInfo) {
    return userStore.userInfo
  }

  return {
    username: userProfile.username,
    displayName: userProfile.name,
    role: userProfile.role,
    roleName: roleNameMap[userProfile.role] ?? '首席经营者',
    department: userProfile.department,
    employeeType: userProfile.employeeType,
    status: userProfile.status
  }
})

const displayRole = computed(
  () => activeUser.value.roleName ?? roleNameMap[activeUser.value.role] ?? activeUser.value.role
)

const employeeTypeText = computed(() => {
  if (activeUser.value.employeeType === 'LABOR' || activeUser.value.employeeType === '劳工') {
    return '劳工'
  }

  if (activeUser.value.employeeType === 'OFFICE') {
    return '办公职员'
  }

  return activeUser.value.employeeType
})

const visibleModules = computed(() =>
  moduleEntries.filter((item) => !item.roles || item.roles.includes(activeUser.value.role))
)

const goToLogin = () => {
  if (typeof uni === 'undefined') {
    return
  }

  uni.navigateTo({
    url: '/pages/login/index'
  })
}

const handleModuleClick = (item: { path?: string }) => {
  if (typeof uni === 'undefined') {
    return
  }

  if (item.path) {
    uni.navigateTo({
      url: item.path
    })
    return
  }

  uni.showToast({
    title: '建设中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.workspace-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
  box-sizing: border-box;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 360px);
  gap: 18px;
  margin-bottom: 18px;
}

.hero-panel {
  display: grid;
  align-items: center;
  padding: clamp(22px, 3vw, 30px);
}

.hero-copy {
  display: grid;
  gap: 14px;
}

.hero-kicker {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 247, 238, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.16);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.74);
}

.title {
  display: block;
  max-width: none;
  font-family: var(--oa-font-display);
  font-size: clamp(54px, 7vw, 84px);
  line-height: 1.02;
  color: var(--oa-text-inverse);
}

.user-status {
  display: grid;
  align-content: space-between;
  min-width: 0;
}

.user-identity,
.user-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.user-actions {
  margin-top: 10px;
}

.user-name {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.user-role,
.user-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.user-role {
  background: var(--oa-accent-soft);
  color: var(--oa-accent-deep);
}

.user-state {
  background: var(--oa-success-soft);
  color: #4b6c52;
}

.user-note,
.action-link {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.action-link {
  color: var(--oa-accent-deep);
}

.workspace-shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 18px;
  min-height: 0;
}

.column {
  min-height: 0;
}

.workspace-left {
  display: grid;
  gap: 22px;
}

.workspace-right {
  display: grid;
  gap: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.section-note {
  font-size: 12px;
  color: var(--oa-text-muted);
  white-space: nowrap;
}

.pending-item,
.notice-item,
.reminder-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0 14px;
  border-bottom: 1px solid var(--oa-border);
}

.pending-item:last-child,
.notice-item:last-child,
.reminder-item:last-child {
  border-bottom: none;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--oa-text-primary);
}

.item-meta {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--oa-text-secondary);
}

.item-side {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.priority,
.reminder-level {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.priority-高,
.reminder-高 {
  background: var(--oa-danger-soft);
  color: #954740;
}

.priority-中,
.reminder-中 {
  background: var(--oa-warning-soft);
  color: #8d642c;
}

.priority-低,
.reminder-低 {
  background: var(--oa-success-soft);
  color: #4c6d53;
}

.deadline {
  font-size: 12px;
  color: var(--oa-text-muted);
  white-space: nowrap;
}

.reminder-item {
  align-items: flex-start;
}

.reminder-copy {
  flex: 1;
  min-width: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: linear-gradient(180deg, rgba(255, 251, 246, 0.94) 0%, rgba(247, 240, 234, 0.94) 100%);
  border: 1px solid var(--oa-border-strong);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.stat-value {
  display: block;
  margin: 10px 0 6px;
  font-family: var(--oa-font-display);
  font-size: 30px;
  color: var(--oa-text-primary);
}

.stat-note {
  display: block;
  font-size: 12px;
  color: var(--oa-text-secondary);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.module-card {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 243, 0.8);
  border: 1px solid var(--oa-border-strong);
}

.module-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.module-title {
  display: block;
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.module-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.dot-ready {
  background: #6f8c4d;
  box-shadow: 0 0 0 6px rgba(111, 140, 77, 0.14);
}

.dot-pending {
  background: #c68443;
  box-shadow: 0 0 0 6px rgba(198, 132, 67, 0.14);
}

@media (min-width: 761px) {
  .workspace-page {
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .workspace-shell {
    flex: 1 1 auto;
    min-height: 0;
  }

  .workspace-left,
  .workspace-right {
    height: 100%;
    overflow-y: auto;
  }
}

@media (max-width: 960px) {
  .topbar,
  .workspace-shell,
  .stats-grid,
  .module-grid {
    grid-template-columns: 1fr;
  }

  .user-identity,
  .user-actions,
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-status {
    min-width: 0;
    width: 100%;
  }
}

@media (max-width: 760px) {
  .workspace-page {
    padding: 16px;
  }

  .section-note,
  .deadline {
    white-space: normal;
  }
}
</style>
