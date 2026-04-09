<template>
  <div v-if="isDev" class="dev-toolbar">
    <!-- Collapsed: FAB button -->
    <a-button
      v-if="!expanded"
      type="primary"
      shape="circle"
      size="large"
      class="dev-fab"
      @click="expanded = true"
    >
      DEV
    </a-button>

    <!-- Expanded: Card panel -->
    <a-card v-else class="dev-panel" size="small">
      <template #title>
        <span>开发工具</span>
        <a-button type="text" size="small" @click="expanded = false">×</a-button>
      </template>

      <a-space direction="vertical" style="width: 100%">
        <!-- Section 1: Wizard Management -->
        <div class="dev-section">
          <div class="section-title">向导管理</div>
          <a-space direction="vertical" style="width: 100%">
            <a-popconfirm
              title="确定要重置向导吗？"
              @confirm="resetSetup"
            >
              <a-button size="small" block :loading="resetting">
                重置向导
              </a-button>
            </a-popconfirm>
            <a-button size="small" block :loading="skipping" @click="skipSetup">
              跳过向导
            </a-button>
          </a-space>
        </div>

        <a-divider style="margin: 8px 0" />

        <!-- Section 2: Quick Login -->
        <div class="dev-section">
          <div class="section-title">快捷登录</div>
          <a-space wrap>
            <a-button
              v-for="user in quickUsers"
              :key="user.username"
              size="small"
              :loading="user.loading"
              @click="quickLogin(user)"
            >
              {{ user.label }}
            </a-button>
          </a-space>
        </div>
      </a-space>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'

const isDev = computed(() => import.meta.env.DEV)
const expanded = ref(false)
const resetting = ref(false)
const skipping = ref(false)

interface QuickUser {
  username: string
  label: string
  loading: boolean
}

const quickUsers = ref<QuickUser[]>([
  { username: 'employee.demo', label: '员工', loading: false },
  { username: 'finance.demo', label: '财务', loading: false },
  { username: 'pm.demo', label: '项目经理', loading: false },
  { username: 'ceo.demo', label: 'CEO', loading: false },
  { username: 'worker.demo', label: '施工队', loading: false }
])

async function resetSetup() {
  resetting.value = true
  try {
    await $fetch('http://localhost:8080/api/dev/reset-setup', {
      method: 'POST'
    })
    // Clear cookies and sessionStorage
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=')
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
    sessionStorage.clear()
    navigateTo('/setup')
  } catch (error: any) {
    if (error?.response?.status === 404) {
      message.error('仅开发环境可用')
    } else {
      message.error('重置失败')
    }
  } finally {
    resetting.value = false
  }
}

async function skipSetup() {
  skipping.value = true
  try {
    // First reset
    await $fetch('http://localhost:8080/api/dev/reset-setup', {
      method: 'POST'
    })
    // Then init with test data
    await $fetch('http://localhost:8080/api/setup/init', {
      method: 'POST',
      body: {
        ceoName: '测试CEO',
        ceoPhone: '13800000001',
        ceoPassword: 'password123',
        hrName: '测试HR',
        hrPhone: '13800000002'
      }
    })
    navigateTo('/login')
  } catch (error: any) {
    if (error?.response?.status === 404) {
      message.error('仅开发环境可用')
    } else {
      message.error('跳过向导失败')
    }
  } finally {
    skipping.value = false
  }
}

interface LoginResponse {
  token: string
  user: string
}

async function quickLogin(user: QuickUser) {
  user.loading = true
  try {
    const data = await $fetch<LoginResponse>('http://localhost:8080/api/auth/login', {
      method: 'POST',
      body: {
        username: user.username,
        password: '123456'
      }
    })
    useCookie('oa-token').value = data.token
    useCookie('oa-user').value = data.user
    navigateTo('/')
  } catch {
    message.error(`${user.label} 登录失败`)
  } finally {
    user.loading = false
  }
}
</script>

<style scoped>
.dev-toolbar {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
}

.dev-fab {
  font-weight: bold;
}

.dev-panel {
  width: 240px;
}

.dev-panel :deep(.ant-card-head) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dev-panel :deep(.ant-card-head-title) {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dev-section {
  width: 100%;
}

.section-title {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}
</style>
