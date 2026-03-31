<template>
  <view class="page">
    <view class="header">
      <view class="header-left">
        <text class="header-title">角色管理</text>
        <text class="header-sub">配置系统角色与权限</text>
      </view>
      <button class="btn-text" @click="goBack">返回</button>
    </view>

    <view class="main">
      <!-- 角色列表 -->
      <view class="card">
        <view class="card-header">
          <text class="card-title">角色列表</text>
          <button class="btn-primary" @click="showAdd = true">新增角色</button>
        </view>

        <view v-if="roles.length" class="role-list">
          <view v-for="role in roles" :key="role.id" class="role-item">
            <view class="role-info">
              <text class="role-name">{{ role.roleName }}</text>
              <text class="role-code">{{ role.roleCode }}</text>
            </view>
            <view class="role-actions">
              <button class="btn-icon" @click="edit(role)">
                <Icon name="edit" :size="18" />
              </button>
              <button v-if="!role.isSystem" class="btn-icon danger" @click="remove(role.id)">
                <Icon name="delete" :size="18" />
              </button>
            </view>
          </view>
        </view>
        <text v-else class="empty">暂无角色</text>
      </view>
    </view>

    <!-- 新增/编辑弹窗 -->
    <view v-if="showAdd || editingRole" class="modal">
      <view class="modal-mask" @click="closeModal" />
      <view class="modal-content card">
        <text class="modal-title">{{ editingRole ? '编辑角色' : '新增角色' }}</text>
        
        <view class="field">
          <text class="field-label">角色编码 *</text>
          <input v-model="form.roleCode" class="field-input" placeholder="如：manager" :disabled="!!editingRole" />
        </view>

        <view class="field">
          <text class="field-label">角色名称 *</text>
          <input v-model="form.roleName" class="field-input" placeholder="如：项目经理" />
        </view>

        <view class="field">
          <text class="field-label">描述</text>
          <textarea v-model="form.description" class="field-textarea" placeholder="角色职责描述" />
        </view>

        <view class="modal-actions">
          <button class="btn-secondary" @click="closeModal">取消</button>
          <button class="btn-primary" @click="save">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Icon } from '../../components/ui'
import { fetchRoles, saveRole } from '../../utils/access'
import { useUserStore } from '../../stores'

const userStore = useUserStore()
const roles = ref<any[]>([])
const showAdd = ref(false)
const editingRole = ref<any>(null)

const form = reactive({
  id: undefined as number | undefined,
  roleCode: '',
  roleName: '',
  description: '',
  status: 1,
  permissions: [] as string[]
})

const loadRoles = async () => {
  roles.value = await fetchRoles(userStore.token)
}

const edit = (role: any) => {
  editingRole.value = role
  form.id = role.id
  form.roleCode = role.roleCode
  form.roleName = role.roleName
  form.description = role.description
  form.status = role.status
  form.permissions = [...role.permissions]
}

const closeModal = () => {
  showAdd.value = false
  editingRole.value = null
  form.id = undefined
  form.roleCode = ''
  form.roleName = ''
  form.description = ''
  form.permissions = []
}

const save = async () => {
  if (!form.roleCode || !form.roleName) {
    uni.showToast({ title: '请填写完整', icon: 'none' })
    return
  }
  await saveRole({ ...form }, userStore.token)
  await loadRoles()
  closeModal()
  uni.showToast({ title: '保存成功', icon: 'success' })
}

const remove = async (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复',
    success: async (res) => {
      if (res.confirm) {
        roles.value = roles.value.filter(r => r.id !== id)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

const goBack = () => uni.navigateBack()

onMounted(loadRoles)
</script>

<style lang="scss" scoped>
.page { padding: 16px; }

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left { display: flex; flex-direction: column; gap: 4px; }

.header-title {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--on-surface);
}

.header-sub { font-size: 13px; color: var(--on-surface-variant); }

.btn-text { font-size: 14px; color: var(--primary); padding: 8px 12px; }

.main { max-width: 800px; }

.card {
  background: var(--surface-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title { font-family: var(--font-display); font-size: 16px; font-weight: 700; }

.btn-primary {
  height: 36px;
  padding: 0 16px;
  background: var(--primary);
  color: var(--on-primary);
  border-radius: var(--radius-md);
  font-size: 13px;
}

.btn-secondary {
  height: 40px;
  padding: 0 20px;
  background: var(--surface-low);
  color: var(--on-surface);
  border-radius: var(--radius-md);
  font-size: 14px;
}

.role-list { display: flex; flex-direction: column; gap: 8px; }

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border-radius: var(--radius-md);
  background: var(--surface-low);
}

.role-info { display: flex; flex-direction: column; gap: 2px; }

.role-name { font-size: 15px; font-weight: 600; color: var(--on-surface); }

.role-code { font-size: 12px; color: var(--on-surface-variant); }

.role-actions { display: flex; gap: 8px; }

.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  background: var(--surface-high);
  color: var(--on-surface-variant);
}

.btn-icon.danger { color: var(--error); }

.empty { text-align: center; color: var(--on-surface-variant); padding: 40px; }

.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 20px;
}

.field { margin-bottom: 16px; }

.field-label { font-size: 13px; color: var(--on-surface-variant); margin-bottom: 6px; display: block; }

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  background: var(--surface-low);
}

.field-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  background: var(--surface-low);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}
</style>
