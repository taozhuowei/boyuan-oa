<template>
  <div class="roles-page">
    <h2 class="page-title">Role Management</h2>

    <a-card>
      <!-- Top actions bar -->
      <div class="search-bar">
        <div />
        <a-button v-if="isCEO" type="primary" @click="openCreateModal">
          Add Role
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
              {{ record.isSystem ? 'System' : 'Custom' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? 'Enabled' : 'Disabled' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <template v-if="isCEO && !record.isSystem">
              <a-button type="link" size="small" @click="openEditModal(record)">
                Edit
              </a-button>
              <a-popconfirm
                title="Are you sure you want to delete this role?"
                ok-text="Yes"
                cancel-text="No"
                @confirm="handleDelete(record.id)"
              >
                <a-button type="link" size="small" danger>
                  Delete
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
      :title="isEditMode ? 'Edit Role' : 'Add Role'"
      ok-text="Save"
      @ok="handleModalOk"
      @cancel="closeModal"
    >
      <a-form
        :model="formState"
        :rules="rules"
        ref="formRef"
        layout="vertical"
      >
        <a-form-item label="Role Code" name="roleCode">
          <a-input
            v-model:value="formState.roleCode"
            placeholder="Enter role code"
            :disabled="isEditMode"
          />
        </a-form-item>
        <a-form-item label="Role Name" name="roleName">
          <a-input
            v-model:value="formState.roleName"
            placeholder="Enter role name"
          />
        </a-form-item>
        <a-form-item label="Description" name="description">
          <a-textarea
            v-model:value="formState.description"
            placeholder="Enter description"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="Status" name="status">
          <a-select v-model:value="formState.status" :options="statusOptions" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
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
  { value: 1, label: 'Enabled' },
  { value: 0, label: 'Disabled' }
]

const columns = [
  { title: 'Role Name', dataIndex: 'roleName', key: 'roleName' },
  { title: 'Role Code', dataIndex: 'roleCode', key: 'roleCode' },
  { title: 'Description', dataIndex: 'description', key: 'description' },
  { title: 'Type', key: 'isSystem', width: 100 },
  { title: 'Status', key: 'status', width: 100 },
  { title: 'Action', key: 'action', width: 120 }
]

const rules = {
  roleCode: [{ required: true, message: 'Role code is required', trigger: 'blur' }],
  roleName: [{ required: true, message: 'Role name is required', trigger: 'blur' }]
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
      message.success('Role updated successfully')
    } else {
      await request({
        url: '/roles',
        method: 'POST',
        body: payload
      })
      message.success('Role created successfully')
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
    message.success('Role deleted successfully')
    await loadRoles()
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode
    const messageText = (err as { message?: string }).message
    if (status === 400) {
      message.error(messageText || 'Cannot delete system role')
    }
  }
}

onMounted(loadRoles)
</script>

<style scoped>
.roles-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px;
  color: #003466;
}

.search-bar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}
</style>
