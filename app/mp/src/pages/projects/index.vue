<template>
  <AppShell title="项目管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">项目管理</text>
          <text v-if="is_ceo" class="page-desc">全公司项目总览与管理</text>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Button"
            v-if="Button && is_ceo"
            type="primary"
            @click="open_create_modal"
          >
            新建项目
          </component>
          <component
            :is="Select"
            v-if="Select"
            v-model="filter_status"
            :options="status_options"
            placeholder="全部状态"
            style="width: 120px"
            @change="handle_filter_change"
          />
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="search_keyword"
            placeholder="搜索项目名称"
            :prefix="'search'"
            style="width: 240px"
            @change="handle_search"
          />
        </view>
      </view>

      <!-- 项目列表表格 -->
      <view class="content-card">
        <view class="data-table">
          <view class="table-head">
            <view class="cell" style="flex: 2">项目名</view>
            <view class="cell" style="flex: 1">状态</view>
            <view class="cell" style="flex: 1">成员数</view>
            <view class="cell" style="flex: 1">开始日期</view>
            <view class="cell" style="width: 180px; justify-content: center">操作</view>
          </view>
          <view
            v-for="project in project_list"
            :key="project.id"
            class="table-row"
          >
            <view class="cell" style="flex: 2; font-weight: 500">{{ project.name }}</view>
            <view class="cell" style="flex: 1">
              <component
                :is="Tag"
                v-if="Tag"
                :color="project.status === 'ACTIVE' ? 'success' : 'default'"
              >
                {{ project.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </component>
              <view v-else class="status-tag" :class="project.status === 'ACTIVE' ? 'success' : 'default'">
                {{ project.status === 'ACTIVE' ? '进行中' : '已完成' }}
              </view>
            </view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ project.memberCount }}人</view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ project.startDate || '-' }}</view>
            <view class="cell" style="width: 180px; justify-content: center">
              <component
                :is="Button"
                v-if="Button"
                type="link"
                size="small"
                @click="view_detail(project)"
              >
                详情
              </component>
              <component
                :is="Button"
                v-if="Button && is_ceo && project.status === 'ACTIVE'"
                type="link"
                size="small"
                danger
                @click="close_project(project)"
              >
                关闭项目
              </component>
            </view>
          </view>
          <view v-if="!project_list.length" class="table-empty">
            <text>暂无项目数据</text>
          </view>
        </view>

        <!-- 分页 -->
        <view v-if="total_pages > 1" class="pagination">
          <component
            :is="Button"
            v-if="Button"
            :disabled="current_page <= 1"
            @click="change_page(current_page - 1)"
          >
            上一页
          </component>
          <text class="page-info">{{ current_page }} / {{ total_pages }}</text>
          <component
            :is="Button"
            v-if="Button"
            :disabled="current_page >= total_pages"
            @click="change_page(current_page + 1)"
          >
            下一页
          </component>
        </view>
      </view>

    </view>

    <!-- 创建项目弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="create_modal_visible"
      title="新建项目"
      width="500px"
    >
      <view class="form-content">
        <view class="form-item">
          <label>项目名称 <text class="required">*</text></label>
          <component
            :is="Input"
            v-if="Input"
            v-model="create_form.name"
            placeholder="请输入项目名称"
          />
        </view>
        <view class="form-item">
          <label>开始日期</label>
          <component
            :is="Input"
            v-if="Input"
            v-model="create_form.startDate"
            placeholder="YYYY-MM-DD"
          />
        </view>
        <view class="form-item">
          <label>日志提交周期（天）</label>
          <component
            :is="Input"
            v-if="Input"
            v-model.number="create_form.logCycleDays"
            type="number"
            placeholder="默认为1天"
          />
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="create_modal_visible = false">取消</component>
        <component :is="Button" v-if="Button" type="primary" @click="create_project">创建</component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import { request } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

/**
 * 项目列表页面
 * 功能：展示项目列表，支持筛选、搜索，CEO可新建项目和关闭项目
 */

// 异步加载平台适配组件
const { Button, Input, Select, Modal, Tag } = useComponent(['Button', 'Input', 'Select', 'Modal', 'Tag'])

// 用户状态
const user_store = useUserStore()
const is_ceo = computed(() => user_store.userInfo?.role === 'ceo')

// 筛选和搜索状态
const filter_status = ref('')
const search_keyword = ref('')

// 分页状态
const current_page = ref(1)
const page_size = 20
const total_pages = ref(0)
const total_elements = ref(0)

// 项目列表数据
const project_list = ref<Project[]>([])

// 状态选项
const status_options = [
  { label: '全部状态', value: '' },
  { label: '进行中', value: 'ACTIVE' },
  { label: '已完成', value: 'CLOSED' }
]

// 创建项目弹窗状态
const create_modal_visible = ref(false)
const create_form = ref({
  name: '',
  startDate: '',
  logCycleDays: 1
})

/**
 * 项目数据类型
 */
interface Project {
  id: number
  name: string
  status: 'ACTIVE' | 'CLOSED'
  startDate?: string
  actualEndDate?: string
  logCycleDays: number
  memberCount: number
}

/**
 * 获取项目列表
 */
const fetch_projects = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', String(current_page.value))
    params.append('size', String(page_size))
    if (filter_status.value) params.append('status', filter_status.value)

    const res: any = await request({
      url: `/projects?${params.toString()}`,
      method: 'GET'
    })

    project_list.value = res.content || []
    total_pages.value = res.totalPages || 0
    total_elements.value = res.totalElements || 0
  } catch (err) {
    uni.showToast({ title: '获取项目列表失败', icon: 'none' })
  }
}

/**
 * 筛选变化处理
 */
const handle_filter_change = () => {
  current_page.value = 1
  fetch_projects()
}

/**
 * 搜索处理
 */
const handle_search = () => {
  current_page.value = 1
  // 后端暂不支持关键字搜索，前端过滤
  fetch_projects()
}

/**
 * 分页切换
 */
const change_page = (page: number) => {
  current_page.value = page
  fetch_projects()
}

/**
 * 打开创建项目弹窗
 */
const open_create_modal = () => {
  create_form.value = {
    name: '',
    startDate: '',
    logCycleDays: 1
  }
  create_modal_visible.value = true
}

/**
 * 创建项目
 */
const create_project = async () => {
  if (!create_form.value.name) {
    uni.showToast({ title: '请填写项目名称', icon: 'none' })
    return
  }

  try {
    const data = {
      name: create_form.value.name,
      startDate: create_form.value.startDate || undefined,
      logCycleDays: create_form.value.logCycleDays || 1
    }

    await request({
      url: '/projects',
      method: 'POST',
      data
    })

    uni.showToast({ title: '创建成功', icon: 'success' })
    create_modal_visible.value = false
    fetch_projects()
  } catch (err: any) {
    uni.showToast({ title: err.message || '创建失败', icon: 'none' })
  }
}

/**
 * 查看项目详情
 */
const view_detail = (project: Project) => {
  uni.navigateTo({ url: '/pages/projects/detail?id=' + project.id })
}

/**
 * 关闭项目
 */
const close_project = (project: Project) => {
  uni.showModal({
    title: '确认关闭',
    content: `确定要关闭项目 "${project.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/projects/${project.id}/status`,
            method: 'PATCH',
            data: { status: 'CLOSED' }
          })
          uni.showToast({ title: '关闭成功', icon: 'success' })
          fetch_projects()
        } catch (err) {
          uni.showToast({ title: '关闭失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  fetch_projects()
})
</script>

<style lang="scss" scoped>
.page-content {
  height: 100%;
  overflow: hidden;
  padding: 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-header {
  flex-shrink: 0;

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

.content-card {
  flex: 1;
  min-height: 0;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

// 自定义表格
.data-table {
  width: 100%;
  flex: 1;
  overflow-y: auto;

  .table-head {
    display: flex;
    padding: 12px 16px;
    background: var(--surface-low);
    border-bottom: 1px solid var(--surface-high);
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface-variant);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .table-row {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--surface);
    transition: background 0.15s;

    &:hover { background: var(--surface-low); }
    &:last-child { border-bottom: none; }

    .cell {
      display: flex;
      align-items: center;
      font-size: 14px;
      color: var(--on-surface);
      padding: 0 8px;
      box-sizing: border-box;
    }
  }

  .table-empty {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 48px;
    color: var(--on-surface-variant);
    font-size: 14px;
  }
}

// 状态标签（fallback）
.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.success { background: #f0f9eb; color: #2e7d32; }
  &.default { background: var(--surface-low); color: var(--on-surface-variant); }
}

// 分页
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid var(--surface-high);

  .page-info {
    font-size: 14px;
    color: var(--on-surface-variant);
  }
}

// 表单样式
.form-content {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 16px;

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
