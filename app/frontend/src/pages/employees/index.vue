<template>
  <view class="employees-page oa-page">
    <view class="employees-hero oa-surface-hero">
      <view class="hero-copy">
        <text class="hero-kicker">员工管理</text>
        <text class="hero-title">把组织名册、在岗状态和项目归属放回同一块业务视图里</text>
        <text class="hero-subtitle">
          {{ heroSubtitle }}
        </text>
      </view>

      <view class="hero-metrics">
        <view class="hero-metric">
          <text class="metric-label">当前名册</text>
          <text class="metric-value">{{ employees.length }}</text>
          <text class="metric-note">覆盖办公与劳务两类人员</text>
        </view>
        <view class="hero-metric">
          <text class="metric-label">在岗人数</text>
          <text class="metric-value">{{ activeCount }}</text>
          <text class="metric-note">便于财务与项目同步确认状态</text>
        </view>
      </view>
    </view>

    <view class="employees-shell">
      <view class="oa-panel employee-list">
        <view class="section-head">
          <view>
            <text class="section-title">员工名单</text>
            <text class="section-note">按当前演示数据加载，可直接查看详情</text>
          </view>
          <button class="ghost-button" @click="goBack">返回工作台</button>
        </view>

        <view v-if="employees.length" class="list-body">
          <view
            v-for="item in employees"
            :key="item.id"
            class="employee-card"
            :class="{ active: selectedEmployee?.id === item.id }"
            @click="handleSelectEmployee(item.id)"
          >
            <view class="employee-main">
              <text class="employee-name">{{ item.name }}</text>
              <text class="employee-meta">{{ item.department }} · {{ employeeTypeLabel(item.employeeType) }}</text>
            </view>
            <view class="employee-side">
              <text class="employee-badge">{{ item.employeeNo }}</text>
              <text class="employee-status">{{ statusLabel(item.status) }}</text>
            </view>
          </view>
        </view>
        <view v-else class="empty-block">当前没有可展示的员工数据。</view>
      </view>

      <view class="detail-column">
        <view class="oa-panel detail-panel">
          <view class="section-head">
            <view>
              <text class="section-title">资料详情</text>
              <text class="section-note">用于核对员工基础信息与项目归属</text>
            </view>
          </view>

          <view v-if="selectedEmployee" class="detail-body">
            <view class="profile-card">
              <view>
                <text class="profile-name">{{ selectedEmployee.name }}</text>
                <text class="profile-meta">
                  {{ selectedEmployee.employeeNo }} · {{ selectedEmployee.department }}
                </text>
              </view>
              <text class="profile-tag">{{ employeeTypeLabel(selectedEmployee.employeeType) }}</text>
            </view>

            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-key">项目归属</text>
                <text class="detail-value">{{ selectedEmployee.project || '未绑定项目' }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">在岗状态</text>
                <text class="detail-value">{{ statusLabel(selectedEmployee.status) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">联系电话</text>
                <text class="detail-value">{{ selectedEmployee.phone }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">联系邮箱</text>
                <text class="detail-value">{{ selectedEmployee.email }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">入职日期</text>
                <text class="detail-value">{{ formatDate(selectedEmployee.hireDate) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-key">组织标签</text>
                <text class="detail-value">{{ departmentSummary }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-block">从左侧选择一位员工后，在这里查看完整资料。</view>
        </view>

        <view class="oa-panel insight-panel">
          <view class="section-head">
            <view>
              <text class="section-title">组织摘要</text>
              <text class="section-note">方便进入下一步项目与通讯录管理</text>
            </view>
          </view>

          <view class="insight-grid">
            <view class="insight-card">
              <text class="insight-label">劳务人员</text>
              <text class="insight-value">{{ laborCount }}</text>
              <text class="insight-note">适用于施工日志、工伤补偿等业务</text>
            </view>
            <view class="insight-card">
              <text class="insight-label">部门覆盖</text>
              <text class="insight-value">{{ departmentCount }}</text>
              <text class="insight-note">支持后续通讯录导入映射部门</text>
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
const departmentSummary = computed(() => `${departmentCount.value} 个部门正在协同`)
const heroSubtitle = computed(() => {
  return '以成熟 OA 门户的组织视角展示当前员工名单，让角色、部门、项目归属和联络信息能被快速核对。'
})

function employeeTypeLabel(value: string) {
  if (value === 'LABOR' || value === '劳工') {
    return '劳务人员'
  }

  if (value === 'OFFICE') {
    return '办公职员'
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

  uni.showToast({
    title,
    icon: 'none'
  })
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
.employees-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
}

.employees-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.7fr);
  gap: 20px;
  margin-bottom: 18px;
  padding: clamp(22px, 3vw, 30px);
}

.hero-copy,
.hero-metrics,
.detail-column,
.detail-body {
  display: grid;
  gap: 16px;
}

.hero-kicker,
.metric-label {
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
.metric-note {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 250, 243, 0.86);
}

.hero-metrics {
  align-content: start;
}

.hero-metric {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 240, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.18);
}

.metric-value {
  display: block;
  margin: 10px 0 8px;
  font-family: var(--oa-font-display);
  font-size: 34px;
  color: var(--oa-text-inverse);
}

.employees-shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 18px;
}

.employee-list,
.detail-panel,
.insight-panel,
.list-body,
.insight-grid {
  display: grid;
  gap: 14px;
}

.section-head,
.employee-card,
.profile-card {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.section-title {
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.section-note,
.profile-meta,
.employee-meta,
.insight-note {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--oa-text-secondary);
}

.employee-card,
.detail-item,
.insight-card,
.profile-card {
  border-radius: var(--oa-radius-lg);
  border: 1px solid var(--oa-border-strong);
  background: rgba(255, 248, 243, 0.82);
}

.employee-card {
  align-items: center;
  padding: 16px;
}

.employee-card.active {
  background: var(--oa-accent-soft);
  border-color: rgba(164, 91, 56, 0.28);
  box-shadow: 0 12px 24px rgba(121, 58, 27, 0.08);
}

.employee-name,
.profile-name {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.employee-side {
  display: grid;
  justify-items: end;
  gap: 8px;
}

.employee-badge,
.employee-status,
.profile-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
}

.employee-badge {
  background: rgba(93, 77, 68, 0.08);
  color: var(--oa-text-secondary);
}

.employee-status,
.profile-tag {
  background: rgba(96, 139, 104, 0.14);
  color: #4b6c52;
}

.profile-card,
.detail-grid {
  padding: 18px;
}

.detail-grid,
.insight-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item,
.insight-card {
  padding: 16px;
}

.detail-key,
.insight-label {
  display: block;
  font-size: 12px;
  color: var(--oa-text-muted);
}

.detail-value,
.insight-value {
  display: block;
  margin-top: 8px;
  color: var(--oa-text-primary);
}

.insight-value {
  font-family: var(--oa-font-display);
  font-size: 30px;
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

.empty-block {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 250, 246, 0.76);
  border: 1px dashed rgba(162, 177, 196, 0.36);
  color: var(--oa-text-secondary);
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .employees-hero,
  .employees-shell,
  .detail-grid,
  .insight-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .employees-page {
    padding: 16px;
  }

  .hero-title {
    max-width: none;
  }

  .section-head,
  .employee-card,
  .profile-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .employee-side {
    justify-items: start;
  }
}
</style>
