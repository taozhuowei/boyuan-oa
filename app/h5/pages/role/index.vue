<template>
  <div class="roles-page">
    <h2 class="page-title">角色管理</h2>

    <a-card>
      <!-- Top actions bar -->
      <div class="search-bar">
        <div />
        <a-button v-if="isCEO" type="primary" @click="openCreateModal">
          新增角色
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="roles"
        :loading="loading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isSystem'">
            <a-tag :color="record.isSystem ? 'blue' : 'default'">
              {{ record.isSystem ? '系统' : '自定义' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <template v-if="isCEO && !record.isSystem">
              <a-button type="link" size="small" :data-catch="'role-row-edit-btn-' + record.roleCode" @click="openEditModal(record as Role)">
                编辑
              </a-button>
              <a-popconfirm
                title="确定删除该角色吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" size="small" danger :data-catch="'role-row-delete-btn-' + record.roleCode">
                  删除
                </a-button>
              </a-popconfirm>
            </template>
            <template v-else>
              -
            </template>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditMode ? '编辑角色' : '新增角色'"
      ok-text="保存"
      @ok="handleModalOk"
      @cancel="closeModal"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item label="角色编码" name="roleCode">
          <a-input
            v-model:value="formState.roleCode"
            placeholder="请输入角色编码"
            :disabled="isEditMode"
          />
        </a-form-item>
        <a-form-item label="角色名称" name="roleName">
          <a-input
            v-model:value="formState.roleName"
            placeholder="请输入角色名称"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            placeholder="请输入描述"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="状态" name="status">
          <a-select v-model:value="formState.status" :options="statusOptions" />
        </a-form-item>

        <a-divider style="margin: 8px 0;">权限矩阵（设计 §2.2 步骤 5）</a-divider>
        <table class="perm-matrix">
          <thead>
            <tr>
              <th>模块</th>
              <th v-for="lvl in PERMISSION_LEVELS" :key="lvl.code">{{ lvl.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mod in PERMISSION_MODULES" :key="mod.code">
              <td>{{ mod.label }}</td>
              <td v-for="lvl in PERMISSION_LEVELS" :key="lvl.code">
                <a-checkbox :checked="hasPermission(mod.code, lvl.code)" @change="(e: CheckboxChangeEvent) => togglePermission(mod.code, lvl.code, Boolean(e.target.checked))" />
              </td>
            </tr>
          </tbody>
        </table>
      </a-form>
      <template #footer>
        <a-button @click="closeModal">取消</a-button>
        <a-button type="primary" data-catch="role-modal-save-btn" @click="handleModalOk">保存</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { CheckboxChangeEvent } from 'ant-design-vue/es/checkbox/interface'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

interface Role {
  id: number
  roleCode: string
  roleName: string
  description: string
  status: number
  isSystem: boolean
  permissions: string[]
}

interface FormState {
  id?: number
  roleCode: string
  roleName: string
  description: string
  status: number
  permissions: string[]
}

const userStore = useUserStore()
const isCEO = computed(() => userStore.userInfo?.role === 'ceo')

// 设计 §2.2 步骤 5：4 级权限 × 6 大模块 = 24 个权限码
const PERMISSION_MODULES = [
  { code: 'HR',         label: '人员' },
  { code: 'PROJECT',    label: '项目' },
  { code: 'PAYROLL',    label: '薪资' },
  { code: 'ATTENDANCE', label: '考勤' },
  { code: 'EXPENSE',    label: '报销' },
  { code: 'INJURY',     label: '工伤' }
]
const PERMISSION_LEVELS = [
  { code: 'VIEW',    label: '查看' },
  { code: 'EDIT',    label: '修改' },
  { code: 'MANAGE',  label: '增删' },
  { code: 'APPROVE', label: '审批' }
]
function permCode(mod: string, lvl: string) { return `${mod}_${lvl}` }
function hasPermission(mod: string, lvl: string): boolean {
  return formState.permissions.includes(permCode(mod, lvl))
}
function togglePermission(mod: string, lvl: string, checked: boolean) {
  const code = permCode(mod, lvl)
  if (checked && !formState.permissions.includes(code)) {
    formState.permissions.push(code)
  } else if (!checked) {
    formState.permissions = formState.permissions.filter(p => p !== code)
  }
}

const loading = ref(false)
const roles = ref<Role[]>([])
const modalVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref()

const formState = reactive<FormState>({
  roleCode: '',
  roleName: '',
  description: '',
  status: 1,
  permissions: []
})

const statusOptions = [
  { value: 1, label: '启用' },
  { value: 0, label: '禁用' }
]

const columns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '类型', key: 'isSystem', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 120 }
]

const rules: Record<string, Rule[]> = {
  roleCode: [{ required: true, message: '角色编码不能为空', trigger: 'blur' }],
  roleName: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }]
}

async function loadRoles() {
  loading.value = true
  try {
    const data = await request<Role[]>({ url: '/roles' })
    roles.value = data ?? []
  } catch {
    roles.value = []
  } finally {
    loading.value = false
  }
}

function resetForm() {
  formState.id = undefined
  formState.roleCode = ''
  formState.roleName = ''
  formState.description = ''
  formState.status = 1
  formState.permissions = []
}

function openCreateModal() {
  isEditMode.value = false
  resetForm()
  modalVisible.value = true
}

function openEditModal(record: Role) {
  isEditMode.value = true
  formState.id = record.id
  formState.roleCode = record.roleCode
  formState.roleName = record.roleName
  formState.description = record.description
  formState.status = record.status
  formState.permissions = record.permissions ?? []
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  formRef.value?.resetFields()
}

async function handleModalOk() {
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const payload = {
    roleCode: formState.roleCode,
    roleName: formState.roleName,
    description: formState.description,
    status: formState.status,
    permissions: formState.permissions
  }

  try {
    if (isEditMode.value && formState.id) {
      await request({
        url: `/roles/${formState.id}`,
        method: 'PUT',
        body: payload
      })
      message.success('角色更新成功')
    } else {
      await request({
        url: '/roles',
        method: 'POST',
        body: payload
      })
      message.success('角色创建成功')
    }
    closeModal()
    await loadRoles()
  } catch (err: unknown) {
    // Error handling is done by the request utility, but we can show additional message if needed
  }
}

async function handleDelete(id: number) {
  try {
    await request({
      url: `/roles/${id}`,
      method: 'DELETE'
    })
    message.success('角色删除成功')
    await loadRoles()
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    const messageText = (err as { message?: string }).message
    if (status === 400) {
      message.error(messageText || '不能删除系统角色')
    }
  }
}

onMounted(loadRoles)
</script>

<style scoped>
.roles-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

/* Removed flex constraints to allow natural content flow */

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}

.perm-matrix {
  width: 100%;
  border-collapse: collapse;
}

.perm-matrix th,
.perm-matrix td {
  border: 1px solid #f0f0f0;
  padding: 6px 8px;
  text-align: center;
}

.perm-matrix th {
  background: #fafafa;
  font-weight: 500;
}

.perm-matrix td:first-child {
  font-weight: 500;
  background: #fafafa;
  text-align: left;
}
</style>
