<template>
  <AppShell title="员工管理">
    <view class="page-content">

      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">员工管理</text>
          <text class="page-desc">{{ isCEO ? '公司人员管理与组织架构' : '通讯录与部门信息' }}</text>
        </view>
        <view class="header-stats">
          <view class="stat-item">
            <text class="stat-value">{{ stats.total }}</text>
            <text class="stat-label">总人数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ stats.newThisMonth }}</text>
            <text class="stat-label">本月入职</text>
          </view>
        </view>
      </view>

      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Button"
            v-if="Button && (isCEO || isFinance)"
            type="primary"
            @click="showAddModal = true"
          >
            添加员工
          </component>
          <component
            :is="Button"
            v-if="Button && (isCEO || isFinance)"
            @click="exportEmployees"
          >
            导出名单
          </component>
          <component
            :is="Button"
            v-if="Button && (isCEO || isFinance)"
            @click="importEmployees"
          >
            批量导入
          </component>
          <component
            :is="Select"
            v-if="Select"
            v-model="filterDept"
            :options="departmentOptions"
            placeholder="全部部门"
            style="width: 140px"
          />
        </view>
        <view class="toolbar-right">
          <component
            :is="Input"
            v-if="Input"
            v-model="searchKeyword"
            placeholder="搜索姓名或工号"
            :prefix="'search'"
            style="width: 240px"
          />
        </view>
      </view>

      <!-- 主内容区：员工列表 -->
      <view class="content-card">
        <view class="data-table">
          <view class="table-head">
            <view class="cell" style="width: 60px; justify-content: center">头像</view>
            <view class="cell" style="flex: 1">姓名</view>
            <view class="cell" style="flex: 1">工号</view>
            <view class="cell" style="flex: 1.5">部门</view>
            <view class="cell" style="flex: 1">职位</view>
            <view class="cell" style="flex: 1">入职日期</view>
            <view class="cell" style="flex: 0.8">状态</view>
            <view v-if="isCEO || isFinance" class="cell" style="width: 100px; justify-content: center">操作</view>
          </view>
          <view
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="table-row"
          >
            <view class="cell" style="width: 60px; justify-content: center">
              <view class="avatar">{{ emp.name.charAt(0) }}</view>
            </view>
            <view class="cell" style="flex: 1; font-weight: 500">{{ emp.name }}</view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ emp.employeeNo }}</view>
            <view class="cell" style="flex: 1.5; color: var(--on-surface-variant)">{{ emp.department }}</view>
            <view class="cell" style="flex: 1">{{ emp.position }}</view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ emp.joinDate }}</view>
            <view class="cell" style="flex: 0.8">
              <view 
                class="status-tag"
                :class="emp.status === '在职' ? 'success' : 'default'"
              >
                {{ emp.status }}
              </view>
            </view>
            <view v-if="isCEO || isFinance" class="cell" style="width: 100px; justify-content: center">
              <component
                :is="Button"
                v-if="Button"
                type="link"
                size="small"
                @click="editEmployee(emp)"
              >
                编辑
              </component>
              <component
                :is="Button"
                v-if="Button && isCEO"
                type="link"
                size="small"
                danger
                @click="deleteEmployee(emp)"
              >
                删除
              </component>
            </view>
          </view>
        </view>
      </view>

      <!-- 部门人员分布 -->
      <view v-if="isCEO || isFinance" class="content-card dept-card">
        <view class="card-header">
          <text class="card-title">部门人员分布</text>
        </view>
        <view class="card-body">
          <view class="dept-stats">
            <view
              v-for="dept in deptStats"
              :key="dept.name"
              class="dept-item"
            >
              <view class="dept-info">
                <text class="dept-name">{{ dept.name }}</text>
                <text class="dept-count">{{ dept.count }}人（{{ dept.percentage }}%）</text>
              </view>
              <view class="dept-bar">
                <view
                  class="dept-fill"
                  :style="{ width: dept.percentage + '%' }"
                />
              </view>
            </view>
          </view>
        </view>
      </view>

    </view>

    <!-- 添加/编辑员工弹窗 -->
    <component
      :is="Modal"
      v-if="Modal"
      v-model="showAddModal"
      :title="editingEmployee ? '编辑员工' : '添加员工'"
      width="600px"
    >
      <view class="form-content">
        <view class="form-row">
          <view class="form-item half">
            <label>姓名 <text class="required">*</text></label>
            <component :is="Input" v-if="Input" v-model="employeeForm.name" placeholder="请输入姓名" />
          </view>
          <view class="form-item half">
            <label>工号 <text class="required">*</text></label>
            <component :is="Input" v-if="Input" v-model="employeeForm.employeeNo" placeholder="请输入工号" />
          </view>
        </view>
        <view class="form-row">
          <view class="form-item half">
            <label>部门 <text class="required">*</text></label>
            <component
              :is="Select"
              v-if="Select"
              v-model="employeeForm.department"
              :options="departmentOptions.filter(d => d.value)"
              placeholder="请选择部门"
            />
          </view>
          <view class="form-item half">
            <label>职位 <text class="required">*</text></label>
            <component :is="Input" v-if="Input" v-model="employeeForm.position" placeholder="请输入职位" />
          </view>
        </view>
        <view class="form-item">
          <label>入职日期 <text class="required">*</text></label>
          <component :is="DatePicker" v-if="DatePicker" v-model="employeeForm.joinDate" />
        </view>
      </view>
      <template #footer>
        <component :is="Button" v-if="Button" @click="showAddModal = false">取消</component>
        <component :is="Button" v-if="Button" type="primary" @click="saveEmployee">保存</component>
      </template>
    </component>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import AppShell from '../../layouts/AppShell.vue'

const { Card, Row, Col, Badge, Button, Input, Select, DatePicker, Modal } = useComponent(['Card', 'Row', 'Col', 'Badge', 'Button', 'Input', 'Select', 'DatePicker', 'Modal'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isFinance = computed(() => userRole.value === 'finance')
const isPM = computed(() => userRole.value === 'project_manager')

// 状态
const filterDept = ref('')
const searchKeyword = ref('')
const showAddModal = ref(false)
const editingEmployee = ref<any>(null)

const employeeForm = ref({
  name: '',
  employeeNo: '',
  department: '',
  position: '',
  joinDate: ''
})

// 选项
const departmentOptions = [
  { label: '全部部门', value: '' },
  { label: '技术部', value: '技术部' },
  { label: '人事部', value: '人事部' },
  { label: '财务部', value: '财务部' },
  { label: '销售部', value: '销售部' }
]

// Mock 数据
const stats = ref({
  total: 28,
  newThisMonth: 3
})

const employees = ref([
  { id: 1, name: '张晓宁', employeeNo: 'EMP001', department: '技术部', position: '前端工程师', joinDate: '2022-03-15', status: '在职' },
  { id: 2, name: '赵铁柱', employeeNo: 'EMP002', department: '技术部', position: '后端工程师', joinDate: '2021-08-20', status: '在职' },
  { id: 3, name: '王小花', employeeNo: 'EMP003', department: '人事部', position: '人事专员', joinDate: '2023-01-10', status: '在职' },
  { id: 4, name: '李明', employeeNo: 'EMP004', department: '销售部', position: '销售经理', joinDate: '2020-06-05', status: '在职' },
  { id: 5, name: '刘芳', employeeNo: 'EMP005', department: '财务部', position: '会计', joinDate: '2022-11-20', status: '在职' }
])

const deptStats = ref([
  { name: '技术部', count: 12, percentage: 42 },
  { name: '销售部', count: 8, percentage: 28 },
  { name: '人事部', count: 4, percentage: 14 },
  { name: '财务部', count: 4, percentage: 14 }
])

const filteredEmployees = computed(() => {
  let result = employees.value

  if (filterDept.value) {
    result = result.filter(e => e.department === filterDept.value)
  }

  if (searchKeyword.value) {
    result = result.filter(e =>
      e.name.includes(searchKeyword.value) ||
      e.employeeNo.includes(searchKeyword.value)
    )
  }

  return result
})

const editEmployee = (emp: any) => {
  editingEmployee.value = emp
  employeeForm.value = { ...emp }
  showAddModal.value = true
}

const deleteEmployee = (emp: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除员工 ${emp.name} 吗？`,
    success: (res) => {
      if (res.confirm) {
        const index = employees.value.findIndex(e => e.id === emp.id)
        if (index > -1) {
          employees.value.splice(index, 1)
          stats.value.total--
          uni.showToast({ title: '删除成功', icon: 'success' })
        }
      }
    }
  })
}

const saveEmployee = () => {
  if (!employeeForm.value.name || !employeeForm.value.employeeNo ||
      !employeeForm.value.department || !employeeForm.value.position) {
    uni.showToast({ title: '请填写必填项', icon: 'none' })
    return
  }

  if (editingEmployee.value) {
    const index = employees.value.findIndex(e => e.id === editingEmployee.value.id)
    if (index > -1) {
      employees.value[index] = { ...editingEmployee.value, ...employeeForm.value }
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
  } else {
    employees.value.unshift({
      id: Date.now(),
      ...employeeForm.value,
      status: '在职'
    })
    stats.value.total++
    stats.value.newThisMonth++
    uni.showToast({ title: '添加成功', icon: 'success' })
  }

  showAddModal.value = false
  editingEmployee.value = null
  employeeForm.value = { name: '', employeeNo: '', department: '', position: '', joinDate: '' }
}

const exportEmployees = () => {
  uni.showToast({ title: '导出成功', icon: 'success' })
}

const importEmployees = () => {
  uni.showToast({ title: '导入功能开发中', icon: 'none' })
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

.content-card {
  flex: 1;
  min-height: 0;
  background: var(--surface-lowest);
  border: 1px solid var(--surface-high);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.dept-card {
    flex: 0 0 200px;
  }

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
    padding: 16px 20px;
  }
}

// 自定义表格
.data-table {
  width: 100%;

  .table-head {
    display: flex;
    padding: 10px 0;
    background: var(--surface-low);
    border-bottom: 1px solid var(--surface-high);
    font-size: 12px;
    font-weight: 600;
    color: var(--on-surface-variant);
    letter-spacing: 0.3px;
  }

  .table-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--surface);
    transition: background 0.15s;

    &:hover { background: var(--surface-low); }
    &:last-child { border-bottom: none; }

    .cell {
      display: flex;
      align-items: center;
      font-size: 13px;
      color: var(--on-surface);
      padding: 0 8px;
      box-sizing: border-box;
    }
  }
}

// 头像
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0,52,102,0.08);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
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

// 部门统计
.dept-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  .dept-item {
    .dept-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .dept-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--on-surface);
      }

      .dept-count {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }

    .dept-bar {
      height: 6px;
      background: var(--surface);
      border-radius: 3px;
      overflow: hidden;

      .dept-fill {
        height: 100%;
        background: var(--primary);
        border-radius: 3px;
        transition: width 0.3s;
      }
    }
  }
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
