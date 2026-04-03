<template>
  <AppShell title="角色管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">角色管理</text>
          <text class="page-desc">配置角色及其权限</text>
        </view>
        <view class="header-stats">
          <view class="stat-item">
            <text class="stat-value">{{ roleList.length }}</text>
            <text class="stat-label">角色数量</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Button"
            v-if="Button && isCEO"
            type="primary"
            @click="showCreateModal = true"
          >
            新建角色
          </component>
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="main-content">
        <!-- 左栏：角色列表 -->
        <view class="left-panel content-card">
          <view class="card-header">
            <text class="card-title">角色列表</text>
          </view>
          <view class="card-body scrollable">
            <view class="role-list">
              <view
                v-for="role in roleList"
                :key="role.roleCode"
                class="role-item"
                :class="{ active: selectedRole?.roleCode === role.roleCode }"
                @click="selectRole(role)"
              >
                <view class="role-info">
                  <text class="role-name">{{ role.roleName }}</text>
                  <text class="role-code">{{ role.roleCode }}</text>
                </view>
                <view 
                  class="priority-dot"
                  :class="getRoleLevel(role.roleCode)"
                />
              </view>
            </view>
          </view>
        </view>

        <!-- 右栏：权限配置 -->
        <view class="right-panel content-card">
          <template v-if="selectedRole">
            <view class="card-header">
              <text class="card-title">{{ selectedRole.roleName }} - 权限配置</text>
              <component
                :is="Button"
                v-if="Button && isCEO"
                type="primary"
                size="small"
                @click="savePermissions"
              >
                保存权限
              </component>
            </view>
            <view class="card-body scrollable">
              <view class="role-detail">
                <view class="detail-section">
                  <text class="section-title">角色描述</text>
                  <text class="role-desc">{{ selectedRole.description }}</text>
                </view>
                <view class="detail-section">
                  <text class="section-title">权限列表</text>
                  <view class="perm-list">
                    <view 
                      v-for="perm in selectedRole.permissions" 
                      :key="perm"
                      class="perm-tag"
                    >
                      {{ perm }}
                    </view>
                  </view>
                </view>
                <view class="detail-section">
                  <text class="section-title">可配置权限</text>
                  <view class="perm-options">
                    <view
                      v-for="perm in allPermissions"
                      :key="perm"
                      class="perm-option"
                      :class="{ checked: selectedRole.permissions.includes(perm) }"
                      @click="togglePermission(perm)"
                    >
                      <view class="perm-checkbox">
                        <view v-if="selectedRole.permissions.includes(perm)" class="perm-check" />
                      </view>
                      <text class="perm-label">{{ perm }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </template>
          <template v-else>
            <view class="card-header">
              <text class="card-title">权限配置</text>
            </view>
            <view class="card-body">
              <view class="empty-state">
                <text>请选择角色查看权限详情</text>
              </view>
            </view>
          </template>
        </view>
      </view>

    </view>

    <!-- 创建角色弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="showCreateModal"
      title="新建角色"
      width="500px"
    >
      <view class="form-content">
        <view class="form-item">
          <label>角色名称 <text class="required">*</text></label>
          <component :is="Input" v-if="Input" v-model="newRole.roleName" placeholder="请输入角色名称" />
        </view>
        <view class="form-item">
          <label>角色代码 <text class="required">*</text></label>
          <component :is="Input" v-if="Input" v-model="newRole.roleCode" placeholder="请输入角色代码" />
        </view>
        <view class="form-item">
          <label>角色描述</label>
          <component
            :is="Input"
            v-if="Input"
            v-model="newRole.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="showCreateModal = false">取消</component>
        <component :is="Button" v-if="Button" type="primary" @click="createRole">创建</component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const { Row, Col, Card, Tag, Button, Input, Modal } = useComponent(['Row', 'Col', 'Card', 'Tag', 'Button', 'Input', 'Modal'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')

// 状态
const selectedRole = ref<any>(null)
const showCreateModal = ref(false)

const newRole = ref({
  roleCode: '',
  roleName: '',
  description: '',
  permissions: []
})

// 所有可用权限
const allPermissions = [
  '查看本人信息',
  '查看全员信息',
  '发起请假',
  '发起加班',
  '工资条确认与异议',
  '工资结算',
  '通讯录导入',
  '导出数据',
  '项目初审',
  '项目总览',
  '日志模板维护',
  '终审审批',
  '角色与权限配置',
  '数据有效期配置',
  '经营总览'
]

const roleList = ref([
  {
    roleCode: 'employee',
    roleName: '员工',
    description: '发起和查看本人业务单据，查看并确认工资条',
    permissions: ['查看本人信息', '发起请假', '发起加班', '工资条确认与异议']
  },
  {
    roleCode: 'worker',
    roleName: '劳工',
    description: '处理施工日志、工伤补偿和个人工资确认事项',
    permissions: ['施工日志', '工伤补偿', '发起请假', '工资条确认与异议']
  },
  {
    roleCode: 'finance',
    roleName: '财务',
    description: '维护人员与薪资配置，执行结算、复核异议、导出数据',
    permissions: ['查看全员信息', '工资结算', '通讯录导入', '导出数据']
  },
  {
    roleCode: 'project_manager',
    roleName: '项目经理',
    description: '处理项目范围内审批，维护日志模板，查看项目总览',
    permissions: ['项目初审', '项目总览', '日志模板维护']
  },
  {
    roleCode: 'ceo',
    roleName: '首席经营者',
    description: '管理全局配置、终审审批、配置角色权限、查看经营总览',
    permissions: ['终审审批', '角色与权限配置', '数据有效期配置', '经营总览']
  }
])

const getRoleLevel = (roleCode: string) => {
  const map: Record<string, string> = {
    'ceo': 'high',
    'project_manager': 'mid',
    'finance': 'mid',
    'employee': 'low',
    'worker': 'low'
  }
  return map[roleCode] || 'low'
}

const selectRole = (role: any) => {
  selectedRole.value = role
}

const togglePermission = (perm: string) => {
  if (!selectedRole.value) return
  if (!isCEO.value) {
    uni.showToast({ title: '无权限编辑', icon: 'none' })
    return
  }
  
  const idx = selectedRole.value.permissions.indexOf(perm)
  if (idx > -1) {
    selectedRole.value.permissions.splice(idx, 1)
  } else {
    selectedRole.value.permissions.push(perm)
  }
}

const savePermissions = () => {
  uni.showToast({ title: '保存成功', icon: 'success' })
}

const createRole = () => {
  if (!newRole.value.roleCode || !newRole.value.roleName) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }
  
  roleList.value.push({
    ...newRole.value,
    permissions: []
  })
  
  showCreateModal.value = false
  newRole.value = { roleCode: '', roleName: '', description: '', permissions: [] }
  uni.showToast({ title: '创建成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }

  .page-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-top: 2px;
    display: block;
  }

  .header-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      text-align: right;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary);
        display: block;
        font-family: var(--font-display, 'Manrope');
      }

      .stat-label {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.left-panel {
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-card {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-high);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-surface);
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;

    &.scrollable {
      overflow-y: auto;
      padding: 16px 20px;
    }
  }
}

// 优先级圆点
.priority-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &.high { background: var(--error); }
  &.mid { background: var(--warning); }
  &.low { background: var(--success); }
}

// 角色列表
.role-list {
  .role-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--surface);
    cursor: pointer;
    transition: background 0.15s;
    border-radius: var(--radius-md);

    &:hover {
      background: var(--surface-low);
    }

    &.active {
      background: rgba(0,52,102,0.06);
      border: 1px solid rgba(0,52,102,0.15);
    }

    &:last-child {
      border-bottom: none;
    }

    .role-info {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .role-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--on-surface);
      }

      .role-code {
        font-size: 11px;
        color: var(--on-surface-variant);
        text-transform: uppercase;
      }
    }
  }
}

// 角色详情
.role-detail {
  .detail-section {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--on-surface);
      margin-bottom: 12px;
      display: block;
    }
  }

  .role-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    line-height: 1.6;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: var(--radius-md);
  }

  .perm-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .perm-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    background: rgba(0,52,102,0.08);
    color: var(--primary);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .perm-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;

    .perm-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: var(--surface);
      }

      &.checked {
        background: rgba(0,52,102,0.06);
      }

      .perm-checkbox {
        width: 16px;
        height: 16px;
        border: 2px solid var(--surface-high);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;

        .perm-check {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 1px;
        }
      }

      .perm-label {
        font-size: 13px;
        color: var(--on-surface);
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--on-surface-variant);
  font-size: 13px;
}

// 表单样式
.form-content {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 16px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--on-surface-variant);

    .required {
      color: var(--error);
    }
  }
}
</style>
