<!-- 项目管理页面：仅查看功能 -->
<template>
  <view class="page projects-page">
    <!-- Hero -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="business" :size="28" />
          <text class="hero-title">项目管理</text>
        </view>
        <text class="hero-subtitle">查看项目信息与成员配置</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ projects.length }}</text>
          <text class="stat-label">项目总数</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ activeCount }}</text>
          <text class="stat-label">进行中</text>
        </view>
      </view>
    </view>

    <view class="projects-container">
      <!-- 左侧列表 -->
      <view class="card list-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="list" :size="18" />
            <text class="card-title">项目清单</text>
          </view>
        </view>
        <view class="list-body">
          <view
            v-for="item in projects"
            :key="item.id"
            class="list-item"
            :class="{ active: selected?.id === item.id }"
            @click="selected = item"
          >
            <view class="item-main">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-meta">{{ item.projectNo }} · {{ item.manager }}</text>
            </view>
            <view class="item-side">
              <Badge :variant="item.status === 'ACTIVE' ? 'success' : 'default'">{{ statusLabel(item.status) }}</Badge>
            </view>
          </view>
        </view>
      </view>

      <!-- 右侧详情 -->
      <view class="card detail-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="info" :size="18" />
            <text class="card-title">项目详情</text>
          </view>
        </view>
        <view v-if="selected" class="detail-body">
          <view class="profile-header">
            <view class="avatar">{{ selected.name.charAt(0) }}</view>
            <view class="profile-info">
              <text class="profile-name">{{ selected.name }}</text>
              <text class="profile-meta">{{ selected.department }} · 负责人 {{ selected.manager }}</text>
            </view>
            <Badge :variant="selected.status === 'ACTIVE' ? 'success' : 'default'">{{ statusLabel(selected.status) }}</Badge>
          </view>
          <view class="info-list">
            <view class="info-item">
              <text class="info-label">项目编号</text>
              <text class="info-value">{{ selected.projectNo }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">开始日期</text>
              <text class="info-value">{{ selected.startDate }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">结束日期</text>
              <text class="info-value">{{ selected.endDate }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">所属部门</text>
              <text class="info-value">{{ selected.department }}</text>
            </view>
          </view>
          <view v-if="selected.members?.length" class="members-section">
            <view class="section-title">
              <Icon name="people" :size="14" />
              <text>项目成员</text>
            </view>
            <view class="members-list">
              <view v-for="member in selected.members" :key="member" class="member-tag">
                {{ member }}
              </view>
            </view>
          </view>
        </view>
        <Empty v-else text="请选择左侧项目查看详情" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon, Badge, Empty } from '../../components/ui'

// Mock 数据
const projects = ref([
  { 
    id: 1, 
    projectNo: 'P001', 
    name: '绿地中心大厦装修项目', 
    description: '高层商业楼宇内部装修工程', 
    department: '项目一部', 
    manager: '王建国',
    startDate: '2024-01-01', 
    endDate: '2024-12-31', 
    status: 'ACTIVE',
    members: ['王建国', '赵铁柱', '刘大力']
  },
  { 
    id: 2, 
    projectNo: 'P002', 
    name: '科技园区基础设施改造', 
    description: '园区道路、管网及绿化改造工程', 
    department: '项目二部', 
    manager: '李华',
    startDate: '2024-03-01', 
    endDate: '2024-10-30', 
    status: 'ACTIVE',
    members: ['李华', '王小燕']
  },
  { 
    id: 3, 
    projectNo: 'P003', 
    name: '地铁站出口建设工程', 
    description: '地铁站B出口土建及装饰工程', 
    department: '项目三部', 
    manager: '张伟',
    startDate: '2023-06-01', 
    endDate: '2024-06-30', 
    status: 'COMPLETED',
    members: ['张伟', '赵铁柱']
  }
])

const selected = ref<any>(null)
const activeCount = computed(() => projects.value.filter(p => p.status === 'ACTIVE').length)

const statusLabel = (status: string) => status === 'ACTIVE' ? '进行中' : '已完成'
</script>

<style lang="scss" scoped>
.projects-page {
  display: flex;
  flex-direction: column;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin: 16px 16px 0;
  border-radius: var(--radius-lg);
}

.hero-main {
  margin-bottom: 16px;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  gap: 24px;
}

.hero-stat {
  text-align: center;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.projects-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
  padding: 16px;
}

.card {
  background: #fff;
  border-radius: var(--radius-lg);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.list-card {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.list-body {
  padding: 12px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: var(--bg-secondary);
  }
  &.active {
    background: var(--primary-light);
  }
  &:last-child {
    margin-bottom: 0;
  }
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 500;
  font-size: 14px;
}

.item-meta {
  font-size: 12px;
  color: var(--text-secondary);
}

.detail-body {
  padding: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.avatar {
  width: 56px;
  height: 56px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
}

.profile-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
}

.profile-meta {
  font-size: 13px;
  color: var(--text-secondary);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.members-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.members-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.member-tag {
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: 13px;
}
</style>
