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
          <a-tab-pane v-if="isPmOrCeo" key="second-roles" tab="第二角色" />
          <a-tab-pane key="material" tab="实体成本" />
          <a-tab-pane key="aftersale" tab="售后问题单" />
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
                <a-button data-catch="project-members-add-btn" type="primary" :loading="addMemberLoading" @click="doAddMember">添加成员</a-button>
                <!-- TODO data-catch: project-members-user-select — element not found -->
                <!-- TODO data-catch: project-members-save-btn — element not found -->
              </a-space>
            </div>
          </template>

          <a-table
            data-catch="project-members-list"
            :columns="memberColumns"
            :data-source="members"
            :loading="loadingProject"
            row-key="employeeId"
            size="small"
            :pagination="false"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'role'">
                <a-tag :color="record.role === 'PM' ? 'blue' : 'default'">{{ record.role === 'PM' ? '项目经理' : '成员' }}</a-tag>
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
            <a-button data-catch="project-milestone-add-btn" type="primary" @click="showMilestoneModal = true">+ 新建里程碑</a-button>
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
            :okButtonProps="{ 'data-catch': 'project-milestone-save-btn' }"
          >
            <a-form :model="milestoneForm" layout="vertical">
              <a-form-item label="名称" required>
                <a-input v-model:value="milestoneForm.name" />
              </a-form-item>
              <a-form-item label="排序">
                <a-input-number v-model:value="milestoneForm.sort" :min="0" style="width: 100%;" />
              </a-form-item>
              <a-form-item label="实际完成日期（可选）">
                <a-date-picker v-model:value="milestoneForm.actualCompletionDate" style="width: 100%;" value-format="YYYY-MM-DD" placeholder="请选择日期" />
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
                <a-button data-catch="project-progress-update-btn" type="primary" :loading="progressLoading" @click="doRecordProgress">提交进度</a-button>
              </a-form-item>
              <!-- TODO data-catch: project-progress-save-btn — element not found -->
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

        <!-- TODO data-catch: project-cost-add-btn — element not found -->
        <!-- TODO data-catch: project-cost-save-btn — element not found -->
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
                <a-date-picker v-model:value="summaryForm.periodStart" style="width: 100%;" value-format="YYYY-MM-DD" placeholder="请选择日期" />
              </a-form-item>
              <a-form-item label="统计截止日期" required>
                <a-date-picker v-model:value="summaryForm.periodEnd" style="width: 100%;" value-format="YYYY-MM-DD" placeholder="请选择日期" />
              </a-form-item>
              <a-form-item label="项目经理备注">
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

          <a-modal v-model:open="showReviewModal" title="批注" @ok="doReviewLog" :confirm-loading="reviewLoading">
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

        <!-- ── Tab: 第二角色 ── -->
        <template v-if="activeTab === 'second-roles'">
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: end;">
            <a-form-item label="员工 ID" style="margin: 0;">
              <a-input-number v-model:value="srForm.employeeId" :precision="0" style="width: 140px" />
            </a-form-item>
            <a-form-item label="第二角色" style="margin: 0;">
              <a-select v-model:value="srForm.roleCode" style="width: 200px">
                <a-select-option v-for="d in srDefs" :key="d.code" :value="d.code">{{ d.name }}（{{ d.appliesTo === 'OFFICE' ? '员工' : '劳工' }}）</a-select-option>
              </a-select>
            </a-form-item>
            <a-button type="primary" :loading="srLoading" @click="assignSecondRole">分配</a-button>
            <a-button @click="loadSecondRoles">刷新</a-button>
          </div>
          <a-table :columns="srColumns" :data-source="srAssignments" :loading="srLoading" row-key="id" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'roleName'">{{ srRoleName(record.roleCode) }}</template>
              <template v-if="column.key === 'action'">
                <a-popconfirm title="确定撤销此第二角色？" @confirm="revokeSecondRole(record.id)">
                  <a-button type="link" danger size="small">撤销</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
        </template>

        <!-- ── Tab: 实体成本 ── -->
        <template v-if="activeTab === 'material'">
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
            <a-button type="primary" @click="openMaterialModal">+ 录入实体成本</a-button>
            <a-button @click="loadMaterialCosts">刷新</a-button>
            <span style="margin-left: auto; color: #666;">
              合计：¥{{ formatAmount(materialTotal) }}
            </span>
          </div>
          <a-table :columns="materialColumns" :data-source="materialCosts" :loading="materialLoading" row-key="id" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'subtotal'">¥{{ formatAmount(Number(record.quantity) * Number(record.unitPrice)) }}</template>
              <template v-if="column.key === 'action'">
                <a-popconfirm title="确定删除？" @confirm="deleteMaterialCost(record.id)">
                  <a-button type="link" danger size="small">删除</a-button>
                </a-popconfirm>
              </template>
            </template>
          </a-table>
          <a-modal v-model:open="showMaterialModal" title="录入实体成本" :confirm-loading="materialSubmitting" @ok="submitMaterialCost" @cancel="showMaterialModal = false" width="540px">
            <a-form layout="vertical" :model="materialForm">
              <a-row :gutter="16">
                <a-col :span="12"><a-form-item label="物品名称" required><a-input v-model:value="materialForm.itemName" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="规格"><a-input v-model:value="materialForm.spec" /></a-form-item></a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="8"><a-form-item label="数量" required><a-input-number v-model:value="materialForm.quantity" :min="0" :precision="2" style="width: 100%" /></a-form-item></a-col>
                <a-col :span="8"><a-form-item label="单位" required><a-input v-model:value="materialForm.unit" /></a-form-item></a-col>
                <a-col :span="8"><a-form-item label="单价（元）" required><a-input-number v-model:value="materialForm.unitPrice" :min="0" :precision="2" style="width: 100%" /></a-form-item></a-col>
              </a-row>
              <a-row :gutter="16">
                <a-col :span="12"><a-form-item label="发生日期" required><a-input v-model:value="materialForm.occurredOn" placeholder="YYYY-MM-DD" /></a-form-item></a-col>
                <a-col :span="12"><a-form-item label="备注"><a-input v-model:value="materialForm.remark" /></a-form-item></a-col>
              </a-row>
            </a-form>
          </a-modal>
        </template>

        <!-- ── Tab: 售后问题单 ── -->
        <template v-if="activeTab === 'aftersale'">
          <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center;">
            <a-button type="primary" @click="openTicketModal">+ 新建问题单</a-button>
            <a-button @click="loadTickets">刷新</a-button>
          </div>
          <a-table :columns="ticketColumns" :data-source="tickets" :loading="ticketsLoading" row-key="id" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'typeName'">{{ ticketTypeName(record.typeCode) }}</template>
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === 'CLOSED' ? 'green' : record.status === 'PROCESSING' ? 'blue' : 'orange'">
                  {{ { PENDING: '待处理', PROCESSING: '处理中', CLOSED: '已关闭' }[record.status] ?? record.status }}
                </a-tag>
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" size="small" @click="openTicketEdit(record)">编辑</a-button>
              </template>
            </template>
          </a-table>
          <a-modal v-model:open="showTicketModal" :title="editingTicketId ? '编辑问题单' : '新建问题单'" :confirm-loading="ticketSubmitting" @ok="submitTicket" @cancel="showTicketModal = false" width="600px">
            <a-form layout="vertical" :model="ticketForm">
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="问题类型" required>
                    <a-select v-model:value="ticketForm.typeCode">
                      <a-select-option v-for="t in ticketTypes" :key="t.code" :value="t.code">{{ t.name }}</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="售后日期" required><a-input v-model:value="ticketForm.incidentDate" placeholder="YYYY-MM-DD" /></a-form-item>
                </a-col>
              </a-row>
              <a-form-item label="问题描述" required><a-textarea v-model:value="ticketForm.description" :rows="3" /></a-form-item>
              <a-form-item label="客户反馈"><a-textarea v-model:value="ticketForm.customerFeedback" :rows="2" /></a-form-item>
              <a-form-item label="处理结果"><a-textarea v-model:value="ticketForm.resolution" :rows="2" /></a-form-item>
              <a-form-item label="状态">
                <a-select v-model:value="ticketForm.status">
                  <a-select-option value="PENDING">待处理</a-select-option>
                  <a-select-option value="PROCESSING">处理中</a-select-option>
                  <a-select-option value="CLOSED">已关闭</a-select-option>
                </a-select>
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
  { title: '已通知CEO', key: 'notified', width: 100 },
  { title: '项目经理备注', dataIndex: 'pmNote', key: 'pmNote' },
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
  if (key === 'second-roles') { loadSecondRoleDefs(); loadSecondRoles() }
  if (key === 'material') loadMaterialCosts()
  if (key === 'aftersale') { loadTicketTypes(); loadTickets() }
}

// ── 第二角色 ─────────────────────────────────────────────

interface SecondRoleDef { code: string; name: string; appliesTo: 'OFFICE' | 'LABOR'; projectBound: boolean }
interface SecondRoleAssignment { id: number; employeeId: number; roleCode: string; projectId: number | null }
const srDefs = ref<SecondRoleDef[]>([])
const srAssignments = ref<SecondRoleAssignment[]>([])
const srLoading = ref(false)
const srForm = ref<{ employeeId: number | null; roleCode: string | null }>({ employeeId: null, roleCode: null })
const srColumns = [
  { title: '员工 ID', dataIndex: 'employeeId', key: 'employeeId', width: 100 },
  { title: '角色', key: 'roleName' },
  { title: '操作', key: 'action', width: 100 }
]
async function loadSecondRoleDefs() {
  if (srDefs.value.length) return
  try { srDefs.value = await request<SecondRoleDef[]>({ url: '/second-roles/defs' }) ?? [] } catch { srDefs.value = [] }
}
async function loadSecondRoles() {
  srLoading.value = true
  try {
    srAssignments.value = await request<SecondRoleAssignment[]>({ url: `/second-roles?projectId=${projectId.value}` }) ?? []
  } catch { srAssignments.value = [] } finally { srLoading.value = false }
}
function srRoleName(code: string) { return srDefs.value.find(d => d.code === code)?.name ?? code }
async function assignSecondRole() {
  if (!srForm.value.employeeId || !srForm.value.roleCode) { message.warning('请填写员工 ID 与第二角色'); return }
  try {
    await request({ url: '/second-roles', method: 'POST', body: {
      employeeId: srForm.value.employeeId, roleCode: srForm.value.roleCode, projectId: projectId.value
    }})
    message.success('已分配')
    srForm.value = { employeeId: null, roleCode: null }
    await loadSecondRoles()
  } catch {}
}
async function revokeSecondRole(id: number) {
  try { await request({ url: `/second-roles/${id}`, method: 'DELETE' }); await loadSecondRoles() } catch {}
}

// ── 实体成本 ────────────────────────────────────────────

interface MaterialCost { id: number; itemName: string; spec?: string; quantity: number; unit: string; unitPrice: number; occurredOn: string; remark?: string }
const materialCosts = ref<MaterialCost[]>([])
const materialLoading = ref(false)
const showMaterialModal = ref(false)
const materialSubmitting = ref(false)
const materialForm = ref<{ itemName: string; spec: string; quantity: number | null; unit: string; unitPrice: number | null; occurredOn: string; remark: string }>({
  itemName: '', spec: '', quantity: null, unit: '', unitPrice: null, occurredOn: new Date().toISOString().slice(0, 10), remark: ''
})
const materialColumns = [
  { title: '物品名称', dataIndex: 'itemName', key: 'itemName' },
  { title: '规格', dataIndex: 'spec', key: 'spec' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100 },
  { title: '小计', key: 'subtotal', width: 110 },
  { title: '日期', dataIndex: 'occurredOn', key: 'occurredOn', width: 110 },
  { title: '操作', key: 'action', width: 80 }
]
const materialTotal = computed(() => materialCosts.value.reduce((s, m) => s + Number(m.quantity) * Number(m.unitPrice), 0))
async function loadMaterialCosts() {
  materialLoading.value = true
  try {
    materialCosts.value = await request<MaterialCost[]>({ url: `/projects/${projectId.value}/material-costs` }) ?? []
  } catch { materialCosts.value = [] } finally { materialLoading.value = false }
}
function openMaterialModal() {
  materialForm.value = { itemName: '', spec: '', quantity: null, unit: '', unitPrice: null, occurredOn: new Date().toISOString().slice(0, 10), remark: '' }
  showMaterialModal.value = true
}
async function submitMaterialCost() {
  if (!materialForm.value.itemName || !materialForm.value.quantity || !materialForm.value.unit || !materialForm.value.unitPrice || !materialForm.value.occurredOn) {
    message.warning('必填项不完整'); return
  }
  materialSubmitting.value = true
  try {
    await request({ url: `/projects/${projectId.value}/material-costs`, method: 'POST', body: materialForm.value })
    message.success('已录入'); showMaterialModal.value = false; await loadMaterialCosts()
  } catch {} finally { materialSubmitting.value = false }
}
async function deleteMaterialCost(id: number) {
  try { await request({ url: `/projects/${projectId.value}/material-costs/${id}`, method: 'DELETE' }); await loadMaterialCosts() } catch {}
}
function formatAmount(n: number) { return Number(n ?? 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// ── 售后问题单 ─────────────────────────────────────────

interface AfterSaleType { code: string; name: string }
interface AfterSaleTicket { id: number; projectId: number; typeCode: string; incidentDate: string; description: string; customerFeedback?: string; resolution?: string; status: string }
const ticketTypes = ref<AfterSaleType[]>([])
const tickets = ref<AfterSaleTicket[]>([])
const ticketsLoading = ref(false)
const showTicketModal = ref(false)
const ticketSubmitting = ref(false)
const editingTicketId = ref<number | null>(null)
const ticketForm = ref<{ typeCode: string | null; incidentDate: string; description: string; customerFeedback: string; resolution: string; status: string }>({
  typeCode: null, incidentDate: new Date().toISOString().slice(0, 10), description: '', customerFeedback: '', resolution: '', status: 'PENDING'
})
const ticketColumns = [
  { title: '日期', dataIndex: 'incidentDate', key: 'incidentDate', width: 110 },
  { title: '类型', key: 'typeName', width: 130 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '状态', key: 'status', width: 100 },
  { title: '操作', key: 'action', width: 80 }
]
async function loadTicketTypes() {
  if (ticketTypes.value.length) return
  try { ticketTypes.value = await request<AfterSaleType[]>({ url: '/after-sale/types' }) ?? [] } catch { ticketTypes.value = [] }
}
function ticketTypeName(code: string) { return ticketTypes.value.find(t => t.code === code)?.name ?? code }
async function loadTickets() {
  ticketsLoading.value = true
  try { tickets.value = await request<AfterSaleTicket[]>({ url: `/after-sale/tickets?projectId=${projectId.value}` }) ?? [] }
  catch { tickets.value = [] } finally { ticketsLoading.value = false }
}
function openTicketModal() {
  editingTicketId.value = null
  ticketForm.value = { typeCode: ticketTypes.value[0]?.code ?? null, incidentDate: new Date().toISOString().slice(0, 10), description: '', customerFeedback: '', resolution: '', status: 'PENDING' }
  showTicketModal.value = true
}
function openTicketEdit(record: AfterSaleTicket) {
  editingTicketId.value = record.id
  ticketForm.value = {
    typeCode: record.typeCode,
    incidentDate: record.incidentDate,
    description: record.description,
    customerFeedback: record.customerFeedback ?? '',
    resolution: record.resolution ?? '',
    status: record.status
  }
  showTicketModal.value = true
}
async function submitTicket() {
  if (!ticketForm.value.typeCode || !ticketForm.value.incidentDate || !ticketForm.value.description) {
    message.warning('类型/日期/描述必填'); return
  }
  ticketSubmitting.value = true
  try {
    const body = { ...ticketForm.value, projectId: projectId.value }
    if (editingTicketId.value) {
      await request({ url: `/after-sale/tickets/${editingTicketId.value}`, method: 'PUT', body })
    } else {
      await request({ url: '/after-sale/tickets', method: 'POST', body })
    }
    message.success('已保存'); showTicketModal.value = false; await loadTickets()
  } catch {} finally { ticketSubmitting.value = false }
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

<style scoped>
.project-detail-page {
  /* Flow layout: natural top-to-bottom content flow */
}

/* Removed flex constraints to allow natural content flow */
</style>
