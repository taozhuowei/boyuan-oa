<template>
  <!-- OvertimeNotifyTab — 加班通知 + 已发起 tabs -->
  <!-- mode='notifications': employee views + responds to incoming notifications -->
  <!-- mode='notify-initiated': PM/CEO views self-initiated notifications + responses -->
  <div>
    <!-- 加班通知 — 员工查看收到的通知，可确认或拒绝 -->
    <template v-if="mode === 'notifications'">
      <a-table
        :columns="notif_columns"
        :data-source="notifications"
        :loading="is_loading_notifs"
        :pagination="{ pageSize: 20 }"
        row-key="notification.id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'date'">
            {{ record.notification.overtimeDate }}
          </template>
          <template v-if="column.key === 'type'">
            {{ overtimeTypeLabel(record.notification.overtimeType) }}
          </template>
          <template v-if="column.key === 'content'">
            {{ record.notification.content }}
          </template>
          <template v-if="column.key === 'status'">
            <template v-if="record.myResponse">
              <a-tag :color="record.myResponse.accepted ? 'success' : 'error'">
                {{ record.myResponse.accepted ? '已确认' : '已拒绝' }}
              </a-tag>
            </template>
            <a-tag v-else color="processing">待响应</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <template v-if="!record.myResponse && record.notification.status !== 'ARCHIVED'">
              <a-space>
                <a-button size="small" type="primary" @click="respondNotif(record.notification.id, true, '')">确认</a-button>
                <a-button size="small" danger @click="openRejectModal(record.notification.id)">拒绝</a-button>
              </a-space>
            </template>
            <span v-else class="text-muted">—</span>
          </template>
        </template>
      </a-table>

      <!-- 拒绝加班通知弹窗 -->
      <a-modal
        v-model:open="is_reject_modal_visible"
        title="拒绝原因"
        ok-text="确认拒绝"
        cancel-text="取消"
        @ok="confirmReject"
      >
        <a-textarea v-model:value="reject_reason" placeholder="请填写拒绝原因（必填）" :rows="3" />
      </a-modal>
    </template>

    <!-- 已发起 — PM/CEO 查看自己发起的通知及响应情况 -->
    <template v-if="mode === 'notify-initiated'">
      <a-table
        :columns="initiated_columns"
        :data-source="initiated_notifs"
        :loading="is_loading_initiated"
        :pagination="{ pageSize: 20 }"
        row-key="notification.id"
        size="small"
        :expand-row-by-click="true"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'date'">
            {{ record.notification.overtimeDate }}
          </template>
          <template v-if="column.key === 'type'">
            {{ overtimeTypeLabel(record.notification.overtimeType) }}
          </template>
          <template v-if="column.key === 'content'">
            {{ record.notification.content }}
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="notifStatusColor(record.notification.status)">
              {{ notifStatusLabel(record.notification.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'responseCount'">
            {{ record.responses.length }} 人响应
          </template>
        </template>
        <template #expandedRowRender="{ record }">
          <div v-if="record.responses.length === 0" class="no-response-tip">暂无响应</div>
          <a-table
            v-else
            :columns="response_detail_columns"
            :data-source="record.responses"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column: col, record: resp }">
              <template v-if="col.key === 'accepted'">
                <a-tag :color="resp.accepted ? 'success' : 'error'">
                  {{ resp.accepted ? '已确认' : '已拒绝' }}
                </a-tag>
              </template>
              <template v-if="col.key === 'rejectReason'">
                {{ resp.rejectReason || '—' }}
              </template>
            </template>
          </a-table>
        </template>
      </a-table>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * OvertimeNotifyTab — 加班通知 + 已发起 Tab
 * mode='notifications': employee receives notifications and can confirm/reject.
 * mode='notify-initiated': PM/CEO views self-sent notifications with recipient responses.
 * Exposes loadNotifications / loadInitiatedNotifs for parent ?tab= deep-link support.
 */
import { ref, watch, onMounted } from 'vue'
import { request } from '~/utils/http'

type NotifyMode = 'notifications' | 'notify-initiated'

interface OvertimeNotifRecord {
  notification: {
    id: number
    projectId?: number
    initiatorId: number
    overtimeDate: string
    overtimeType: string
    content: string
    status: string
  }
  myResponse: {
    accepted: boolean
    rejectReason?: string
    rejectApprovalStatus?: string
  } | null
}

interface OvertimeResponse {
  id: number
  employeeId: number
  accepted: boolean
  rejectReason?: string
  rejectApprovalStatus?: string
}

interface InitiatedNotifRecord {
  notification: {
    id: number
    overtimeDate: string
    overtimeType: string
    content: string
    status: string
  }
  responses: OvertimeResponse[]
}

const props = defineProps<{
  /** Active sub-mode: 'notifications' for employee view, 'notify-initiated' for PM/CEO view */
  mode: NotifyMode
}>()

// Notifications (employee receives)
const is_loading_notifs = ref(false)
const notifications = ref<OvertimeNotifRecord[]>([])
const is_reject_modal_visible = ref(false)
const reject_reason = ref('')
const pending_reject_id = ref<number | null>(null)

// Initiated notifications (PM/CEO sent)
const is_loading_initiated = ref(false)
const initiated_notifs = ref<InitiatedNotifRecord[]>([])

// Column definitions — source of truth for notification tables
const notif_columns = [
  { title: '加班日期', key: 'date', width: 110 }, { title: '类型', key: 'type', width: 100 },
  { title: '说明', key: 'content' }, { title: '状态', key: 'status', width: 90 },
  { title: '操作', key: 'action', width: 130 }
]
const initiated_columns = [
  { title: '加班日期', key: 'date', width: 110 }, { title: '类型', key: 'type', width: 100 },
  { title: '通知内容', key: 'content' }, { title: '状态', key: 'status', width: 90 },
  { title: '响应', key: 'responseCount', width: 90 }
]
const response_detail_columns = [
  { title: '员工ID', dataIndex: 'employeeId', key: 'employeeId', width: 90 },
  { title: '响应', key: 'accepted', width: 80 }, { title: '拒绝原因', key: 'rejectReason' }
]

function overtimeTypeLabel(t: string) {
  const map: Record<string, string> = { WEEKDAY: '工作日加班', WEEKEND: '周末加班', HOLIDAY: '节假日加班' }
  return map[t] ?? t
}

function notifStatusColor(s: string) {
  if (s === 'NOTIFIED') return 'processing'
  return 'default'
}

function notifStatusLabel(s: string) {
  const map: Record<string, string> = { NOTIFIED: '待响应', ARCHIVED: '已归档' }
  return map[s] ?? s
}

async function loadNotifications() {
  is_loading_notifs.value = true
  try {
    const list = await request<OvertimeNotifRecord[]>({ url: '/overtime-notifications' })
    notifications.value = list ?? []
  } catch {
    notifications.value = []
  } finally {
    is_loading_notifs.value = false
  }
}

async function loadInitiatedNotifs() {
  is_loading_initiated.value = true
  try {
    const list = await request<InitiatedNotifRecord[]>({ url: '/overtime-notifications/initiated' })
    initiated_notifs.value = list ?? []
  } catch {
    initiated_notifs.value = []
  } finally {
    is_loading_initiated.value = false
  }
}

async function respondNotif(id: number, accepted: boolean, reason: string) {
  try {
    await request({
      url: `/overtime-notifications/${id}/respond`,
      method: 'POST',
      body: { accepted, rejectReason: reason }
    })
    await loadNotifications()
  } catch (e: unknown) {
    alert((e as Error).message ?? '操作失败')
  }
}

function openRejectModal(id: number) {
  pending_reject_id.value = id
  reject_reason.value = ''
  is_reject_modal_visible.value = true
}

async function confirmReject() {
  if (!pending_reject_id.value || !reject_reason.value.trim()) {
    alert('请填写拒绝原因')
    return
  }
  await respondNotif(pending_reject_id.value, false, reject_reason.value)
  is_reject_modal_visible.value = false
}

/** Initial load when this component mounts (covers ?tab= deep-link entry) */
onMounted(() => {
  if (props.mode === 'notifications') loadNotifications()
  if (props.mode === 'notify-initiated') loadInitiatedNotifs()
})

/** Reload when parent switches between modes rendered by this component */
watch(
  () => props.mode,
  (new_mode) => {
    if (new_mode === 'notifications') loadNotifications()
    if (new_mode === 'notify-initiated') loadInitiatedNotifs()
  }
)

/** Exposed so parent can imperatively reload after OvertimeNotifyCreateTab submits */
defineExpose({ loadNotifications, loadInitiatedNotifs })
</script>

<style scoped>
.no-response-tip {
  padding: 8px 16px;
  color: #999;
  font-size: 13px;
}
</style>
