<template>
  <div v-if="isDev" class="dev-toolbar">
    <!-- Collapsed: FAB button -->
    <button
      v-if="!expanded"
      class="dev-fab"
      @click="expanded = true"
    >
      🛠️ Dev
    </button>

    <!-- Expanded: Card panel -->
    <div v-else class="dev-panel">
      <div class="panel-header">
        <span class="panel-title">Dev Tools</span>
        <button class="close-btn" @click="expanded = false">×</button>
      </div>

      <div class="panel-content">
        <!-- Section 1: Setup -->
        <div class="dev-section">
          <div class="section-title">Setup</div>
          <div class="btn-group">
            <button
              class="dev-btn"
              :disabled="resetting"
              @click="resetSetup"
            >
              <span v-if="resetting">⏳</span> Reset Setup
            </button>
            <button
              class="dev-btn"
              :disabled="skipping"
              @click="skipSetup"
            >
              <span v-if="skipping">⏳</span> Skip Setup
            </button>
          </div>
        </div>

        <div class="divider" />

        <!-- Section 2: Quick Login -->
        <div class="dev-section">
          <div class="section-title">Quick Login</div>
          <div class="btn-group login-group">
            <button
              v-for="user in quickUsers"
              :key="user.username"
              class="dev-btn login-btn"
              :disabled="user.loading"
              @click="quickLogin(user)"
            >
              <span v-if="user.loading">⏳</span>
              {{ user.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error Toast -->
      <div v-if="errorMsg" class="error-toast" @click="errorMsg = ''">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Top-level DEV guard - component is tree-shaken in production
const isDev = import.meta.env.DEV

const expanded = ref(false)
const resetting = ref(false)
const skipping = ref(false)
const errorMsg = ref('')

interface QuickUser {
  username: string
  label: string
  loading: boolean
}

const quickUsers = ref<QuickUser[]>([
  { username: 'employee.demo', label: 'Employee', loading: false },
  { username: 'finance.demo', label: 'Finance', loading: false },
  { username: 'pm.demo', label: 'PM', loading: false },
  { username: 'ceo.demo', label: 'CEO', loading: false },
  { username: 'worker.demo', label: 'Worker', loading: false }
])

function showError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => {
    errorMsg.value = ''
  }, 3000)
}

async function resetSetup() {
  resetting.value = true
  try {
    const response = await fetch('/api/dev/reset-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    // Navigate to setup
    await navigateTo('/setup')
  } catch (error: any) {
    showError(error?.message || 'Reset setup failed')
  } finally {
    resetting.value = false
  }
}

async function skipSetup() {
  skipping.value = true
  try {
    // First reset
    const resetResponse = await fetch('/api/dev/reset-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!resetResponse.ok) {
      throw new Error(`Reset failed: HTTP ${resetResponse.status}`)
    }

    // Then init with preset data
    const initResponse = await fetch('/api/setup/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'Boyuan Construction',
        ceoEmployeeNo: 'ceo.demo',
        ceoPassword: '123456',
        recoveryCode: null
      })
    })

    if (!initResponse.ok) {
      throw new Error(`Init failed: HTTP ${initResponse.status}`)
    }

    // Navigate to login
    await navigateTo('/login')
  } catch (error: any) {
    showError(error?.message || 'Skip setup failed')
  } finally {
    skipping.value = false
  }
}

interface LoginResponse {
  token: string
  user?: any
}

async function quickLogin(user: QuickUser) {
  user.loading = true
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        password: '123456'
      })
    })

    if (!response.ok) {
      throw new Error(`Login failed: HTTP ${response.status}`)
    }

    const data: LoginResponse = await response.json()

    // Store token in localStorage
    localStorage.setItem('token', data.token)

    // Navigate to home
    await navigateTo('/')
  } catch (error: any) {
    showError(error?.message || `${user.label} login failed`)
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* FAB Button */
.dev-fab {
  background: rgba(30, 41, 59, 0.95);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.dev-fab:hover {
  background: rgba(51, 65, 85, 0.95);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.dev-fab:active {
  transform: translateY(0);
}

/* Panel */
.dev-panel {
  width: 240px;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #f1f5f9;
}

.close-btn {
  background: transparent;
  color: #94a3b8;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #f1f5f9;
}

.panel-content {
  padding: 12px;
}

/* Section */
.dev-section {
  margin-bottom: 12px;
}

.dev-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 8px;
}

/* Buttons */
.btn-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.login-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.dev-btn {
  background: rgba(51, 65, 85, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.dev-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.9);
  border-color: rgba(255, 255, 255, 0.2);
}

.dev-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.dev-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  padding: 10px 8px;
}

/* Divider */
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

/* Error Toast */
.error-toast {
  position: absolute;
  bottom: 100%;
  right: 0;
  margin-bottom: 8px;
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  animation: slideIn 0.2s ease;
  backdrop-filter: blur(8px);
  max-width: 220px;
  word-wrap: break-word;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
