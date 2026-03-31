<!-- 员工管理页面：仅查看功能 -->
<template>
  <view class="page employees-page">
    <!-- Hero -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="people" :size="28" />
          <text class="hero-title">员工管理</text>
        </view>
        <text class="hero-subtitle">查看员工档案与联系信息</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ employees.length }}</text>
          <text class="stat-label">总人数</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ activeCount }}</text>
          <text class="stat-label">在岗</text>
        </view>
      </view>
    </view>

    <view class="employees-container">
      <!-- 左侧列表 -->
      <view class="card list-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="list" :size="18" />
            <text class="card-title">员工名单</text>
          </view>
        </view>
        <view class="list-body">
          <view
            v-for="item in employees"
            :key="item.id"
            class="list-item"
            :class="{ active: selected?.id === item.id }"
            @click="selected = item"
          >
            <view class="item-main">
              <text class="item-name">{{ item.name }}</text>
              <text class="item-meta">{{ item.department }} · {{ typeLabel(item.employeeType) }}</text>
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
            <Icon name="person" :size="18" />
            <text class="card-title">员工详情</text>
          </view>
        </view>
        <view v-if="selected" class="detail-body">
          <view class="profile-header">
            <view class="avatar">{{ selected.name.charAt(0) }}</view>
            <view class="profile-info">
              <text class="profile-name">{{ selected.name }}</text>
              <text class="profile-meta">{{ selected.employeeNo }} · {{ selected.department }}</text>
            </view>
            <Badge :variant="selected.status === 'ACTIVE' ? 'success' : 'default'">{{ statusLabel(selected.status) }}</Badge>
          </view>
          <view class="info-list">
            <view class="info-item">
              <text class="info-label">员工类型</text>
              <text class="info-value">{{ typeLabel(selected.employeeType) }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">所属项目</text>
              <text class="info-value">{{ selected.project || '未分配' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">联系电话</text>
              <text class="info-value">{{ selected.phone }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">联系邮箱</text>
              <text class="info-value">{{ selected.email }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">入职日期</text>
              <text class="info-value">{{ selected.hireDate }}</text>
            </view>
          </view>
        </view>
        <Empty v-else text="请选择左侧员工查看详情" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon, Badge, Empty } from '../../components/ui'

// Mock 数据
const employees = ref([
  { id: 1, employeeNo: 'E001', name: '张晓宁', department: '综合管理部', project: null, employeeType: 'OFFICE', hireDate: '2022-03-15', status: 'ACTIVE', phone: '13800138001', email: 'zhangxn@oa.com' },
  { id: 2, employeeNo: 'E002', name: '赵铁柱', department: '施工一部', project: 'P001', employeeType: 'LABOR', hireDate: '2021-06-01', status: 'ACTIVE', phone: '13800138002', email: 'zhaotz@oa.com' },
  { id: 3, employeeNo: 'E003', name: '李静', department: '财务管理部', project: null, employeeType: 'OFFICE', hireDate: '2020-01-10', status: 'ACTIVE', phone: '13800138003', email: 'lijing@oa.com' },
  { id: 4, employeeNo: 'E004', name: '王建国', department: '项目一部', project: 'P001', employeeType: 'OFFICE', hireDate: '2019-08-20', status: 'ACTIVE', phone: '13800138004', email: 'wangjg@oa.com' },
  { id: 5, employeeNo: 'E005', name: '陈明远', department: '运营管理部', project: null, employeeType: 'OFFICE', hireDate: '2018-05-01', status: 'ACTIVE', phone: '13800138005', email: 'chenmy@oa.com' }
])

const selected = ref<any>(null)
const activeCount = computed(() => employees.value.filter(e => e.status === 'ACTIVE').length)

const typeLabel = (type: string) => type === 'LABOR' ? '劳工' : '职员'
const statusLabel = (status: string) => status === 'ACTIVE' ? '在岗' : '离职'
</script>

<style lang="scss" scoped>
.employees-page {
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

.employees-container {
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
</style>
