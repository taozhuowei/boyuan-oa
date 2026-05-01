<template>
  <div v-if="isDev" class="dev-toolbar">
    <!-- Collapsed: FAB button -->
    <button v-if="!expanded" class="dev-fab" @click="expanded = true">🛠️ 调试</button>

    <!-- Expanded: Card panel -->
    <div v-else class="dev-panel">
      <div class="panel-header">
        <span class="panel-title">开发工具</span>
        <button class="close-btn" @click="expanded = false">×</button>
      </div>

      <div class="panel-content">
        <!-- Section: Setup -->
        <div class="dev-section">
          <div class="section-title">系统设置</div>
          <div class="btn-group">
            <button class="dev-btn" :disabled="resetting" @click="resetSetup">
              <span v-if="resetting">⏳</span>
              重置初始化
            </button>
            <button class="dev-btn" :disabled="skipping" @click="skipSetup">
              <span v-if="skipping">⏳</span>
              跳过初始化
            </button>
          </div>
        </div>

        <div class="divider" />

        <!-- Section: Test Data -->
        <div class="dev-section">
          <div class="section-title">测试数据</div>
          <div class="btn-group">
            <button class="dev-btn" :disabled="clearingRate" @click="clearRateLimit">
              <span v-if="clearingRate">⏳</span>
              清登录限流计数
            </button>
            <button class="dev-btn" :disabled="restoringEmp" @click="restoreEmployeeDemo">
              <span v-if="restoringEmp">⏳</span>
              恢复 employee.demo 首次登录
            </button>
          </div>
        </div>

        <!-- Passive verification code display: auto-populated when any "send code" response
             returns _devCode (captured by the onResponse hook in utils/http.ts). -->
        <div v-if="latestCode" class="code-display">
          <span class="code-label">最新验证码</span>
          <span class="code-value">{{ latestCode }}</span>
        </div>

        <div class="divider" />

        <!-- Section: Quick Login -->
        <div class="dev-section">
          <div class="section-title">快速登录</div>
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

      <!-- Flash / Error Toast -->
      <div v-if="flashMsg" class="error-toast" @click="flashMsg = ''">
        {{ flashMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * DevToolbar — dev-only floating debug panel (tree-shaken in production via isDev guard).
 * Verification codes are captured passively via the onResponse hook in utils/http.ts;
 * no active polling or manual query is needed.
 */
import { ref } from 'vue'
import { loginWithAccount } from '~/utils/access'
import { useUserStore } from '~/stores/user'

const isDev = import.meta.env.DEV

const expanded = ref(false)
const resetting = ref(false)
const skipping = ref(false)
const clearingRate = ref(false)
const restoringEmp = ref(false)
const flashMsg = ref('')

// Populated automatically by utils/http.ts onResponse hook when any "send code" API call
// returns a _devCode field (dev profile only).
const latestCode = useState<string>('dev-latest-code', () => '')

interface QuickUser {
  username: string
  label: string
  loading: boolean
}

const quickUsers = ref<QuickUser[]>([
  { username: 'employee.demo', label: '员工', loading: false },
  { username: 'finance.demo', label: '财务', loading: false },
  { username: 'hr.demo', label: '人事', loading: false },
  { username: 'pm.demo', label: '项目经理', loading: false },
  { username: 'ceo.demo', label: 'CEO', loading: false },
  { username: 'worker.demo', label: '劳工', loading: false },
])

function showFlash(msg: string) {
  flashMsg.value = msg
  setTimeout(() => {
    flashMsg.value = ''
  }, 1500)
}

function showError(msg: string) {
  flashMsg.value = msg
  setTimeout(() => {
    flashMsg.value = ''
  }, 3000)
}

async function resetSetup() {
  resetting.value = true
  try {
    const response = await fetch('/api/dev/reset-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    localStorage.clear()
    sessionStorage.clear()
    await navigateTo('/setup')
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '重置失败')
  } finally {
    resetting.value = false
  }
}

async function skipSetup() {
  skipping.value = true
  try {
    const response = await fetch('/api/dev/skip-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    window.location.href = '/'
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '跳过失败')
  } finally {
    skipping.value = false
  }
}

async function clearRateLimit() {
  clearingRate.value = true
  try {
    const resp = await fetch('/api/dev/reset-rate-limit', { method: 'POST' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    showFlash('限流计数已清零')
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '清限流失败')
  } finally {
    clearingRate.value = false
  }
}

async function restoreEmployeeDemo() {
  restoringEmp.value = true
  try {
    const ceoResp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ceo.demo', password: '123456' }),
    })
    if (!ceoResp.ok) throw new Error('CEO 登录失败，请确保 ceo.demo 密码仍为 123456')
    const { token } = (await ceoResp.json()) as { token: string }
    const restoreResp = await fetch('/api/dev/restore-employee-demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
    })
    if (!restoreResp.ok) throw new Error(`HTTP ${restoreResp.status}`)
    showFlash('employee.demo 已恢复首次登录')
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '恢复失败')
  } finally {
    restoringEmp.value = false
  }
}

async function quickLogin(user: QuickUser) {
  user.loading = true
  try {
    const result = await loginWithAccount({ identifier: user.username, password: '123456' })
    const store = useUserStore()
    store.setSession(result.token, result.user)
    await navigateTo('/')
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || user.label + ' 登录失败')
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

.dev-fab {
  background: rgba(30, 41, 59, 0.65);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.dev-fab:hover {
  background: rgba(51, 65, 85, 0.75);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.dev-fab:active {
  transform: translateY(0);
}

.dev-panel {
  width: 240px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(16px);
  overflow: hidden;
}

.panel-content {
  overflow-y: auto;
  padding: 12px;
}
.panel-content::-webkit-scrollbar {
  width: 6px;
}
.panel-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
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
  background: rgba(51, 65, 85, 0.55);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
}

.dev-btn:hover:not(:disabled) {
  background: rgba(71, 85, 105, 0.7);
  border-color: rgba(255, 255, 255, 0.15);
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

/* Passive code display — appears after any "send code" action */
.code-display {
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  padding: 10px 12px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.code-label {
  font-size: 10px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.code-value {
  font-family: 'SF Mono', Consolas, Menlo, monospace;
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
  letter-spacing: 2px;
  user-select: all;
}

.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 12px 0;
}

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
