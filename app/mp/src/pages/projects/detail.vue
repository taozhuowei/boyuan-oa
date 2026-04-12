<template>
  <AppShell :title="'项目详情'">
    <view class="page-content">

      <!-- 返回按钮和标题 -->
      <view class="page-header">
        <view class="header-left">
          <component
            :is="Button"
            v-if="Button"
            type="link"
            @click="go_back"
          >
            ← 返回
          </component>
          <text v-else class="back-link" @click="go_back">← 返回</text>
          <text class="page-title">项目详情 — {{ project?.name }}</text>
        </view>
      </view>

      <!-- 项目信息卡片 -->
      <view class="info-card">
        <view class="info-row">
          <view class="info-item">
            <text class="info-label">状态:</text>
            <component
              :is="Tag"
              v-if="Tag"
              :color="project?.status === 'ACTIVE' ? 'success' : 'default'"
            >
              {{ project?.status === 'ACTIVE' ? '进行中' : '已完成' }}
            </component>
            <view v-else class="status-tag" :class="project?.status === 'ACTIVE' ? 'success' : 'default'">
              {{ project?.status === 'ACTIVE' ? '进行中' : '已完成' }}
            </view>
          </view>
          <view class="info-item">
            <text class="info-label">开始日期:</text>
            <text class="info-value">{{ project?.startDate || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">实际结束:</text>
            <text class="info-value">{{ project?.actualEndDate || '-' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">成员:</text>
            <text class="info-value">{{ project?.memberCount || 0 }}人</text>
          </view>
          <view class="info-item">
            <text class="info-label">日志周期:</text>
            <text class="info-value">{{ project?.logCycleDays || 1 }}天</text>
          </view>
        </view>
        <view v-if="is_ceo && project?.status === 'ACTIVE'" class="info-actions">
          <component
            :is="Button"
            v-if="Button"
            type="primary"
            danger
            size="small"
            @click="close_project"
          >
            关闭项目
          </component>
        </view>
      </view>

      <!-- 成员管理 Tab -->
      <view class="content-card">
        <view class="card-header">
          <text class="card-title">成员管理</text>
          <component
            :is="Button"
            v-if="Button && is_ceo"
            type="primary"
            size="small"
            @click="open_add_member_modal"
          >
            添加成员
          </component>
        </view>
        <view class="card-body">
          <view class="data-table">
            <view class="table-head">
              <view class="cell" style="flex: 1">姓名</view>
              <view class="cell" style="flex: 1">工号</view>
              <view class="cell" style="flex: 1">角色</view>
              <view v-if="is_ceo" class="cell" style="width: 200px; justify-content: center">操作</view>
            </view>
            <view
              v-for="member in member_list"
              :key="member.employeeId"
              class="table-row"
            >
              <view class="cell" style="flex: 1; font-weight: 500">{{ member.name }}</view>
              <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ member.employeeNo }}</view>
              <view class="cell" style="flex: 1">
                <component
                  :is="Tag"
                  v-if="Tag"
                  :color="member.role === 'PM' ? 'primary' : 'default'"
                >
                  {{ member.role === 'PM' ? '项目经理' : '成员' }}
                </component>
                <view v-else class="role-tag" :class="member.role === 'PM' ? 'primary' : 'default'">
                  {{ member.role === 'PM' ? '项目经理' : '成员' }}
                </view>
              </view>
              <view v-if="is_ceo" class="cell" style="width: 200px; justify-content: center">
                <component
                  :is="Button"
                  v-if="Button && member.role !== 'PM'"
                  type="link"
                  size="small"
                  @click="set_member_role(member, 'PM')"
                >
                  设为PM
                </component>
                <component
                  :is="Button"
                  v-if="Button && member.role === 'PM'"
                  type="link"
                  size="small"
                  @click="set_member_role(member, 'MEMBER')"
                >
                  设为成员
                </component>
                <component
                  :is="Button"
                  v-if="Button"
                  type="link"
                  size="small"
                  danger
                  @click="remove_member(member)"
                >
                  移除
                </component>
              </view>
            </view>
            <view v-if="!member_list.length" class="table-empty">
              <text>暂无成员</text>
            </view>
          </view>
        </view>
      </view>

    </view>

    <!-- 添加成员弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="add_member_modal_visible"
      title="添加成员"
      width="500px"
    >
      <view class="form-content">
        <view class="form-item">
          <label>选择员工 <text class="required">*</text></label>
          <component
            :is="Select"
            v-if="Select"
            v-model="add_member_form.employeeId"
            :options="employee_options"
            placeholder="请选择员工"
            style="width: 100%"
          />
        </view>
        <view class="form-item">
          <label>角色 <text class="required">*</text></label>
          <component
            :is="Select"
            v-if="Select"
            v-model="add_member_form.role"
            :options="role_options"
            placeholder="请选择角色"
            style="width: 100%"
          />
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="add_member_modal_visible = false">取消</component>
        <component :is="Button" v-if="Button" type="primary" @click="add_member">确认添加</component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// @ts-ignore
import { onLoad } from '@dcloudio/uni-app'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import { request } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

/**
 * 项目详情页面
 * 功能：展示项目详情和成员列表，CEO可添加/移除成员、设置角色
 */

// 异步加载平台适配组件
const { Button, Select, Modal, Tag } = useComponent(['Button', 'Select', 'Modal', 'Tag'])

// 用户状态
const user_store = useUserStore()
const is_ceo = computed(() => user_store.userInfo?.role === 'ceo')

// 页面参数
const project_id = ref<number>(0)

// 项目数据
const project = ref<Project | null>(null)
const member_list = ref<ProjectMember[]>([])

// 员工列表（用于添加成员选择）
const employee_list = ref<Employee[]>([])

// 添加成员弹窗状态
const add_member_modal_visible = ref(false)
const add_member_form = ref({
  employeeId: '',
  role: 'MEMBER'
})

// 角色选项
const role_options = [
  { label: '项目经理', value: 'PM' },
  { label: '成员', value: 'MEMBER' }
]

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
  members: ProjectMember[]
}

/**
 * 项目成员数据类型
 */
interface ProjectMember {
  employeeId: number
  employeeNo: string
  name: string
  role: 'PM' | 'MEMBER'
}

/**
 * 员工数据类型
 */
interface Employee {
  id: number
  employeeNo: string
  name: string
  departmentName?: string
}

/**
 * 员工下拉选项（排除已在项目中的成员）
 */
const employee_options = computed(() => {
  const existing_ids = new Set(member_list.value.map(m => m.employeeId))
  return employee_list.value
    .filter(e => !existing_ids.has(e.id))
    .map(e => ({
      label: `${e.name} (${e.employeeNo})`,
      value: String(e.id)
    }))
})

/**
 * 获取项目详情
 */
const fetch_project_detail = async () => {
  if (!project_id.value) return
  try {
    const res: any = await request({
      url: `/projects/${project_id.value}`,
      method: 'GET'
    })
    project.value = res
    member_list.value = res.members || []
  } catch (err) {
    uni.showToast({ title: '获取项目详情失败', icon: 'none' })
  }
}

/**
 * 获取员工列表
 */
const fetch_employees = async () => {
  try {
    const res: any = await request({
      url: '/employees?size=100',
      method: 'GET'
    })
    employee_list.value = res.content || []
  } catch (err) {
    console.error('获取员工列表失败', err)
  }
}

/**
 * 打开添加成员弹窗
 */
const open_add_member_modal = () => {
  add_member_form.value = {
    employeeId: '',
    role: 'MEMBER'
  }
  add_member_modal_visible.value = true
}

/**
 * 添加成员
 */
const add_member = async () => {
  if (!add_member_form.value.employeeId) {
    uni.showToast({ title: '请选择员工', icon: 'none' })
    return
  }

  try {
    await request({
      url: `/projects/${project_id.value}/members`,
      method: 'POST',
      data: {
        employeeId: Number(add_member_form.value.employeeId),
        role: add_member_form.value.role
      }
    })

    uni.showToast({ title: '添加成功', icon: 'success' })
    add_member_modal_visible.value = false
    fetch_project_detail()
  } catch (err: any) {
    uni.showToast({ title: err.message || '添加失败', icon: 'none' })
  }
}

/**
 * 移除成员
 */
const remove_member = (member: ProjectMember) => {
  uni.showModal({
    title: '确认移除',
    content: `确定要移除成员 "${member.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/projects/${project_id.value}/members/${member.employeeId}`,
            method: 'DELETE'
          })
          uni.showToast({ title: '移除成功', icon: 'success' })
          fetch_project_detail()
        } catch (err) {
          uni.showToast({ title: '移除失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 设置成员角色
 */
const set_member_role = async (member: ProjectMember, new_role: 'PM' | 'MEMBER') => {
  try {
    await request({
      url: `/projects/${project_id.value}/members`,
      method: 'POST',
      data: {
        employeeId: member.employeeId,
        role: new_role
      }
    })
    uni.showToast({ title: '设置成功', icon: 'success' })
    fetch_project_detail()
  } catch (err) {
    uni.showToast({ title: '设置失败', icon: 'none' })
  }
}

/**
 * 关闭项目
 */
const close_project = () => {
  if (!project.value) return
  uni.showModal({
    title: '确认关闭',
    content: `确定要关闭项目 "${project.value.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/projects/${project_id.value}/status`,
            method: 'PATCH',
            data: { status: 'CLOSED' }
          })
          uni.showToast({ title: '关闭成功', icon: 'success' })
          fetch_project_detail()
        } catch (err) {
          uni.showToast({ title: '关闭失败', icon: 'none' })
        }
      }
    }
  })
}

/**
 * 返回上一页
 */
const go_back = () => {
  uni.navigateBack()
}

/**
 * 页面加载时获取参数
 * onLoad 在 UniApp 中可直接使用，但需要在 script setup 中
 * 使用 defineExpose 或直接用 onLoad hook
 */
onLoad((options: any) => {
  if (options?.id) {
    project_id.value = Number(options.id)
    fetch_project_detail()
    fetch_employees()
  }
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
  display: flex;
  align-items: center;
  gap: 12px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-link {
    font-size: 14px;
    color: var(--primary);
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  .page-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--on-surface);
    font-family: var(--font-display, 'Manrope');
  }
}

// 项目信息卡片
.info-card {
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  padding: 16px 20px;

  .info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .info-label {
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .info-value {
      font-size: 14px;
      color: var(--on-surface);
      font-weight: 500;
    }
  }

  .info-actions {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--surface-high);
  }
}

// 状态标签
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

// 角色标签
.role-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.primary { background: rgba(0, 52, 102, 0.08); color: var(--primary); }
  &.default { background: var(--surface-low); color: var(--on-surface-variant); }
}

// 内容卡片
.content-card {
  flex: 1;
  min-height: 0;
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
    overflow-y: auto;
    padding: 0;
  }
}

// 自定义表格
.data-table {
  width: 100%;

  .table-head {
    display: flex;
    padding: 12px 16px;
    background: var(--surface-low);
    border-bottom: 1px solid var(--surface-high);
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface-variant);
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
