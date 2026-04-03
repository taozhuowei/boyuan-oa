<template>
  <AppShell title="工作台">
    <!--
      工作台首页 (pages/index/index.vue)
      布局：固定视口，不整页滚动，三行 Flex 列：
        Row1 — 待办 + 通知 横向扁平条（flex-shrink: 0）
        Row2 — 关键 KPI 卡片（flex-shrink: 0）
        Row3 — 项目进度面板（flex: 1，内部滚动）
    -->
    <view class="workbench">

      <!-- ① 横向信息条：待办 + 通知 -->
      <view class="alert-row">

        <!-- 待办条 -->
        <view class="alert-strip todo-strip">
          <view class="strip-head">
            <!-- #ifdef H5 -->
            <AuditOutlined class="strip-icon" />
            <!-- #endif -->
            <text class="strip-title">待办事项</text>
            <view v-if="todoItems.length" class="count-chip">{{ todoItems.length }}</view>
          </view>
          <view class="strip-scroll">
            <view
              v-for="item in todoItems"
              :key="item.id"
              class="strip-item"
              @click="goTo(item.path)"
            >
              <view class="priority-tag" :class="'p-' + item.priority">{{ item.category }}</view>
              <text class="item-title">{{ item.title }}</text>
            </view>
            <view v-if="!todoItems.length" class="strip-empty">暂无待办</view>
          </view>
          <view class="strip-link" @click="goTo('/pages/todo/index')">
            <text>全部</text>
            <!-- #ifdef H5 -->
            <RightOutlined />
            <!-- #endif -->
          </view>
        </view>


      </view>

      <!-- ② 关键 KPI 行（角色定制，最需关注的数据） -->
      <view class="kpi-row">
        <view
          v-for="kpi in keyKpis"
          :key="kpi.key"
          class="kpi-card"
          :class="kpi.urgent ? 'kpi-urgent' : ''"
        >
          <view class="kpi-top">
            <!-- #ifdef H5 -->
            <component :is="kpi.icon" class="kpi-icon" />
            <!-- #endif -->
            <view v-if="kpi.urgent" class="urgent-dot" />
          </view>
          <text class="kpi-value">{{ kpi.value }}</text>
          <text class="kpi-label">{{ kpi.label }}</text>
        </view>
      </view>

      <!-- ③ 项目进度面板（CEO/PM/劳工可见；财务不负责项目管理，不显示） -->
      <view v-if="role !== 'finance'" class="project-panel">
        <view class="panel-head">
          <text class="panel-title">在建项目进度</text>
          <text class="panel-date">{{ todayStr }}</text>
        </view>
        <view class="project-list">
          <view v-for="proj in projects" :key="proj.id" class="project-row">
            <view class="proj-name-col">
              <text class="proj-name">{{ proj.name }}</text>
              <text class="proj-phase">{{ proj.phase }}</text>
            </view>
            <view class="prog-col">
              <view class="prog-track">
                <view
                  class="prog-fill"
                  :style="{ width: proj.progress + '%', backgroundColor: progressColor(proj.status) }"
                />
              </view>
              <text class="prog-pct">{{ proj.progress }}%</text>
            </view>
            <view class="proj-status-col">
              <view class="status-chip" :class="'s-' + proj.status">{{ proj.statusLabel }}</view>
            </view>
            <text class="proj-date">截止 {{ proj.dueDate }}</text>
          </view>
          <view v-if="!projects.length" class="proj-empty">暂无在建项目</view>
        </view>
      </view>

    </view>
  </AppShell>
</template>

<script lang="ts" setup>
/**
 * @page 工作台首页 (pages/index/index.vue)
 * @description 数据中心视图。不整页滚动，固定三行布局：
 *   Row1 横向待办/通知条 → Row2 角色定制 KPI → Row3 项目进度（内部滚动）
 * @dataFlow userStore.role → keyKpis / todoItems / projects
 */
import { computed, markRaw, ref } from 'vue'
import { useUserStore } from '../../stores'
import { roleNameMap } from '../../utils/access'
import AppShell from '../../layouts/AppShell.vue'

/* #ifdef H5 */
import {
  AuditOutlined,
  RightOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  DollarOutlined,
  TeamOutlined,
  BuildOutlined,
  SolutionOutlined
} from '@ant-design/icons-vue'
/* #endif */

const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? 'employee')

// ── 今日字符串 ────────────────────────────────────────────────────────────
const todayStr = computed(() => {
  const d = new Date()
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${days[d.getDay()]}`
})

// ── 关键 KPI（角色定制，最需行动的数据优先） ─────────────────────────────
/* #ifdef H5 */
const kpiMap: Record<string, Array<{ key: string; icon: any; value: string; label: string; urgent: boolean }>> = {
  ceo: [
    { key: 'pending',   icon: markRaw(AuditOutlined),         value: '5',       label: '待处理审批',     urgent: true  },
    { key: 'abnormal',  icon: markRaw(CalendarOutlined),      value: '3 人',    label: '本周考勤异常',   urgent: true  },
    { key: 'risk',      icon: markRaw(WarningOutlined),        value: '1 个',    label: '进度预警项目',   urgent: true  },
    { key: 'payroll',   icon: markRaw(DollarOutlined),         value: '进行中',  label: '本月薪资窗口期', urgent: false }
  ],
  finance: [
    { key: 'settle',    icon: markRaw(AuditOutlined),         value: '3 单',    label: '待结算薪资',     urgent: true  },
    { key: 'dispute',   icon: markRaw(WarningOutlined),        value: '2 件',    label: '薪资异议待处理', urgent: true  },
    { key: 'window',    icon: markRaw(ClockCircleOutlined),   value: '第3天',   label: '窗口期进度',     urgent: false },
    { key: 'staff',     icon: markRaw(TeamOutlined),           value: '28',      label: '在职员工总数',   urgent: false }
  ],
  project_manager: [
    { key: 'pending',   icon: markRaw(AuditOutlined),         value: '4 项',    label: '待我审批',       urgent: true  },
    { key: 'risk',      icon: markRaw(WarningOutlined),        value: '1 个',    label: '进度预警项目',   urgent: true  },
    { key: 'log',       icon: markRaw(BuildOutlined),          value: '7 份',    label: '待审施工日志',   urgent: false },
    { key: 'members',   icon: markRaw(TeamOutlined),           value: '18 人',   label: '项目组成员',     urgent: false }
  ],
  employee: [
    { key: 'slip',      icon: markRaw(DollarOutlined),         value: '待确认',  label: '本月工资条',     urgent: true  },
    { key: 'leave',     icon: markRaw(CalendarOutlined),      value: '12 天',   label: '剩余年假',       urgent: false },
    { key: 'overtime',  icon: markRaw(ClockCircleOutlined),   value: '8 h',     label: '本月加班时长',   urgent: false }
  ],
  worker: [
    { key: 'slip',      icon: markRaw(DollarOutlined),         value: '待确认',  label: '本月工资条',     urgent: true  },
    { key: 'log',       icon: markRaw(BuildOutlined),          value: '今日待填', label: '施工日志',       urgent: true  },
    { key: 'leave',     icon: markRaw(CalendarOutlined),      value: '5 天',    label: '剩余年假',       urgent: false }
  ]
}
/* #endif */

const keyKpis = computed(() => {
  /* #ifdef H5 */
  return kpiMap[role.value] ?? kpiMap.employee
  /* #endif */
  /* #ifndef H5 */
  return []
  /* #endif */
})

// ── 待办事项（按角色 mock） ──────────────────────────────────────────────
const todoItems = computed(() => {
  const r = role.value
  if (r === 'ceo') {
    return [
      { id: 1, title: '项目二部施工日志待审核', category: '项目', priority: 'high', path: '/pages/projects/index'   },
      { id: 2, title: '全员 3月工资条待发放',   category: '薪资', priority: 'mid',  path: '/pages/payroll/index'   },
      { id: 3, title: '李小龙请假申请（3天）',   category: '考勤', priority: 'low',  path: '/pages/attendance/index' }
    ]
  }
  if (r === 'finance') {
    return [
      { id: 1, title: '全员 3月工资条待发放',   category: '薪资', priority: 'high', path: '/pages/payroll/index'   },
      { id: 2, title: '工资异议待处理（2件）',   category: '薪资', priority: 'mid',  path: '/pages/payroll/index'   },
      { id: 3, title: '本月考勤异常待核查',       category: '考勤', priority: 'low',  path: '/pages/attendance/index' }
    ]
  }
  if (r === 'project_manager') {
    return [
      { id: 1, title: '三号楼施工日志待审核',   category: '项目', priority: 'high', path: '/pages/projects/index'   },
      { id: 2, title: '王建国请假申请（1天）',   category: '考勤', priority: 'low',  path: '/pages/attendance/index' }
    ]
  }
  if (r === 'worker') {
    return [
      { id: 1, title: '今日施工日志未提交',      category: '日志', priority: 'high', path: '/pages/projects/index' }
    ]
  }
  return [
    { id: 1, title: '3月工资条待确认签字',       category: '薪资', priority: 'high', path: '/pages/payroll/index' }
  ]
})

// ── 项目进度（mock，后续对接 GET /projects?status=active） ───────────────
const projects = ref([
  { id: 1, name: '万达广场中央空调安装', phase: '冷媒管道焊接阶段', progress: 62, status: 'normal',  statusLabel: '正常',    dueDate: '2026-04-30' },
  { id: 2, name: '冷链物流园冷库制冷',   phase: '管道支架安装阶段', progress: 38, status: 'normal',  statusLabel: '正常',    dueDate: '2026-05-20' },
  { id: 3, name: '汽车涂装车间通风排烟', phase: '深化设计阶段',     progress: 15, status: 'warning', statusLabel: '预警',    dueDate: '2026-06-10' },
  { id: 4, name: '医院手术室净化空调',   phase: '风管安装阶段',     progress: 55, status: 'delayed', statusLabel: '延期',    dueDate: '2026-03-31' },
  { id: 5, name: '科技园区新风系统改造', phase: '竣工验收阶段',     progress: 98, status: 'normal',  statusLabel: '即将完工', dueDate: '2026-01-15' }
])

function progressColor(status: string): string {
  const map: Record<string, string> = {
    normal: '#2e7d32',
    warning: '#ed6c02',
    delayed: '#ba1a1a'
  }
  return map[status] ?? '#003466'
}

function goTo(path: string) {
  uni.navigateTo({ url: path })
}
</script>

<style lang="scss" scoped>
// ── 工作台容器：填满 shell-main，固定视口不产生外层滚动 ─────────────────
.workbench {
  height: 100%;
  overflow: hidden;       // 阻止内容撑出 shell-main
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;          // shell-main 已去除 padding，在此补回
  box-sizing: border-box; // 使 height:100% 包含 padding
}

// ── ROW 1: 横向信息条（上下两行） ────────────────────────────────────────
.alert-row {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alert-strip {
  width: 100%;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  height: 52px;

  .strip-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-right: 12px;
    border-right: 1px solid var(--surface-high);

    .strip-icon {
      font-size: 16px;
      color: var(--primary);
    }

    .strip-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--on-surface);
      white-space: nowrap;
    }

    .count-chip {
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: var(--error);
      border-radius: 9px;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .unread-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--error);
    }
  }

  .strip-scroll {
    flex: 1;
    min-width: 0;         // 关键：flex 子项默认 min-width=auto，不加这个 overflow-x 不生效
    display: flex;
    align-items: center;
    gap: 10px;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar { display: none; }
  }

  .strip-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 12px;
    background: var(--surface);
    border-radius: var(--radius-sm);
    border: 1px solid var(--surface-high);
    cursor: pointer;
    transition: border-color 0.15s;

    &:hover { border-color: var(--primary); }

    .priority-tag {
      font-size: 11px;
      font-weight: 500;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;

      &.p-high { background: #fff1f0; color: var(--error); }
      &.p-mid  { background: #fff7e6; color: var(--warning); }
      &.p-low  { background: #f6ffed; color: var(--success); }
    }

    .item-title {
      font-size: 13px;
      color: var(--on-surface);
      white-space: nowrap;
    }

  }

  .strip-empty {
    font-size: 13px;
    color: var(--on-surface-variant);
  }

  .strip-link {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--primary);
    cursor: pointer;
    padding-left: 12px;
    border-left: 1px solid var(--surface-high);
    white-space: nowrap;
  }
}

// ── ROW 2: KPI 卡片行 ────────────────────────────────────────────────────
.kpi-row {
  flex-shrink: 0;
  display: flex;
  gap: 16px;
}

.kpi-card {
  flex: 1;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;

  &.kpi-urgent {
    border-left: 3px solid var(--error);

    .kpi-icon { color: var(--error); }
    .kpi-value { color: var(--error); }
  }

  .kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .kpi-icon {
    font-size: 18px;
    color: var(--primary);
  }

  .urgent-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--error);
  }

  .kpi-value {
    font-size: 26px;
    font-weight: 700;
    color: var(--primary);
    line-height: 1.2;
    font-family: var(--font-display);
  }

  .kpi-label {
    font-size: 12px;
    color: var(--on-surface-variant);
  }
}

// ── ROW 3: 项目进度面板 ───────────────────────────────────────────────────
.project-panel {
  flex: 1;
  min-height: 0;             // 关键：允许 flex 子项压缩到内容以下
  display: flex;
  flex-direction: column;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-md);
  overflow: hidden;

  .panel-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid var(--surface-high);

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--on-surface);
    }

    .panel-date {
      font-size: 12px;
      color: var(--on-surface-variant);
    }
  }

  .project-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
}

.project-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--surface);
  transition: background 0.15s;

  &:hover { background: var(--surface); }
  &:last-child { border-bottom: none; }

  .proj-name-col {
    width: 200px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    .proj-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface);
    }

    .proj-phase {
      font-size: 12px;
      color: var(--on-surface-variant);
    }
  }

  .prog-col {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;

    .prog-track {
      flex: 1;
      height: 6px;
      background: var(--surface-high);
      border-radius: 3px;
      overflow: hidden;
    }

    .prog-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .prog-pct {
      width: 36px;
      font-size: 13px;
      font-weight: 600;
      color: var(--on-surface);
      text-align: right;
    }
  }

  .proj-status-col {
    width: 72px;
    flex-shrink: 0;
    display: flex;
    justify-content: center;
  }

  .status-chip {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    white-space: nowrap;

    &.s-normal  { background: #f0f9eb; color: var(--success); }
    &.s-warning { background: #fff7e6; color: var(--warning); }
    &.s-delayed { background: #fff1f0; color: var(--error);   }
  }

  .proj-date {
    width: 120px;
    flex-shrink: 0;
    font-size: 12px;
    color: var(--on-surface-variant);
    text-align: right;
  }
}

.proj-empty {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  color: var(--on-surface-variant);
}
</style>
