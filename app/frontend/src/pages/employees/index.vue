<!-- 员工管理页面：展示员工列表、在岗状态与项目归属详情 -->
<template>
  <view class="page oa-page">
    <view class="header-card">
      <view class="header-left">
        <view class="header-icon-wrap">
          <text class="header-icon">●</text>
        </view>
        <view>
          <text class="header-title">员工管理</text>
          <text class="header-sub">{{ employees.length }} 人 · 在岗 {{ activeCount }} 人</text>
        </view>
      </view>
      <button class="btn-ghost" @click="goBack">← 返回</button>
    </view>

    <view class="shell">
      <view class="panel list-panel">
        <view class="panel-head">
          <text class="panel-title">员工名单</text>
        </view>
        <view v-if="employees.length" class="list-body">
          <view
            v-for="item in employees"
            :key="item.id"
            class="list-card"
            :class="{ active: selectedEmployee?.id === item.id }"
            @click="handleSelectEmployee(item.id)"
          >
            <view class="list-main">
              <text class="list-name">{{ item.name }}</text>
              <text class="list-meta">{{ item.department }} · {{ employeeTypeLabel(item.employeeType) }}</text>
            </view>
            <view class="list-side">
              <text class="badge">{{ item.employeeNo }}</text>
              <text class="tag" :class="item.status === 'ACTIVE' ? 'tag-success' : 'tag-default'">
                {{ statusLabel(item.status) }}
              </text>
            </view>
          </view>
        </view>
        <view v-else class="empty">
          <text class="empty-icon">◈</text>
          <text class="empty-text">暂无员工数据</text>
        </view>
      </view>

      <view class="detail-column">
        <view class="panel detail-panel">
          <view class="panel-head">
            <text class="panel-title">资料详情</text>
          </view>
          <view v-if="selectedEmployee" class="detail-body">
            <view class="profile-header">
              <view class="avatar">{{ selectedEmployee.name.charAt(0) }}</view>
              <view class="profile-info">
                <text class="profile-name">{{ selectedEmployee.name }}</text>
                <text class="profile-meta">{{ selectedEmployee.employeeNo }} · {{ selectedEmployee.department }}</text>
              </view>
              <text class="tag" :class="selectedEmployee.status === 'ACTIVE' ? 'tag-success' : 'tag-default'">
                {{ statusLabel(selectedEmployee.status) }}
              </text>
            </view>
            <view class="info-grid">
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot" />
                  <text>项目归属</text>
                </view>
                <text class="info-value">{{ selectedEmployee.project || '未绑定' }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot green" />
                  <text>联系电话</text>
                </view>
                <text class="info-value">{{ selectedEmployee.phone }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot blue" />
                  <text>联系邮箱</text>
                </view>
                <text class="info-value">{{ selectedEmployee.email }}</text>
              </view>
              <view class="info-item">
                <view class="info-label">
                  <text class="label-dot orange" />
                  <text>入职日期</text>
                </view>
                <text class="info-value">{{ formatDate(selectedEmployee.hireDate) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty">
            <text class="empty-icon">◈</text>
            <text class="empty-text">请选择左侧员工查看详情</text>
          </view>
        </view>

        <view class="panel stat-panel">
          <view class="panel-head">
            <text class="panel-title">组织摘要</text>
          </view>
          <view class="stat-grid">
            <view class="stat-card">
              <text class="stat-num">{{ laborCount }}</text>
              <text class="stat-label">劳务人员</text>
            </view>
            <view class="stat-card">
              <text class="stat-num">{{ departmentCount }}</text>
              <text class="stat-label">部门覆盖</text>
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
import { fetchEmployeeDetail, fetchEmployees, type EmployeeProfile } from '../../utils/org'

const userStore = useUserStore()

const employees = ref<EmployeeProfile[]>([])
const selectedEmployee = ref<EmployeeProfile | null>(null)

const activeCount = computed(() => employees.value.filter((item) => item.status === 'ACTIVE').length)
const laborCount = computed(() =>
  employees.value.filter((item) => item.employeeType === 'LABOR' || item.employeeType === '劳工').length
)
const departmentCount = computed(() => new Set(employees.value.map((item) => item.department)).size)

function employeeTypeLabel(value: string) {
  if (value === 'LABOR' || value === '劳工') {
    return '劳务'
  }
  if (value === 'OFFICE') {
    return '职员'
  }
  return value
}

function statusLabel(value: string) {
  return value === 'ACTIVE' ? '在岗' : value
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

async function loadEmployees() {
  employees.value = await fetchEmployees(userStore.token)
  if (!selectedEmployee.value && employees.value[0]) {
    await handleSelectEmployee(employees.value[0].id)
  }
}

async function handleSelectEmployee(id: number) {
  selectedEmployee.value = await fetchEmployeeDetail(id, userStore.token)
}

function goBack() {
  if (typeof uni === 'undefined') {
    return
  }
  uni.navigateBack()
}

onMounted(() => {
  loadEmployees().catch(() => {
    showToast('员工数据加载失败')
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

.badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  background: rgba(93, 77, 68, 0.08);
  color: var(--oa-text-secondary);
}

.tag {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
}

.tag-success {
  background: var(--oa-success-soft);
  color: #4b6c52;
}

.tag-default {
  background: rgba(93, 77, 68, 0.08);
  color: var(--oa-text-secondary);
}

.detail-body {
  display: grid;
  gap: 16px;
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

.info-value {
  display: block;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--oa-text-primary);
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
