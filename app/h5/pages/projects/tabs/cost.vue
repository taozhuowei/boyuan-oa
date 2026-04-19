<template>
  <!-- 成本 Tab — projects/tabs/cost.vue
       职责：实体成本录入/查看 + 保险成本管理。
       数据来源：
         GET    /api/projects/{id}/material-costs — 实体成本列表
         POST   /api/projects/{id}/material-costs — 录入实体成本
         DELETE /api/projects/{id}/material-costs/{costId} — 删除实体成本
         GET    /api/projects/{id}/insurance/summary — 保险成本汇总（含合计行）
         POST   /api/projects/{id}/insurance — 新建保险条目
         DELETE /api/projects/{id}/insurance/{id} — 删除保险条目 -->
  <div>
    <a-tabs v-model:activeKey="innerTab">
      <a-tab-pane key="material" tab="实体成本" />
      <a-tab-pane key="insurance" tab="保险成本" />
    </a-tabs>

    <!-- ── 内层 Tab: 实体成本 ── -->
    <template v-if="innerTab === 'material'">
      <div style="margin-bottom: 12px; display: flex; gap: 8px; align-items: center">
        <a-button type="primary" @click="openMaterialModal">+ 录入实体成本</a-button>
        <a-button :loading="materialLoading" @click="loadMaterialCosts">刷新</a-button>
        <span style="margin-left: auto; color: #666">合计：¥{{ formatAmount(materialTotal) }}</span>
      </div>
      <a-table
        :columns="materialColumns"
        :data-source="materialCosts"
        :loading="materialLoading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'subtotal'">
            ¥{{ formatAmount(Number(record.quantity) * Number(record.unitPrice)) }}
          </template>
          <template v-if="column.key === 'action'">
            <a-popconfirm title="确定删除？" @confirm="deleteMaterialCost(record.id)">
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="showMaterialModal"
        title="录入实体成本"
        :confirm-loading="materialSubmitting"
        @ok="submitMaterialCost"
        @cancel="showMaterialModal = false"
        width="540px"
      >
        <a-form layout="vertical" :model="materialForm">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="物品名称" required>
                <a-input v-model:value="materialForm.itemName" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="规格"><a-input v-model:value="materialForm.spec" /></a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="数量" required>
                <a-input-number
                  v-model:value="materialForm.quantity"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="单位" required>
                <a-input v-model:value="materialForm.unit" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="单价（元）" required>
                <a-input-number
                  v-model:value="materialForm.unitPrice"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
          </a-row>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="发生日期" required>
                <a-input v-model:value="materialForm.occurredOn" placeholder="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="备注">
                <a-input v-model:value="materialForm.remark" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>
      </a-modal>
    </template>

    <!-- ── 内层 Tab: 保险成本 ── -->
    <template v-if="innerTab === 'insurance'">
      <div style="margin-bottom: 12px; display: flex; gap: 8px">
        <a-button v-if="canEditInsurance" type="primary" @click="openInsuranceModal">
          + 新建保险条目
        </a-button>
        <a-button :loading="insuranceLoading" @click="loadInsurance">刷新</a-button>
      </div>
      <a-table
        :columns="insuranceColumns"
        :data-source="insuranceRows"
        :loading="insuranceLoading"
        :pagination="false"
        row-key="insuranceName"
        size="small"
        :row-class-name="(r: InsuranceRow) => (r.isTotal ? 'insurance-total-row' : '')"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scope'">
            <span v-if="!record.isTotal">
              {{ insuranceScopeLabel(record.scope)
              }}{{ record.scopeTargetId ? ' #' + record.scopeTargetId : '' }}
            </span>
          </template>
          <template v-if="column.key === 'cost'">
            <strong v-if="record.isTotal">¥{{ formatAmount(Number(record.cost)) }}</strong>
            <span v-else>¥{{ formatAmount(Number(record.cost ?? 0)) }}</span>
          </template>
          <template v-if="column.key === 'action'">
            <a-popconfirm
              v-if="canEditInsurance && !record.isTotal"
              title="确定删除？"
              @confirm="deleteInsurance(record.id)"
            >
              <a-button type="link" danger size="small">删除</a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>

      <a-modal
        v-model:open="showInsuranceModal"
        title="新建保险条目"
        :confirm-loading="insuranceSaving"
        @ok="submitInsurance"
        @cancel="showInsuranceModal = false"
        width="520px"
      >
        <a-form layout="vertical" :model="insuranceForm">
          <a-form-item label="险种名称" required>
            <a-input v-model:value="insuranceForm.insuranceName" placeholder="如 工伤险 / 人身险" />
          </a-form-item>
          <a-form-item label="作用域" required>
            <a-select v-model:value="insuranceForm.scope">
              <a-select-option value="GLOBAL">全部劳工</a-select-option>
              <a-select-option value="POSITION">指定岗位</a-select-option>
              <a-select-option value="EMPLOYEE">指定个人</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item
            v-if="insuranceForm.scope !== 'GLOBAL'"
            :label="insuranceForm.scope === 'POSITION' ? '岗位 ID' : '员工 ID'"
            required
          >
            <a-input-number
              v-model:value="insuranceForm.scopeTargetId"
              :precision="0"
              style="width: 100%"
            />
          </a-form-item>
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="单价（元/天）" required>
                <a-input-number
                  v-model:value="insuranceForm.dailyRate"
                  :precision="2"
                  :min="0"
                  style="width: 100%"
                />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="生效日期" required>
                <a-input v-model:value="insuranceForm.effectiveDate" placeholder="YYYY-MM-DD" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="备注"><a-input v-model:value="insuranceForm.remark" /></a-form-item>
        </a-form>
      </a-modal>
    </template>
  </div>
</template>

<style scoped>
:deep(.insurance-total-row) td {
  background: #fafafa;
  font-weight: 500;
}
</style>

<script setup lang="ts">
/**
 * 成本 Tab 子组件 — projects/tabs/cost.vue
 * 职责：实体成本（录入/列表/删除）+ 保险成本（新建/列表/删除）。
 * Props：project（父页面传入的项目详情）、projectId（项目 ID）
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import type { ProjectDetail } from '../types'

// ── Props ──────────────────────────────────────────────
interface Props {
  project: ProjectDetail
  projectId: number
}
const props = defineProps<Props>()

// ── 权限 ──────────────────────────────────────────────
const userStore = useUserStore()
const role = computed(() => userStore.userInfo?.role ?? '')
const canEditInsurance = computed(() => ['ceo', 'finance'].includes(role.value))

// ── 内层 Tab ───────────────────────────────────────────
const innerTab = ref('material')

// ── 金额格式化（实体成本和保险成本共用） ────────────────
function formatAmount(n: number) {
  return Number(n ?? 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ── 实体成本 ───────────────────────────────────────────
interface MaterialCost {
  id: number
  itemName: string
  spec?: string
  quantity: number
  unit: string
  unitPrice: number
  occurredOn: string
  remark?: string
}

const materialCosts = ref<MaterialCost[]>([])
const materialLoading = ref(false)
const showMaterialModal = ref(false)
const materialSubmitting = ref(false)
const materialForm = ref<{
  itemName: string
  spec: string
  quantity: number | undefined
  unit: string
  unitPrice: number | undefined
  occurredOn: string
  remark: string
}>({
  itemName: '',
  spec: '',
  quantity: undefined,
  unit: '',
  unitPrice: undefined,
  occurredOn: new Date().toISOString().slice(0, 10),
  remark: '',
})

const materialColumns = [
  { title: '物品名称', dataIndex: 'itemName', key: 'itemName' },
  { title: '规格', dataIndex: 'spec', key: 'spec' },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80 },
  { title: '单位', dataIndex: 'unit', key: 'unit', width: 80 },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100 },
  { title: '小计', key: 'subtotal', width: 110 },
  { title: '日期', dataIndex: 'occurredOn', key: 'occurredOn', width: 110 },
  { title: '操作', key: 'action', width: 80 },
]

const materialTotal = computed(() =>
  materialCosts.value.reduce((s, m) => s + Number(m.quantity) * Number(m.unitPrice), 0)
)

async function loadMaterialCosts() {
  materialLoading.value = true
  try {
    materialCosts.value =
      (await request<MaterialCost[]>({ url: `/projects/${props.projectId}/material-costs` })) ?? []
  } catch {
    materialCosts.value = []
  } finally {
    materialLoading.value = false
  }
}

function openMaterialModal() {
  materialForm.value = {
    itemName: '',
    spec: '',
    quantity: undefined,
    unit: '',
    unitPrice: undefined,
    occurredOn: new Date().toISOString().slice(0, 10),
    remark: '',
  }
  showMaterialModal.value = true
}

async function submitMaterialCost() {
  if (
    !materialForm.value.itemName ||
    !materialForm.value.quantity ||
    !materialForm.value.unit ||
    !materialForm.value.unitPrice ||
    !materialForm.value.occurredOn
  ) {
    message.warning('必填项不完整')
    return
  }
  materialSubmitting.value = true
  try {
    await request({
      url: `/projects/${props.projectId}/material-costs`,
      method: 'POST',
      body: materialForm.value,
    })
    message.success('已录入')
    showMaterialModal.value = false
    await loadMaterialCosts()
  } catch {
  } finally {
    materialSubmitting.value = false
  }
}

async function deleteMaterialCost(id: number) {
  try {
    await request({ url: `/projects/${props.projectId}/material-costs/${id}`, method: 'DELETE' })
    await loadMaterialCosts()
  } catch {}
}

// ── 保险成本 ───────────────────────────────────────────
interface InsuranceRow {
  id: number | null
  insuranceName: string
  scope?: string
  scopeTargetId?: number | null
  dailyRate?: number
  effectiveDate?: string
  remark?: string | null
  manDays?: number
  cost?: number
  isTotal?: boolean
}

const insuranceRows = ref<InsuranceRow[]>([])
const insuranceLoading = ref(false)
const showInsuranceModal = ref(false)
const insuranceSaving = ref(false)
const insuranceForm = ref<{
  insuranceName: string
  scope: 'GLOBAL' | 'POSITION' | 'EMPLOYEE'
  scopeTargetId: number | undefined
  dailyRate: number | undefined
  effectiveDate: string
  remark: string
}>({
  insuranceName: '',
  scope: 'GLOBAL',
  scopeTargetId: undefined,
  dailyRate: undefined,
  effectiveDate: new Date().toISOString().slice(0, 10),
  remark: '',
})

// 设计 §8.4：本期出勤 / 本期成本 两列 + 合计行（来自 GET /summary）
const insuranceColumns = [
  { title: '险种', dataIndex: 'insuranceName', key: 'insuranceName' },
  { title: '适用范围', key: 'scope', width: 140 },
  { title: '日费率', dataIndex: 'dailyRate', key: 'dailyRate', width: 100 },
  { title: '生效日期', dataIndex: 'effectiveDate', key: 'effectiveDate', width: 110 },
  { title: '本期出勤', dataIndex: 'manDays', key: 'manDays', width: 100 },
  { title: '本期成本', key: 'cost', width: 130 },
  { title: '操作', key: 'action', width: 80 },
]

function insuranceScopeLabel(scope: string) {
  return (
    ({ GLOBAL: '全劳工', POSITION: '岗位', EMPLOYEE: '指定个人' } as Record<string, string>)[
      scope
    ] ?? scope
  )
}

async function loadInsurance() {
  insuranceLoading.value = true
  try {
    // /summary 一次拉取条目元信息 + 本期出勤 + 本期成本（含合计行）
    insuranceRows.value =
      (await request<InsuranceRow[]>({ url: `/projects/${props.projectId}/insurance/summary` })) ??
      []
  } catch {
    insuranceRows.value = []
  } finally {
    insuranceLoading.value = false
  }
}

function openInsuranceModal() {
  insuranceForm.value = {
    insuranceName: '',
    scope: 'GLOBAL',
    scopeTargetId: undefined,
    dailyRate: undefined,
    effectiveDate: new Date().toISOString().slice(0, 10),
    remark: '',
  }
  showInsuranceModal.value = true
}

async function submitInsurance() {
  if (
    !insuranceForm.value.insuranceName ||
    !insuranceForm.value.dailyRate ||
    !insuranceForm.value.effectiveDate
  ) {
    message.warning('险种/单价/生效日期必填')
    return
  }
  insuranceSaving.value = true
  try {
    await request({
      url: `/projects/${props.projectId}/insurance`,
      method: 'POST',
      body: insuranceForm.value,
    })
    message.success('已新建')
    showInsuranceModal.value = false
    await loadInsurance()
  } catch {
  } finally {
    insuranceSaving.value = false
  }
}

async function deleteInsurance(id: number) {
  try {
    await request({ url: `/projects/${props.projectId}/insurance/${id}`, method: 'DELETE' })
    await loadInsurance()
  } catch {}
}

// ── 初始化 ─────────────────────────────────────────────
onMounted(loadMaterialCosts)
</script>
