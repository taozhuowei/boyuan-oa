<!-- 项目管理页面：展示项目列表、进度与成员详情 -->
<template>
  <view class="page oa-page">
    <view class="header-card">
      <view class="header-left">
        <view class="header-icon-wrap">
          <text class="header-icon">◈</text>
        </view>
        <view>
          <text class="header-title">项目管理</text>
          <text class="header-sub">{{ activeCount }} 个进行中 · 平均进度 {{ averageProgress }}%</text>
        </view>
      </view>
      <button class="btn-ghost" @click="goBack">← 返回</button>
    </view>

    <view class="shell">
      <view class="panel list-panel">
        <view class="panel-head">
          <text class="panel-title">项目清单</text>
        </view>
        <view v-if="projects.length" class="list-body">
          <view
            v-for="item in projects"
            :key="item.id"
            class="list-card"
            :class="{ active: selectedProject?.id === item.id }"
            @click="selectedProject = item"
          >
            <view class="list-main">
              <text class="list-name">{{ item.name }}</text>
              <text class="list-meta">{{ item.projectNo }} · {{ item.manager }}</text>
            </view>
            <view class="list-side">
              <text class="tag" :class="`tag-${item.status.toLowerCase()}`">{{ statusLabel(item.status) }}</text>
              <text class="progress-text">{{ Math.round(item.progress) }}%</text>
            </view>
          </view>
        </view>
        <view v-else class="empty">
          <text class="empty-icon">◈</text>
          <text class="empty-text">暂无项目数据</text>
        </view>
      </view>

      <view class="detail-column">
        <view class="panel detail-panel">
          <view class="panel-head">
            <text class="panel-title">项目详情</text>
          </view>
          <view v-if="selectedProject" class="detail-body">
            <view class="profile-header">
              <view class="avatar">{{ selectedProject.name.charAt(0) }}</view>
              <view class="profile-info">
                <text class="profile-name">{{ selectedProject.name }}</text>
                <text class="profile-meta">{{ selectedProject.department }} · 负责人 {{ selectedProject.manager }}</text>
              </view>
              <text class="tag" :class="`tag-${selectedProject.status.toLowerCase()}`">
                {{ statusLabel(selectedProject.status) }}
              </text>
            </view>

            <view class="progress-card">
              <view class="progress-head">
                <view class="progress-label">
                  <text class="label-dot" />
                  <text>项目进度</text>
                </view>
                <text class="progress-value">{{ Math.round(selectedProject.progress) }}%</text>
              </view>
              <view class="progress-track">
                <view class="progress-bar" :style="{ width: `${Math.min(selectedProject.progress, 100)}%` }" />
              </view>
            </view>

            <view class="info-grid">
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot blue" />
                  <text>项目编号</text>
                </view>
                <text class="info-value">{{ selectedProject.projectNo }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot green" />
                  <text>开始日期</text>
                </view>
                <text class="info-value">{{ formatDate(selectedProject.startDate) }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot orange" />
                  <text>结束日期</text>
                </view>
                <text class="info-value">{{ formatDate(selectedProject.endDate) }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot purple" />
                  <text>参与人数</text>
                </view>
                <text class="info-value">{{ selectedProject.members.length }} 人</text>
              </view>
            </view>

            <view class="desc-card">
              <view class="info-label">
                <text class="label-dot" />
                <text>项目说明</text>
              </view>
              <text class="desc-text">{{ selectedProject.description }}</text>
            </view>

            <view class="member-card">
              <view class="info-label">
                <text class="label-dot green" />
                <text>项目成员</text>
              </view>
              <view class="member-list">
                <text v-for="member in selectedProject.members" :key="member" class="member-pill">{{ member }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty">
            <text class="empty-icon">◈</text>
            <text class="empty-text">请选择左侧项目查看详情</text>
          </view>
        </view>

        <view class="panel stat-panel">
          <view class="panel-head">
            <text class="panel-title">交付观察</text>
          </view>
          <view class="stat-grid">
            <view class="stat-card">
              <text class="stat-num">{{ completedCount }}</text>
              <text class="stat-label">已完成</text>
            </view>
            <view class="stat-card">
              <text class="stat-num">{{ maxProgress }}%</text>
              <text class="stat-label">最高进度</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '../../stores'
import { fetchProjects, type ProjectRecord } from '../../utils/org'

const userStore = useUserStore()

const projects = ref<ProjectRecord[]>([])
const selectedProject = ref<ProjectRecord | null>(null)

const activeCount = computed(() => projects.value.filter((item) => item.status === 'ACTIVE').length)
const completedCount = computed(() => projects.value.filter((item) => item.status === 'COMPLETED').length)
const averageProgress = computed(() => {
  if (!projects.value.length) {
    return 0
  }
  const total = projects.value.reduce((sum, item) => sum + item.progress, 0)
  return Math.round(total / projects.value.length)
})
const maxProgress = computed(() => {
  if (!projects.value.length) {
    return 0
  }
  return Math.round(Math.max(...projects.value.map((item) => item.progress)))
})

function statusLabel(value: string) {
  if (value === 'ACTIVE') {
    return '进行中'
  }
  if (value === 'COMPLETED') {
    return '已完成'
  }
  return value
}

function formatDate(value: string) {
  if (!value) {
    return '未记录'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

function showToast(title: string) {
  if (typeof uni === 'undefined') {
    return
  }
  uni.showToast({ title, icon: 'none' })
}

function goBack() {
  if (typeof uni === 'undefined') {
    return
  }
  uni.navigateBack()
}

onMounted(() => {
  fetchProjects(userStore.token)
    .then((data) => {
      projects.value = data
      selectedProject.value = data[0] ?? null
    })
    .catch(() => {
      showToast('项目数据加载失败')
    })
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: clamp(16px, 2.4vw, 28px);
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: clamp(16px, 2.2vw, 24px);
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--oa-accent-soft);
}

.header-icon {
  font-size: 20px;
  color: var(--oa-accent);
}

.header-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.header-sub {
  display: block;
  margin-top: 4px;
  font-size: 13px;
  color: var(--oa-text-muted);
}

.btn-ghost {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: rgba(125, 61, 35, 0.06);
  color: var(--oa-text-secondary);
  font-size: 13px;
}

.shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 18px;
}

.panel {
  border-radius: var(--oa-radius-xl);
  background: var(--oa-surface);
  border: 1px solid var(--oa-border);
  box-shadow: var(--oa-shadow-panel);
  padding: clamp(16px, 2vw, 22px);
}

.panel-head {
  margin-bottom: 14px;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.list-body,
.detail-column {
  display: grid;
  gap: 12px;
}

.list-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.list-card.active {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
  box-shadow: 0 8px 18px rgba(121, 58, 27, 0.08);
}

.list-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.list-meta {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.list-side {
  display: grid;
  justify-items: end;
  gap: 6px;
}

.tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
}

.tag-active {
  background: var(--oa-warning-soft);
  color: #8d642c;
}

.tag-completed {
  background: var(--oa-success-soft);
  color: #4b6c52;
}

.progress-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--oa-accent);
}

.detail-body {
  display: grid;
  gap: 14px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  font-size: 22px;
  font-weight: 700;
  color: var(--oa-text-inverse);
  background: var(--oa-gradient-action);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.profile-meta {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.progress-card {
  padding: 14px 16px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.progress-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.progress-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-accent);
}

.progress-track {
  overflow: hidden;
  height: 8px;
  border-radius: 999px;
  background: rgba(125, 61, 35, 0.08);
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--oa-gradient-action);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.info-item {
  padding: 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.info-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.label-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--oa-accent);
}

.label-dot.green {
  background: #4b6c52;
}

.label-dot.blue {
  background: #4a6fa5;
}

.label-dot.orange {
  background: #c7885f;
}

.label-dot.purple {
  background: #8a6fa5;
}

.info-value {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--oa-text-primary);
}

.desc-card,
.member-card {
  padding: 14px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
}

.desc-text {
  display: block;
  margin-top: 10px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--oa-text-secondary);
}

.member-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.member-pill {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--oa-accent-soft);
  color: var(--oa-accent-deep);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  padding: 16px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px solid var(--oa-border);
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: var(--oa-accent);
}

.stat-label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.empty {
  display: grid;
  place-items: center;
  gap: 10px;
  padding: 32px 18px;
  border-radius: var(--oa-radius-md);
  background: var(--oa-surface-soft);
  border: 1px dashed var(--oa-border-strong);
}

.empty-icon {
  font-size: 28px;
  color: var(--oa-text-muted);
}

.empty-text {
  font-size: 13px;
  color: var(--oa-text-muted);
}

@media (max-width: 1100px) {
  .shell,
  .info-grid,
  .stat-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .page {
    padding: 14px;
  }

  .header-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-card,
  .profile-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-side {
    justify-items: start;
    width: 100%;
  }
}
</style>
