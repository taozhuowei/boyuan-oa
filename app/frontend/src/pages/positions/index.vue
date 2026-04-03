<template>
  <AppShell title="岗位管理">
    <view class="page-content">
      <!-- 页面头部 -->
      <view class="page-header">
        <view class="header-left">
          <text class="page-title">岗位管理</text>
          <text class="page-desc">配置岗位信息、等级体系和社保规则</text>
        </view>
        <view v-if="isCEO" class="header-actions">
          <component :is="Button" v-if="Button" type="primary" @click="openCreateModal">新增岗位</component>
        </view>
      </view>

      <!-- 主内容区 -->
      <view class="main-content">
        <!-- 左栏：岗位列表 -->
        <view class="left-panel content-card">
          <view class="card-header">
            <text class="card-title">岗位列表</text>
          </view>
          <view class="card-body scrollable">
            <view v-if="positions.length" class="position-list">
              <view
                v-for="item in positions"
                :key="item.id"
                class="position-item"
                :class="{ active: selectedPosition?.id === item.id }"
                @click="selectPosition(item)"
              >
                <view class="position-info">
                  <text class="position-name">{{ item.positionName }}</text>
                  <view class="position-badges">
                    <text class="category-badge" :class="item.employeeCategory?.toLowerCase()">
                      {{ item.employeeCategory === 'LABOR' ? '劳工' : '办公室' }}
                    </text>
                    <text class="code-text">{{ item.positionCode }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty-state">
              <text>暂无岗位数据</text>
            </view>
          </view>
        </view>

        <!-- 右栏：岗位详情 -->
        <view class="right-panel content-card">
          <template v-if="selectedPosition">
            <view class="card-header">
              <text class="card-title">{{ selectedPosition.positionName }}</text>
              <view v-if="isCEO" class="header-actions">
                <component :is="Button" v-if="Button" @click="openEditModal">编辑</component>
                <component :is="Button" v-if="Button" danger @click="handleDelete">删除</component>
              </view>
            </view>
            <view class="card-body">
              <!-- Tabs -->
              <view class="tab-group">
                <view
                  v-for="tab in tabs"
                  :key="tab.key"
                  class="tab-item"
                  :class="{ active: activeTab === tab.key }"
                  @click="activeTab = tab.key"
                >
                  {{ tab.label }}
                </view>
              </view>

              <!-- Tab 内容 -->
              <view class="tab-content">
                <!-- 基本信息 -->
                <template v-if="activeTab === 'basic'">
                  <view class="detail-section">
                    <view class="detail-row">
                      <text class="label">岗位编码</text>
                      <text class="value">{{ positionDetail?.positionCode || selectedPosition.positionCode }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">岗位名称</text>
                      <text class="value">{{ positionDetail?.positionName || selectedPosition.positionName }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">员工类别</text>
                      <text class="value">{{ positionDetail?.employeeCategory === 'LABOR' ? '劳工' : '办公室' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">默认角色</text>
                      <text class="value">{{ positionDetail?.defaultRoleCode || '-' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">需要施工日志</text>
                      <text class="value">{{ positionDetail?.requiresConstructionLog ? '是' : '否' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">有绩效奖金</text>
                      <text class="value">{{ positionDetail?.hasPerformanceBonus ? '是' : '否' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">工作日加班倍率</text>
                      <text class="value">{{ positionDetail?.overtimeRateWeekday || '1.5' }}x</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">周末加班倍率</text>
                      <text class="value">{{ positionDetail?.overtimeRateWeekend || '2.0' }}x</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">节假日加班倍率</text>
                      <text class="value">{{ positionDetail?.overtimeRateHoliday || '3.0' }}x</text>
                    </view>
                  </view>
                </template>

                <!-- 薪资假期 -->
                <template v-if="activeTab === 'salary'">
                  <view class="detail-section">
                    <view class="detail-row">
                      <text class="label">基本工资</text>
                      <text class="value">{{ positionDetail?.baseSalary ? '¥' + positionDetail.baseSalary : '-' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">加班计算基准</text>
                      <text class="value">{{ positionDetail?.overtimeBaseType || '-' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">默认绩效奖金</text>
                      <text class="value">{{ positionDetail?.defaultPerformanceBonus ? '¥' + positionDetail.defaultPerformanceBonus : '-' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">年假天数</text>
                      <text class="value">{{ positionDetail?.annualLeave ? positionDetail.annualLeave + '天' : '-' }}</text>
                    </view>
                    <view class="detail-row">
                      <text class="label">请假扣款基准</text>
                      <text class="value">{{ positionDetail?.leaveDeductBaseType || '-' }}</text>
                    </view>
                  </view>
                </template>

                <!-- 社保配置 -->
                <template v-if="activeTab === 'insurance'">
                  <view class="detail-section">
                    <view class="detail-row">
                      <text class="label">社保模式</text>
                      <text class="value">{{ positionDetail?.socialInsuranceMode || '-' }}</text>
                    </view>
                    <view class="section-title">社保项目</view>
                    <view v-if="positionDetail?.socialInsuranceItems?.length" class="insurance-list">
                      <view
                        v-for="item in positionDetail.socialInsuranceItems"
                        :key="item.id"
                        class="insurance-item"
                      >
                        <view class="insurance-header">
                          <text class="insurance-name">{{ item.name }}</text>
                          <text class="insurance-status" :class="item.isEnabled ? 'enabled' : 'disabled'">
                            {{ item.isEnabled ? '启用' : '禁用' }}
                          </text>
                        </view>
                        <view class="insurance-rates">
                          <text class="rate-text">个人 {{ item.employeeRate }}%</text>
                          <text class="rate-text">公司 {{ item.companyRate }}%</text>
                        </view>
                      </view>
                    </view>
                    <view v-else class="empty-state">
                      <text>暂无社保项目配置</text>
                    </view>
                  </view>
                </template>

                <!-- 等级管理 -->
                <template v-if="activeTab === 'levels'">
                  <view class="detail-section">
                    <view v-if="isCEO" class="section-actions">
                      <component :is="Button" v-if="Button" type="primary" size="small" @click="openLevelModal">新增等级</component>
                    </view>
                    <view v-if="positionDetail?.levels?.length" class="level-list">
                      <view
                        v-for="level in positionDetail.levels"
                        :key="level.id"
                        class="level-item"
                      >
                        <view class="level-header">
                          <text class="level-name">{{ level.levelName }}</text>
                          <text class="level-order">排序: {{ level.levelOrder }}</text>
                        </view>
                        <view class="level-details">
                          <text v-if="level.baseSalaryOverride" class="level-detail">
                            基本工资: ¥{{ level.baseSalaryOverride }}
                          </text>
                          <text v-if="level.performanceBonusOverride" class="level-detail">
                            绩效奖金: ¥{{ level.performanceBonusOverride }}
                          </text>
                          <text v-if="level.annualLeaveOverride" class="level-detail">
                            年假: {{ level.annualLeaveOverride }}天
                          </text>
                        </view>
                        <view v-if="isCEO" class="level-actions">
                          <text class="action-link" @click="editLevel(level)">编辑</text>
                          <text class="action-link danger" @click="deleteLevel(level)">删除</text>
                        </view>
                      </view>
                    </view>
                    <view v-else class="empty-state">
                      <text>暂无等级配置</text>
                    </view>
                  </view>
                </template>
              </view>
            </view>
          </template>
          <template v-else>
            <view class="empty-state center">
              <text>请选择左侧岗位查看详情</text>
            </view>
          </template>
        </view>
      </view>

      <!-- 新增/编辑岗位 Modal -->
      <component
        :is="Modal"
        v-if="Modal"
        :open="positionModalVisible"
        :title="isEditing ? '编辑岗位' : '新增岗位'"
        :footer="null"
        @cancel="closePositionModal"
      >
        <view class="modal-form">
          <view class="form-item">
            <label>岗位名称 <text class="required">*</text></label>
            <component
              :is="Input"
              v-if="Input"
              v-model:value="positionForm.positionName"
              placeholder="请输入岗位名称"
            />
          </view>
          <view class="form-row">
            <view class="form-item half">
              <label>员工类别</label>
              <component
                :is="Select"
                v-if="Select"
                v-model:value="positionForm.employeeCategory"
                :options="categoryOptions"
                placeholder="请选择"
              />
            </view>
            <view class="form-item half">
              <label>默认角色</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="positionForm.defaultRoleCode"
                placeholder="角色编码"
              />
            </view>
          </view>
          <view class="form-row">
            <view class="form-item half">
              <label>基本工资</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="positionForm.baseSalary"
                type="number"
                placeholder="0.00"
              />
            </view>
            <view class="form-item half">
              <label>年假天数</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="positionForm.annualLeave"
                type="number"
                placeholder="0"
              />
            </view>
          </view>
          <view class="form-row">
            <view class="form-item half">
              <label>需要施工日志</label>
              <component
                :is="Switch"
                v-if="Switch"
                v-model:checked="positionForm.requiresConstructionLog"
              />
            </view>
            <view class="form-item half">
              <label>有绩效奖金</label>
              <component
                :is="Switch"
                v-if="Switch"
                v-model:checked="positionForm.hasPerformanceBonus"
              />
            </view>
          </view>
          <view class="form-row">
            <view class="form-item half">
              <label>工作日倍率</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="positionForm.overtimeRateWeekday"
                type="number"
                placeholder="1.5"
              />
            </view>
            <view class="form-item half">
              <label>周末倍率</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="positionForm.overtimeRateWeekend"
                type="number"
                placeholder="2.0"
              />
            </view>
          </view>
          <view class="form-item">
            <label>节假日倍率</label>
            <component
              :is="Input"
              v-if="Input"
              v-model:value="positionForm.overtimeRateHoliday"
              type="number"
              placeholder="3.0"
            />
          </view>
          <view class="modal-actions">
            <component :is="Button" v-if="Button" @click="closePositionModal">取消</component>
            <component :is="Button" v-if="Button" type="primary" @click="savePosition">保存</component>
          </view>
        </view>
      </component>

      <!-- 新增/编辑等级 Modal -->
      <component
        :is="Modal"
        v-if="Modal"
        :open="levelModalVisible"
        :title="isEditingLevel ? '编辑等级' : '新增等级'"
        :footer="null"
        @cancel="closeLevelModal"
      >
        <view class="modal-form">
          <view class="form-item">
            <label>等级名称 <text class="required">*</text></label>
            <component
              :is="Input"
              v-if="Input"
              v-model:value="levelForm.levelName"
              placeholder="如：初级、中级、高级"
            />
          </view>
          <view class="form-item">
            <label>排序号</label>
            <component
              :is="Input"
              v-if="Input"
              v-model:value="levelForm.levelOrder"
              type="number"
              placeholder="数字越小越靠前"
            />
          </view>
          <view class="form-row">
            <view class="form-item half">
              <label>基本工资覆盖</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="levelForm.baseSalaryOverride"
                type="number"
                placeholder="可选"
              />
            </view>
            <view class="form-item half">
              <label>绩效奖金覆盖</label>
              <component
                :is="Input"
                v-if="Input"
                v-model:value="levelForm.performanceBonusOverride"
                type="number"
                placeholder="可选"
              />
            </view>
          </view>
          <view class="form-item">
            <label>年假覆盖</label>
            <component
              :is="Input"
              v-if="Input"
              v-model:value="levelForm.annualLeaveOverride"
              type="number"
              placeholder="可选"
            />
          </view>
          <view class="modal-actions">
            <component :is="Button" v-if="Button" @click="closeLevelModal">取消</component>
            <component :is="Button" v-if="Button" type="primary" @click="saveLevel">保存</component>
          </view>
        </view>
      </component>
    </view>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useComponent } from '../../composables/useComponent'
import { useUserStore } from '../../stores'
import { request } from '../../utils/http'
import AppShell from '../../layouts/AppShell.vue'

const { Button, Modal, Input, Select, Switch } = useComponent(['Button', 'Modal', 'Input', 'Select', 'Switch'])

const userStore = useUserStore()
const isCEO = computed(() => userStore.userInfo?.role === 'ceo')

// Tabs
const tabs = [
  { key: 'basic', label: '基本信息' },
  { key: 'salary', label: '薪资假期' },
  { key: 'insurance', label: '社保配置' },
  { key: 'levels', label: '等级管理' }
]
const activeTab = ref('basic')

// 岗位列表
const positions = ref<any[]>([])
const selectedPosition = ref<any>(null)
const positionDetail = ref<any>(null)

// Mock 数据
const mockPositions = [
  { id: 1, positionCode: 'POS001', positionName: '项目工程师', employeeCategory: 'OFFICE' },
  { id: 2, positionCode: 'POS002', positionName: '财务专员', employeeCategory: 'OFFICE' },
  { id: 3, positionCode: 'POS003', positionName: '施工管道焊接工', employeeCategory: 'LABOR' }
]

// 选项
const categoryOptions = [
  { label: '办公室', value: 'OFFICE' },
  { label: '劳工', value: 'LABOR' }
]

// 岗位 Modal
const positionModalVisible = ref(false)
const isEditing = ref(false)
const positionForm = ref({
  positionName: '',
  employeeCategory: 'OFFICE',
  defaultRoleCode: '',
  baseSalary: '',
  annualLeave: '',
  requiresConstructionLog: false,
  hasPerformanceBonus: false,
  overtimeRateWeekday: '1.5',
  overtimeRateWeekend: '2.0',
  overtimeRateHoliday: '3.0'
})

// 等级 Modal
const levelModalVisible = ref(false)
const isEditingLevel = ref(false)
const editingLevelId = ref<number | null>(null)
const levelForm = ref({
  levelName: '',
  levelOrder: '',
  baseSalaryOverride: '',
  performanceBonusOverride: '',
  annualLeaveOverride: ''
})

// 加载岗位列表
const loadPositions = async () => {
  try {
    const res = await request<any[]>({ url: '/positions', method: 'GET' })
    positions.value = res || []
  } catch (e) {
    console.log('API 失败，使用 mock 数据')
    positions.value = mockPositions
  }
}

// 加载岗位详情
const loadPositionDetail = async (id: number) => {
  try {
    const res = await request<any>({ url: `/positions/${id}`, method: 'GET' })
    positionDetail.value = res
  } catch (e) {
    console.log('加载详情失败')
    positionDetail.value = null
  }
}

// 选择岗位
const selectPosition = async (item: any) => {
  selectedPosition.value = item
  activeTab.value = 'basic'
  await loadPositionDetail(item.id)
}

// 打开新增岗位 Modal
const openCreateModal = () => {
  isEditing.value = false
  positionForm.value = {
    positionName: '',
    employeeCategory: 'OFFICE',
    defaultRoleCode: '',
    baseSalary: '',
    annualLeave: '',
    requiresConstructionLog: false,
    hasPerformanceBonus: false,
    overtimeRateWeekday: '1.5',
    overtimeRateWeekend: '2.0',
    overtimeRateHoliday: '3.0'
  }
  positionModalVisible.value = true
}

// 打开编辑岗位 Modal
const openEditModal = () => {
  if (!positionDetail.value) return
  isEditing.value = true
  positionForm.value = {
    positionName: positionDetail.value.positionName || '',
    employeeCategory: positionDetail.value.employeeCategory || 'OFFICE',
    defaultRoleCode: positionDetail.value.defaultRoleCode || '',
    baseSalary: String(positionDetail.value.baseSalary || ''),
    annualLeave: String(positionDetail.value.annualLeave || ''),
    requiresConstructionLog: positionDetail.value.requiresConstructionLog || false,
    hasPerformanceBonus: positionDetail.value.hasPerformanceBonus || false,
    overtimeRateWeekday: String(positionDetail.value.overtimeRateWeekday || '1.5'),
    overtimeRateWeekend: String(positionDetail.value.overtimeRateWeekend || '2.0'),
    overtimeRateHoliday: String(positionDetail.value.overtimeRateHoliday || '3.0')
  }
  positionModalVisible.value = true
}

// 关闭岗位 Modal
const closePositionModal = () => {
  positionModalVisible.value = false
}

// 保存岗位
const savePosition = async () => {
  if (!positionForm.value.positionName) {
    uni.showToast({ title: '请输入岗位名称', icon: 'none' })
    return
  }
  
  const data = {
    ...positionForm.value,
    baseSalary: positionForm.value.baseSalary ? Number(positionForm.value.baseSalary) : null,
    annualLeave: positionForm.value.annualLeave ? Number(positionForm.value.annualLeave) : null,
    overtimeRateWeekday: positionForm.value.overtimeRateWeekday ? Number(positionForm.value.overtimeRateWeekday) : null,
    overtimeRateWeekend: positionForm.value.overtimeRateWeekend ? Number(positionForm.value.overtimeRateWeekend) : null,
    overtimeRateHoliday: positionForm.value.overtimeRateHoliday ? Number(positionForm.value.overtimeRateHoliday) : null
  }
  
  try {
    if (isEditing.value) {
      await request({ url: `/positions/${selectedPosition.value.id}`, method: 'PUT', data })
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await request({ url: '/positions', method: 'POST', data })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    closePositionModal()
    await loadPositions()
    if (selectedPosition.value) {
      await loadPositionDetail(selectedPosition.value.id)
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 删除岗位
const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，是否继续？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({ url: `/positions/${selectedPosition.value.id}`, method: 'DELETE' })
          uni.showToast({ title: '删除成功', icon: 'success' })
          selectedPosition.value = null
          positionDetail.value = null
          await loadPositions()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

// 打开等级 Modal
const openLevelModal = () => {
  isEditingLevel.value = false
  editingLevelId.value = null
  levelForm.value = {
    levelName: '',
    levelOrder: '',
    baseSalaryOverride: '',
    performanceBonusOverride: '',
    annualLeaveOverride: ''
  }
  levelModalVisible.value = true
}

// 编辑等级
const editLevel = (level: any) => {
  isEditingLevel.value = true
  editingLevelId.value = level.id
  levelForm.value = {
    levelName: level.levelName || '',
    levelOrder: String(level.levelOrder || ''),
    baseSalaryOverride: level.baseSalaryOverride ? String(level.baseSalaryOverride) : '',
    performanceBonusOverride: level.performanceBonusOverride ? String(level.performanceBonusOverride) : '',
    annualLeaveOverride: level.annualLeaveOverride ? String(level.annualLeaveOverride) : ''
  }
  levelModalVisible.value = true
}

// 关闭等级 Modal
const closeLevelModal = () => {
  levelModalVisible.value = false
}

// 保存等级
const saveLevel = async () => {
  if (!levelForm.value.levelName) {
    uni.showToast({ title: '请输入等级名称', icon: 'none' })
    return
  }
  
  const data = {
    levelName: levelForm.value.levelName,
    levelOrder: levelForm.value.levelOrder ? Number(levelForm.value.levelOrder) : null,
    baseSalaryOverride: levelForm.value.baseSalaryOverride ? Number(levelForm.value.baseSalaryOverride) : null,
    performanceBonusOverride: levelForm.value.performanceBonusOverride ? Number(levelForm.value.performanceBonusOverride) : null,
    annualLeaveOverride: levelForm.value.annualLeaveOverride ? Number(levelForm.value.annualLeaveOverride) : null
  }
  
  try {
    if (isEditingLevel.value) {
      await request({
        url: `/positions/${selectedPosition.value.id}/levels/${editingLevelId.value}`,
        method: 'PUT',
        data
      })
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await request({
        url: `/positions/${selectedPosition.value.id}/levels`,
        method: 'POST',
        data
      })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    closeLevelModal()
    await loadPositionDetail(selectedPosition.value.id)
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

// 删除等级
const deleteLevel = (level: any) => {
  uni.showModal({
    title: '确认删除',
    content: `删除等级 "${level.levelName}"？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/positions/${selectedPosition.value.id}/levels/${level.id}`,
            method: 'DELETE'
          })
          uni.showToast({ title: '删除成功', icon: 'success' })
          await loadPositionDetail(selectedPosition.value.id)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

onMounted(() => {
  loadPositions()
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

  .header-left {
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

  .header-actions {
    display: flex;
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
  flex: 0 0 260px;
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

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .card-body {
    flex: 1;
    min-height: 0;
    padding: 16px 20px;

    &.scrollable {
      overflow-y: auto;
    }
  }
}

// 岗位列表
.position-list {
  .position-item {
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);
    cursor: pointer;
    transition: background 0.15s;

    &:hover, &.active {
      background: var(--surface-low);
      margin: 0 -20px;
      padding-left: 20px;
      padding-right: 20px;
    }

    &:last-child {
      border-bottom: none;
    }

    .position-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--on-surface);
      display: block;
      margin-bottom: 6px;
    }

    .position-badges {
      display: flex;
      align-items: center;
      gap: 8px;

      .category-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 500;

        &.office {
          background: rgba(0, 52, 102, 0.08);
          color: var(--primary);
        }

        &.labor {
          background: #fff7e6;
          color: #ed6c02;
        }
      }

      .code-text {
        font-size: 11px;
        color: var(--on-surface-variant);
      }
    }
  }
}

// Tabs
.tab-group {
  display: flex;
  gap: 4px;
  background: var(--surface-low);
  padding: 4px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;

  .tab-item {
    padding: 8px 20px;
    font-size: 13px;
    color: var(--on-surface-variant);
    cursor: pointer;
    border-radius: var(--radius-sm);
    transition: all 0.2s;

    &:hover {
      color: var(--on-surface);
    }

    &.active {
      background: var(--surface-lowest);
      color: var(--primary);
      font-weight: 600;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

// 详情区域
.detail-section {
  .detail-row {
    display: flex;
    justify-content: space-between;
    padding: 14px 0;
    border-bottom: 1px solid var(--surface);

    &:last-child {
      border-bottom: none;
    }

    .label {
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .value {
      font-size: 13px;
      font-weight: 500;
      color: var(--on-surface);
    }
  }
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 20px 0 12px;
  display: block;
}

.section-actions {
  margin-bottom: 16px;
}

// 社保项目列表
.insurance-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .insurance-item {
    background: var(--surface);
    padding: 12px 16px;
    border-radius: var(--radius-md);

    .insurance-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .insurance-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--on-surface);
      }

      .insurance-status {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;

        &.enabled {
          background: #f0f9eb;
          color: #2e7d32;
        }

        &.disabled {
          background: #f5f5f5;
          color: #999;
        }
      }
    }

    .insurance-rates {
      display: flex;
      gap: 16px;

      .rate-text {
        font-size: 12px;
        color: var(--on-surface-variant);
      }
    }
  }
}

// 等级列表
.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .level-item {
    background: var(--surface);
    padding: 16px;
    border-radius: var(--radius-md);

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .level-name {
        font-weight: 600;
        font-size: 14px;
        color: var(--on-surface);
      }

      .level-order {
        font-size: 11px;
        color: var(--on-surface-variant);
      }
    }

    .level-details {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 12px;

      .level-detail {
        font-size: 12px;
        color: var(--on-surface-variant);
        background: var(--surface-lowest);
        padding: 4px 10px;
        border-radius: 4px;
      }
    }

    .level-actions {
      display: flex;
      gap: 16px;

      .action-link {
        font-size: 12px;
        color: var(--primary);
        cursor: pointer;

        &.danger {
          color: var(--error);
        }
      }
    }
  }
}

// 空状态
.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--on-surface-variant);
  font-size: 13px;

  &.center {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

// Modal 表单
.modal-form {
  .form-item {
    margin-bottom: 16px;

    label {
      display: block;
      font-size: 13px;
      color: var(--on-surface);
      margin-bottom: 6px;

      .required {
        color: var(--error);
      }
    }

    &.half {
      flex: 1;
    }
  }

  .form-row {
    display: flex;
    gap: 16px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--surface);
  }
}
</style>
