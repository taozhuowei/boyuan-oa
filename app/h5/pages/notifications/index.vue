<template>
  <!-- Notification Center page — lists user notifications with infinite scroll -->
  <div class="notifications-page">
    <div class="page-header">
      <h2 class="page-title">通知中心</h2>
      <div class="header-actions">
        <a-button
          type="link"
          size="small"
          data-catch="notification-mark-all-read"
          :loading="markingAllRead"
          @click="markAllAsRead"
        >
          全部已读
        </a-button>
        <a-button type="link" size="small" danger :loading="clearingRead" @click="clearRead">
          清除已读
        </a-button>
      </div>
    </div>

    <a-list
      :data-source="notifications"
      :loading="loading"
      :locale="{ emptyText: '' }"
      class="notification-list"
    >
      <template #renderItem="{ item, index }">
        <a-list-item
          :class="['notification-item', { unread: !item.read }]"
          :data-catch="index === 0 ? 'notification-item-first' : undefined"
          @click="handleItemClick(item)"
        >
          <a-list-item-meta>
            <template #title>
              <div class="notification-title">
                <a-badge
                  v-if="!item.read"
                  status="error"
                  class="unread-badge"
                  data-catch="notification-badge-unread"
                />
                <span>{{ item.title }}</span>
              </div>
            </template>
            <template #description>
              <div class="notification-content">
                {{ truncateContent(item.content, 50) }}
              </div>
              <div class="notification-time">
                {{ formatRelativeTime(item.createdAt) }}
              </div>
            </template>
          </a-list-item-meta>
        </a-list-item>
      </template>
    </a-list>

    <!-- Empty state -->
    <div v-if="!loading && notifications.length === 0" class="empty-state">
      <a-empty description="暂无通知" />
    </div>

    <!-- Loading more indicator -->
    <div v-if="loadingMore" class="loading-more">
      <a-spin size="small" />
      <span>加载中...</span>
    </div>

    <!-- No more data indicator -->
    <div v-if="!hasMore && notifications.length > 0" class="no-more">没有更多了</div>

    <!-- Detail modal -->
    <a-modal
      v-model:open="detailModalOpen"
      :title="selectedNotification?.title ?? '通知详情'"
      :footer="null"
      width="520px"
    >
      <div class="notification-detail">
        <div class="detail-time">
          {{ selectedNotification ? formatRelativeTime(selectedNotification.createdAt) : '' }}
        </div>
        <div class="detail-content">
          {{ selectedNotification?.content ?? '' }}
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'

/**
 * Notification interface
 */
interface Notification {
  id: number
  title: string
  content: string
  read: boolean
  createdAt: string
}

/**
 * Paginated response interface
 */
interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// Page state
const notifications = ref<Notification[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const currentPage = ref(0)
const hasMore = ref(true)
const markingAllRead = ref(false)
const clearingRead = ref(false)

// Modal state
const detailModalOpen = ref(false)
const selectedNotification = ref<Notification | null>(null)

/**
 * Truncate content to specified length with ellipsis
 */
function truncateContent(content: string | undefined, maxLength: number): string {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.slice(0, maxLength) + '...'
}

/**
 * Format timestamp to relative time (e.g., "3分钟前", "昨天", "2024-01-15")
 */
function formatRelativeTime(timestamp: string | undefined): string {
  if (!timestamp) return ''

  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`

  // Return formatted date for older notifications
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Load notifications for the current page
 */
async function loadNotifications(isLoadMore = false): Promise<void> {
  if (isLoadMore) {
    if (loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else {
    if (loading.value) return
    loading.value = true
    currentPage.value = 0
    hasMore.value = true
  }

  try {
    const response = await request<PageResponse<Notification>>({
      url: `/notifications?page=${currentPage.value}&size=20`,
    })

    const newNotifications = response.content ?? []

    if (isLoadMore) {
      notifications.value.push(...newNotifications)
    } else {
      notifications.value = newNotifications
    }

    // Check if there are more pages
    hasMore.value = newNotifications.length === 20 && currentPage.value < response.totalPages - 1
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '加载通知失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

/**
 * Handle scroll event for infinite scroll
 */
function handleScroll(): void {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // Trigger load when user scrolls near bottom (within 100px)
  if (scrollTop + windowHeight >= documentHeight - 100) {
    if (hasMore.value && !loadingMore.value) {
      currentPage.value++
      loadNotifications(true)
    }
  }
}

/**
 * Mark a single notification as read
 */
async function markAsRead(id: number): Promise<boolean> {
  try {
    await request({
      url: `/notifications/${id}/read`,
      method: 'PATCH',
    })
    return true
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '标记已读失败')
    return false
  }
}

/**
 * Handle notification item click
 */
async function handleItemClick(item: Notification): Promise<void> {
  selectedNotification.value = item
  detailModalOpen.value = true

  // Mark as read if unread
  if (!item.read) {
    const success = await markAsRead(item.id)
    if (success) {
      item.read = true
    }
  }
}

/**
 * Mark all notifications as read
 */
async function markAllAsRead(): Promise<void> {
  if (markingAllRead.value) return

  markingAllRead.value = true
  try {
    await request({
      url: '/notifications/read-all',
      method: 'POST',
    })
    // Update all local notifications to read
    notifications.value.forEach((item) => {
      item.read = true
    })
    message.success('已全部标记为已读')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '操作失败')
  } finally {
    markingAllRead.value = false
  }
}

/**
 * Clear all read notifications
 */
async function clearRead(): Promise<void> {
  if (clearingRead.value) return

  clearingRead.value = true
  try {
    await request({
      url: '/notifications/read',
      method: 'DELETE',
    })
    // Remove read notifications from list
    notifications.value = notifications.value.filter((item) => !item.read)
    message.success('已清除已读通知')
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    message.error(err.data?.message ?? '操作失败')
  } finally {
    clearingRead.value = false
  }
}

onMounted(() => {
  loadNotifications()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.notifications-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #003466;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.notification-list {
  background: #fff;
  border-radius: 8px;
}

.notification-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item.unread {
  background-color: #e6f7ff;
}

.notification-item.unread:hover {
  background-color: #bae7ff;
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.unread-badge {
  flex-shrink: 0;
}

.notification-content {
  color: rgba(0, 0, 0, 0.65);
  margin-top: 4px;
  line-height: 1.5;
}

.notification-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
  margin-top: 4px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-more {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: rgba(0, 0, 0, 0.45);
}

.no-more {
  text-align: center;
  padding: 16px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
}

.notification-detail {
  padding: 8px 0;
}

.detail-time {
  color: rgba(0, 0, 0, 0.45);
  font-size: 14px;
  margin-bottom: 16px;
}

.detail-content {
  color: rgba(0, 0, 0, 0.85);
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
