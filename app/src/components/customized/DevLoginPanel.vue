<template>
  <div
    v-if="isDev"
    class="dev-login-wrapper"
    :style="wrapperStyle"
    @mousedown="onDragStart"
    @touchstart.passive="onTouchStart"
  >
    <div
      v-if="!expanded"
      class="dev-login-btn"
      @click="onBtnClick"
    >
      Dev
    </div>
    <div
      v-else
      class="dev-login-panel"
      tabindex="-1"
      @blur="onBlur"
    >
      <div class="dev-login-header">
        <span>快速登录</span>
        <span class="dev-login-close" @click.stop="toggleExpanded">x</span>
      </div>
      <div class="dev-login-list">
        <div
          v-for="account in accounts"
          :key="account.username"
          class="dev-login-row"
          :class="{ loading: loading === account.username }"
          @click.stop="handleLogin(account)"
        >
          <span>{{ account.label }}</span>
          <span v-if="loading === account.username" class="dev-login-spinner">...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { loginWithAccount } from '@/utils/access'
import { useUserStore } from '@/stores'

const isDev = import.meta.env.DEV === true

const userStore = useUserStore()

interface Account {
  username: string
  password: string
  label: string
}

const accounts: Account[] = [
  { username: 'ceo.demo', password: '123456', label: '陈明远 CEO' },
  { username: 'finance.demo', password: '123456', label: '李静 财务' },
  { username: 'pm.demo', password: '123456', label: '王建国 PM' },
  { username: 'employee.demo', password: '123456', label: '张晓宁 员工' },
  { username: 'worker.demo', password: '123456', label: '赵铁柱 劳工' }
]

const expanded = ref(false)
const loading = ref<string | null>(null)

// Draggable position — initialized once DOM is ready
const pos = ref({ x: 0, y: 12 })

onMounted(() => {
  // Place initial position: top-right corner
  pos.value.x = window.innerWidth - 44
})

const wrapperStyle = computed(() => ({
  position: 'fixed' as const,
  top: `${pos.value.y}px`,
  left: `${pos.value.x}px`,
  zIndex: 9999,
  userSelect: 'none' as const
}))

// Drag state
let dragStartX = 0
let dragStartY = 0
let originX = 0
let originY = 0
let dragging = false
const DRAG_THRESHOLD = 4 // px — below this distance treat as click

function onDragStart(e: MouseEvent) {
  dragStartX = e.clientX
  dragStartY = e.clientY
  originX = pos.value.x
  originY = pos.value.y
  dragging = false
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  if (!dragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
  dragging = true
  pos.value.x = clampX(originX + dx)
  pos.value.y = clampY(originY + dy)
}

function onDragEnd() {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// Touch support
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  const t = e.touches[0]
  touchStartX = t.clientX
  touchStartY = t.clientY
  originX = pos.value.x
  originY = pos.value.y
  dragging = false
  window.addEventListener('touchmove', onTouchMove)
  window.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches[0]
  const dx = t.clientX - touchStartX
  const dy = t.clientY - touchStartY
  if (!dragging && Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) return
  dragging = true
  e.preventDefault()
  pos.value.x = clampX(originX + dx)
  pos.value.y = clampY(originY + dy)
}

function onTouchEnd() {
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

function clampX(x: number) {
  return Math.max(0, Math.min(window.innerWidth - 40, x))
}

function clampY(y: number) {
  return Math.max(0, Math.min(window.innerHeight - 40, y))
}

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})

// Distinguish click vs drag for the Dev button
function onBtnClick() {
  if (dragging) return
  toggleExpanded()
}

function toggleExpanded() {
  expanded.value = !expanded.value
  if (expanded.value) {
    nextTick(() => {
      const panel = document.querySelector('.dev-login-panel') as HTMLElement
      panel?.focus()
    })
  }
}

function onBlur() {
  setTimeout(() => {
    expanded.value = false
  }, 150)
}

async function handleLogin(account: Account) {
  if (loading.value) return
  loading.value = account.username
  try {
    const result = await loginWithAccount({ identifier: account.username, password: account.password })
    userStore.setSession(result.token, result.user)
    uni.switchTab({ url: '/pages/index/index' })
  } catch (err) {
    // Error handled by loginWithAccount (shows toast or throws)
  } finally {
    loading.value = null
  }
}
</script>

<style scoped>
.dev-login-wrapper {
  /* position/top/left controlled by wrapperStyle binding */
  cursor: grab;
}

.dev-login-wrapper:active {
  cursor: grabbing;
}

.dev-login-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.dev-login-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.dev-login-btn:active {
  background: rgba(0, 0, 0, 0.9);
}

.dev-login-panel {
  width: 200px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  outline: none;
}

.dev-login-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #333333;
  background: #f5f5f5;
  border-bottom: 1px solid #e8e8e8;
}

.dev-login-close {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666666;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.dev-login-close:hover {
  color: #333333;
  background: #e0e0e0;
}

.dev-login-list {
  padding: 4px 0;
}

.dev-login-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-size: 13px;
  color: #555555;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dev-login-row:hover {
  background: #f0f0f0;
}

.dev-login-row:active {
  background: #e8e8e8;
}

.dev-login-row.loading {
  opacity: 0.6;
  cursor: not-allowed;
}

.dev-login-spinner {
  font-size: 12px;
  color: #888888;
  letter-spacing: 1px;
}
</style>
