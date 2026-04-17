<template>
  <!-- Position Management — CRUD for positions and their levels -->
  <div class="positions-page">
    <h2 class="page-title">岗位管理</h2>

    <a-card>
      <!-- Search bar with Add button -->
      <div class="search-bar">
        <a-input
          v-model:value="keyword"
          placeholder="搜索岗位名称"
          style="width: 280px"
          allow-clear
          @press-enter="onSearch"
        />
        <a-button type="primary" @click="onSearch">搜索</a-button>
        <a-button v-if="isCEO" type="primary" style="margin-left: auto" data-catch="positions-list-create-btn" @click="openAddPositionModal">
          新增岗位
        </a-button>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredPositions"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
        :expand-icon="expandIcon"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'socialInsuranceMode'">
            {{ (record as Position).socialInsuranceMode === 'COMPANY_PAID' ? '公司缴纳' : '合并缴纳' }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button v-if="isCEO" type="link" size="small" :data-catch="'positions-row-edit-btn-' + record.id" @click.stop="openEditPositionModal(record as Position)">
                编辑
              </a-button>
              <a-popconfirm
                v-if="isCEO"
                title="确定删除该岗位吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm.stop="deletePosition(record.id)"
              >
                <a-button type="link" danger size="small" :data-catch="'positions-row-delete-btn-' + record.id" @click.stop>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>

        <!-- Expanded row for levels -->
        <template #expandedRowRender="{ record }">
          <div class="levels-section">
            <div class="levels-header">
              <span class="levels-title">等级配置</span>
              <a-button v-if="isCEO" type="primary" size="small" :data-catch="'positions-levels-create-btn-' + record.id" @click="openAddLevelModal(record.id)">
                新增等级
              </a-button>
            </div>
            <a-table
              :columns="levelColumns"
              :data-source="record.levels || []"
              :pagination="false"
              size="small"
              row-key="id"
              bordered
            >
              <template #bodyCell="{ column, record: level }">
                <template v-if="column.key === 'action' && isCEO">
                  <a-space>
                    <a-button type="link" size="small" :data-catch="'positions-level-row-edit-btn-' + level.id" @click="openEditLevelModal(record.id, level as Level)">
                      编辑
                    </a-button>
                    <a-popconfirm
                      title="确定删除该等级吗？"
                      ok-text="确定"
                      cancel-text="取消"
                      @confirm="deleteLevel(record.id, level.id)"
                    >
                      <a-button type="link" danger size="small">删除</a-button>
                    </a-popconfirm>
                  </a-space>
                </template>
                <template v-if="column.key === 'baseSalaryOverride'">
                  {{ level.baseSalaryOverride ?? '—' }}
                </template>
                <template v-if="column.key === 'positionSalaryOverride'">
                  {{ level.positionSalaryOverride ?? '—' }}
                </template>
                <template v-if="column.key === 'performanceBonusOverride'">
                  {{ level.performanceBonusOverride ?? '—' }}
                </template>
                <template v-if="column.key === 'annualLeaveOverride'">
                  {{ level.annualLeaveOverride ?? '—' }}
                </template>
              </template>
            </a-table>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- Position Modal (Create/Edit) -->
    <a-modal
      v-model:open="positionModalOpen"
      :title="positionModalTitle"
      :confirm-loading="positionModalLoading"
      @ok="submitPosition"
      @cancel="closePositionModal"
      width="600px"
    >
      <a-form :model="positionForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="岗位名称" required>
              <a-input v-model:value="positionForm.positionName" placeholder="请输入岗位名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="员工类别" required>
              <a-select v-model:value="positionForm.employeeCategory" placeholder="请选择">
                <a-select-option value="OFFICE">办公室</a-select-option>
                <a-select-option value="LABOR">劳务</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="默认角色代码">
              <a-input v-model:value="positionForm.defaultRoleCode" placeholder="请输入角色代码" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年假天数">
              <a-input-number v-model:value="positionForm.annualLeave" style="width: 100%" :precision="0" placeholder="请输入年假天数" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="基本工资">
              <a-input-number v-model:value="positionForm.baseSalary" style="width: 100%" :precision="2" placeholder="请输入基本工资" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位工资">
              <a-input-number v-model:value="positionForm.positionSalary" style="width: 100%" :precision="2" placeholder="按岗位设定的固定薪资项（可选）" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="默认绩效奖金">
              <a-input-number v-model:value="positionForm.defaultPerformanceBonus" style="width: 100%" :precision="2" placeholder="有绩效奖金时生效（可选）" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="社保缴纳方式">
              <a-select v-model:value="positionForm.socialInsuranceMode" placeholder="请选择">
                <a-select-option value="COMPANY_PAID">公司缴纳</a-select-option>
                <a-select-option value="MERGED">合并缴纳</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item>
              <template #label>
                <span>需要施工日志</span>
              </template>
              <a-switch v-model:checked="positionForm.requiresConstructionLog" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item>
              <template #label>
                <span>有绩效奖金</span>
              </template>
              <a-switch v-model:checked="positionForm.hasPerformanceBonus" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <template #footer>
        <a-button @click="closePositionModal">取消</a-button>
        <a-button type="primary" :loading="positionModalLoading" data-catch="positions-modal-save-btn" @click="submitPosition">确定</a-button>
      </template>
    </a-modal>

    <!-- Level Modal (Create/Edit) -->
    <a-modal
      v-model:open="levelModalOpen"
      :title="levelModalTitle"
      :confirm-loading="levelModalLoading"
      @ok="submitLevel"
      @cancel="closeLevelModal"
      width="500px"
    >
      <a-form :model="levelForm" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="等级名称" required>
              <a-input v-model:value="levelForm.levelName" placeholder="请输入等级名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="等级顺序">
              <a-input-number v-model:value="levelForm.levelOrder" style="width: 100%" :precision="0" placeholder="请输入顺序" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="基本工资覆盖">
              <a-input-number v-model:value="levelForm.baseSalaryOverride" style="width: 100%" :precision="2" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="岗位工资覆盖">
              <a-input-number v-model:value="levelForm.positionSalaryOverride" style="width: 100%" :precision="2" placeholder="可选" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="绩效奖金覆盖">
              <a-input-number v-model:value="levelForm.performanceBonusOverride" style="width: 100%" :precision="2" placeholder="可选" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="年假覆盖">
              <a-input-number v-model:value="levelForm.annualLeaveOverride" style="width: 100%" :precision="0" placeholder="可选" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <template #footer>
        <a-button @click="closeLevelModal">取消</a-button>
        <a-button type="primary" :loading="levelModalLoading" data-catch="positions-level-modal-save-btn" @click="submitLevel">确定</a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { h, ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'

// Types
interface Level {
  id: number
  positionId: number
  levelName: string
  levelOrder: number
  baseSalaryOverride: number | null
  positionSalaryOverride: number | null
  performanceBonusOverride: number | null
  annualLeaveOverride: number | null
}

interface Position {
  id: number
  positionCode: string
  positionName: string
  employeeCategory: 'OFFICE' | 'LABOR'
  defaultRoleCode: string | null
  baseSalary: number | null
  positionSalary: number | null
  overtimeRateWeekday: number | null
  overtimeRateWeekend: number | null
  overtimeRateHoliday: number | null
  defaultPerformanceBonus: number | null
  annualLeave: number | null
  leaveDeductBaseType: string | null
  socialInsuranceMode: 'COMPANY_PAID' | 'MERGED' | null
  requiresConstructionLog: boolean
  hasPerformanceBonus: boolean
  levels: Level[]
  socialInsuranceItems: unknown[]
}

interface PositionForm {
  id: number | undefined
  positionName: string
  employeeCategory: 'OFFICE' | 'LABOR'
  defaultRoleCode: string
  baseSalary: number | undefined
  positionSalary: number | undefined
  defaultPerformanceBonus: number | undefined
  socialInsuranceMode: 'COMPANY_PAID' | 'MERGED' | undefined
  annualLeave: number | undefined
  requiresConstructionLog: boolean
  hasPerformanceBonus: boolean
}

interface LevelForm {
  id: number | undefined
  positionId: number | undefined
  levelName: string
  levelOrder: number | undefined
  baseSalaryOverride: number | undefined
  positionSalaryOverride: number | undefined
  performanceBonusOverride: number | undefined
  annualLeaveOverride: number | undefined
}

function expandIcon(props: { expanded: boolean; onExpand: (expanded: boolean, record: any) => void; record: any }) {
  return h('span', {
    'data-catch': `positions-row-expand-btn-${props.record.id}`,
    style: { cursor: 'pointer', marginRight: '8px', color: '#1890ff' },
    onClick: (e: Event) => {
      e.stopPropagation()
      props.onExpand(!props.expanded, props.record)
    }
  }, props.expanded ? '▼' : '▶')
}

// User permissions
const userStore = useUserStore()
const isCEO = computed(() => userStore.userInfo?.role === 'ceo')

// Table data
const loading = ref(false)
const positions = ref<Position[]>([])
const keyword = ref('')

const columns = [
  { title: '岗位名称', dataIndex: 'positionName', key: 'positionName' },
  { title: '员工类别', dataIndex: 'employeeCategory', key: 'employeeCategory', width: 100 },
  { title: '默认角色', dataIndex: 'defaultRoleCode', key: 'defaultRoleCode', width: 120 },
  { title: '基本工资', dataIndex: 'baseSalary', key: 'baseSalary', width: 110 },
  { title: '岗位工资', dataIndex: 'positionSalary', key: 'positionSalary', width: 110 },
  { title: '默认绩效', dataIndex: 'defaultPerformanceBonus', key: 'defaultPerformanceBonus', width: 110 },
  { title: '社保模式', key: 'socialInsuranceMode', width: 100 },
  { title: '操作', key: 'action', width: 150 }
]

const levelColumns = [
  { title: '等级名称', dataIndex: 'levelName', key: 'levelName' },
  { title: '等级顺序', dataIndex: 'levelOrder', key: 'levelOrder', width: 100 },
  { title: '基本工资覆盖', dataIndex: 'baseSalaryOverride', key: 'baseSalaryOverride', width: 130 },
  { title: '岗位工资覆盖', dataIndex: 'positionSalaryOverride', key: 'positionSalaryOverride', width: 130 },
  { title: '绩效奖金覆盖', dataIndex: 'performanceBonusOverride', key: 'performanceBonusOverride', width: 130 },
  { title: '年假覆盖', dataIndex: 'annualLeaveOverride', key: 'annualLeaveOverride', width: 100 },
  { title: '操作', key: 'action', width: 150 }
]

// Filtered positions
const filteredPositions = computed(() => {
  if (!keyword.value.trim()) return positions.value
  const kw = keyword.value.trim().toLowerCase()
  return positions.value.filter(p => 
    p.positionName.toLowerCase().includes(kw) ||
    (p.defaultRoleCode && p.defaultRoleCode.toLowerCase().includes(kw))
  )
})

// Position Modal
const positionModalOpen = ref(false)
const positionModalLoading = ref(false)
const positionModalTitle = computed(() => positionForm.value.id ? '编辑岗位' : '新增岗位')

const defaultPositionForm: PositionForm = {
  id: undefined,
  positionName: '',
  employeeCategory: 'OFFICE',
  defaultRoleCode: '',
  baseSalary: undefined,
  positionSalary: undefined,
  defaultPerformanceBonus: undefined,
  socialInsuranceMode: 'COMPANY_PAID',
  annualLeave: undefined,
  requiresConstructionLog: false,
  hasPerformanceBonus: false
}

const positionForm = ref<PositionForm>({ ...defaultPositionForm })

// Level Modal
const levelModalOpen = ref(false)
const levelModalLoading = ref(false)
const levelModalTitle = computed(() => levelForm.value.id ? '编辑等级' : '新增等级')

const defaultLevelForm: LevelForm = {
  id: undefined,
  positionId: undefined,
  levelName: '',
  levelOrder: undefined,
  baseSalaryOverride: undefined,
  positionSalaryOverride: undefined,
  performanceBonusOverride: undefined,
  annualLeaveOverride: undefined
}

const levelForm = ref<LevelForm>({ ...defaultLevelForm })

// Current position for level operations
const currentPositionId = ref<number | undefined>(undefined)

// Load positions
async function loadPositions() {
  loading.value = true
  try {
    const data = await request<Position[]>({ url: '/positions' })
    positions.value = data ?? []
  } catch {
    positions.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  // Client-side filtering, no need to reload
}

// Position CRUD
function openAddPositionModal() {
  positionForm.value = { ...defaultPositionForm }
  positionModalOpen.value = true
}

function openEditPositionModal(record: Position) {
  positionForm.value = {
    id: record.id,
    positionName: record.positionName,
    employeeCategory: record.employeeCategory,
    defaultRoleCode: record.defaultRoleCode ?? '',
    baseSalary: record.baseSalary ?? undefined,
    positionSalary: record.positionSalary ?? undefined,
    defaultPerformanceBonus: record.defaultPerformanceBonus ?? undefined,
    socialInsuranceMode: record.socialInsuranceMode ?? undefined,
    annualLeave: record.annualLeave ?? undefined,
    requiresConstructionLog: record.requiresConstructionLog,
    hasPerformanceBonus: record.hasPerformanceBonus
  }
  positionModalOpen.value = true
}

function closePositionModal() {
  positionModalOpen.value = false
  positionForm.value = { ...defaultPositionForm }
}

async function submitPosition() {
  if (!positionForm.value.positionName.trim()) {
    message.error('请输入岗位名称')
    return
  }

  positionModalLoading.value = true
  try {
    const body = {
      positionName: positionForm.value.positionName,
      employeeCategory: positionForm.value.employeeCategory,
      defaultRoleCode: positionForm.value.defaultRoleCode || null,
      baseSalary: positionForm.value.baseSalary,
      positionSalary: positionForm.value.positionSalary,
      overtimeRateWeekday: null,
      overtimeRateWeekend: null,
      overtimeRateHoliday: null,
      defaultPerformanceBonus: positionForm.value.defaultPerformanceBonus,
      annualLeave: positionForm.value.annualLeave,
      leaveDeductBaseType: null,
      socialInsuranceMode: positionForm.value.socialInsuranceMode,
      requiresConstructionLog: positionForm.value.requiresConstructionLog,
      hasPerformanceBonus: positionForm.value.hasPerformanceBonus
    }

    if (positionForm.value.id) {
      await request({
        url: `/positions/${positionForm.value.id}`,
        method: 'PUT',
        body
      })
      message.success('岗位更新成功')
    } else {
      await request({
        url: '/positions',
        method: 'POST',
        body
      })
      message.success('岗位创建成功')
    }
    positionModalOpen.value = false
    await loadPositions()
  } catch {
    // Error handled by request util
  } finally {
    positionModalLoading.value = false
  }
}

async function deletePosition(id: number) {
  try {
    await request({
      url: `/positions/${id}`,
      method: 'DELETE'
    })
    message.success('岗位删除成功')
    await loadPositions()
  } catch {
    // Error handled by request util
  }
}

// Level CRUD
function openAddLevelModal(positionId: number) {
  currentPositionId.value = positionId
  levelForm.value = { ...defaultLevelForm, positionId }
  levelModalOpen.value = true
}

function openEditLevelModal(positionId: number, level: Level) {
  currentPositionId.value = positionId
  levelForm.value = {
    id: level.id,
    positionId,
    levelName: level.levelName,
    levelOrder: level.levelOrder,
    baseSalaryOverride: level.baseSalaryOverride ?? undefined,
    positionSalaryOverride: level.positionSalaryOverride ?? undefined,
    performanceBonusOverride: level.performanceBonusOverride ?? undefined,
    annualLeaveOverride: level.annualLeaveOverride ?? undefined
  }
  levelModalOpen.value = true
}

function closeLevelModal() {
  levelModalOpen.value = false
  levelForm.value = { ...defaultLevelForm }
  currentPositionId.value = undefined
}

async function submitLevel() {
  if (!levelForm.value.levelName.trim()) {
    message.error('请输入等级名称')
    return
  }
  if (!currentPositionId.value) return

  levelModalLoading.value = true
  try {
    const body = {
      levelName: levelForm.value.levelName,
      levelOrder: levelForm.value.levelOrder,
      baseSalaryOverride: levelForm.value.baseSalaryOverride,
      positionSalaryOverride: levelForm.value.positionSalaryOverride,
      performanceBonusOverride: levelForm.value.performanceBonusOverride,
      annualLeaveOverride: levelForm.value.annualLeaveOverride
    }

    if (levelForm.value.id) {
      await request({
        url: `/positions/${currentPositionId.value}/levels/${levelForm.value.id}`,
        method: 'PUT',
        body
      })
      message.success('等级更新成功')
    } else {
      await request({
        url: `/positions/${currentPositionId.value}/levels`,
        method: 'POST',
        body
      })
      message.success('等级创建成功')
    }
    levelModalOpen.value = false
    await loadPositions()
  } catch {
    // Error handled by request util
  } finally {
    levelModalLoading.value = false
  }
}

async function deleteLevel(positionId: number, levelId: number) {
  try {
    await request({
      url: `/positions/${positionId}/levels/${levelId}`,
      method: 'DELETE'
    })
    message.success('等级删除成功')
    await loadPositions()
  } catch {
    // Error handled by request util
  }
}

onMounted(loadPositions)
</script>

<style scoped>
.positions-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

/* Removed flex constraints to allow natural content flow */

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.levels-section {
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.levels-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.levels-title {
  font-weight: 500;
}

:deep(.ant-table-expanded-row) .ant-table-cell {
  padding: 0 !important;
}
</style>
