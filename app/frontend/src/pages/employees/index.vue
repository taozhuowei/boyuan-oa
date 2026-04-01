<template>
  <view class="page employees-page">
    <!-- Hero 区域 -->
    <view class="hero">
      <view class="hero-main">
        <view class="hero-title-row">
          <component :is="Icon" v-if="Icon" name="groups" :size="28" />
          <text class="hero-title">员工</text>
        </view>
        <text class="hero-subtitle">
          {{ isCEO ? '公司人员管理与组织架构' : '通讯录与部门信息' }}
        </text>
      </view>
      <view class="hero-stats">
        <view class="hero-stat">
          <text class="stat-num">{{ stats.total }}</text>
          <text class="stat-label">总人数</text>
        </view>
        <view class="hero-stat">
          <text class="stat-num">{{ stats.newThisMonth }}</text>
          <text class="stat-label">本月入职</text>
        </view>
      </view>
    </view>

    <view class="employees-container">
      <!-- 工具栏 -->
      <view class="toolbar">
        <view class="toolbar-left">
          <component
            :is="Button"
            v-if="Button && (isCEO || isFinance)"
            type="primary"
            @click="showAddModal = true"
          >
            <component :is="Icon" v-if="Icon" name="person-add" :size="14" />
            添加员工
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
        <component
          :is="Input"
          v-if="Input"
          v-model="searchKeyword"
          placeholder="搜索姓名或工号"
          :prefix="'search'"
          style="width: 240px"
        />
      </view>

      <!-- 员工列表 -->
      <component :is="Card" v-if="Card">
        <view class="employee-table">
          <view class="table-header">
            <text class="cell" style="width: 60px">头像</text>
            <text class="cell" style="flex: 1">姓名</text>
            <text class="cell" style="flex: 1">工号</text>
            <text class="cell" style="flex: 1.5">部门</text>
            <text class="cell" style="flex: 1">职位</text>
            <text class="cell" style="flex: 1">入职日期</text>
            <text class="cell" style="flex: 1">状态</text>
            <text v-if="isCEO || isFinance" class="cell" style="width: 120px">操作</text>
          </view>
          <view
            v-for="emp in filteredEmployees"
            :key="emp.id"
            class="table-row"
          >
            <view class="cell" style="width: 60px">
              <view class="avatar">{{ emp.name.charAt(0) }}</view>
            </view>
            <text class="cell" style="flex: 1">{{ emp.name }}</text>
            <text class="cell" style="flex: 1">{{ emp.employeeNo }}</text>
            <text class="cell" style="flex: 1.5">{{ emp.department }}</text>
            <text class="cell" style="flex: 1">{{ emp.position }}</text>
            <text class="cell" style="flex: 1">{{ emp.joinDate }}</text>
            <text class="cell" style="flex: 1">
              <component
                :is="Badge"
                v-if="Badge"
                :status="emp.status === '在职' ? 'success' : 'default'"
                :text="emp.status"
              />
            </text>
            <view v-if="isCEO || isFinance" class="cell" style="width: 120px">
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
                @click="deleteEmployee(emp)"
              >
                删除
              </component>
            </view>
          </view>
        </view>
      </component>

      <!-- 部门统计（仅CEO/财务可见） -->
      <component :is="Row" v-if="Row && (isCEO || isFinance)" :gutter="16" class="mt-16">
        <component :is="Col" v-if="Col" :span="12">
          <component :is="Card" v-if="Card" title="部门人员分布">
            <view class="dept-stats">
              <view
                v-for="dept in deptStats"
                :key="dept.name"
                class="dept-item"
              >
                <view class="dept-info">
                  <text class="dept-name">{{ dept.name }}</text>
                  <text class="dept-count">{{ dept.count }}人</text>
                </view>
                <view class="dept-bar">
                  <view
                    class="dept-fill"
                    :style="{ width: dept.percentage + '%' }"
                  />
                </view>
              </view>
            </view>
          </component>
        </component>
        <component :is="Col" v-if="Col" :span="12">
          <component :is="Card" v-if="Card" title="快速操作">
            <view class="quick-actions">
              <component :is="Button" v-if="Button" block @click="exportEmployees">
                <component :is="Icon" v-if="Icon" name="download" :size="14" />
                导出员工名单
              </component>
              <component :is="Button" v-if="Button" block @click="importEmployees">
                <component :is="Icon" v-if="Icon" name="upload" :size="14" />
                批量导入
              </component>
              <component :is="Button" v-if="Button" block @click="viewOrgChart">
                <component :is="Icon" v-if="Icon" name="account-tree" :size="14" />
                组织架构图
              </component>
            </view>
          </component>
        </component>
      </component>
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
        <component :is="Row" v-if="Row" :gutter="16">
          <component :is="Col" v-if="Col" :span="12">
            <view class="form-item">
              <label>姓名 <text class="required">*</text></label>
              <component :is="Input" v-if="Input" v-model="employeeForm.name" placeholder="请输入姓名" />
            </view>
          </component>
          <component :is="Col" v-if="Col" :span="12">
            <view class="form-item">
              <label>工号 <text class="required">*</text></label>
              <component :is="Input" v-if="Input" v-model="employeeForm.employeeNo" placeholder="请输入工号" />
            </view>
          </component>
        </component>
        <component :is="Row" v-if="Row" :gutter="16">
          <component :is="Col" v-if="Col" :span="12">
            <view class="form-item">
              <label>部门 <text class="required">*</text></label>
              <component
                :is="Select"
                v-if="Select"
                v-model="employeeForm.department"
                :options="departmentOptions"
                placeholder="请选择部门"
              />
            </view>
          </component>
          <component :is="Col" v-if="Col" :span="12">
            <view class="form-item">
              <label>职位 <text class="required">*</text></label>
              <component :is="Input" v-if="Input" v-model="employeeForm.position" placeholder="请输入职位" />
            </view>
          </component>
        </component>
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getComponent } from '../../adapters'
import { useUserStore } from '../../stores'

// 异步获取组件
const Icon = ref(null)
const Card = ref(null)
const Row = ref(null)
const Col = ref(null)
const Badge = ref(null)
const Button = ref(null)
const Input = ref(null)
const Select = ref(null)
const DatePicker = ref(null)
const Modal = ref(null)

onMounted(async () => {
  Icon.value = await getComponent('Icon')
  Card.value = await getComponent('Card')
  Row.value = await getComponent('Row')
  Col.value = await getComponent('Col')
  Badge.value = await getComponent('Badge')
  Button.value = await getComponent('Button')
  Input.value = await getComponent('Input')
  Select.value = await getComponent('Select')
  DatePicker.value = await getComponent('DatePicker')
  Modal.value = await getComponent('Modal')
})

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

const viewOrgChart = () => {
  uni.showToast({ title: '组织架构图开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.employees-page {
  min-height: 100vh;
  background: var(--oa-bg);
  padding: 16px;
}

.hero {
  background: linear-gradient(135deg, #003466 0%, #324963 100%);
  color: #fff;
  padding: 24px;
  margin-bottom: 16px;
  border-radius: var(--oa-radius-lg);
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

.employee-table {
  .table-header {
    display: flex;
    padding: 12px 16px;
    background: var(--oa-bg);
    border-radius: var(--oa-radius-md) var(--oa-radius-md) 0 0;
    font-weight: 500;
    font-size: 14px;
    color: var(--oa-text-secondary);
  }

  .table-row {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--oa-border-split);

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--oa-bg);
    }
  }

  .cell {
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--oa-primary-light);
      color: var(--oa-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.dept-stats {
  .dept-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .dept-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .dept-name {
    font-size: 14px;
  }

  .dept-count {
    font-size: 12px;
    color: var(--oa-text-secondary);
  }

  .dept-bar {
    height: 8px;
    background: var(--oa-border);
    border-radius: 4px;
    overflow: hidden;
  }

  .dept-fill {
    height: 100%;
    background: var(--oa-primary);
    border-radius: 4px;
    transition: width 0.3s;
  }
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-content {
  padding: 16px 0;
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

.mt-16 {
  margin-top: 16px;
}
</style>
