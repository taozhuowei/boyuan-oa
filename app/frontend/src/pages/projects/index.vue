<template>
  <view class="page projects-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <Icon name="folder-open" :size="28" />
          <text class="hero-title">项目</text>
        </view>
        <text class="hero-subtitle">
          {{ isCEO ? '全公司项目总览与资源调配' : '我的项目与任务管理' }}
        </text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ stats.active }}</text>
          <text class="stat-label">进行中</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ stats.completed }}</text>
          <text class="stat-label">已完成</text>
        </view>
      </view>
    </view>

    <view class="projects-container">
      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <oa-button 
            v-if="isCEO" 
            type="primary" 
            @click="showCreateModal = true"
          >
            <Icon name="add" :size="14" />
            新建项目
          </oa-button>
          <oa-select
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 120px"
          />
        </view>
        <oa-input
          v-model="searchKeyword"
          placeholder="搜索项目名称"
          :prefix="'search'"
          style="width: 240px"
        />
      </view>

      <!-- 项目列表 -->
      <oa-row :gutter="16">
        <oa-col 
          v-for="project in filteredProjects" 
          :key="project.id"
          :span="isCEO ? 8 : 6"
        >
          <oa-card class="project-card" hoverable @click="viewProject(project)">
            <view class="project-header">
              <text class="project-name">{{ project.name }}</text>
              <oa-badge :status="getStatusType(project.status)" :text="project.status" />
            </view>
            <text class="project-desc">{{ project.description }}</text>
            <view class="project-meta">
              <view class="meta-item">
                <Icon name="person" :size="14" />
                <text>{{ project.manager }}</text>
              </view>
              <view class="meta-item">
                <Icon name="calendar-today" :size="14" />
                <text>{{ project.deadline }}</text>
              </view>
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
          </oa-card>
        </oa-col>
      </oa-row>
    </view>

    <!-- 创建项目弹窗 -->
    <oa-modal
      v-model="showCreateModal"
      title="新建项目"
      width="600px"
    >
      <oa-form :model="newProject">
        <view class="form-item">
          <label>项目名称 <text class="required">*</text></label>
          <oa-input v-model="newProject.name" placeholder="请输入项目名称" />
        </view>
        <view class="form-item">
          <label>项目描述</label>
          <oa-input 
            v-model="newProject.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入项目描述"
          />
        </view>
        <oa-row :gutter="16">
          <oa-col :span="12">
            <view class="form-item">
              <label>项目经理 <text class="required">*</text></label>
              <oa-select
                v-model="newProject.manager"
                :options="employeeOptions"
                placeholder="请选择"
              />
            </view>
          </oa-col>
          <oa-col :span="12">
            <view class="form-item">
              <label>截止日期 <text class="required">*</text></label>
              <oa-date-picker v-model="newProject.deadline" />
            </view>
          </oa-col>
        </oa-row>
      </oa-form>
      <template #footer>
        <oa-button @click="showCreateModal = false">取消</oa-button>
        <oa-button type="primary" @click="createProject">创建</oa-button>
      </template>
    </oa-modal>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '../../components/ui'
import { 
  OaCard, OaRow, OaCol, OaBadge, 
  OaButton, OaInput, OaSelect, 
  OaDatePicker, OaModal, OaForm 
} from '../../components/ui-kit'
import { useUserStore } from '../../stores'

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')

// 状态
const filterStatus = ref('')
const searchKeyword = ref('')
const showCreateModal = ref(false)

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

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    '进行中': 'processing',
    '已完成': 'success',
    '已延期': 'error'
  }
  return map[status] || 'default'
}

const getProgressClass = (progress: number) => {
  if (progress >= 100) return 'success'
  if (progress >= 60) return 'normal'
  return 'warning'
}

const viewProject = (project: any) => {
  uni.showToast({ title: `查看项目: ${project.name}`, icon: 'none' })
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
.projects-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-border-radius-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hero-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.hero-title {
  font-size: 24px;
  font-weight: 700;
}

.hero-subtitle {
  font-size: 14px;
  opacity: 0.9;
}

.hero-stats {
  display: flex;
  gap: 32px;
}

.hero-stat {
  text-align: center;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
}

.project-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  .project-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .project-name {
    font-size: 16px;
    font-weight: 600;
  }

  .project-desc {
    font-size: 13px;
    color: var(--oa-text-secondary);
    line-height: 1.5;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .project-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--oa-text-secondary);
    }
  }

  .project-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .progress-bar {
      flex: 1;
      height: 6px;
      background: var(--oa-border);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s;

      &.success {
        background: var(--oa-success);
      }

      &.normal {
        background: var(--oa-primary);
      }

      &.warning {
        background: var(--oa-warning);
      }
    }

    .progress-text {
      font-size: 12px;
      font-weight: 500;
      color: var(--oa-text-secondary);
      min-width: 36px;
      text-align: right;
    }
  }

  .project-members {
    display: flex;
    align-items: center;

    .member-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--oa-primary-light);
      color: var(--oa-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      margin-left: -8px;
      border: 2px solid #fff;

      &:first-child {
        margin-left: 0;
      }
    }

    .member-more {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--oa-bg);
      color: var(--oa-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      margin-left: -8px;
      border: 2px solid #fff;
    }
  }
}

.form-item {
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--oa-text-secondary);

    .required {
      color: var(--oa-error);
    }
  }
}
</style>
