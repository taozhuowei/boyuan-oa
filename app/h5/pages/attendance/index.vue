<template>
  <!-- Attendance page — tab switcher with ?tab= URL parameter support -->
  <!-- PM/CEO additionally see: 发起通知 + 已发起 tabs -->
  <div class="attendance-page">
    <h2 class="page-title">考勤管理</h2>

    <a-card>
      <a-tabs v-model:activeKey="active_tab" @change="onTabChange">
        <a-tab-pane key="records" tab="我的记录" />
        <a-tab-pane key="leave">
          <template #tab><span data-catch="attendance-tab-leave">请假申请</span></template>
        </a-tab-pane>
        <a-tab-pane key="overtime" tab="加班申报" />
        <a-tab-pane key="self-report" tab="自补加班" />
        <a-tab-pane key="notifications" tab="加班通知" />
        <a-tab-pane v-if="is_pm_or_ceo" key="notify-create" tab="发起通知" />
        <a-tab-pane v-if="is_pm_or_ceo" key="notify-initiated" tab="已发起" />
      </a-tabs>

      <MyRecordsTab
        v-if="active_tab === 'records'"
        ref="records_tab_ref"
        @resubmit-leave="onResubmitLeave"
        @resubmit-overtime="onResubmitOvertime"
      />

      <LeaveTab
        v-if="active_tab === 'leave'"
        :prefill="leave_prefill"
        @submitted="onFormSubmitted"
      />

      <OvertimeTab
        v-if="active_tab === 'overtime' || active_tab === 'self-report'"
        :mode="active_tab as 'overtime' | 'self-report'"
        :prefill="overtime_prefill"
        @submitted="onFormSubmitted"
      />

      <!-- Employee notification view + PM/CEO initiated list -->
      <OvertimeNotifyTab
        v-if="active_tab === 'notifications' || active_tab === 'notify-initiated'"
        ref="notify_tab_ref"
        :mode="active_tab as 'notifications' | 'notify-initiated'"
      />

      <!-- PM/CEO: create a new overtime notification -->
      <OvertimeNotifyCreateTab
        v-if="active_tab === 'notify-create'"
        @submitted="onNotificationSent"
      />
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Attendance page — layout, tab switching, and ?tab= URL query parameter support
 *
 * Purpose: thin coordinator that owns only the active tab key and cross-tab
 * communication (resubmit flow from MyRecordsTab → LeaveTab / OvertimeTab).
 * All business logic lives in the individual tab components.
 *
 * Data flow:
 *   - ?tab=<key> URL parameter sets initial tab on mount (A-AUDIT-FIX-02 compat)
 *   - MyRecordsTab emits resubmit-leave / resubmit-overtime → parent fills prefill
 *     prop and switches active tab so the target form pre-populates
 *   - After any form submission, switches back to records tab and reloads the list
 */
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '~/stores/user'
import MyRecordsTab from './tabs/MyRecordsTab.vue'
import LeaveTab from './tabs/LeaveTab.vue'
import OvertimeTab from './tabs/OvertimeTab.vue'
import OvertimeNotifyTab from './tabs/OvertimeNotifyTab.vue'
import OvertimeNotifyCreateTab from './tabs/OvertimeNotifyCreateTab.vue'

const user_store = useUserStore()
const route = useRoute()
const router = useRouter()

const is_pm_or_ceo = computed(() => {
  const role = user_store.userInfo?.role ?? ''
  return role === 'project_manager' || role === 'ceo' || role === 'department_manager'
})

// Valid tab keys; invalid ?tab= values fall back to 'records'
const VALID_TABS = [
  'records',
  'leave',
  'overtime',
  'self-report',
  'notifications',
  'notify-create',
  'notify-initiated',
] as const
type TabKey = (typeof VALID_TABS)[number]

const initial_tab = (() => {
  const q = Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab
  return typeof q === 'string' && (VALID_TABS as readonly string[]).includes(q)
    ? (q as TabKey)
    : 'records'
})()

const active_tab = ref<TabKey>(initial_tab)

// Cross-tab prefill state for resubmit flow (MyRecordsTab → form tabs)
const leave_prefill = ref<{
  leaveType: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  reason: string
} | null>(null)
const overtime_prefill = ref<{
  date: string | undefined
  startTime: string | undefined
  endTime: string | undefined
  overtimeType: string | undefined
  reason: string
} | null>(null)

// Template refs for exposing child methods
const records_tab_ref = ref<InstanceType<typeof MyRecordsTab> | null>(null)
const notify_tab_ref = ref<InstanceType<typeof OvertimeNotifyTab> | null>(null)

/** Clear prefill state when manually navigating away from form tabs; keep ?tab= in sync */
function onTabChange(key: string | number) {
  if (key !== 'leave') leave_prefill.value = null
  if (key !== 'overtime') overtime_prefill.value = null
  router.replace({ query: { ...route.query, tab: String(key) } })
}

/** Called by MyRecordsTab when user clicks 重新发起 on a rejected leave record */
function onResubmitLeave(data: {
  leaveType: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  reason: string
}) {
  leave_prefill.value = data
  active_tab.value = 'leave'
}

/** Called by MyRecordsTab when user clicks 重新发起 on a rejected overtime record */
function onResubmitOvertime(data: {
  date: string | undefined
  startTime: string | undefined
  endTime: string | undefined
  overtimeType: string | undefined
  reason: string
}) {
  overtime_prefill.value = data
  active_tab.value = 'overtime'
}

/** Called after LeaveTab or OvertimeTab submits successfully: go to records and reload */
async function onFormSubmitted() {
  active_tab.value = 'records'
  // nextTick-equivalent: allow records_tab_ref to mount before calling loadRecords
  await new Promise((resolve) => setTimeout(resolve, 0))
  records_tab_ref.value?.loadRecords()
}

/** Called after OvertimeNotifyCreateTab sends a notification: switch to notify-initiated */
async function onNotificationSent() {
  active_tab.value = 'notify-initiated'
  // Allow OvertimeNotifyTab to mount, then reload its list
  await new Promise((resolve) => setTimeout(resolve, 0))
  notify_tab_ref.value?.loadInitiatedNotifs()
}
</script>

<style scoped>
.attendance-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}
</style>
