<template>
  <!-- 进度管理 Tab — projects/tabs/progress.vue
       职责：里程碑 CRUD、进度记录、Dashboard、汇总报告（PM/CEO 专属）
       数据来源：GET/POST /api/projects/{id}/milestones，GET /api/projects/{id}/dashboard，
                POST /api/projects/{id}/progress，POST /api/projects/{id}/construction-summary -->
  <div>
    <a-tabs v-model:activeKey="innerTab">
      <a-tab-pane key="milestones" tab="里程碑" />
      <a-tab-pane key="progress" tab="进度记录" />
      <a-tab-pane key="dashboard" tab="Dashboard" />
      <a-tab-pane key="summary" tab="汇总报告" />
    </a-tabs>

    <!-- 里程碑 -->
    <template v-if="innerTab === 'milestones'">
      <div style="margin-bottom: 12px">
        <a-button
          data-catch="project-milestone-add-btn"
          type="primary"
          @click="showMilestoneModal = true"
        >
          + 新建里程碑
        </a-button>
        <a-button style="margin-left: 8px" :loading="loadingMilestones" @click="loadMilestones">
          刷新
        </a-button>
      </div>
      <a-table
        :columns="milestoneColumns"
        :data-source="milestones"
        :loading="loadingMilestones"
        row-key="id"
        size="small"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actualCompletionDate'">
            <a-tag v-if="record.actualCompletionDate" color="green">
              已完成 {{ record.actualCompletionDate }}
            </a-tag>
            <a-tag v-else color="orange">进行中</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="openEditMilestone(record as Milestone)">
                编辑
              </a-button>
              <a-button
                v-if="!record.actualCompletionDate"
                type="link"
                size="small"
                @click="doMarkMilestoneComplete(record as Milestone)"
              >
                标记完成
              </a-button>
              <a-popconfirm
                title="确认删除该里程碑？"
                @confirm="doDeleteMilestone(record.id as number)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
      <a-modal
        v-model:open="showMilestoneModal"
        :title="editingMilestone ? '编辑里程碑' : '新建里程碑'"
        @ok="doSaveMilestone"
        :confirm-loading="milestoneLoading"
        @cancel="resetMilestoneForm"
        :okButtonProps="{ 'data-catch': 'project-milestone-save-btn' } as unknown as ButtonProps"
      >
        <a-form :model="milestoneForm" layout="vertical">
          <a-form-item label="名称" required>
            <a-input v-model:value="milestoneForm.name" />
          </a-form-item>
          <a-form-item label="排序">
            <a-input-number v-model:value="milestoneForm.sort" :min="0" style="width: 100%" />
          </a-form-item>
          <a-form-item label="实际完成日期（可选）">
            <a-date-picker
              v-model:value="milestoneForm.actualCompletionDate"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </a-form-item>
        </a-form>
      </a-modal>
    </template>

    <!-- 进度记录 -->
    <template v-if="innerTab === 'progress'">
      <a-card title="记录今日进度" style="margin-bottom: 16px">
        <a-form :model="progressForm" layout="vertical">
          <a-form-item label="关联里程碑（可选）">
            <a-select
              v-model:value="progressForm.milestoneId"
              placeholder="选择里程碑"
              allow-clear
              style="width: 100%"
            >
              <a-select-option v-for="m in milestones" :key="m.id" :value="m.id">
                {{ m.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="进度说明" required>
            <a-textarea
              v-model:value="progressForm.note"
              :rows="3"
              placeholder="描述今日完成内容…"
            />
          </a-form-item>
          <a-form-item>
            <a-button
              data-catch="project-progress-update-btn"
              type="primary"
              :loading="progressLoading"
              @click="doRecordProgress"
            >
              提交进度
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      <a-card title="进度历史">
        <a-spin :spinning="loadingDashboard">
          <a-timeline v-if="progressLogs.length > 0">
            <a-timeline-item v-for="log in progressLogs" :key="log.id" color="blue">
              <div style="font-weight: 500">{{ log.createdAt?.slice(0, 10) ?? '—' }}</div>
              <div>{{ log.note }}</div>
              <div v-if="log.milestoneId" style="color: #888; font-size: 12px">
                里程碑 #{{ log.milestoneId }}
              </div>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无进度记录" />
        </a-spin>
      </a-card>
    </template>

    <!-- Dashboard -->
    <template v-if="innerTab === 'dashboard'">
      <a-spin :spinning="loadingDashboard">
        <a-row :gutter="16" style="margin-bottom: 16px">
          <a-col :span="8">
            <a-card>
              <a-statistic
                title="里程碑完成数"
                :value="dashboard.workItemSummary.completed"
                :suffix="`/ ${dashboard.workItemSummary.total}`"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card>
              <a-statistic
                title="进度记录总数"
                :value="dashboard.timeSeriesData.length"
                suffix="条"
              />
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card>
              <a-statistic title="汇总报告" :value="dashboard.summaries.length" suffix="份" />
            </a-card>
          </a-col>
        </a-row>
        <a-card title="里程碑完成率" style="margin-bottom: 16px">
          <a-progress
            data-catch="project-progress-rate"
            :percent="milestonesCompletionPct"
            status="active"
            :stroke-color="{ from: '#108ee9', to: '#87d068' }"
          />
          <a-list size="small" :data-source="dashboard.milestones" style="margin-top: 12px">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-space style="width: 100%; justify-content: space-between">
                  <span>{{ item.name }}</span>
                  <a-tag :color="item.actualCompletionDate ? 'green' : 'orange'">
                    {{
                      item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : '进行中'
                    }}
                  </a-tag>
                </a-space>
              </a-list-item>
            </template>
          </a-list>
          <a-empty v-if="dashboard.milestones.length === 0" description="暂无里程碑" />
        </a-card>
        <a-card title="进度时间轴（最近 10 条）">
          <a-timeline v-if="recentLogs.length > 0">
            <a-timeline-item v-for="(log, idx) in recentLogs" :key="idx" color="blue">
              <span style="font-weight: 500">{{ log.date }}</span>
              <span style="margin-left: 8px; color: #555">{{ log.note }}</span>
            </a-timeline-item>
          </a-timeline>
          <a-empty v-else description="暂无进度数据" />
        </a-card>
      </a-spin>
    </template>

    <!-- 汇总报告 -->
    <template v-if="innerTab === 'summary'">
      <a-card title="生成汇总报告" style="margin-bottom: 16px">
        <a-form :model="summaryForm" layout="vertical">
          <a-form-item label="统计起始日期" required>
            <a-date-picker
              v-model:value="summaryForm.periodStart"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </a-form-item>
          <a-form-item label="统计截止日期" required>
            <a-date-picker
              v-model:value="summaryForm.periodEnd"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              placeholder="请选择日期"
            />
          </a-form-item>
          <a-form-item label="项目经理备注">
            <a-textarea v-model:value="summaryForm.pmNote" :rows="3" />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :loading="summaryLoading" @click="doCreateSummary">
              生成并通知 CEO
            </a-button>
          </a-form-item>
        </a-form>
      </a-card>
      <a-card title="历史汇总报告">
        <a-spin :spinning="loadingDashboard">
          <a-table
            :columns="summaryColumns"
            :data-source="dashboard.summaries"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 5 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'period'">
                {{ record.periodStart }} ~ {{ record.periodEnd }}
              </template>
              <template v-if="column.key === 'notified'">
                <a-tag :color="record.ceoNotifiedAt ? 'green' : 'orange'">
                  {{ record.ceoNotifiedAt ? '已通知' : '未通知' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-spin>
      </a-card>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 进度管理 Tab 子组件 — projects/tabs/progress.vue
 * 职责：里程碑 CRUD、进度记录提交与历史展示、Dashboard 统计、汇总报告生成。
 * Props：project（父页面传入的项目详情）、projectId（项目 ID）
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { message } from 'ant-design-vue'
import type { ButtonProps } from 'ant-design-vue'
import type { ProjectDetail } from '../types'

// ── Props ──────────────────────────────────────────────
interface Props {
  project: ProjectDetail
  projectId: number
}
const props = defineProps<Props>()

// ── 内层 Tab ───────────────────────────────────────────
const innerTab = ref('milestones')

// ── 类型定义 ────────────────────────────────────────────
interface Milestone {
  id: number
  projectId: number
  name: string
  sort: number
  actualCompletionDate: string | null
}
interface ProgressLog {
  id: number
  projectId: number
  milestoneId: number | null
  note: string
  createdAt: string
}
interface SummaryItem {
  id: number
  periodStart: string
  periodEnd: string
  pmNote: string | null
  ceoNotifiedAt: string | null
  createdAt: string
}
interface DashboardData {
  project: { id: number; name: string; status: string }
  milestones: Milestone[]
  workItemSummary: { total: number; completed: number }
  timeSeriesData: { date: string; note: string; milestoneId: number }[]
  summaries: SummaryItem[]
}

// ── 里程碑 ─────────────────────────────────────────────
const loadingMilestones = ref(false)
const milestones = ref<Milestone[]>([])
const showMilestoneModal = ref(false)
const milestoneLoading = ref(false)
const editingMilestone = ref<Milestone | null>(null)
const milestoneForm = ref({
  name: '',
  sort: 0,
  actualCompletionDate: undefined as string | undefined,
})

const milestoneColumns = [
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
  { title: '里程碑名称', dataIndex: 'name', key: 'name' },
  { title: '状态', key: 'actualCompletionDate', width: 180 },
  { title: '操作', key: 'action', width: 180 },
]

async function loadMilestones() {
  loadingMilestones.value = true
  try {
    milestones.value = await request<Milestone[]>({
      url: `/projects/${props.projectId}/milestones`,
      method: 'GET',
    })
  } catch {
    message.error('加载里程碑失败')
  } finally {
    loadingMilestones.value = false
  }
}

function resetMilestoneForm() {
  editingMilestone.value = null
  milestoneForm.value = { name: '', sort: 0, actualCompletionDate: undefined }
}

function openEditMilestone(m: Milestone) {
  editingMilestone.value = m
  milestoneForm.value = {
    name: m.name,
    sort: m.sort,
    actualCompletionDate: m.actualCompletionDate ?? undefined,
  }
  showMilestoneModal.value = true
}

async function doSaveMilestone() {
  if (!milestoneForm.value.name.trim()) {
    message.warning('名称不能为空')
    return
  }
  milestoneLoading.value = true
  try {
    const body = {
      name: milestoneForm.value.name,
      sort: milestoneForm.value.sort,
      actualCompletionDate: milestoneForm.value.actualCompletionDate ?? null,
    }
    if (editingMilestone.value) {
      await request({
        url: `/projects/${props.projectId}/milestones/${editingMilestone.value.id}`,
        method: 'PUT',
        body,
      })
      message.success('已更新')
    } else {
      await request({ url: `/projects/${props.projectId}/milestones`, method: 'POST', body })
      message.success('里程碑已创建')
    }
    showMilestoneModal.value = false
    resetMilestoneForm()
    await loadMilestones()
  } catch {
    message.error('保存失败')
  } finally {
    milestoneLoading.value = false
  }
}

async function doMarkMilestoneComplete(m: Milestone) {
  try {
    await request({
      url: `/projects/${props.projectId}/milestones/${m.id}`,
      method: 'PUT',
      body: {
        name: m.name,
        sort: m.sort,
        actualCompletionDate: new Date().toISOString().slice(0, 10),
      },
    })
    message.success('已标记完成')
    await loadMilestones()
  } catch {
    message.error('操作失败')
  }
}

async function doDeleteMilestone(id: number) {
  try {
    await request({ url: `/projects/${props.projectId}/milestones/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadMilestones()
  } catch {
    message.error('删除失败')
  }
}

// ── 进度记录 ────────────────────────────────────────────
const progressLogs = ref<ProgressLog[]>([])
const progressForm = ref({ milestoneId: undefined as number | undefined, note: '' })
const progressLoading = ref(false)

async function doRecordProgress() {
  if (!progressForm.value.note.trim()) {
    message.warning('进度说明不能为空')
    return
  }
  progressLoading.value = true
  try {
    const body: Record<string, unknown> = { note: progressForm.value.note }
    if (progressForm.value.milestoneId) body.milestoneId = progressForm.value.milestoneId
    await request({ url: `/projects/${props.projectId}/progress`, method: 'POST', body })
    message.success('进度已记录')
    progressForm.value = { milestoneId: undefined, note: '' }
    await loadDashboard()
  } catch {
    message.error('记录失败')
  } finally {
    progressLoading.value = false
  }
}

// ── Dashboard ───────────────────────────────────────────
const loadingDashboard = ref(false)
const dashboard = ref<DashboardData>({
  project: { id: 0, name: '', status: '' },
  milestones: [],
  workItemSummary: { total: 0, completed: 0 },
  timeSeriesData: [],
  summaries: [],
})

const milestonesCompletionPct = computed(() => {
  const { total, completed } = dashboard.value.workItemSummary
  return total === 0 ? 0 : Math.round((completed / total) * 100)
})
const recentLogs = computed(() => dashboard.value.timeSeriesData.slice(0, 10))

async function loadDashboard() {
  loadingDashboard.value = true
  try {
    const res = await request<DashboardData>({
      url: `/projects/${props.projectId}/dashboard`,
      method: 'GET',
    })
    dashboard.value = res
    // 同步进度历史列表（复用 dashboard timeSeriesData）
    progressLogs.value = res.timeSeriesData.map((d, idx) => ({
      id: idx,
      projectId: props.projectId,
      milestoneId: d.milestoneId || null,
      note: d.note,
      createdAt: d.date,
    }))
  } catch {
    message.error('加载 Dashboard 失败')
  } finally {
    loadingDashboard.value = false
  }
}

// ── 汇总报告 ────────────────────────────────────────────
const summaryForm = ref({
  periodStart: undefined as string | undefined,
  periodEnd: undefined as string | undefined,
  pmNote: '',
})
const summaryLoading = ref(false)

const summaryColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '统计区间', key: 'period', width: 200 },
  { title: '已通知CEO', key: 'notified', width: 100 },
  { title: '项目经理备注', dataIndex: 'pmNote', key: 'pmNote' },
  { title: '生成时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
]

async function doCreateSummary() {
  if (!summaryForm.value.periodStart || !summaryForm.value.periodEnd) {
    message.warning('请选择统计区间')
    return
  }
  summaryLoading.value = true
  try {
    await request({
      url: `/projects/${props.projectId}/construction-summary`,
      method: 'POST',
      body: {
        periodStart: summaryForm.value.periodStart,
        periodEnd: summaryForm.value.periodEnd,
        pmNote: summaryForm.value.pmNote || null,
      },
    })
    message.success('汇总报告已生成，CEO 已收到通知')
    summaryForm.value = { periodStart: undefined, periodEnd: undefined, pmNote: '' }
    await loadDashboard()
  } catch {
    message.error('生成失败')
  } finally {
    summaryLoading.value = false
  }
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadMilestones(), loadDashboard()])
})
</script>
