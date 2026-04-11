<template>
  <!-- Personal profile page -->
  <div class="profile-page">
    <h2 class="page-title">个人信息</h2>

    <a-card>
      <a-spin :spinning="loading">
        <!-- Warning alert for default password -->
        <a-alert
          v-if="userInfo?.isDefaultPassword"
          type="warning"
          show-icon
          :message="'当前密码为初始密码（123456），请立即修改。'"
          class="password-alert"
        >
          <template #action>
            <a-button type="primary" size="small" @click="navigateTo('/me/password')">
              立即修改
            </a-button>
          </template>
        </a-alert>

        <a-descriptions bordered :column="1">
          <a-descriptions-item label="姓名">
            {{ userInfo?.name }}
          </a-descriptions-item>
          <a-descriptions-item label="工号">
            {{ userInfo?.employeeNo }}
          </a-descriptions-item>
          <a-descriptions-item label="手机号">
            {{ userInfo?.phone ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="角色">
            {{ userInfo?.roleName }}
          </a-descriptions-item>
          <a-descriptions-item label="部门">
            {{ userInfo?.departmentName ?? '-' }}
          </a-descriptions-item>
          <a-descriptions-item label="员工类型">
            {{ formatEmployeeType(userInfo?.employeeType) }}
          </a-descriptions-item>
          <a-descriptions-item label="账号状态">
            正常
          </a-descriptions-item>
        </a-descriptions>

        <div class="actions">
          <a-button type="primary" @click="navigateTo('/me/password')">
            修改密码
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
  if (type === 'OFFICE') return '正式员工'
  if (type === 'LABOR') return '劳工'
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
