<template>
  <view class="projects-page oa-page">
    <view class="projects-hero oa-surface-hero">
      <view class="hero-copy">
        <text class="hero-kicker">项目管理</text>
        <text class="hero-title">把进度、负责人和施工成员浓缩成工作台可直接判断的项目概览</text>
        <text class="hero-subtitle">
          当前页面承接成熟 OA 门户里的项目总览区，先聚焦项目状态、节点节奏和负责人视角。
        </text>
      </view>

      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-label">进行中项目</text>
          <text class="stat-value">{{ activeCount }}</text>
          <text class="stat-note">配合审批与员工模块一起核对归属</text>
        </view>
        <view class="hero-stat">
          <text class="stat-label">平均进度</text>
          <text class="stat-value">{{ averageProgress }}%</text>
          <text class="stat-note">用于快速判断交付压力与资源分配</text>
        </view>
      </view>
    </view>

    <view class="projects-shell">
      <view class="oa-panel project-list">
        <view class="section-head">
          <view>
            <text class="section-title">项目清单</text>
            <text class="section-note">支持项目经理、CEO 和协同角色快速浏览</text>
          </view>
          <button class="ghost-button" @click="goBack">返回工作台</button>
        </view>

        <view v-if="projects.length" class="project-cards">
          <view
            v-for="item in projects"
            :key="item.id"
            class="project-card"
            :class="{ active: selectedProject?.id === item.id }"
            @click="selectedProject = item"
          >
            <view>
              <text class="project-name">{{ item.name }}</text>
              <text class="project-meta">{{ item.projectNo }} · {{ item.manager }}</text>
            </view>
            <view class="project-card-side">
              <text class="project-status" :class="`status-${item.status}`">{{ statusLabel(item.status) }}</text>
              <text class="project-progress">{{ Math.round(item.progress) }}%</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-block">当前没有项目数据。</view>
      </view>

      <view class="detail-column">
        <view class="oa-panel detail-panel">
          <view class="section-head">
            <view>
              <text class="section-title">项目详情</text>
              <text class="section-note">聚焦项目编号、区属部门、时间范围和成员信息</text>
            </view>
          </view>

          <view v-if="selectedProject" class="detail-body">
            <view class="headline-card">
              <view>
                <text class="headline-title">{{ selectedProject.name }}</text>
                <text class="headline-meta">
                  {{ selectedProject.department }} · 负责人 {{ selectedProject.manager }}
                </text>
              </view>
              <text class="project-status" :class="`status-${selectedProject.status}`">
                {{ statusLabel(selectedProject.status) }}
              </text>
            </view>

            <view class="progress-panel">
              <view class="progress-head">
                <text class="detail-key">项目进度</text>
                <text class="detail-value strong">{{ Math.round(selectedProject.progress) }}%</text>
              </view>
              <view class="progress-track">
                <view class="progress-bar" :style="{ width: `${Math.min(selectedProject.progress, 100)}%` }" />
              </view>
            </view>

            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-key">项目编号</text>
                <text class="detail-value">{{ selectedProject.projectNo }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">开始日期</text>
                <text class="detail-value">{{ formatDate(selectedProject.startDate) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">结束日期</text>
                <text class="detail-value">{{ formatDate(selectedProject.endDate) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">参与人数</text>
                <text class="detail-value">{{ selectedProject.members.length }} 人</text>
              </view>
            </view>

            <view class="description-card">
              <text class="detail-key">项目说明</text>
              <text class="description-text">{{ selectedProject.description }}</text>
            </view>

            <view class="member-card">
              <text class="detail-key">项目成员</text>
              <view class="member-list">
                <text v-for="member in selectedProject.members" :key="member" class="member-pill">
                  {{ member }}
                </text>
              </view>
            </view>
          </view>
          <view v-else class="empty-block">从左侧选择一个项目后，在这里查看详细信息。</view>
        </view>

        <view class="oa-panel insight-panel">
          <view class="section-head">
            <view>
              <text class="section-title">交付观察</text>
              <text class="section-note">为下一轮项目台账和节点预警预留承接位</text>
            </view>
          </view>

          <view class="insight-grid">
            <view class="insight-card">
              <text class="detail-key">已完成项目</text>
              <text class="insight-value">{{ completedCount }}</text>
              <text class="section-note">可继续接归档与结算信息</text>
            </view>
            <view class="insight-card">
              <text class="detail-key">最高进度</text>
              <text class="insight-value">{{ maxProgress }}%</text>
              <text class="section-note">用于识别已接近交付的重点项目</text>
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

  uni.showToast({
    title,
    icon: 'none'
  })
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
.projects-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
}

.projects-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.7fr);
  gap: 20px;
  margin-bottom: 18px;
  padding: clamp(22px, 3vw, 30px);
}

.hero-copy,
.hero-stats,
.detail-column,
.detail-body,
.project-cards,
.member-list,
.insight-grid {
  display: grid;
  gap: 14px;
}

.hero-kicker,
.stat-label {
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.74);
}

.hero-title {
  display: block;
  max-width: 16ch;
  font-family: var(--oa-font-display);
  font-size: clamp(30px, 3.2vw, 42px);
  line-height: 1.08;
  color: var(--oa-text-inverse);
}

.hero-subtitle,
.stat-note,
.section-note,
.project-meta,
.headline-meta,
.description-text {
  display: block;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 250, 243, 0.86);
}

.hero-stat {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 240, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.18);
}

.stat-value {
  display: block;
  margin: 10px 0 8px;
  font-family: var(--oa-font-display);
  font-size: 34px;
  color: var(--oa-text-inverse);
}

.projects-shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 18px;
}

.project-list,
.detail-panel,
.insight-panel {
  display: grid;
  gap: 16px;
}

.section-head,
.project-card,
.headline-card,
.progress-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.ghost-button {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 247, 240, 0.72);
  border: 1px solid rgba(151, 167, 186, 0.24);
  color: var(--oa-text-primary);
  font-size: 14px;
}

.project-card,
.headline-card,
.progress-panel,
.detail-item,
.description-card,
.member-card,
.insight-card {
  padding: 16px;
  border-radius: var(--oa-radius-lg);
  border: 1px solid var(--oa-border-strong);
  background: rgba(255, 248, 243, 0.82);
}

.project-card.active {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
  box-shadow: 0 12px 24px rgba(121, 58, 27, 0.08);
}

.project-name,
.headline-title {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.project-card-side {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.project-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.status-ACTIVE {
  background: rgba(196, 152, 83, 0.16);
  color: #8d642c;
}

.status-COMPLETED {
  background: rgba(96, 139, 104, 0.14);
  color: #4b6c52;
}

.project-progress,
.insight-value {
  font-family: var(--oa-font-display);
  font-size: 28px;
  color: var(--oa-text-primary);
}

.progress-track {
  overflow: hidden;
  height: 10px;
  margin-top: 10px;
  border-radius: 999px;
  background: rgba(125, 61, 35, 0.08);
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: var(--oa-gradient-action);
}

.detail-grid,
.insight-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-key {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.detail-value {
  display: block;
  margin-top: 8px;
  color: var(--oa-text-primary);
}

.detail-value.strong {
  margin-top: 0;
  font-weight: 700;
}

.description-text {
  margin-top: 8px;
  color: var(--oa-text-secondary);
}

.member-pill {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(164, 91, 56, 0.12);
  color: var(--oa-accent-deep);
  font-size: 12px;
}

.empty-block {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 250, 246, 0.76);
  border: 1px dashed rgba(162, 177, 196, 0.36);
  color: var(--oa-text-secondary);
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .projects-hero,
  .projects-shell,
  .detail-grid,
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .projects-page {
    padding: 16px;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .project-card,
  .headline-card,
  .progress-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .project-card-side {
    justify-items: start;
  }
}
</style>
