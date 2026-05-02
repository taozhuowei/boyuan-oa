<template>
  <Teleport to="body">
    <div
      v-if="isDev"
      class="dev-toolbar"
      :style="{ left: pos.x + 'px', top: pos.y + 'px' }"
    >
      <!-- Collapsed: FAB -->
      <button
        v-if="!expanded"
        class="dev-fab"
        title="开发工具"
        @mousedown.prevent="startDrag($event, 'fab')"
        @click="onFabClick"
      >🛠</button>

      <!-- Expanded: Panel -->
      <div v-else class="dev-panel">
        <!-- Drag handle (header) -->
        <div class="panel-header" @mousedown.prevent="startDrag($event, 'panel')">
          <span class="panel-title">DEV</span>
          <button class="close-btn" @mousedown.stop @click="expanded = false">×</button>
        </div>

        <div class="panel-body">
          <!-- Setup: always visible -->
          <section class="dev-section">
            <div class="section-label">初始化</div>
            <div class="btn-row">
              <button class="dev-btn" :disabled="busy.reset" @click="resetSetup">
                {{ busy.reset ? '…' : '重置' }}
              </button>
              <button class="dev-btn" :disabled="busy.skip" @click="skipSetup">
                {{ busy.skip ? '…' : '跳过' }}
              </button>
            </div>
          </section>

          <!-- Test data: always visible -->
          <section class="dev-section">
            <div class="section-label">测试数据</div>
            <div class="btn-row">
              <button class="dev-btn" :disabled="busy.rate" @click="clearRateLimit">
                {{ busy.rate ? '…' : '清限流' }}
              </button>
              <button class="dev-btn" :disabled="busy.emp" @click="restoreEmployeeDemo">
                {{ busy.emp ? '…' : '恢复员工' }}
              </button>
            </div>
          </section>

          <!-- Verification code: passive display, shown when captured -->
          <div v-if="latestCode" class="code-badge">
            <span class="code-hint">验证码</span>
            <span class="code-val">{{ latestCode }}</span>
          </div>

          <!-- Quick login: only when NOT logged in -->
          <section v-if="!isLoggedIn" class="dev-section">
            <div class="section-label">快捷登录</div>
            <div class="btn-grid">
              <button
                v-for="u in quickUsers"
                :key="u.username"
                class="dev-btn"
                :disabled="u.loading"
                @click="quickLogin(u)"
              >{{ u.loading ? '…' : u.label }}</button>
            </div>
          </section>
        </div>

        <!-- Flash message -->
        <div v-if="flash" class="flash" @click="flash = ''">{{ flash }}</div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * DevToolbar — dev-only floating debug panel.
 * - Draggable (position saved to localStorage)
 * - Context-aware: quick login hidden when already authenticated
 * - Verification code captured passively via utils/http.ts onResponse hook
 * Tree-shaken in production: all functionality is gated by isDev.
 */
import { ref, reactive, onMounted, computed } from 'vue'
import { loginWithAccount } from '~/utils/access'
import { useUserStore } from '~/stores/user'

const isDev = import.meta.env.DEV
const STORAGE_POS = 'dev-toolbar-pos'

const expanded = ref(false)
const flash = ref('')
const latestCode = useState<string>('dev-latest-code', () => '')
const busy = reactive({ reset: false, skip: false, rate: false, emp: false })

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)

// ── Position ──────────────────────────────────────────────────────────────

const pos = ref({ x: 0, y: 0 })

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_POS)
  if (saved) {
    try {
      pos.value = JSON.parse(saved) as { x: number; y: number }
      return
    } catch { /* ignore */ }
  }
  // Default: bottom-right
  pos.value = { x: window.innerWidth - 60, y: window.innerHeight - 60 }
})

// ── Drag ─────────────────────────────────────────────────────────────────

let didDrag = false

function startDrag(e: MouseEvent, source: 'fab' | 'panel') {
  const startX = e.clientX
  const startY = e.clientY
  const originX = pos.value.x
  const originY = pos.value.y
  didDrag = false

  const PANEL_W = source === 'fab' ? 44 : 240
  const PANEL_H = source === 'fab' ? 44 : 300

  const onMove = (ev: MouseEvent) => {
    const dx = ev.clientX - startX
    const dy = ev.clientY - startY
    if (!didDrag && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) didDrag = true
    if (didDrag) {
      pos.value = {
        x: Math.max(0, Math.min(window.innerWidth - PANEL_W, originX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - PANEL_H, originY + dy)),
      }
    }
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    localStorage.setItem(STORAGE_POS, JSON.stringify(pos.value))
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function onFabClick() {
  if (!didDrag) expanded.value = true
}

// ── Helpers ───────────────────────────────────────────────────────────────

function showFlash(msg: string, ms = 1500) {
  flash.value = msg
  setTimeout(() => { flash.value = '' }, ms)
}

function showError(msg: string) { showFlash(msg, 3000) }

// ── Actions ───────────────────────────────────────────────────────────────

async function resetSetup() {
  busy.reset = true
  try {
    const r = await fetch('/api/dev/reset-setup', { method: 'POST' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    localStorage.clear()
    sessionStorage.clear()
    await navigateTo('/setup')
  } catch (e: unknown) { showError((e as Error).message || '失败') }
  finally { busy.reset = false }
}

async function skipSetup() {
  busy.skip = true
  try {
    const r = await fetch('/api/dev/skip-setup', { method: 'POST' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    window.location.href = '/'
  } catch (e: unknown) { showError((e as Error).message || '失败') }
  finally { busy.skip = false }
}

async function clearRateLimit() {
  busy.rate = true
  try {
    const r = await fetch('/api/dev/reset-rate-limit', { method: 'POST' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    showFlash('限流已清零')
  } catch (e: unknown) { showError((e as Error).message || '失败') }
  finally { busy.rate = false }
}

async function restoreEmployeeDemo() {
  busy.emp = true
  try {
    const lr = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'ceo.demo', password: '123456' }),
    })
    if (!lr.ok) throw new Error('CEO 登录失败')
    const { token } = (await lr.json()) as { token: string }
    const r = await fetch('/api/dev/restore-employee-demo', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    showFlash('已恢复首次登录状态')
  } catch (e: unknown) { showError((e as Error).message || '失败') }
  finally { busy.emp = false }
}

interface QuickUser { username: string; label: string; loading: boolean }

const quickUsers = ref<QuickUser[]>([
  { username: 'employee.demo', label: '员工', loading: false },
  { username: 'hr.demo',       label: '人事', loading: false },
  { username: 'finance.demo',  label: '财务', loading: false },
  { username: 'pm.demo',       label: 'PM',   loading: false },
  { username: 'ceo.demo',      label: 'CEO',  loading: false },
  { username: 'worker.demo',   label: '劳工', loading: false },
])

async function quickLogin(u: QuickUser) {
  u.loading = true
  try {
    const result = await loginWithAccount({ identifier: u.username, password: '123456' })
    userStore.setSession(result.token, result.user)
    await navigateTo('/')
  } catch (e: unknown) { showError((e as Error).message || `${u.label} 登录失败`) }
  finally { u.loading = false }
}
</script>

<style scoped>
.dev-toolbar {
  position: fixed;
  z-index: 9999;
  user-select: none;
}

/* ── FAB ─────────────────────────────────────────────── */

.dev-fab {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(15, 20, 40, 0.35);
  backdrop-filter: blur(16px) saturate(160%);
  color: rgba(255, 255, 255, 0.75);
  font-size: 16px;
  line-height: 1;
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: background 0.15s, border-color 0.15s;
}

.dev-fab:hover {
  background: rgba(30, 40, 70, 0.5);
  border-color: rgba(255, 255, 255, 0.25);
}

.dev-fab:active {
  cursor: grabbing;
}

/* ── Panel ───────────────────────────────────────────── */

.dev-panel {
  width: 220px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(10, 15, 35, 0.38);
  backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: grab;
}

.panel-header:active {
  cursor: grabbing;
}

.panel-title {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: rgba(255, 255, 255, 0.4);
  text-transform: uppercase;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.35);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.close-btn:hover {
  color: rgba(255, 255, 255, 0.75);
}

.panel-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Sections ────────────────────────────────────────── */

.dev-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-label {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.28);
}

.btn-row,
.btn-grid {
  display: grid;
  gap: 5px;
}

.btn-row {
  grid-template-columns: 1fr 1fr;
}

.btn-grid {
  grid-template-columns: 1fr 1fr 1fr;
}

.dev-btn {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  font-weight: 500;
  padding: 6px 4px;
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dev-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.13);
  border-color: rgba(255, 255, 255, 0.2);
}

.dev-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

/* ── Verification code badge ─────────────────────────── */

.code-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.code-hint {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: rgba(147, 197, 253, 0.7);
  flex-shrink: 0;
}

.code-val {
  font-family: 'SF Mono', Consolas, Menlo, monospace;
  font-size: 16px;
  font-weight: 700;
  color: #93c5fd;
  letter-spacing: 3px;
  user-select: all;
}

/* ── Flash message ───────────────────────────────────── */

.flash {
  margin: 0 10px 10px;
  padding: 7px 10px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.85);
  font-size: 11px;
  cursor: pointer;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px) }
  to   { opacity: 1; transform: translateY(0) }
}
</style>
