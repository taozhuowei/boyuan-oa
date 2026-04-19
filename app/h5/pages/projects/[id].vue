<template>
  <!-- 项目详情页 — projects/[id].vue
       职责：加载项目基础数据，渲染 Tab 容器，将 project + projectId 下发给各 Tab 子组件。
       数据来源：GET /api/projects/{id} -->
  <div class="project-detail-page">
    <div
      class="page-header"
      style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px"
    >
      <a-button type="link" style="padding: 0" @click="navigateTo('/projects')">
        ← 返回列表
      </a-button>
      <h2 class="page-title" style="margin: 0">
        {{ project?.name ?? '加载中…' }}
        <a-tag
          v-if="project"
          :color="project.status === 'ACTIVE' ? 'green' : 'default'"
          style="margin-left: 8px; vertical-align: middle"
        >
          {{ project.status === 'ACTIVE' ? '进行中' : '已关闭' }}
        </a-tag>
      </h2>
    </div>

    <a-spin :spinning="loadingProject">
      <a-card>
        <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
          <a-tab-pane key="members" tab="成员信息" />
          <a-tab-pane v-if="isPmOrCeo" key="progress" tab="进度管理" />
          <a-tab-pane key="cost" tab="成本" />
          <a-tab-pane key="revenue" tab="营收" />
          <a-tab-pane v-if="isPmOrCeo" key="logs" tab="施工日志审批" />
          <a-tab-pane key="aftersale" tab="售后问题单" />
        </a-tabs>

        <template v-if="project">
          <MembersTab
            v-if="activeTab === 'members'"
            :project="project"
            :project-id="projectId"
            @refresh="loadProject"
          />
          <ProgressTab
            v-if="activeTab === 'progress' && isPmOrCeo"
            :project="project"
            :project-id="projectId"
          />
          <CostTab v-if="activeTab === 'cost'" :project="project" :project-id="projectId" />
          <RevenueTab v-if="activeTab === 'revenue'" :project="project" :project-id="projectId" />
          <LogsTab
            v-if="activeTab === 'logs' && isPmOrCeo"
            :project="project"
            :project-id="projectId"
          />
          <AftersaleTab
            v-if="activeTab === 'aftersale'"
            :project="project"
            :project-id="projectId"
          />
        </template>
      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目详情页父组件 — projects/[id].vue
 * 职责：
 *   1. 鉴权 + definePageMeta
 *   2. 加载项目基础数据（GET /api/projects/{id}）
 *   3. 维护 activeTab 与 URL ?tab= 参数的双向同步
 *   4. 将 project / projectId 作为 props 传递给各 Tab 子组件
 *
 * 数据来源：GET /api/projects/{id}
 */
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import type { ProjectDetail } from './types'

// ── 异步懒加载各 Tab 子组件 ──────────────────────────────
const MembersTab = defineAsyncComponent(() => import('./tabs/members.vue'))
const ProgressTab = defineAsyncComponent(() => import('./tabs/progress.vue'))
const CostTab = defineAsyncComponent(() => import('./tabs/cost.vue'))
const RevenueTab = defineAsyncComponent(() => import('./tabs/revenue.vue'))
const LogsTab = defineAsyncComponent(() => import('./tabs/logs.vue'))
const AftersaleTab = defineAsyncComponent(() => import('./tabs/aftersale.vue'))

// ── 页面元数据与权限 ─────────────────────────────────────
definePageMeta({ requiresAuth: true })

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isPmOrCeo = computed(() => ['project_manager', 'ceo'].includes(role.value))

// ── Tab 激活状态与 URL 同步 ──────────────────────────────
const VALID_TABS = ['members', 'progress', 'cost', 'revenue', 'logs', 'aftersale'] as const
type TabKey = (typeof VALID_TABS)[number]

const activeTab = ref<TabKey>(
  (VALID_TABS as readonly string[]).includes(String(route.query.tab))
    ? (route.query.tab as TabKey)
    : 'members'
)

function onTabChange(key: string | number) {
  router.replace({ query: { ...route.query, tab: String(key) } })
}

// ── 项目 ID ─────────────────────────────────────────────
const projectId = computed(() => Number(route.params.id))

// ── 项目基础数据 ─────────────────────────────────────────
const loadingProject = ref(false)
const project = ref<ProjectDetail | null>(null)

async function loadProject() {
  loadingProject.value = true
  try {
    const res = await request<ProjectDetail>({ url: `/projects/${projectId.value}`, method: 'GET' })
    project.value = res
  } catch {
    message.error('加载项目详情失败')
  } finally {
    loadingProject.value = false
  }
}

onMounted(loadProject)
</script>

<style scoped>
.project-detail-page {
  /* Flow layout: natural top-to-bottom content flow */
}
</style>
