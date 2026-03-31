<!--
 ************************************************************
 * 文件名称：app/frontend/src/pages/role/index.vue
 * 功能描述：角色管理页面
 *   - 查看系统角色列表
 *   - 首席经营者可编辑角色信息（名称、编码、职责说明、权限列表）
 *   - 非首席经营者仅可查看，不可修改
 * 数据来源：utils/access.ts中的fetchRoles/saveRole函数，本地存储作为fallback
 * 交互入口：从工作台模块入口进入，支持角色选择、编辑和保存
 ************************************************************
-->

<template>
  <view class="role-page oa-page">
    <view class="role-hero oa-surface-hero">
      <view>
        <text class="eyebrow">角色与权限</text>
        <text class="title">统一维护系统角色，保持职责边界与配置口径一致</text>
        <text class="subtitle">默认角色可查看。新增、编辑与保存仅对首席经营者开放，其他角色保持只读浏览。</text>
      </view>
      <view class="hero-side">
        <view class="hero-card">
          <text class="hero-label">当前权限</text>
          <text class="hero-value">{{ canEdit ? '可编辑角色' : '只读查看' }}</text>
          <text class="hero-note">角色变更会影响前端显隐与后端接口授权口径。</text>
        </view>
        <button class="back-btn" @click="goBack">返回工作台</button>
      </view>
    </view>

    <view class="role-shell">
      <view class="role-list oa-panel">
        <view class="section-head">
          <text class="section-title">角色列表</text>
          <text class="section-note">{{ roles.length }} 个角色</text>
        </view>

        <view
          v-for="role in roles"
          :key="role.id"
          class="role-item"
          :class="{ active: selectedRole?.id === role.id }"
          @click="selectRole(role)"
        >
          <view class="role-row">
            <text class="role-name">{{ role.roleName }}</text>
            <text class="role-tag">{{ role.isSystem ? '系统角色' : '自定义角色' }}</text>
          </view>
          <text class="role-desc">{{ role.description }}</text>
          <view class="permission-list">
            <text v-for="permission in role.permissions" :key="permission" class="permission-chip">
              {{ permission }}
            </text>
          </view>
        </view>
      </view>

      <view class="role-form oa-panel">
        <view class="section-head">
          <view>
            <text class="section-title">角色编辑</text>
            <text class="section-note-block">角色编码、名称、职责和权限保持一处配置。</text>
          </view>
          <text class="section-note">{{ canEdit ? '可提交保存' : '当前为只读' }}</text>
        </view>

        <view class="form-list">
          <view class="field-block">
            <text class="field-label">角色编码</text>
            <input v-model="form.roleCode" class="field-input" type="text" :disabled="!canEdit" />
          </view>
          <view class="field-block">
            <text class="field-label">角色名称</text>
            <input v-model="form.roleName" class="field-input" type="text" :disabled="!canEdit" />
          </view>
          <view class="field-block">
            <text class="field-label">职责说明</text>
            <textarea v-model="form.description" class="field-textarea" :disabled="!canEdit" />
          </view>
          <view class="field-block">
            <text class="field-label">权限列表</text>
            <textarea
              v-model="permissionsText"
              class="field-textarea"
              :disabled="!canEdit"
              placeholder="每行一个权限"
            />
          </view>
        </view>

        <view class="action-row">
          <button class="secondary-btn" @click="resetForm">新建角色</button>
          <button class="primary-btn" :disabled="!canEdit" @click="handleSave">保存角色</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
// Vue 组合式 API：响应式数据、生命周期、计算属性
import { computed, onMounted, reactive, ref } from 'vue'
// Pinia 用户状态管理 Store，用于获取当前用户角色与 Token
import { useUserStore } from '../../stores'
// 角色数据类型定义
import type { RoleItem } from '../../utils/access'
// 角色数据获取与持久化工具函数
import { fetchRoles, saveRole } from '../../utils/access'

// 用户状态管理实例，用于读取当前用户角色与登录 Token，以判断是否有编辑权限
const userStore = useUserStore()

/**
 * 角色列表数据
 * 职责：存储从API或本地获取的角色数据
 */
const roles = ref<RoleItem[]>([])

/**
 * 当前选中的角色
 * 职责：控制右侧表单显示内容，支持切换查看不同角色详情
 */
const selectedRole = ref<RoleItem | null>(null)

/**
 * 权限文本编辑值
 * 职责：将权限数组转换为多行文本便于编辑，保存时再转回数组
 */
const permissionsText = ref('')

/**
 * 角色表单数据
 * 职责：收集编辑中的角色信息，与表单输入双向绑定
 */
const form = reactive({
  // 角色唯一标识；undefined 代表当前处于新建模式
  id: undefined as number | undefined,
  // 角色编码，系统内部唯一标识字符串
  roleCode: '',
  // 角色名称，页面展示用
  roleName: '',
  // 职责说明，描述该角色的工作范围
  description: '',
  // 角色状态，1 表示启用
  status: 1
})

/**
 * 当前用户是否有编辑权限
 * 职责：根据用户角色判断是否可以编辑角色信息
 * 设计意图：仅首席经营者(ceo)拥有角色管理权限，实现RBAC控制
 */
const canEdit = computed(() => {
  // 获取当前用户角色编码，若未取到则兜底为空字符串
  const role = userStore.userInfo?.role ?? ''
  // 允许 ceo / executive 角色编码，或角色名称为"首席经营者"的用户进行编辑
  return role === 'ceo' || role === 'executive' || userStore.userInfo?.roleName === '首席经营者'
})

/**
 * 加载角色列表
 * 职责：从API获取角色数据，失败时使用本地缓存
 * 设计意图：确保页面始终有数据展示，自动选中第一个角色
 */
const loadRoles = async () => {
  // 携带用户 Token 从接口（或本地缓存）获取角色列表
  roles.value = await fetchRoles(userStore.token)

  // 若当前未选中任何角色且列表非空，默认选中第一项以填充右侧表单
  if (!selectedRole.value && roles.value.length > 0) {
    selectRole(roles.value[0])
  }
}

/**
 * 选择角色
 * 职责：切换当前编辑的角色，将角色数据同步到表单
 */
const selectRole = (role: RoleItem) => {
  // 记录当前选中的角色引用，用于左侧列表高亮显示
  selectedRole.value = role
  // 将选中角色的基础信息回填到编辑表单
  form.id = role.id
  form.roleCode = role.roleCode
  form.roleName = role.roleName
  form.description = role.description
  form.status = role.status
  // 将权限数组按换行符拼接为文本，便于在 textarea 中直观地逐行编辑
  permissionsText.value = role.permissions.join('\n')
}

/**
 * 重置表单
 * 职责：清空表单数据，用于新建角色
 */
const resetForm = () => {
  // 取消当前选中状态，进入新建角色模式
  selectedRole.value = null
  // 重置表单各字段为默认值
  form.id = undefined
  form.roleCode = ''
  form.roleName = ''
  form.description = ''
  form.status = 1
  // 清空权限编辑文本
  permissionsText.value = ''
}

/**
 * 保存角色
 * 职责：提交表单数据到后端，更新或创建角色
 * 设计意图：先尝试API调用，失败时回退到本地存储，确保演示可用性
 */
const handleSave = async () => {
  // 权限校验：无编辑权限时弹出提示并阻止保存
  if (!canEdit.value) {
    uni.showToast({
      title: '仅首席经营者可编辑角色',
      icon: 'none'
    })
    return
  }

  // 组装待保存角色数据：将 textarea 中的多行文本按换行符切分为权限数组
  const nextRole = await saveRole(
    {
      id: form.id,
      roleCode: form.roleCode,
      roleName: form.roleName,
      description: form.description,
      status: form.status,
      permissions: permissionsText.value.split('\n')
    },
    userStore.token
  )

  // 保存成功后重新加载角色列表，并定位到刚保存的角色项
  await loadRoles()
  selectRole(nextRole)

  // 弹出成功提示，给予用户操作反馈
  uni.showToast({
    title: '角色已保存',
    icon: 'success'
  })
}

/**
 * 返回工作台
 * 职责：导航回上一页
 */
const goBack = () => {
  // 在非 uni-app 环境（如普通浏览器直接运行）下防止调用异常
  if (typeof uni === 'undefined') {
    return
  }

  // 调用 uni-app 导航 API 返回上一页
  uni.navigateBack()
}

/**
 * 页面挂载生命周期钩子
 * 职责：组件挂载完成后立即加载角色列表，完成页面初始化
 */
onMounted(() => {
  // 发起角色列表数据请求
  loadRoles()
})
</script>

<style lang="scss" scoped>
.role-page {
  min-height: 100vh;
  padding: clamp(18px, 2vw, 28px);
}

.role-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
  gap: 18px;
  padding: clamp(22px, 3vw, 30px);
  margin-bottom: 18px;
}

.eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 247, 238, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.16);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 247, 234, 0.76);
}

.title {
  display: block;
  max-width: 12ch;
  margin-top: 12px;
  font-family: var(--oa-font-display);
  font-size: clamp(32px, 4vw, 48px);
  line-height: 1.04;
  color: var(--oa-text-inverse);
}

.subtitle {
  display: block;
  max-width: 54ch;
  margin-top: 12px;
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 250, 243, 0.86);
}

.hero-side {
  display: grid;
  align-content: space-between;
  gap: 14px;
}

.hero-card {
  padding: 18px;
  border-radius: var(--oa-radius-lg);
  background: rgba(255, 248, 240, 0.12);
  border: 1px solid rgba(255, 243, 229, 0.16);
}

.hero-label,
.hero-note {
  display: block;
}

.hero-label {
  font-size: 12px;
  color: rgba(255, 247, 234, 0.72);
}

.hero-value {
  display: block;
  margin: 8px 0;
  font-family: var(--oa-font-display);
  font-size: 22px;
  color: var(--oa-text-inverse);
}

.hero-note {
  font-size: 12px;
  line-height: 1.7;
  color: rgba(255, 250, 243, 0.82);
}

.back-btn {
  height: 44px;
  line-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  background: rgba(255, 248, 240, 0.14);
  color: var(--oa-text-inverse);
  border: 1px solid rgba(255, 243, 229, 0.16);
  font-size: 14px;
}

.role-shell {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: 18px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-title {
  font-family: var(--oa-font-display);
  font-size: 18px;
  color: var(--oa-text-primary);
}

.section-note,
.section-note-block {
  font-size: 12px;
  color: var(--oa-text-muted);
}

.section-note-block {
  display: block;
  margin-top: 6px;
  line-height: 1.7;
}

.role-list,
.role-form {
  min-height: 0;
}

.role-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--oa-border);
}

.role-item:last-child {
  border-bottom: none;
}

.role-item.active {
  background: var(--oa-accent-soft);
  margin: 0 -12px;
  padding: 14px 12px;
  border-radius: var(--oa-radius-md);
}

.role-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.role-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--oa-text-primary);
}

.role-tag {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(251, 242, 235, 0.9);
  color: var(--oa-accent-deep);
  font-size: 12px;
}

.role-desc {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--oa-text-secondary);
}

.permission-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.permission-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(248, 239, 232, 0.92);
  color: var(--oa-text-secondary);
  font-size: 12px;
}

.form-list {
  display: grid;
  gap: 14px;
}

.field-block {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  color: var(--oa-text-secondary);
}

.field-input,
.field-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--oa-radius-md);
  background: rgba(255, 248, 243, 0.88);
  border: 1px solid var(--oa-border-strong);
  color: var(--oa-text-primary);
  font-size: 14px;
}

.field-textarea {
  min-height: 108px;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

.secondary-btn,
.primary-btn {
  height: 44px;
  line-height: 44px;
  padding: 0 18px;
  border-radius: 999px;
  font-size: 14px;
}

.secondary-btn {
  background: rgba(255, 247, 240, 0.72);
  color: var(--oa-text-primary);
  border: 1px solid rgba(151, 167, 186, 0.24);
}

.primary-btn {
  background: var(--oa-gradient-action);
  color: var(--oa-text-inverse);
  box-shadow: var(--oa-shadow-accent);
}

@media (max-width: 960px) {
  .role-hero,
  .role-shell {
    grid-template-columns: 1fr;
  }

  .role-header,
  .section-head,
  .action-row {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .role-page {
    padding: 16px;
  }

  .title {
    max-width: none;
  }
}
</style>
