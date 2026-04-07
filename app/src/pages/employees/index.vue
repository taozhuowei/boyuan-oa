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
            v-if="Button && isCEO"
            type="primary"
            @click="openAddModal"
          >
            添加员工
          </component>
          <component
            :is="Select"
            v-if="Select"
            v-model="filterDept"
            :options="departmentOptions"
            placeholder="全部部门"
            style="width: 140px"
            @change="handleFilterChange"
          />
          <component
            :is="Select"
            v-if="Select"
            v-model="filterRole"
            :options="roleOptions"
            placeholder="全部角色"
            style="width: 140px"
            @change="handleFilterChange"
          />
          <component
            :is="Select"
            v-if="Select"
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            style="width: 120px"
            @change="handleFilterChange"
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
            @change="handleSearch"
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
            <view class="cell" style="flex: 1">角色</view>
            <view class="cell" style="flex: 1">入职日期</view>
            <view class="cell" style="flex: 0.8">状态</view>
            <view v-if="isCEO" class="cell" style="width: 140px; justify-content: center">操作</view>
          </view>
          <view
            v-for="emp in employeeList"
            :key="emp.id"
            class="table-row"
          >
            <view class="cell" style="width: 60px; justify-content: center">
              <view class="avatar">{{ emp.name ? emp.name.charAt(0) : '?' }}</view>
            </view>
            <view class="cell" style="flex: 1; font-weight: 500">{{ emp.name }}</view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ emp.employeeNo }}</view>
            <view class="cell" style="flex: 1.5; color: var(--on-surface-variant)">{{ emp.departmentName || '-' }}</view>
            <view class="cell" style="flex: 1">{{ emp.roleName || emp.roleCode }}</view>
            <view class="cell" style="flex: 1; color: var(--on-surface-variant)">{{ emp.entryDate || '-' }}</view>
            <view class="cell" style="flex: 0.8">
              <view 
                class="status-tag"
                :class="emp.accountStatus === 'ACTIVE' ? 'success' : 'default'"
              >
                {{ emp.accountStatus === 'ACTIVE' ? '在职' : '已禁用' }}
              </view>
            </view>
            <view v-if="isCEO" class="cell" style="width: 140px; justify-content: center">
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
                v-if="Button"
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
        
        <!-- 分页 -->
        <view v-if="totalPages > 1" class="pagination">
          <component
            :is="Button"
            v-if="Button"
            :disabled="currentPage <= 0"
            @click="changePage(currentPage - 1)"
          >
            上一页
          </component>
          <text class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</text>
          <component
            :is="Button"
            v-if="Button"
            :disabled="currentPage >= totalPages - 1"
            @click="changePage(currentPage + 1)"
          >
            下一页
          </component>
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
            <label>手机</label>
            <component :is="Input" v-if="Input" v-model="employeeForm.phone" placeholder="请输入手机号" />
          </view>
        </view>
        <view class="form-row">
          <view class="form-item half">
            <label>角色 <text class="required">*</text></label>
            <component
              :is="Select"
              v-if="Select"
              v-model="employeeForm.roleCode"
              :options="roleOptions.filter(r => r.value)"
              placeholder="请选择角色"
            />
          </view>
          <view class="form-item half">
            <label>员工类型 <text class="required">*</text></label>
            <component
              :is="Select"
              v-if="Select"
              v-model="employeeForm.employeeType"
              :options="[
                { label: '办公室员工', value: 'OFFICE' },
                { label: '劳工', value: 'LABOR' }
              ]"
              placeholder="请选择类型"
            />
          </view>
        </view>
        <view class="form-row">
          <view class="form-item half">
            <label>部门 <text class="required">*</text></label>
            <component
              :is="Select"
              v-if="Select"
              v-model="employeeForm.departmentId"
              :options="departmentOptions.filter(d => d.value)"
              placeholder="请选择部门"
            />
          </view>
          <view class="form-item half">
            <label>入职日期 <text class="required">*</text></label>
            <component :is="DatePicker" v-if="DatePicker" v-model="employeeForm.entryDate" />
          </view>
        </view>
        <view v-if="editingEmployee" class="form-row">
          <view class="form-item half">
            <label>账号状态</label>
            <component
              :is="Select"
              v-if="Select"
              v-model="employeeForm.accountStatus"
              :options="[
                { label: '在职', value: 'ACTIVE' },
                { label: '已禁用', value: 'DISABLED' }
              ]"
              placeholder="请选择状态"
            />
          </view>
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
import { ref, computed, onMounted } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import { request } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

const { Card, Row, Col, Badge, Button, Input, Select, DatePicker, Modal } = useComponent(['Card', 'Row', 'Col', 'Badge', 'Button', 'Input', 'Select', 'DatePicker', 'Modal'])

const userStore = useUserStore()
const userRole = computed(() => userStore.userInfo?.role || 'employee')
const isCEO = computed(() => userRole.value === 'ceo')
const isFinance = computed(() => userRole.value === 'finance')
const isPM = computed(() => userRole.value === 'project_manager')

// 状态
const filterDept = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const searchKeyword = ref('')
const showAddModal = ref(false)
const editingEmployee = ref<any>(null)

// 分页
const currentPage = ref(0)
const pageSize = 20
const totalPages = ref(0)
const totalElements = ref(0)

// 数据
const employeeList = ref<any[]>([])
const departmentList = ref<any[]>([])
const roleList = ref<any[]>([])

const employeeForm = ref({
  name: '',
  phone: '',
  email: '',
  roleCode: '',
  employeeType: 'OFFICE',
  departmentId: '',
  positionId: '',
  levelId: '',
  directSupervisorId: '',
  accountStatus: 'ACTIVE',
  entryDate: ''
})

// 选项
const departmentOptions = computed(() => [
  { label: '全部部门', value: '' },
  ...departmentList.value.map(d => ({ label: d.name, value: d.id }))
])

const roleOptions = computed(() => [
  { label: '全部角色', value: '' },
  ...roleList.value.map(r => ({ label: r.roleName, value: r.roleCode }))
])

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '在职', value: 'ACTIVE' },
  { label: '已禁用', value: 'DISABLED' }
]

// Mock 统计数据
const stats = ref({
  total: 0,
  newThisMonth: 0
})

const deptStats = ref<any[]>([])

// 获取员工列表
const fetchEmployees = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', String(currentPage.value))
    params.append('size', String(pageSize))
    if (searchKeyword.value) params.append('keyword', searchKeyword.value)
    if (filterRole.value) params.append('roleCode', filterRole.value)
    if (filterStatus.value) params.append('accountStatus', filterStatus.value)
    if (filterDept.value) params.append('departmentId', filterDept.value)

    const res: any = await request({
      url: `/employees?${params.toString()}`,
      method: 'GET'
    })

    employeeList.value = res.content || []
    totalPages.value = res.totalPages || 0
    totalElements.value = res.totalElements || 0
    stats.value.total = res.totalElements || 0
  } catch (err) {
    uni.showToast({ title: '获取员工列表失败', icon: 'none' })
  }
}

// 获取部门列表
const fetchDepartments = async () => {
  try {
    const res: any = await request({
      url: '/departments',
      method: 'GET'
    })
    departmentList.value = res || []
    
    // 计算部门统计
    const total = employeeList.value.length
    const stats = departmentList.value.map((dept: any) => {
      const count = employeeList.value.filter((e: any) => e.departmentId === dept.id).length
      return {
        name: dept.name,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }
    }).filter((d: any) => d.count > 0)
    deptStats.value = stats
  } catch (err) {
    console.error('获取部门列表失败', err)
  }
}

// 获取角色列表
const fetchRoles = async () => {
  try {
    const res: any = await request({
      url: '/roles',
      method: 'GET'
    })
    roleList.value = res || []
  } catch (err) {
    console.error('获取角色列表失败', err)
  }
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 0
  fetchEmployees()
}

// 搜索
const handleSearch = () => {
  currentPage.value = 0
  fetchEmployees()
}

// 分页
const changePage = (page: number) => {
  currentPage.value = page
  fetchEmployees()
}

// 打开新增弹窗
const openAddModal = () => {
  editingEmployee.value = null
  employeeForm.value = {
    name: '',
    phone: '',
    email: '',
    roleCode: '',
    employeeType: 'OFFICE',
    departmentId: '',
    positionId: '',
    levelId: '',
    directSupervisorId: '',
    accountStatus: 'ACTIVE',
    entryDate: ''
  }
  showAddModal.value = true
}

const editEmployee = (emp: any) => {
  editingEmployee.value = emp
  employeeForm.value = {
    name: emp.name || '',
    phone: emp.phone || '',
    email: emp.email || '',
    roleCode: emp.roleCode || '',
    employeeType: emp.employeeType || 'OFFICE',
    departmentId: emp.departmentId || '',
    positionId: emp.positionId || '',
    levelId: emp.levelId || '',
    directSupervisorId: emp.directSupervisorId || '',
    accountStatus: emp.accountStatus || 'ACTIVE',
    entryDate: emp.entryDate || ''
  }
  showAddModal.value = true
}

const deleteEmployee = (emp: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除员工 ${emp.name} 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/employees/${emp.id}`,
            method: 'DELETE'
          })
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchEmployees()
        } catch (err) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const saveEmployee = async () => {
  if (!employeeForm.value.name) {
    uni.showToast({ title: '请填写姓名', icon: 'none' })
    return
  }
  if (!employeeForm.value.roleCode) {
    uni.showToast({ title: '请选择角色', icon: 'none' })
    return
  }
  if (!employeeForm.value.departmentId) {
    uni.showToast({ title: '请选择部门', icon: 'none' })
    return
  }

  try {
    const data = {
      name: employeeForm.value.name,
      phone: employeeForm.value.phone,
      email: employeeForm.value.email,
      roleCode: employeeForm.value.roleCode,
      employeeType: employeeForm.value.employeeType,
      departmentId: employeeForm.value.departmentId ? Number(employeeForm.value.departmentId) : null,
      positionId: employeeForm.value.positionId ? Number(employeeForm.value.positionId) : null,
      levelId: employeeForm.value.levelId ? Number(employeeForm.value.levelId) : null,
      directSupervisorId: employeeForm.value.directSupervisorId ? Number(employeeForm.value.directSupervisorId) : null,
      entryDate: employeeForm.value.entryDate || new Date().toISOString().split('T')[0],
      accountStatus: employeeForm.value.accountStatus
    }

    if (editingEmployee.value) {
      await request({
        url: `/employees/${editingEmployee.value.id}`,
        method: 'PUT',
        data
      })
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await request({
        url: '/employees',
        method: 'POST',
        data
      })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }

    showAddModal.value = false
    fetchEmployees()
  } catch (err: any) {
    uni.showToast({ title: err.message || '保存失败', icon: 'none' })
  }
}

onMounted(() => {
  fetchEmployees()
  fetchDepartments()
  fetchRoles()
})
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
