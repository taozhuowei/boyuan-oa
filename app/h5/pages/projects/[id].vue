<template>
  <!-- 项目详情页 — projects/[id].vue
       Tab 布局（按角色显示不同 Tab）：
       - 基本信息（所有人）：项目信息 + 成员列表，CEO 可添加/移除成员
       - 里程碑（PM/CEO）：里程碑 CRUD + 标记完成
       - 进度记录（PM/CEO）：记录今日进度 + 查看历史
       - Dashboard（所有人）：里程碑完成率 + 进度时间轴 + 工作项汇总
       - 汇总报告（PM/CEO）：生成报告 + 历史报告列表 -->
  <div class="project-detail-page">
    <div class="page-header" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
      <a-button type="link" style="padding: 0;" @click="navigateTo('/projects')">← 返回列表</a-button>
      <h2 class="page-title" style="margin: 0;">
        {{ project?.name ?? '加载中…' }}
        <a-tag v-if="project" :color="project.status === 'ACTIVE' ? 'green' : 'default'" style="margin-left: 8px; vertical-align: middle;">
          {{ project.status === 'ACTIVE' ? '进行中' : '已关闭' }}
        </a-tag>
      </h2>
    </div>

    <a-spin :spinning="loadingProject">
      <a-card>
        <a-tabs v-model:activeKey="activeTab" @change="onTabChange">
          <a-tab-pane key="info" tab="基本信息" />
          <a-tab-pane v-if="isPmOrCeo" key="milestones" tab="里程碑" />
          <a-tab-pane v-if="isPmOrCeo" key="progress" tab="进度记录" />
          <a-tab-pane key="dashboard" tab="Dashboard" />
          <a-tab-pane v-if="isPmOrCeo" key="summary" tab="汇总报告" />
          <a-tab-pane v-if="isPmOrCeo" key="logs" tab="施工日志审批" />
        </a-tabs>

        <!-- ── Tab: 基本信息 ── -->
        <template v-if="activeTab === 'info'">
          <a-descriptions bordered size="small" :column="2" style="margin-bottom: 16px;">
            <a-descriptions-item label="项目名称">{{ project?.name }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ project?.status === 'ACTIVE' ? '进行中' : '已关闭' }}</a-descriptions-item>
            <a-descriptions-item label="开始日期">{{ project?.startDate ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="实际完工日期">{{ project?.actualEndDate ?? '—' }}</a-descriptions-item>
            <a-descriptions-item label="日志申报周期">{{ project?.logCycleDays ?? 1 }} 天</a-descriptions-item>
            <a-descriptions-item label="汇报周期">{{ project?.logReportCycleDays ?? 1 }} 天</a-descriptions-item>
          </a-descriptions>

          <!-- CEO：修改配置 -->
          <template v-if="isCeo">
            <a-divider>项目配置</a-divider>
            <a-form layout="inline" style="margin-bottom: 16px;">
              <a-form-item label="日志申报周期（天）">
                <a-input-number v-model:value="configForm.logCycleDays" :min="1" :max="30" />
              </a-form-item>
              <a-form-item label="汇报周期（天）">
                <a-input-number v-model:value="configForm.logReportCycleDays" :min="1" :max="90" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="configLoading" @click="doUpdateConfig">保存配置</a-button>
              </a-form-item>
            </a-form>
          </template>

          <!-- 成员列表 -->
          <a-divider>项目成员</a-divider>
          <template v-if="isCeo">
            <div style="margin-bottom: 12px;">
              <a-space>
                <a-input-number v-model:value="addMemberForm.employeeId" placeholder="员工ID" :min="1" style="width: 120px;" />
                <a-select v-model:value="addMemberForm.role" style="width: 120px;">
                  <a-select-option value="PM">PM</a-select-option>
                  <a-select-option value="MEMBER">成员</a-select-option>
                </a-select>
                <a-button type="primary" :loading="addMemberLoading" @click="doAddMember">添加成员</a-button>
              </a-space>
            </div>
          </template>

          <a-table
            :columns="memberColumns"
            :data-source="members"
            :loading="loadingProject"
            row-key="employeeId"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'role'">
                <a-tag :color="record.role === 'PM' ? 'blue' : 'default'">{{ record.role }}</a-tag>
              </template>
              <template v-if="column.key === 'action' && isCeo">
                <a-popconfirm title="确认移除该成员？" @confirm="doRemoveMember(record.employeeId)">
                  <a-button type="link" size="small" danger>移除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </template>

        <!-- ── Tab: 里程碑 ── -->
        <template v-if="activeTab === 'milestones'">
          <div style="margin-bottom: 12px;">
            <a-button type="primary" @click="showMilestoneModal = true">+ 新建里程碑</a-button>
            <a-button style="margin-left: 8px;" @click="loadMilestones" :loading="loadingMilestones">刷新</a-button>
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
                  <a-button type="link" size="small" @click="openEditMilestone(record as Milestone)">编辑</a-button>
                  <a-button
                    v-if="!record.actualCompletionDate"
                    type="link"
                    size="small"
                    @click="doMarkMilestoneComplete(record as Milestone)"
                  >标记完成</a-button>
                  <a-popconfirm title="确认删除该里程碑？" @confirm="doDeleteMilestone(record.id as number)">
                    <a-button type="link" size="small" danger>删除</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>

          <!-- 新建/编辑里程碑弹窗 -->
          <a-modal
            v-model:open="showMilestoneModal"
            :title="editingMilestone ? '编辑里程碑' : '新建里程碑'"
            @ok="doSaveMilestone"
            :confirm-loading="milestoneLoading"
            @cancel="resetMilestoneForm"
          >
            <a-form :model="milestoneForm" layout="vertical">
              <a-form-item label="名称" required>
                <a-input v-model:value="milestoneForm.name" />
              </a-form-item>
              <a-form-item label="排序">
                <a-input-number v-model:value="milestoneForm.sort" :min="0" style="width: 100%;" />
              </a-form-item>
              <a-form-item label="实际完成日期（可选）">
                <a-date-picker v-model:value="milestoneForm.actualCompletionDate" style="width: 100%;" value-format="YYYY-MM-DD" />
              </a-form-item>
            </a-form>
          </a-modal>
        </template>

        <!-- ── Tab: 进度记录 ── -->
        <template v-if="activeTab === 'progress'">
          <a-card title="记录今日进度" style="margin-bottom: 16px;">
            <a-form :model="progressForm" layout="vertical">
              <a-form-item label="关联里程碑（可选）">
                <a-select
                  v-model:value="progressForm.milestoneId"
                  placeholder="选择里程碑"
                  allow-clear
                  style="width: 100%;"
                >
                  <a-select-option v-for="m in milestones" :key="m.id" :value="m.id">
                    {{ m.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
              <a-form-item label="进度说明" required>
                <a-textarea v-model:value="progressForm.note" :rows="3" placeholder="描述今日完成内容…" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="progressLoading" @click="doRecordProgress">提交进度</a-button>
              </a-form-item>
            </a-form>
          </a-card>

          <a-card title="进度历史">
            <a-spin :spinning="loadingDashboard">
              <a-timeline v-if="progressLogs.length > 0">
                <a-timeline-item v-for="log in progressLogs" :key="log.id" color="blue">
                  <div style="font-weight: 500;">{{ log.createdAt?.slice(0, 10) ?? '—' }}</div>
                  <div>{{ log.note }}</div>
                  <div v-if="log.milestoneId" style="color: #888; font-size: 12px;">
                    里程碑 #{{ log.milestoneId }}
                  </div>
                </a-timeline-item>
              </a-timeline>
              <a-empty v-else description="暂无进度记录" />
            </a-spin>
          </a-card>
        </template>

        <!-- ── Tab: Dashboard ── -->
        <template v-if="activeTab === 'dashboard'">
          <a-spin :spinning="loadingDashboard">
            <a-row :gutter="16" style="margin-bottom: 16px;">
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
                  <a-statistic
                    title="汇总报告"
                    :value="dashboard.summaries.length"
                    suffix="份"
                  />
                </a-card>
              </a-col>
            </a-row>

            <!-- 里程碑完成率 -->
            <a-card title="里程碑完成率" style="margin-bottom: 16px;">
              <a-progress
                :percent="milestonesCompletionPct"
                status="active"
                :stroke-color="{ from: '#108ee9', to: '#87d068' }"
              />
              <a-list size="small" :data-source="dashboard.milestones" style="margin-top: 12px;">
                <template #renderItem="{ item }">
                  <a-list-item>
                    <a-space style="width: 100%; justify-content: space-between;">
                      <span>{{ item.name }}</span>
                      <a-tag :color="item.actualCompletionDate ? 'green' : 'orange'">
                        {{ item.actualCompletionDate ? `完成于 ${item.actualCompletionDate}` : '进行中' }}
                      </a-tag>
                    </a-space>
                  </a-list-item>
                </template>
              </a-list>
              <a-empty v-if="dashboard.milestones.length === 0" description="暂无里程碑" />
            </a-card>

            <!-- 进度时间轴 -->
            <a-card title="进度时间轴（最近 10 条）">
              <a-timeline v-if="recentLogs.length > 0">
                <a-timeline-item v-for="(log, idx) in recentLogs" :key="idx" color="blue">
                  <span style="font-weight: 500;">{{ log.date }}</span>
                  <span style="margin-left: 8px; color: #555;">{{ log.note }}</span>
                </a-timeline-item>
              </a-timeline>
              <a-empty v-else description="暂无进度数据" />
            </a-card>
          </a-spin>
        </template>

        <!-- ── Tab: 汇总报告 ── -->
        <template v-if="activeTab === 'summary'">
          <a-card title="生成汇总报告" style="margin-bottom: 16px;">
            <a-form :model="summaryForm" layout="vertical">
              <a-form-item label="统计起始日期" required>
                <a-date-picker v-model:value="summaryForm.periodStart" style="width: 100%;" value-format="YYYY-MM-DD" />
              </a-form-item>
              <a-form-item label="统计截止日期" required>
                <a-date-picker v-model:value="summaryForm.periodEnd" style="width: 100%;" value-format="YYYY-MM-DD" />
              </a-form-item>
              <a-form-item label="PM 备注">
                <a-textarea v-model:value="summaryForm.pmNote" :rows="3" />
              </a-form-item>
              <a-form-item>
                <a-button type="primary" :loading="summaryLoading" @click="doCreateSummary">生成并通知 CEO</a-button>
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

        <!-- ── Tab: 施工日志审批 ── -->
        <template v-if="activeTab === 'logs'">
          <a-spin :spinning="loadingLogs">
            <div style="margin-bottom: 12px;">
              <a-button @click="loadLogs" :loading="loadingLogs">刷新</a-button>
            </div>
            <a-empty v-if="logRecords.length === 0" description="暂无施工日志" />
            <a-list v-else :data-source="logRecords" :bordered="false">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="`${item.submitterName} — ${item.formNo}`"
                    :description="`提交于 ${item.createdAt?.slice(0, 16).replace('T', ' ')}`"
                  />
                  <a-tag :color="item.status === 'PENDING' ? 'orange' : item.status === 'APPROVED' ? 'green' : 'red'">
                    {{ { PENDING: '待审批', APPROVING: '审批中', APPROVED: '已通过', REJECTED: '已驳回', RECALLED: '已追溯' }[item.status] ?? item.status }}
                  </a-tag>
                  <a-space style="margin-left: 8px;">
                    <a-button size="small" @click="openReviewModal(item)">批注</a-button>
                    <template v-if="item.status === 'PENDING' || item.status === 'APPROVING'">
                      <a-button type="primary" size="small" :loading="approveLoading" @click="doApproveLog(item.id)">通过</a-button>
                      <a-button danger size="small" @click="openRejectLog(item)">驳回</a-button>
                    </template>
                    <a-popconfirm
                      v-if="isCeo && item.status === 'APPROVED'"
                      title="确认追溯驳回此施工日志？"
                      @confirm="doRecallLog(item.id)"
                    >
                      <a-button size="small" danger>追溯驳回</a-button>
                    </a-popconfirm>
                  </a-space>
                </a-list-item>
              </template>
            </a-list>
          </a-spin>

          <a-modal v-model:open="showReviewModal" title="PM 批注" @ok="doReviewLog" :confirm-loading="reviewLoading">
            <a-form layout="vertical">
              <a-form-item label="批注内容">
                <a-textarea v-model:value="reviewNote" :rows="4" placeholder="输入批注（不影响审批状态）" />
              </a-form-item>
            </a-form>
          </a-modal>

          <a-modal v-model:open="showRejectLogModal" title="驳回施工日志" @ok="doRejectLog" :confirm-loading="approveLoading">
            <a-form layout="vertical">
              <a-form-item label="驳回原因">
                <a-textarea v-model:value="rejectLogComment" :rows="3" />
              </a-form-item>
            </a-form>
          </a-modal>
        </template>

      </a-card>
    </a-spin>
  </div>
</template>

<script setup lang="ts">
/**
 * 项目详情页 — projects/[id].vue
 * 数据来源：
 *   GET /api/projects/{id} — 项目详情 + 成员列表
 *   GET /api/projects/{id}/milestones — 里程碑列表
 *   GET /api/projects/{id}/dashboard — Dashboard 数据（进度日志/里程碑/工作项）
 *   POST /api/projects/{id}/milestones — 创建里程碑
 *   PUT /api/projects/{id}/milestones/{milestoneId} — 更新里程碑
 *   DELETE /api/projects/{id}/milestones/{milestoneId} — 删除里程碑
 *   POST /api/projects/{id}/progress — 记录进度
 *   PATCH /api/projects/{id}/config — 更新周期配置（CEO）
 *   POST /api/projects/{id}/members — 添加成员（CEO）
 *   DELETE /api/projects/{id}/members/{employeeId} — 移除成员（CEO）
 *   POST /api/projects/{id}/construction-summary — 生成汇总报告
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'

interface ProjectDetail {
  id: number
  name: string
  status: string
  startDate: string | null
  actualEndDate: string | null
  logCycleDays: number
  logReportCycleDays: number
  members: MemberInfo[] | null
}

interface MemberInfo {
  employeeId: number
  employeeNo: string
  name: string
  role: string
}

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

interface DashboardData {
  project: { id: number; name: string; status: string }
  milestones: Milestone[]
  workItemSummary: { total: number; completed: number }
  timeSeriesData: { date: string; note: string; milestoneId: number }[]
  summaries: SummaryItem[]
}

interface SummaryItem {
  id: number
  periodStart: string
  periodEnd: string
  pmNote: string | null
  ceoNotifiedAt: string | null
  createdAt: string
}

const route = useRoute()
const projectId = computed(() => Number(route.params.id))

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const isCeo = computed(() => role.value === 'ceo')
const isPmOrCeo = computed(() => ['project_manager', 'ceo'].includes(role.value))

const activeTab = ref('info')

// ── 项目基础数据 ──────────────────────────────────────
const loadingProject = ref(false)
const project = ref<ProjectDetail | null>(null)
const members = ref<MemberInfo[]>([])

async function loadProject() {
  loadingProject.value = true
  try {
    const res = await request<ProjectDetail>({ url: `/projects/${projectId.value}`, method: 'GET' })
    project.value = res
    members.value = res.members ?? []
    // 初始化配置表单
    configForm.value.logCycleDays = res.logCycleDays ?? 1
    configForm.value.logReportCycleDays = res.logReportCycleDays ?? 1
  } catch {
    message.error('加载项目详情失败')
  } finally {
    loadingProject.value = false
  }
}

const memberColumns = [
  { title: '员工ID', dataIndex: 'employeeId', key: 'employeeId', width: 80 },
  { title: '工号', dataIndex: 'employeeNo', key: 'employeeNo', width: 100 },
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '角色', dataIndex: 'role', key: 'role', width: 80 },
  ...(isCeo.value ? [{ title: '操作', key: 'action', width: 80 }] : [])
]

// ── 添加/移除成员 ──────────────────────────────────────
const addMemberForm = ref({ employeeId: null as number | null, role: 'MEMBER' })
const addMemberLoading = ref(false)

async function doAddMember() {
  if (!addMemberForm.value.employeeId) {
    message.warning('请输入员工ID')
    return
  }
  addMemberLoading.value = true
  try {
    await request({
      url: `/projects/${projectId.value}/members`,
      method: 'POST',
      body: { employeeId: addMemberForm.value.employeeId, role: addMemberForm.value.role }
    })
    message.success('成员已添加')
    addMemberForm.value = { employeeId: null, role: 'MEMBER' }
    await loadProject()
  } catch {
    message.error('添加失败')
  } finally {
    addMemberLoading.value = false
  }
}

async function doRemoveMember(employeeId: number) {
  try {
    await request({ url: `/projects/${projectId.value}/members/${employeeId}`, method: 'DELETE' })
    message.success('已移除')
    await loadProject()
  } catch {
    message.error('移除失败')
  }
}

// ── 配置 ──────────────────────────────────────────────
const configForm = ref({ logCycleDays: 1, logReportCycleDays: 1 })
const configLoading = ref(false)

async function doUpdateConfig() {
  configLoading.value = true
  try {
    await request({
      url: `/projects/${projectId.value}/config`,
      method: 'PATCH',
      body: { logCycleDays: configForm.value.logCycleDays, logReportCycleDays: configForm.value.logReportCycleDays }
    })
    message.success('配置已更新')
    await loadProject()
  } catch {
    message.error('更新失败')
  } finally {
    configLoading.value = false
  }
}

// ── 里程碑 ────────────────────────────────────────────
const loadingMilestones = ref(false)
const milestones = ref<Milestone[]>([])
const showMilestoneModal = ref(false)
const milestoneLoading = ref(false)
const editingMilestone = ref<Milestone | null>(null)
const milestoneForm = ref({ name: '', sort: 0, actualCompletionDate: null as string | null })

const milestoneColumns = [
  { title: '排序', dataIndex: 'sort', key: 'sort', width: 60 },
  { title: '里程碑名称', dataIndex: 'name', key: 'name' },
  { title: '状态', key: 'actualCompletionDate', width: 180 },
  { title: '操作', key: 'action', width: 180 }
]

async function loadMilestones() {
  loadingMilestones.value = true
  try {
    const res = await request<Milestone[]>({ url: `/projects/${projectId.value}/milestones`, method: 'GET' })
    milestones.value = res
  } catch {
    message.error('加载里程碑失败')
  } finally {
    loadingMilestones.value = false
  }
}

function resetMilestoneForm() {
  editingMilestone.value = null
  milestoneForm.value = { name: '', sort: 0, actualCompletionDate: null }
}

function openEditMilestone(m: Milestone) {
  editingMilestone.value = m
  milestoneForm.value = { name: m.name, sort: m.sort, actualCompletionDate: m.actualCompletionDate }
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
      actualCompletionDate: milestoneForm.value.actualCompletionDate ?? null
    }
    if (editingMilestone.value) {
      await request({ url: `/projects/${projectId.value}/milestones/${editingMilestone.value.id}`, method: 'PUT', body })
      message.success('已更新')
    } else {
      await request({ url: `/projects/${projectId.value}/milestones`, method: 'POST', body })
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
  const today = new Date().toISOString().slice(0, 10)
  try {
    await request({
      url: `/projects/${projectId.value}/milestones/${m.id}`,
      method: 'PUT',
      body: { name: m.name, sort: m.sort, actualCompletionDate: today }
    })
    message.success('已标记完成')
    await loadMilestones()
  } catch {
    message.error('操作失败')
  }
}

async function doDeleteMilestone(id: number) {
  try {
    await request({ url: `/projects/${projectId.value}/milestones/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadMilestones()
  } catch {
    message.error('删除失败')
  }
}

// ── 进度记录 ──────────────────────────────────────────
const progressLogs = ref<ProgressLog[]>([])
const progressForm = ref({ milestoneId: null as number | null, note: '' })
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
    await request({ url: `/projects/${projectId.value}/progress`, method: 'POST', body })
    message.success('进度已记录')
    progressForm.value = { milestoneId: null, note: '' }
    await loadDashboard()
  } catch {
    message.error('记录失败')
  } finally {
    progressLoading.value = false
  }
}

// ── Dashboard ─────────────────────────────────────────
const loadingDashboard = ref(false)
const dashboard = ref<DashboardData>({
  project: { id: 0, name: '', status: '' },
  milestones: [],
  workItemSummary: { total: 0, completed: 0 },
  timeSeriesData: [],
  summaries: []
})

const milestonesCompletionPct = computed(() => {
  const { total, completed } = dashboard.value.workItemSummary
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
})

const recentLogs = computed(() => dashboard.value.timeSeriesData.slice(0, 10))

async function loadDashboard() {
  loadingDashboard.value = true
  try {
    const res = await request<DashboardData>({ url: `/projects/${projectId.value}/dashboard`, method: 'GET' })
    dashboard.value = res
    // 同步 progressLogs 用于进度 Tab 的时间轴
    progressLogs.value = res.timeSeriesData.map((d, idx) => ({
      id: idx,
      projectId: projectId.value,
      milestoneId: d.milestoneId || null,
      note: d.note,
      createdAt: d.date
    }))
  } catch {
    message.error('加载 Dashboard 失败')
  } finally {
    loadingDashboard.value = false
  }
}

// ── 汇总报告 ──────────────────────────────────────────
const summaryForm = ref({ periodStart: null as string | null, periodEnd: null as string | null, pmNote: '' })
const summaryLoading = ref(false)

const summaryColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
  { title: '统计区间', key: 'period', width: 200 },
  { title: 'CEO 通知', key: 'notified', width: 100 },
  { title: 'PM 备注', dataIndex: 'pmNote', key: 'pmNote' },
  { title: '生成时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 }
]

async function doCreateSummary() {
  if (!summaryForm.value.periodStart || !summaryForm.value.periodEnd) {
    message.warning('请选择统计区间')
    return
  }
  summaryLoading.value = true
  try {
    await request({
      url: `/projects/${projectId.value}/construction-summary`,
      method: 'POST',
      body: {
        periodStart: summaryForm.value.periodStart,
        periodEnd: summaryForm.value.periodEnd,
        pmNote: summaryForm.value.pmNote || null
      }
    })
    message.success('汇总报告已生成，CEO 已收到通知')
    summaryForm.value = { periodStart: null, periodEnd: null, pmNote: '' }
    await loadDashboard()
  } catch {
    message.error('生成失败')
  } finally {
    summaryLoading.value = false
  }
}

// ── 施工日志审批 ──────────────────────────────────────
interface LogRecord {
  id: number
  formNo: string
  submitterName: string
  status: string
  createdAt: string
}

const loadingLogs = ref(false)
const logRecords = ref<LogRecord[]>([])
const approveLoading = ref(false)
const showReviewModal = ref(false)
const showRejectLogModal = ref(false)
const reviewNote = ref('')
const rejectLogComment = ref('')
const reviewingLogId = ref<number | null>(null)
const rejectingLogId = ref<number | null>(null)

async function loadLogs() {
  loadingLogs.value = true
  try {
    const res = await request<LogRecord[]>({ url: '/logs/records', method: 'GET' })
    logRecords.value = (res as LogRecord[]).filter((r: LogRecord) => r.formNo?.startsWith('LOG'))
  } catch {
    message.error('加载施工日志失败')
  } finally {
    loadingLogs.value = false
  }
}

function openReviewModal(item: LogRecord) {
  reviewingLogId.value = item.id
  reviewNote.value = ''
  showReviewModal.value = true
}

function openRejectLog(item: LogRecord) {
  rejectingLogId.value = item.id
  rejectLogComment.value = ''
  showRejectLogModal.value = true
}

async function doReviewLog() {
  if (!reviewingLogId.value) return
  try {
    await request({
      url: `/logs/construction-logs/${reviewingLogId.value}/review`,
      method: 'PATCH',
      body: { pmNote: reviewNote.value }
    })
    message.success('批注已保存')
    showReviewModal.value = false
  } catch {
    message.error('保存失败')
  }
}

async function doApproveLog(id: number) {
  approveLoading.value = true
  try {
    await request({
      url: `/logs/${id}/approve`,
      method: 'POST',
      body: { comment: '' }
    })
    message.success('已通过')
    await loadLogs()
  } catch {
    message.error('操作失败')
  } finally {
    approveLoading.value = false
  }
}

async function doRejectLog() {
  if (!rejectingLogId.value) return
  approveLoading.value = true
  try {
    await request({
      url: `/logs/${rejectingLogId.value}/reject`,
      method: 'POST',
      body: { comment: rejectLogComment.value }
    })
    message.success('已驳回')
    showRejectLogModal.value = false
    await loadLogs()
  } catch {
    message.error('操作失败')
  } finally {
    approveLoading.value = false
  }
}

async function doRecallLog(id: number) {
  try {
    await request({ url: `/logs/construction-logs/${id}/recall`, method: 'POST' })
    message.success('已追溯驳回')
    await loadLogs()
  } catch {
    message.error('操作失败')
  }
}

function onTabChange(key: string) {
  if (key === 'logs') loadLogs()
}

// ── 初始化 ────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([
    loadProject(),
    loadMilestones(),
    loadDashboard()
  ])
})
</script>
