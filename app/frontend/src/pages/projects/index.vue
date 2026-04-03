<template>
  <AppShell title="项目管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">项目管理</text>
          <text class="page-desc">{{ isCEO ? '全公司项目总览与资源调配' : '我的项目与任务管理' }}</text>
        </view>
        <view class="header-stats">
          <view class="stat-item">
            <text class="stat-value">{{ stats.active }}</text>
            <text class="stat-label">在建项目</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.completed }}</text>
            <text class="stat-label">已完成</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Button"
            v-if="Button && isCEO"
            type="primary"
            @click="showCreateModal = true"
          >
            新建项目
          </component>
          <component
            :is="Select"
            v-if="Select"
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 120px"
          />
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="searchKeyword"
            placeholder="搜索项目名称"
            :prefix="'search'"
            style="width: 240px"
          />
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="main-content">
        <!-- 左栏：项目列表 -->
        <view class="left-panel content-card">
          <view class="card-header">
            <text class="card-title">项目列表（{{ filteredProjects.length }}）</text>
          </view>
          <view class="card-body scrollable">
            <view v-if="filteredProjects.length" class="project-list">
              <view
                v-for="project in filteredProjects"
                :key="project.id"
                class="project-item"
                :class="{ active: selectedProject?.id === project.id }"
                @click="selectProject(project)"
              >
                <view class="project-header">
                  <text class="project-name">{{ project.name }}</text>
                  <view 
                    class="status-tag"
                    :class="getStatusClass(project.status)"
                  >
                    {{ project.status }}
                  </view>
                </view>
                <text class="project-desc">{{ project.description }}</text>
                <view class="project-meta">
                  <text class="meta-item">👤 {{ project.manager }}</text>
                  <text class="meta-item">📅 {{ project.deadline }}</text>
                </view>
                <view class="project-progress">
                  <view class="progress-bar">
                    <view
                      class="progress-fill"
                      :style="{ width: project.progress + '%' }"
                      :class="getProgressClass(project.progress)"
                    />
                  </view>
                  <text class="progress-text">{{ project.progress }}%</text>
                </view>
                <view class="project-members">
                  <view
                    v-for="member in project.members.slice(0, 3)"
                    :key="member"
                    class="member-avatar"
                  >
                    {{ member.charAt(0) }}
                  </view>
                  <view v-if="project.members.length > 3" class="member-more">
                    +{{ project.members.length - 3 }}
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty-state">
              <text>暂无项目</text>
            </view>
          </view>
        </view>

        <!-- 右栏：项目详情/施工日志 -->
        <view class="right-panel content-card">
          <template v-if="selectedProject">
            <view class="card-header">
              <text class="card-title">{{ selectedProject.name }} - 施工日志</text>
              <component
                :is="Button"
                v-if="Button && (isCEO || isPM)"
                type="primary"
                size="small"
                @click="showAddLog = true"
              >
                新建日志
              </component>
            </view>
            <view class="card-body scrollable">
              <component :is="Timeline" v-if="Timeline">
                <component
                  :is="TimelineItem"
                  v-if="TimelineItem"
                  v-for="(log, index) in constructionLogs"
                  :key="index"
                  :title="log.title"
                  :description="log.description"
                  :time="log.time"
                  :status="log.status"
                />
              </component>
            </view>
          </template>
          <template v-else>
            <view class="card-header">
              <text class="card-title">项目详情</text>
            </view>
            <view class="card-body">
              <view class="empty-state">
                <text>请选择一个项目查看详情</text>
              </view>
            </view>
          </template>
        </view>
      </view>

    </view>

    <!-- 创建项目弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="showCreateModal"
      title="新建项目"
      width="600px"
    >
      <view class="form-content">
        <view class="form-item">
          <label>项目名称 <text class="required">*</text></label>
          <component :is="Input" v-if="Input" v-model="newProject.name" placeholder="请输入项目名称" />
        </view>
        <view class="form-item">
          <label>项目描述</label>
          <component
            :is="Input"
            v-if="Input"
            v-model="newProject.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </view>
        <view class="form-row">
          <view class="form-item half">
            <label>项目经理 <text class="required">*</text></label>
            <component
              :is="Select"
              v-if="Select"
              v-model="newProject.manager"
              :options="employeeOptions"
              placeholder="请选择"
            />
          </view>
          <view class="form-item half">
            <label>截止日期 <text class="required">*</text></label>
            <component :is="DatePicker" v-if="DatePicker" v-model="newProject.deadline" />
          </view>
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="showCreateModal = false">取消</component>
        <component :is="Button" v-if="Button" type="primary" @click="createProject">创建</component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const { Card, Row, Col, Badge, Button, Input, Select, DatePicker, Modal, Timeline, TimelineItem } = useComponent(['Card', 'Row', 'Col', 'Badge', 'Button', 'Input', 'Select', 'DatePicker', 'Modal', 'Timeline', 'TimelineItem'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isPM = computed(() => userRole.value === 'project_manager')

// 状态
const filterStatus = ref('')
const searchKeyword = ref('')
const showCreateModal = ref(false)
const selectedProject = ref<any>(null)
const showAddLog = ref(false)

const newProject = ref({
  name: '',
  description: '',
  manager: '',
  deadline: ''
})

// 选项
const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: '进行中' },
  { label: '已完成', value: '已完成' },
  { label: '已延期', value: '已延期' }
]

const employeeOptions = [
  { label: '张晓宁', value: '张晓宁' },
  { label: '赵铁柱', value: '赵铁柱' },
  { label: '王小花', value: '王小花' }
]

// 施工日志数据
const constructionLogs = ref([
  { title: '项目启动', description: '完成项目立项，组建项目团队', time: '2024-03-01 09:00', status: 'success' as const },
  { title: '基础施工', description: '完成地基开挖和基础浇筑', time: '2024-03-15 18:00', status: 'success' as const },
  { title: '主体建设', description: '主体结构施工中，进度 60%', time: '2024-04-01 12:00', status: 'processing' as const },
  { title: '装修验收', description: '等待施工完成', time: '预计 2024-05-15', status: 'pending' as const }
])

// Mock 数据
const stats = ref({
  active: 5,
  completed: 12
})

const projects = ref([
  {
    id: 1,
    name: '企业官网改版',
    description: '全面升级公司官网，提升品牌形象和用户体验',
    status: '进行中',
    manager: '张晓宁',
    deadline: '2024-05-15',
    progress: 65,
    members: ['张晓宁', '赵铁柱', '王小花', '李明']
  },
  {
    id: 2,
    name: 'OA系统开发',
    description: '内部办公自动化系统，包含考勤、薪资、项目管理',
    status: '进行中',
    manager: '赵铁柱',
    deadline: '2024-06-30',
    progress: 45,
    members: ['赵铁柱', '张晓宁', '王强']
  },
  {
    id: 3,
    name: '客户CRM系统',
    description: '客户关系管理系统，提升销售效率',
    status: '已完成',
    manager: '王小花',
    deadline: '2024-03-20',
    progress: 100,
    members: ['王小花', '李明']
  },
  {
    id: 4,
    name: '移动端App',
    description: '公司移动办公App开发',
    status: '已延期',
    manager: '李明',
    deadline: '2024-04-30',
    progress: 30,
    members: ['李明', '张晓宁', '赵铁柱', '王强', '刘芳']
  }
])

const filteredProjects = computed(() => {
  let result = projects.value

  if (filterStatus.value) {
    result = result.filter(p => p.status === filterStatus.value)
  }

  if (searchKeyword.value) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }

  return result
})

const getStatusClass = (status: string) => {
  const map: Record<string, string> = {
    '进行中': 'primary',
    '已完成': 'success',
    '已延期': 'error'
  }
  return map[status] || 'default'
}

const getProgressClass = (progress: number) => {
  if (progress >= 100) return 'success'
  if (progress >= 60) return 'primary'
  return 'warning'
}

const selectProject = (project: any) => {
  selectedProject.value = project
}

const createProject = () => {
  if (!newProject.value.name || !newProject.value.manager || !newProject.value.deadline) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  projects.value.unshift({
    id: Date.now(),
    name: newProject.value.name,
    description: newProject.value.description,
    status: '进行中',
    manager: newProject.value.manager,
    deadline: newProject.value.deadline,
    progress: 0,
    members: [newProject.value.manager]
  })

  showCreateModal.value = false
  newProject.value = { name: '', description: '', manager: '', deadline: '' }
  stats.value.active++
  uni.showToast({ title: '创建成功', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }

  .page-desc {
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-top: 2px;
    display: block;
  }

  .header-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      text-align: right;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        color: var(--primary);
        display: block;
        font-family: var(--font-display, 'Manrope');
      }

      .stat-label {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

.toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
}

.left-panel {
  flex: 0 0 380px;
  display: flex;
  flex-direction: column;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content-card {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .card-header {
    flex-shrink: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--surface-high);

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--on-surface);
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;

    &.scrollable {
      overflow-y: auto;
      padding: 16px 20px;
    }
  }
}

// 状态标签
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &.success { background: #f0f9eb; color: #2e7d32; }
  &.warning { background: #fff7e6; color: #ed6c02; }
  &.error { background: #fff1f0; color: #ba1a1a; }
  &.primary { background: rgba(0,52,102,0.08); color: var(--primary); }
  &.default { background: var(--surface-low); color: var(--on-surface-variant); }
}

// 项目列表
.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .project-item {
    padding: 16px;
    border: 1px solid var(--surface-high);
    cursor: pointer;
    transition: background 0.15s;
    border-radius: var(--radius-md);

    &:hover {
      background: var(--surface-low);
    }

    &.active {
      background: rgba(0,52,102,0.06);
      border: 1px solid rgba(0,52,102,0.15);
    }

    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;

      .project-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--on-surface);
      }
    }

    .project-desc {
      font-size: 12px;
      color: var(--on-surface-variant);
      line-height: 1.5;
      margin-bottom: 12px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-meta {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;

      .meta-item {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }

    .project-progress {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;

      .progress-bar {
        flex: 1;
        height: 5px;
        background: var(--surface-high);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s;

        &.success { background: var(--success); }
        &.primary { background: var(--primary); }
        &.warning { background: var(--warning); }
      }

      .progress-text {
        font-size: 11px;
        font-weight: 500;
        color: var(--on-surface-variant);
        min-width: 32px;
        text-align: right;
      }
    }

    .project-members {
      display: flex;
      align-items: center;

      .member-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--surface-low);
        color: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 500;
        margin-left: -6px;
        border: 2px solid var(--surface-lowest);

        &:first-child {
          margin-left: 0;
        }
      }

      .member-more {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--surface);
        color: var(--on-surface-variant);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        margin-left: -6px;
        border: 2px solid var(--surface-lowest);
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: var(--on-surface-variant);
  font-size: 13px;
}

// 表单样式
.form-content {
  padding: 16px 0;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-item {
  margin-bottom: 16px;

  &.half {
    flex: 1;
    min-width: 0;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--on-surface-variant);

    .required {
      color: var(--error);
    }
  }
}
</style>
