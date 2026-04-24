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
        <!-- Section 1: Setup -->
        <div class="dev-section">
          <div class="section-title">系统设置</div>
          <div class="btn-group">
            <button class="dev-btn" :disabled="resetting" @click="resetSetup">
              <span v-if="resetting">⏳</span>
              重置初始化（测 CEO 恢复码）
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
            <button class="dev-btn" :disabled="resettingData" @click="resetData">
              <span v-if="resettingData">⏳</span>
              清业务数据（保留账号）
            </button>
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

        <div class="divider" />

        <!-- Section: Verification Code -->
        <div class="dev-section">
          <div class="section-title">一键填入账号邮箱（点一下复制到剪贴板 + 填入页面当前输入框 + 设为查码目标）</div>
          <div class="btn-group login-group">
            <button
              v-for="acc in accountEmails"
              :key="acc.employeeNo"
              class="dev-btn email-btn"
              :title="acc.email"
              @mousedown="rememberFocusThenPrevent"
              @click="fillAccountEmail(acc)"
            >
              {{ acc.label }}
            </button>
          </div>
          <input
            v-model="codeEmail"
            class="code-email-input"
            type="email"
            placeholder="上面点按钮会填这里；也可以手动粘贴"
          />
          <div v-if="latestCode" class="code-display">
            <span class="code-value">{{ latestCode }}</span>
            <span class="code-meta">{{ latestCodeMeta }}</span>
          </div>
          <div class="btn-group">
            <button
              class="dev-btn"
              :disabled="fetchingCode || !codeEmail"
              @click="fetchLatestCode('bind')"
            >
              <span v-if="fetchingCode">⏳</span>
              查 bind 码
            </button>
            <button
              class="dev-btn"
              :disabled="fetchingCode || !codeEmail"
              @click="fetchLatestCode('pwd')"
            >
              <span v-if="fetchingCode">⏳</span>
              查 pwd 码
            </button>
          </div>
        </div>

        <div class="divider" />

        <!-- Section 2: Quick Login -->
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

      <!-- Error Toast -->
      <div v-if="errorMsg" class="error-toast" @click="errorMsg = ''">
        {{ errorMsg }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { loginWithAccount } from '~/utils/access'
import { useUserStore } from '~/stores/user'

// Top-level DEV guard - component is tree-shaken in production
const isDev = import.meta.env.DEV

const expanded = ref(false)
const resetting = ref(false)
const skipping = ref(false)
const resettingData = ref(false)
const clearingRate = ref(false)
const restoringEmp = ref(false)
const fetchingCode = ref(false)
const latestCode = ref('')
const latestCodeMeta = ref('')
const errorMsg = ref('')

/**
 * 查询邮箱：从 localStorage 读取最近一次填入值，支持用户手动编辑。
 * 禁止硬编码个人邮箱到仓库。
 */
const STORAGE_KEY = 'dev-toolbar-code-email'
const codeEmail = ref(
  typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) ?? '' : '',
)
watch(codeEmail, (v) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, v)
})

/** 测试账号邮箱映射，页面加载时从 /api/dev/test-emails 拉取（dev profile 独有）。 */
interface AccountEmail {
  employeeNo: string
  label: string
  email: string
}
const ROLE_LABELS: Record<string, string> = {
  'ceo.demo': 'CEO',
  'hr.demo': 'HR',
  'finance.demo': '财务',
  'pm.demo': 'PM',
  'employee.demo': '员工',
  'worker.demo': '劳工',
  'dept_manager.demo': '部门经理',
  'sys_admin.demo': '系统管理',
}
const accountEmails = ref<AccountEmail[]>([])

async function loadAccountEmails() {
  try {
    const resp = await fetch('/api/dev/test-emails')
    if (!resp.ok) return
    const map = (await resp.json()) as Record<string, string>
    accountEmails.value = Object.entries(map)
      .filter(([k]) => ROLE_LABELS[k])
      .map(([employeeNo, email]) => ({ employeeNo, email, label: ROLE_LABELS[employeeNo] }))
      .sort(
        (a, b) =>
          Object.keys(ROLE_LABELS).indexOf(a.employeeNo) -
          Object.keys(ROLE_LABELS).indexOf(b.employeeNo),
      )
  } catch {
    /* endpoint 不存在（非 dev profile）时静默 */
  }
}
onMounted(() => {
  if (isDev) loadAccountEmails()
})

/** 保存点击按钮前页面上真正聚焦的输入框，防止按钮自身抢焦点导致填入目标丢失。 */
let rememberedInput: HTMLInputElement | HTMLTextAreaElement | null = null

function rememberFocusThenPrevent(e: MouseEvent) {
  const el = document.activeElement
  if (
    el &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') &&
    !(el as HTMLElement).classList.contains('code-email-input')
  ) {
    rememberedInput = el as HTMLInputElement | HTMLTextAreaElement
  } else {
    rememberedInput = null
  }
  // preventDefault 阻止按钮获取焦点；点击事件仍会触发
  e.preventDefault()
}

/**
 * 点按钮：(1) 设 codeEmail（查码目标），(2) 写 clipboard，(3) 若 mousedown 时记住了输入框则填入，
 * 并通过 input 事件通知 Vue 响应式更新。
 */
async function fillAccountEmail(acc: AccountEmail) {
  codeEmail.value = acc.email
  // 写 clipboard（兜底，用户可手动 Cmd/Ctrl+V 粘贴）
  try {
    await navigator.clipboard.writeText(acc.email)
  } catch {
    /* clipboard 权限未授予时静默 */
  }
  // 填入 mousedown 时记住的输入框（按钮自身 preventDefault 后不会抢焦点，但仍有些浏览器
  // 在 mousedown 时已经转移 activeElement；所以提前 remember）
  const target = rememberedInput
  rememberedInput = null
  if (target) {
    const proto = Object.getPrototypeOf(target)
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value')
    descriptor?.set?.call(target, acc.email)
    target.dispatchEvent(new Event('input', { bubbles: true }))
    target.dispatchEvent(new Event('change', { bubbles: true }))
    target.focus()
    showFlash(`已填入 ${acc.label} 邮箱 + 复制到剪贴板`)
  } else {
    showFlash(`${acc.label} 邮箱已复制到剪贴板；未检测到聚焦输入框`)
  }
}

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
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // Clear localStorage and sessionStorage
    localStorage.clear()
    sessionStorage.clear()

    // Navigate to setup
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    // Update UI status message (optional feedback before reload)
    errorMsg.value = '已跳过初始化'
    setTimeout(() => {
      errorMsg.value = ''
    }, 1500)

    // Navigate to home
    window.location.href = '/'
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '跳过失败')
  } finally {
    skipping.value = false
  }
}

async function resetData() {
  resettingData.value = true
  try {
    const resp = await fetch('/api/dev/reset', { method: 'POST' })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    showFlash('业务数据已清理')
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '清理失败')
  } finally {
    resettingData.value = false
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

/**
 * 恢复 employee.demo 到首次登录状态：先用 CEO 登录拿 token，
 * 再调后端 /employees/{id}/reset-first-login（如未实现则直接走两步：reset-password + 清空 email）。
 */
async function restoreEmployeeDemo() {
  restoringEmp.value = true
  try {
    // 1. CEO 登录拿 token
    const ceoResp = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ceo.demo', password: '123456' }),
    })
    if (!ceoResp.ok) throw new Error('CEO 登录失败，请确保 ceo.demo 密码仍为 123456')
    const { token } = (await ceoResp.json()) as { token: string }
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    }

    // 2. 调用现有后端 dev endpoint（若不存在则下一步直接回退）
    const restoreResp = await fetch('/api/dev/restore-employee-demo', {
      method: 'POST',
      headers: authHeaders,
    })
    if (restoreResp.ok) {
      showFlash('employee.demo 已恢复首次登录')
    } else if (restoreResp.status === 404) {
      // 后端没有专用端点：仅重置密码（现有 API 能做到），email 保持现状
      const putResp = await fetch('/api/employees/1/reset-password', {
        method: 'POST',
        headers: authHeaders,
      })
      if (!putResp.ok) throw new Error(`HTTP ${putResp.status}`)
      showFlash('employee.demo 密码已重置为 123456（邮箱需手动清空）')
    } else {
      throw new Error(`HTTP ${restoreResp.status}`)
    }
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '恢复失败')
  } finally {
    restoringEmp.value = false
  }
}

/** 查当前缓存中的最新验证码并显示。 */
async function fetchLatestCode(type: 'bind' | 'pwd') {
  fetchingCode.value = true
  latestCode.value = ''
  latestCodeMeta.value = ''
  try {
    const resp = await fetch(
      `/api/dev/verification-code?type=${type}&email=${encodeURIComponent(codeEmail.value)}`
    )
    if (resp.status === 404) {
      showError(`无缓存：请先触发${type === 'bind' ? '发绑定码' : '发重置码'}`)
      return
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const data = (await resp.json()) as { code: string }
    latestCode.value = data.code
    latestCodeMeta.value = `${type} · ${codeEmail.value}`
  } catch (error: unknown) {
    showError((error as { message?: string })?.message || '取码失败')
  } finally {
    fetchingCode.value = false
  }
}

/** 临时成功提示（1.5s 自动消失）。 */
function showFlash(msg: string) {
  errorMsg.value = msg
  setTimeout(() => {
    errorMsg.value = ''
  }, 1500)
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
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
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

.code-email-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  margin-bottom: 8px;
  box-sizing: border-box;
}

.code-email-input:focus {
  outline: none;
  border-color: rgba(59, 130, 246, 0.5);
}

.code-display {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.code-value {
  font-family: 'SF Mono', Consolas, Menlo, monospace;
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
  letter-spacing: 2px;
  user-select: all;
}

.code-meta {
  font-size: 10px;
  color: #94a3b8;
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
