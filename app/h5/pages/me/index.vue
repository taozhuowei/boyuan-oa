<template>
  <!-- Personal profile page -->
  <div class="profile-page">
    <h2 class="page-title">My Profile</h2>

    <a-card>
      <a-spin :spinning="loading">
        <!-- Warning alert for default password -->
        <a-alert
          v-if="userInfo?.isDefaultPassword"
          type="warning"
          show-icon
          :message="'Your password is the default (123456). Please change it immediately.'"
          class="password-alert"
        >
          <template #action>
            <a-button type="primary" size="small" @click="navigateTo('/me/password')">
              Change Now
            </a-button>
          </template>
        </a-alert>

        <a-descriptions bordered :column="1">
          <a-descriptions-item label="Name">
            {{ userInfo?.name }}
          </a-descriptions-item>
          <a-descriptions-item label="Employee No">
            {{ userInfo?.employeeNo }}
          </a-descriptions-item>
          <a-descriptions-item label="Phone">
            {{ userInfo?.phone ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Role">
            {{ userInfo?.roleName }}
          </a-descriptions-item>
          <a-descriptions-item label="Department">
            {{ userInfo?.departmentName ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="Employee Type">
            {{ formatEmployeeType(userInfo?.employeeType) }}
          </a-descriptions-item>
          <a-descriptions-item label="Account Status">
            Active
          </a-descriptions-item>
        </a-descriptions>

        <div class="actions">
          <a-button type="primary" @click="navigateTo('/me/password')">
            Change Password
          </a-button>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '~/utils/http'

interface UserInfo {
  employeeId: number
  employeeNo: string
  name: string
  phone: string | null
  roleCode: string
  roleName: string
  departmentName: string | null
  employeeType: string
  isDefaultPassword: boolean
}

const loading = ref(false)
const userInfo = ref<UserInfo | null>(null)

function formatEmployeeType(type: string | undefined): string {
  if (type === 'OFFICE') return 'Office'
  if (type === 'LABOR') return 'Labor'
  return type ?? '-'
}

async function loadUserInfo() {
  loading.value = true
  try {
    const data = await request<UserInfo>({
      url: '/auth/me'
    })
    userInfo.value = data
  } catch {
    userInfo.value = null
  } finally {
    loading.value = false
  }
}

onMounted(loadUserInfo)
</script>

<style scoped>
.profile-page {
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

.password-alert {
  margin-bottom: 16px;
}

.actions {
  margin-top: 24px;
}
</style>
