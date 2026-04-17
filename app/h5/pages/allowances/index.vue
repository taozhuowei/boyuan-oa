<template>
  <!-- Allowance Configuration — CRUD for allowance definitions + 3-level override (GLOBAL/POSITION/EMPLOYEE) -->
  <div class="allowances-page">
    <h2 class="page-title">补贴配置</h2>

    <!-- Allowance Definition List -->
    <a-card title="补贴项" class="section-card">
      <template #extra>
        <a-button v-if="canEdit" type="primary" size="small" data-catch="allowances-create-btn" @click="openAddDef">新建补贴项</a-button>
      </template>
      <a-table
        :columns="defColumns"
        :data-source="defs"
        :loading="defsLoading"
        :pagination="false"
        row-key="id"
        size="small"
        :row-selection="rowSelection"
        :custom-row="record => ({ onClick: () => selectDef(record) })"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isEnabled'">
            <a-tag :color="record.isEnabled ? 'green' : 'default'">{{ record.isEnabled ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-if="column.key === 'action'">
            <a-space @click.stop>
              <a-button v-if="canEdit" type="link" size="small" @click="openEditDef(record as AllowanceDef)">编辑</a-button>
              <a-popconfirm v-if="canEdit && !record.isSystem" title="确定删除该补贴项吗？" @confirm="deleteDef(record.id)">
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- Three-level Config Editor -->
    <a-card v-if="selectedDef" :title="`三级覆盖配置 - ${selectedDef.name}`" class="section-card">
      <a-tabs v-model:active-key="scopeTab">
        <a-tab-pane key="GLOBAL" tab="全局">
          <div class="scope-row">
            <span class="scope-label">所有员工默认金额：</span>
            <a-input-number v-model:value="globalAmount" :min="0" :precision="2" style="width: 200px" placeholder="不填视为无全局默认" />
          </div>
          <div class="scope-hint">每月所有员工默认发放此金额；可被"按岗位"或"按员工"设置覆盖。</div>
        </a-tab-pane>

        <a-tab-pane key="POSITION" tab="按岗位">
          <a-table
            :columns="positionScopeColumns"
            :data-source="positions"
            :loading="positionsLoading"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'amount'">
                <a-input-number
                  v-model:value="positionAmounts[record.id]"
                  :min="0"
                  :precision="2"
                  style="width: 160px"
                  placeholder="未设置"
                />
              </template>
            </template>
          </a-table>
          <div class="scope-hint">岗位级设置优先于全局；留空表示该岗位继承全局值。</div>
        </a-tab-pane>

        <a-tab-pane key="EMPLOYEE" tab="按员工">
          <div class="employee-scope-header">
            <a-select
              v-model:value="newEmployeeId"
              placeholder="选择员工"
              style="width: 240px"
              :options="employeeOptions"
              show-search
              option-filter-prop="label"
            />
            <a-input-number v-model:value="newEmployeeAmount" :min="0" :precision="2" placeholder="金额" style="width: 160px" />
            <a-button type="primary" size="small" @click="addEmployeeOverride">添加</a-button>
          </div>
          <a-table
            :columns="employeeScopeColumns"
            :data-source="employeeOverrides"
            :pagination="false"
            row-key="employeeId"
            size="small"
            style="margin-top: 12px"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'employeeName'">
                {{ employeeLabel(record.employeeId) }}
              </template>
              <template v-if="column.key === 'amount'">
                <a-input-number v-model:value="record.amount" :min="0" :precision="2" style="width: 160px" />
              </template>
              <template v-if="column.key === 'action'">
                <a-button type="link" danger size="small" @click="removeEmployeeOverride(record.employeeId)">移除</a-button>
              </template>
            </template>
          </a-table>
          <div class="scope-hint">员工级设置优先级最高；添加后记得"保存全部"。</div>
        </a-tab-pane>
      </a-tabs>

      <div class="save-bar">
        <a-button type="primary" :loading="saving" @click="saveConfigs">保存全部</a-button>
      </div>
    </a-card>

    <!-- Definition Modal -->
    <a-modal v-model:open="defModalOpen" :title="defModalTitle" @ok="submitDef" @cancel="closeDefModal">
      <a-form :model="defForm" layout="vertical">
        <a-form-item label="代码" required>
          <a-input v-model:value="defForm.code" placeholder="如 MEAL / TRANSPORT" :disabled="!!defForm.id" />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input v-model:value="defForm.name" placeholder="如 餐补 / 交通补贴" />
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="defForm.description" placeholder="可选" />
        </a-form-item>
        <a-form-item label="显示顺序">
          <a-input-number v-model:value="defForm.displayOrder" :min="0" :precision="0" style="width: 100%" />
        </a-form-item>
        <a-form-item label="是否启用">
          <a-switch v-model:checked="defForm.isEnabled" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'

interface AllowanceDef {
  id: number
  code: string
  name: string
  description: string | null
  displayOrder: number
  isEnabled: boolean
  isSystem: boolean
}

interface AllowanceConfig {
  id?: number
  allowanceDefId: number
  scope: 'GLOBAL' | 'POSITION' | 'EMPLOYEE'
  scopeTargetId: number | null
  amount: number
}

interface PositionRow {
  id: number
  positionName: string
}

interface EmployeeRow {
  id: number
  name: string
  employeeNo: string
}

interface EmployeeOverride {
  employeeId: number
  amount: number
}

const userStore = useUserStore()
const canEdit = computed(() => ['ceo', 'hr'].includes(userStore.userInfo?.role ?? ''))

const defs = ref<AllowanceDef[]>([])
const defsLoading = ref(false)
const selectedDef = ref<AllowanceDef | null>(null)

const defColumns = [
  { title: '代码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: '顺序', dataIndex: 'displayOrder', key: 'displayOrder', width: 80 },
  { title: '状态', key: 'isEnabled', width: 90 },
  { title: '操作', key: 'action', width: 140 }
]

const rowSelection = computed(() => ({
  type: 'radio' as const,
  selectedRowKeys: selectedDef.value ? [selectedDef.value.id] : [],
  onChange: (_keys: (string | number)[], rows: AllowanceDef[]) => {
    if (rows[0]) selectDef(rows[0])
  }
}))

async function loadDefs() {
  defsLoading.value = true
  try {
    const data = await request<AllowanceDef[]>({ url: '/allowances' })
    defs.value = data ?? []
  } catch {
    defs.value = []
  } finally {
    defsLoading.value = false
  }
}

// Def Modal
const defModalOpen = ref(false)
const defModalTitle = computed(() => defForm.value.id ? '编辑补贴项' : '新建补贴项')
const defForm = ref<{ id: number | null; code: string; name: string; description: string; displayOrder: number; isEnabled: boolean }>({
  id: null, code: '', name: '', description: '', displayOrder: 0, isEnabled: true
})

function openAddDef() {
  defForm.value = { id: null, code: '', name: '', description: '', displayOrder: 0, isEnabled: true }
  defModalOpen.value = true
}

function openEditDef(def: AllowanceDef) {
  defForm.value = {
    id: def.id, code: def.code, name: def.name,
    description: def.description ?? '',
    displayOrder: def.displayOrder ?? 0,
    isEnabled: def.isEnabled
  }
  defModalOpen.value = true
}

function closeDefModal() {
  defModalOpen.value = false
}

async function submitDef() {
  if (!defForm.value.name.trim()) { message.error('请输入名称'); return }
  if (!defForm.value.id && !defForm.value.code.trim()) { message.error('请输入代码'); return }
  try {
    if (defForm.value.id) {
      await request({
        url: `/allowances/${defForm.value.id}`,
        method: 'PUT',
        body: {
          name: defForm.value.name,
          description: defForm.value.description,
          displayOrder: defForm.value.displayOrder,
          isEnabled: defForm.value.isEnabled
        }
      })
    } else {
      await request({
        url: '/allowances',
        method: 'POST',
        body: defForm.value
      })
    }
    message.success('保存成功')
    defModalOpen.value = false
    await loadDefs()
  } catch {
    // handled by request util
  }
}

async function deleteDef(id: number) {
  try {
    await request({ url: `/allowances/${id}`, method: 'DELETE' })
    message.success('已删除')
    if (selectedDef.value?.id === id) selectedDef.value = null
    await loadDefs()
  } catch {
    // handled by request util
  }
}

// Scope editor state
const scopeTab = ref<'GLOBAL' | 'POSITION' | 'EMPLOYEE'>('GLOBAL')
const globalAmount = ref<number | undefined>(undefined)
const positions = ref<PositionRow[]>([])
const positionsLoading = ref(false)
const positionAmounts = reactive<Record<number, number | undefined>>({})
const employees = ref<EmployeeRow[]>([])
const employeeOverrides = ref<EmployeeOverride[]>([])
const newEmployeeId = ref<number | undefined>(undefined)
const newEmployeeAmount = ref<number | undefined>(undefined)
const saving = ref(false)

const positionScopeColumns = [
  { title: '岗位', dataIndex: 'positionName', key: 'positionName' },
  { title: '金额', key: 'amount', width: 180 }
]

const employeeScopeColumns = [
  { title: '员工', key: 'employeeName' },
  { title: '金额', key: 'amount', width: 180 },
  { title: '操作', key: 'action', width: 80 }
]

const employeeOptions = computed(() => employees.value.map(e => ({
  value: e.id, label: `${e.name} (${e.employeeNo})`
})))

function employeeLabel(id: number): string {
  const e = employees.value.find(x => x.id === id)
  return e ? `${e.name} (${e.employeeNo})` : `#${id}`
}

async function selectDef(def: AllowanceDef) {
  selectedDef.value = def
  await Promise.all([loadConfigs(def.id), loadPositions(), loadEmployees()])
}

async function loadConfigs(defId: number) {
  try {
    const list = await request<AllowanceConfig[]>({ url: `/allowances/${defId}/configs` })
    globalAmount.value = undefined
    Object.keys(positionAmounts).forEach(k => { positionAmounts[Number(k)] = undefined })
    employeeOverrides.value = []
    for (const c of list ?? []) {
      if (c.scope === 'GLOBAL') globalAmount.value = c.amount
      else if (c.scope === 'POSITION' && c.scopeTargetId != null) positionAmounts[c.scopeTargetId] = c.amount
      else if (c.scope === 'EMPLOYEE' && c.scopeTargetId != null) {
        employeeOverrides.value.push({ employeeId: c.scopeTargetId, amount: c.amount })
      }
    }
  } catch {
    // handled by request util
  }
}

async function loadPositions() {
  if (positions.value.length > 0) return
  positionsLoading.value = true
  try {
    const list = await request<PositionRow[]>({ url: '/positions' })
    positions.value = list ?? []
  } catch {
    positions.value = []
  } finally {
    positionsLoading.value = false
  }
}

async function loadEmployees() {
  if (employees.value.length > 0) return
  try {
    const page = await request<{ content: EmployeeRow[] }>({ url: '/employees?size=500' })
    employees.value = page?.content ?? []
  } catch {
    employees.value = []
  }
}

function addEmployeeOverride() {
  if (!newEmployeeId.value || newEmployeeAmount.value == null) {
    message.warning('请选择员工并填写金额')
    return
  }
  if (employeeOverrides.value.some(o => o.employeeId === newEmployeeId.value)) {
    message.warning('该员工已在列表中')
    return
  }
  employeeOverrides.value.push({ employeeId: newEmployeeId.value, amount: newEmployeeAmount.value })
  newEmployeeId.value = undefined
  newEmployeeAmount.value = undefined
}

function removeEmployeeOverride(id: number) {
  employeeOverrides.value = employeeOverrides.value.filter(o => o.employeeId !== id)
}

async function saveConfigs() {
  if (!selectedDef.value) return
  saving.value = true
  try {
    const payload: Array<{ scope: string; scopeTargetId: number | null; amount: number }> = []
    if (globalAmount.value != null && globalAmount.value >= 0) {
      payload.push({ scope: 'GLOBAL', scopeTargetId: null, amount: globalAmount.value })
    }
    for (const pos of positions.value) {
      const amt = positionAmounts[pos.id]
      if (amt != null && amt >= 0) {
        payload.push({ scope: 'POSITION', scopeTargetId: pos.id, amount: amt })
      }
    }
    for (const o of employeeOverrides.value) {
      payload.push({ scope: 'EMPLOYEE', scopeTargetId: o.employeeId, amount: o.amount })
    }
    await request({
      url: `/allowances/${selectedDef.value.id}/configs`,
      method: 'PUT',
      body: payload
    })
    message.success('保存成功')
  } catch {
    // handled by request util
  } finally {
    saving.value = false
  }
}

watch(() => selectedDef.value?.id, () => {
  scopeTab.value = 'GLOBAL'
})

onMounted(loadDefs)
</script>

<style scoped>
.allowances-page {
  /* Natural flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.section-card {
  margin-bottom: 16px;
}

.scope-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scope-label {
  color: #666;
}

.scope-hint {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}

.employee-scope-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.save-bar {
  margin-top: 16px;
  text-align: right;
}
</style>
