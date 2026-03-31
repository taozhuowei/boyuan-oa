<!-- 角色管理页面：CEO专属 -->
<template>
  <view class="page role-page">
    <!-- Hero -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="settings" :size="28" />
          <text class="hero-title">角色管理</text>
        </view>
        <text class="hero-subtitle">配置系统角色与权限</text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ roles.length }}</text>
          <text class="stat-label">角色数量</text>
        </view>
      </view>
    </view>

    <view class="role-container">
      <!-- 左侧角色列表 -->
      <view class="card list-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="list" :size="18" />
            <text class="card-title">角色列表</text>
          </view>
        </view>
        <view class="list-body">
          <view
            v-for="item in roles"
            :key="item.id"
            class="role-item"
            :class="{ active: selected?.id === item.id }"
            @click="selectRole(item)"
          >
            <view class="role-icon">
              <Icon :name="getRoleIcon(item.roleCode)" :size="20" />
            </view>
            <view class="role-info">
              <text class="role-name">{{ item.roleName }}</text>
              <text class="role-code">{{ item.roleCode }}</text>
            </view>
            <view v-if="item.isSystem" class="system-tag">系统</view>
          </view>
        </view>
      </view>

      <!-- 右侧详情/编辑 -->
      <view class="card detail-card">
        <view class="card-header">
          <view class="card-header-title">
            <Icon name="edit" :size="18" />
            <text class="card-title">{{ isEditing ? '编辑角色' : '角色详情' }}</text>
          </view>
        </view>
        <view v-if="selected" class="detail-body">
          <!-- 查看模式 -->
          <view v-if="!isEditing" class="view-mode">
            <view class="info-section">
              <view class="info-row">
                <text class="info-label">角色代码</text>
                <text class="info-value">{{ selected.roleCode }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">角色名称</text>
                <text class="info-value">{{ selected.roleName }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">描述</text>
                <text class="info-value">{{ selected.description }}</text>
              </view>
              <view class="info-row">
                <text class="info-label">系统角色</text>
                <Badge :variant="selected.isSystem ? 'success' : 'default'">
                  {{ selected.isSystem ? '是' : '否' }}
                </Badge>
              </view>
            </view>

            <view class="permissions-section">
              <view class="section-title">
                <Icon name="lock" :size="14" />
                <text>权限列表</text>
              </view>
              <view class="permissions-list">
                <view v-for="perm in selected.permissions" :key="perm" class="permission-tag">
                  {{ perm }}
                </view>
              </view>
            </view>

            <view v-if="!selected.isSystem" class="actions">
              <Button variant="primary" @click="startEdit">编辑角色</Button>
            </view>
          </view>

          <!-- 编辑模式 -->
          <view v-else class="edit-mode">
            <view class="form-field">
              <text class="field-label">角色名称</text>
              <input v-model="editForm.roleName" class="field-input" />
            </view>
            <view class="form-field">
              <text class="field-label">描述</text>
              <textarea v-model="editForm.description" class="field-textarea" />
            </view>
            <view class="form-field">
              <text class="field-label">权限配置</text>
              <view class="permissions-checkboxes">
                <view v-for="perm in allPermissions" :key="perm" class="checkbox-item">
                  <checkbox :checked="editForm.permissions.includes(perm)" @click="togglePermission(perm)" />
                  <text>{{ perm }}</text>
                </view>
              </view>
            </view>
            <view class="form-actions">
              <Button variant="ghost" @click="cancelEdit">取消</Button>
              <Button variant="primary" @click="saveRole">保存</Button>
            </view>
          </view>
        </view>
        <Empty v-else text="请选择左侧角色查看详情" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Icon, Button, Badge, Empty } from '../../components/ui'

// 系统预设角色
const roles = ref([
  {
    id: 1,
    roleCode: 'employee',
    roleName: '员工',
    description: '普通员工，可提交请假、加班申请，查看并确认自己的工资条',
    isSystem: true,
    permissions: ['考勤系统', '薪酬系统-查看']
  },
  {
    id: 2,
    roleCode: 'worker',
    roleName: '劳工',
    description: '现场施工人员，可提交施工日志、工伤申报，查看工资条',
    isSystem: true,
    permissions: ['考勤系统', '施工日志系统', '薪酬系统-查看']
  },
  {
    id: 3,
    roleCode: 'finance',
    roleName: '财务',
    description: '财务人员，可管理薪资周期，查看全部工资条',
    isSystem: true,
    permissions: ['考勤系统', '薪酬系统-管理', '员工管理']
  },
  {
    id: 4,
    roleCode: 'project_manager',
    roleName: '项目经理',
    description: '项目负责人，可审批考勤和施工日志，查看项目信息',
    isSystem: true,
    permissions: ['考勤系统', '施工日志系统', '项目管理']
  },
  {
    id: 5,
    roleCode: 'ceo',
    roleName: '首席经营者',
    description: '最高管理者，拥有所有权限，可配置角色',
    isSystem: true,
    permissions: ['考勤系统', '施工日志系统', '薪酬系统-管理', '员工管理', '项目管理', '角色管理']
  }
])

const selected = ref<any>(null)
const isEditing = ref(false)

const allPermissions = [
  '考勤系统',
  '施工日志系统',
  '薪酬系统-查看',
  '薪酬系统-管理',
  '员工管理',
  '项目管理',
  '角色管理'
]

const editForm = reactive({
  roleName: '',
  description: '',
  permissions: [] as string[]
})

const getRoleIcon = (code: string) => {
  const icons: Record<string, string> = {
    employee: 'person',
    worker: 'construction',
    finance: 'attach-money',
    project_manager: 'business',
    ceo: 'settings'
  }
  return icons[code] || 'person'
}

const selectRole = (role: any) => {
  selected.value = role
  isEditing.value = false
}

const startEdit = () => {
  editForm.roleName = selected.value.roleName
  editForm.description = selected.value.description
  editForm.permissions = [...selected.value.permissions]
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
}

const togglePermission = (perm: string) => {
  const idx = editForm.permissions.indexOf(perm)
  if (idx > -1) {
    editForm.permissions.splice(idx, 1)
  } else {
    editForm.permissions.push(perm)
  }
}

const saveRole = () => {
  selected.value.roleName = editForm.roleName
  selected.value.description = editForm.description
  selected.value.permissions = [...editForm.permissions]
  isEditing.value = false
  uni.showToast({ title: '保存成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.role-page {
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

.role-container {
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

.role-item {
  display: flex;
  align-items: center;
  gap: 12px;
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

.role-icon {
  width: 40px;
  height: 40px;
  background: var(--primary-color);
  color: #fff;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.role-name {
  font-weight: 500;
  font-size: 14px;
}

.role-code {
  font-size: 12px;
  color: var(--text-secondary);
}

.system-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--primary-light);
  color: var(--primary-color);
  border-radius: 4px;
}

.detail-body {
  padding: 24px;
}

.info-section {
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 500;
}

.permissions-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.form-field {
  margin-bottom: 20px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.field-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: 14px;
}

.field-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  font-size: 14px;
}

.permissions-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color);
}
</style>
