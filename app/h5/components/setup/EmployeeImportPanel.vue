<template>
  <!--
    EmployeeImportPanel — 员工通讯录批量导入面板（向导态 + 运营态共用）

    场景：
      - mode='wizard'    用于 /setup 初始化向导步骤 6（DESIGN.md §2.2 步骤 6）
                         CSV 解析全在前端完成，结果写入 modelValue（departments/positions/employees）；
                         不调任何 API，由父组件随 setup finalize 一并提交。
      - mode='operation' 用于 /directory 通讯录导入页（CEO/HR 运营期使用）
                         保留原有"预览(POST /directory/import-preview)→ 确认(POST /directory/import-apply)"链路，
                         API 调用由父组件分发；本组件仅负责三步式 UI 交互。

    数据走向：
      父组件通过 v-model 双向绑定 EmployeeImportData；用户在面板内的导入操作
      会以 change 事件回传给父组件，由父组件根据 action 决定后续动作。
  -->
  <div class="employee-import-panel">
    <a-card>
      <a-steps :current="currentStep" class="steps">
        <a-step title="上传数据" />
        <a-step title="预览确认" />
        <a-step title="导入完成" />
      </a-steps>

      <!-- Step 1: Upload -->
      <div v-if="currentStep === 0" class="step-content">
        <a-textarea
          v-model:value="csvInput"
          data-catch="employee-import-textarea-csv"
          :rows="10"
          placeholder="在此粘贴 CSV 数据，每行一条，格式：姓名,手机号,部门&#10;示例：&#10;张三,13800138000,工程部&#10;李四,13900139000,财务部"
        />
        <div class="step-actions">
          <a-button
            type="primary"
            data-catch="employee-import-btn-next"
            :loading="previewLoading"
            @click="handlePreview"
          >
            下一步
          </a-button>
        </div>
      </div>

      <!-- Step 2: Preview -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="statistics">
          <a-card class="stat-card">
            <a-statistic
              title="共计"
              data-catch="employee-import-stat-total"
              :value="previewData?.totalCount ?? 0"
            />
          </a-card>
          <a-card class="stat-card">
            <a-statistic
              title="有效"
              :value="previewData?.validCount ?? 0"
              :value-style="{ color: '#52c41a' }"
            />
          </a-card>
          <a-card class="stat-card">
            <a-statistic
              title="无效"
              :value="previewData?.invalidCount ?? 0"
              :value-style="{ color: '#ff4d4f' }"
            />
          </a-card>
          <a-card class="stat-card">
            <a-statistic
              title="重复"
              data-catch="employee-import-stat-duplicate"
              :value="previewData?.duplicateCount ?? 0"
              :value-style="{ color: '#fa8c16' }"
            />
          </a-card>
        </div>

        <a-table
          :data-source="previewData?.items ?? []"
          :columns="columns"
          :row-selection="rowSelection"
          row-key="rowIndex"
          size="small"
          :pagination="false"
          :scroll="{ y: 400 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor((record as PreviewItem).status)">
                {{ getStatusLabel((record as PreviewItem).status) }}
              </a-tag>
            </template>
          </template>
        </a-table>

        <div class="step-actions">
          <a-button @click="handleBack">上一步</a-button>
          <a-button
            type="primary"
            data-catch="employee-import-btn-import"
            :loading="importLoading"
            @click="handleImport"
          >
            确认导入
          </a-button>
        </div>
      </div>

      <!-- Step 3: Done -->
      <div v-if="currentStep === 2" class="step-content">
        <a-result status="success" title="导入成功" :sub-title="importMessage">
          <template #extra>
            <a-button type="primary" @click="handleReset">再次导入</a-button>
          </template>
        </a-result>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * EmployeeImportPanel — 员工通讯录批量导入面板组件
 *
 * 设计依据：DESIGN.md §2.2 步骤 6 — 系统初始化向导内嵌入与 /directory 共用的
 * <EmployeeImportPanel /> 组件，"一处实现、两处复用"。
 *
 * 数据契约：
 *   父组件通过 v-model 维护 EmployeeImportData 结构；wizard 模式下解析后的结构数据
 *   会同步写回 modelValue；operation 模式下面板仅作 UI 容器，API 调用由父组件经
 *   change 事件触发（保持与原 /directory 页面 1:1 行为一致）。
 *
 * 不变量：
 *   - wizard 模式：本组件不调用任何后端接口，CSV 解析全部在前端完成
 *   - operation 模式：本组件不直接发请求；仅 emit change 让父组件调用
 *     /directory/import-preview 与 /directory/import-apply
 *   - tempId 命名规则：emp-1、emp-2 …（仅 wizard 模式使用，与 finalize 事务内部句柄约定一致）
 */
import { ref, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'

// ────────────────────────────────────────────────────────────────────
// Types — 与 SetupFinalizeRequest.EmployeeImportDto 字段对齐
// ────────────────────────────────────────────────────────────────────

/**
 * 部门简化数据，对齐后端 SetupFinalizeRequest.DepartmentDto。
 *
 * @property parentId 上级部门 ID（顶级为 null；wizard 模式下统一为 null）
 * @property name     部门名称
 * @property sort     排序号（默认 0）
 */
export interface DepartmentEntry {
  parentId: number | null
  name: string
  sort: number
}

/**
 * 岗位等级，对齐后端 PositionLevelUpsertRequest。
 *
 * 字段全部为可选，wizard 模式下若未提供等级，发送空数组即可。
 */
export interface PositionLevelEntry {
  levelName?: string
  levelOrder?: number
  baseSalaryOverride?: number | null
  positionSalaryOverride?: number | null
  performanceBonusOverride?: number | null
  annualLeaveOverride?: number | null
}

/**
 * 岗位主体，对齐后端 PositionUpsertRequest（仅保留 wizard 必需字段）。
 */
export interface PositionMainEntry {
  positionName: string
  employeeCategory?: string
  defaultRoleCode?: string
}

/**
 * 岗位条目，对齐后端 SetupFinalizeRequest.PositionDto = position + levels。
 */
export interface PositionEntry {
  position: PositionMainEntry
  levels: PositionLevelEntry[]
}

/**
 * 员工创建参数，对齐后端 EmployeeCreateRequest 必填字段。
 *
 * @property name         姓名（NotBlank）
 * @property phone        手机号（11 位中国大陆手机号格式）
 * @property roleCode     角色编码（NotBlank）
 * @property departmentId 部门 ID（NotNull；wizard 模式下指向 client 临时部门下标，由后端 finalize 解析）
 * @property entryDate    入职日期（NotNull；wizard 模式默认填 当前日期 yyyy-MM-dd）
 * @property positionId   岗位 ID（可选）
 * @property levelId      岗位等级 ID（可选）
 */
export interface EmployeePayload {
  name: string
  phone: string
  email?: string
  roleCode: string
  departmentId?: number | null
  positionId?: number | null
  levelId?: number | null
  entryDate?: string
}

/**
 * 员工导入条目，对齐后端 SetupFinalizeRequest.EmployeeImportEntryDto。
 *
 * @property tempId  客户端临时句柄（如 emp-1、emp-2），同一 finalize 请求体内唯一
 * @property payload 员工创建参数
 */
export interface EmployeeImportEntry {
  tempId: string
  payload: EmployeePayload
}

/**
 * 员工导入数据包，对齐后端 SetupFinalizeRequest.EmployeeImportDto。
 *
 * @property departments 部门列表（按 sort 升序）
 * @property positions   岗位列表（含等级）
 * @property employees   员工列表（每项含 tempId 与 payload）
 */
export interface EmployeeImportData {
  departments: DepartmentEntry[]
  positions: PositionEntry[]
  employees: EmployeeImportEntry[]
}

/**
 * 预览表格单行数据，与后端 /directory/import-preview 返回结构兼容。
 *
 * @property rowIndex CSV 原始行号（0-based）
 * @property name     姓名
 * @property phone    手机号
 * @property department 部门名称
 * @property status   行状态：VALID / INVALID / DUPLICATE
 * @property message  状态说明文案
 */
export interface PreviewItem {
  rowIndex: number
  name: string
  phone: string
  department: string
  status: 'VALID' | 'INVALID' | 'DUPLICATE'
  message: string
}

/**
 * 预览结果，与后端 /directory/import-preview 返回结构兼容。
 */
export interface PreviewResponse {
  totalCount: number
  validCount: number
  invalidCount: number
  duplicateCount: number
  items: PreviewItem[]
}

/**
 * CSV 行解析结果（中间结构，仅 wizard 模式自用 + operation 模式作为预览请求 body）。
 */
export interface CsvRecord {
  name: string
  phone: string
  department: string
}

/**
 * change 事件载荷。
 *
 * - preview-request：operation 模式下用户点击"下一步"，父组件应调用 /directory/import-preview
 * - apply-request  ：operation 模式下用户点击"确认导入"，父组件应调用 /directory/import-apply
 * - apply-done     ：wizard / operation 通用，导入流程已完成（数据已写入 modelValue 或 API 已成功）
 * - reset          ：用户点击"再次导入"，父组件应清理任何外部缓存
 */
export type ChangeAction = 'preview-request' | 'apply-request' | 'apply-done' | 'reset'

/**
 * change 事件 payload。
 *
 * @property action  动作类型（见 ChangeAction）
 * @property records preview-request 时携带：解析后的 CSV 行（待发往后端）
 * @property indices apply-request 时携带：用户勾选要导入的 rowIndex 数组
 * @property message apply-done 时携带：成功提示文案
 */
export interface ChangePayload {
  action: ChangeAction
  records?: CsvRecord[]
  indices?: number[]
  message?: string
}

// ────────────────────────────────────────────────────────────────────
// Props & Emits
// ────────────────────────────────────────────────────────────────────

/**
 * Props
 *
 * @property modelValue v-model 双向绑定 EmployeeImportData（必填）
 *                      - wizard 模式：CSV 解析结果会增量写入此对象
 *                      - operation 模式：本组件仅作 UI 容器，不写入 modelValue，
 *                        但仍允许父组件传入空结构占位以保持类型一致性
 * @property mode       面板模式；wizard 不调 API，operation 由父组件经 change 调 API
 */
const props = withDefaults(
  defineProps<{
    modelValue: EmployeeImportData
    mode?: 'wizard' | 'operation'
  }>(),
  {
    mode: 'operation',
  }
)

/**
 * Emits
 *
 * @event update:modelValue v-model 同步事件（仅 wizard 模式触发）
 * @event change            动作事件，operation 模式由父组件转换为 API 调用
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: EmployeeImportData): void
  (e: 'change', payload: ChangePayload): void
}>()

// ────────────────────────────────────────────────────────────────────
// 内部状态
// ────────────────────────────────────────────────────────────────────

/** 当前步骤：0=输入 CSV、1=预览确认、2=导入完成 */
const currentStep = ref(0)

/** CSV 文本输入框双向值 */
const csvInput = ref('')

/** "下一步"按钮 loading 标志（operation 模式 API 调用期间） */
const previewLoading = ref(false)

/** "确认导入"按钮 loading 标志（operation 模式 API 调用期间） */
const importLoading = ref(false)

/** 预览数据；wizard 模式由前端解析生成，operation 模式由父组件回填 */
const previewData = ref<PreviewResponse | null>(null)

/** 用户在表格中勾选的行号（仅 VALID 行可勾） */
const selectedRowKeys = ref<number[]>([])

/** Step 3 显示的导入完成文案 */
const importMessage = ref('')

/** wizard 模式下 tempId 自增计数器；每次重置面板归零 */
const tempIdCounter = ref(0)

// ────────────────────────────────────────────────────────────────────
// 表格列与状态映射
// ────────────────────────────────────────────────────────────────────

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '手机号', dataIndex: 'phone', key: 'phone' },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '状态', key: 'status', width: 80 },
  { title: '说明', dataIndex: 'message', key: 'message', ellipsis: true },
]

/**
 * 表格行选择配置；INVALID 行禁止勾选。
 * 使用 reactive 而非 ref，避免 a-table row-selection 解包陷阱。
 */
const rowSelection = computed(() =>
  reactive({
    selectedRowKeys: selectedRowKeys.value,
    onChange: (keys: (string | number)[]) => {
      selectedRowKeys.value = keys as number[]
    },
    getCheckboxProps: (record: PreviewItem) => ({
      disabled: record.status === 'INVALID',
    }),
  })
)

const STATUS_LABELS: Record<string, string> = {
  VALID: '有效',
  INVALID: '无效',
  DUPLICATE: '重复',
}

/**
 * 行状态枚举值 → 中文标签。
 * @param status PreviewItem.status
 */
function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status
}

/**
 * 行状态 → ant-design-vue tag 颜色名。
 * @param status PreviewItem.status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'VALID':
      return 'success'
    case 'INVALID':
      return 'error'
    case 'DUPLICATE':
      return 'warning'
    default:
      return 'default'
  }
}

// ────────────────────────────────────────────────────────────────────
// CSV 解析（纯 JS；wizard 与 operation 模式都先用这一段把 CSV 文本拆成 records）
// ────────────────────────────────────────────────────────────────────

/**
 * 把多行 CSV 文本解析为 CsvRecord 列表；忽略空白行；不足三列的行直接丢弃。
 * 与原 /directory/index.vue 解析规则严格一致，以保证 1:1 还原。
 *
 * @param input 用户粘贴的 CSV 文本
 */
function parseCsvInput(input: string): CsvRecord[] {
  const lines = input.split('\n')
  const records: CsvRecord[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const parts = trimmed.split(',')
    if (parts.length >= 3) {
      records.push({
        name: parts[0].trim(),
        phone: parts[1].trim(),
        department: parts[2].trim(),
      })
    }
  }

  return records
}

/**
 * 中国大陆手机号校验：1 起头 + 第二位 3-9 + 共 11 位数字。
 * 与后端 EmployeeCreateRequest.phone 的 @Pattern 规则一致。
 */
const PHONE_REGEX = /^1[3-9]\d{9}$/

/**
 * wizard 模式下：把 CSV records 在前端转换为 PreviewResponse。
 *
 * 行级校验：
 *   - 姓名 / 手机号 / 部门任一为空 → INVALID
 *   - 手机号格式非法              → INVALID
 *   - 同一文本中手机号重复          → DUPLICATE（仅第二次起标 DUPLICATE，首次保留 VALID）
 *
 * @param records parseCsvInput 解析结果
 */
function buildClientPreview(records: CsvRecord[]): PreviewResponse {
  const items: PreviewItem[] = []
  const seenPhones = new Set<string>()

  records.forEach((rec, idx) => {
    let status: PreviewItem['status'] = 'VALID'
    let msg = '有效'

    if (!rec.name || !rec.phone || !rec.department) {
      status = 'INVALID'
      msg = '姓名 / 手机号 / 部门 不能为空'
    } else if (!PHONE_REGEX.test(rec.phone)) {
      status = 'INVALID'
      msg = '手机号格式不正确'
    } else if (seenPhones.has(rec.phone)) {
      status = 'DUPLICATE'
      msg = '该手机号在本次导入中重复出现'
    } else {
      seenPhones.add(rec.phone)
    }

    items.push({
      rowIndex: idx,
      name: rec.name,
      phone: rec.phone,
      department: rec.department,
      status,
      message: msg,
    })
  })

  return {
    totalCount: items.length,
    validCount: items.filter((i) => i.status === 'VALID').length,
    invalidCount: items.filter((i) => i.status === 'INVALID').length,
    duplicateCount: items.filter((i) => i.status === 'DUPLICATE').length,
    items,
  }
}

// ────────────────────────────────────────────────────────────────────
// 步骤切换：上一步 / 重置
// ────────────────────────────────────────────────────────────────────

/**
 * "上一步"按钮：返回到 CSV 输入界面，清掉本次预览结果。
 */
function handleBack(): void {
  currentStep.value = 0
  previewData.value = null
  selectedRowKeys.value = []
}

/**
 * "再次导入"按钮：完整重置面板内部状态。
 * 同时通知父组件清理任何外部缓存（operation 模式下父组件可能维持 importMessage 等态）。
 */
function handleReset(): void {
  currentStep.value = 0
  csvInput.value = ''
  previewData.value = null
  selectedRowKeys.value = []
  importMessage.value = ''
  emit('change', { action: 'reset' })
}

// ────────────────────────────────────────────────────────────────────
// 预览：operation 模式由父组件回填 previewData，wizard 模式直接前端构造
// ────────────────────────────────────────────────────────────────────

/**
 * 把后端或前端构造的 PreviewResponse 应用到组件状态，并默认勾选所有 VALID 行。
 * 暴露给父组件用，使父组件在 operation 模式下完成 /directory/import-preview API
 * 后通过 panelRef.applyPreviewResult(resp) 把结果交回组件渲染。
 *
 * @param resp 预览结果
 */
function applyPreviewResult(resp: PreviewResponse): void {
  previewData.value = resp
  selectedRowKeys.value = resp.items.filter((i) => i.status === 'VALID').map((i) => i.rowIndex)
  currentStep.value = 1
}

/**
 * "下一步"按钮处理：
 *   - 解析 CSV → 校验非空 → 根据 mode 走前端预览或父组件回填路径
 *   - operation 模式仅 emit preview-request，等父组件调 applyPreviewResult 推进步骤
 *   - wizard 模式同步前端构建 PreviewResponse 并直接推进步骤
 */
async function handlePreview(): Promise<void> {
  if (!csvInput.value.trim()) {
    message.warning('请输入 CSV 数据')
    return
  }

  const records = parseCsvInput(csvInput.value)
  if (records.length === 0) {
    message.warning('未找到有效数据，请检查输入格式')
    return
  }

  if (props.mode === 'wizard') {
    // 前端纯 JS 构建预览；不调任何 API
    applyPreviewResult(buildClientPreview(records))
    return
  }

  // operation 模式：交给父组件调 /directory/import-preview
  previewLoading.value = true
  emit('change', { action: 'preview-request', records })
}

/**
 * 父组件可调此方法来取消"下一步"按钮的 loading 态（API 失败 / 取消）。
 */
function setPreviewLoading(loading: boolean): void {
  previewLoading.value = loading
}

/**
 * 父组件可调此方法来取消"确认导入"按钮的 loading 态。
 */
function setImportLoading(loading: boolean): void {
  importLoading.value = loading
}

// ────────────────────────────────────────────────────────────────────
// 导入：wizard 写 modelValue / operation 由父组件调 API
// ────────────────────────────────────────────────────────────────────

/**
 * wizard 模式下：把已勾选的有效行写入 modelValue（departments / positions / employees）。
 *
 * 字段构造规则：
 *   - departments：从勾选行的"部门名称"去重生成；parentId 全为 null（顶级），sort 按出现顺序递增
 *   - positions  ：wizard 默认空数组（步骤 6 不要求录入岗位；后续向导步骤可补全）
 *   - employees  ：每行生成一条 EmployeeImportEntry，departmentId 写入"在本批 departments 数组中的下标"
 *                  （仅作客户端句柄；finalize 后端事务内会按该下标取出对应部门名再创建 →
 *                  替换为真实 ID。本组件不发请求，故无法获知真实 ID。）
 *                  TODO（D-M08 联调）：与 SetupService 二次确认对 client-index departmentId 的解析约定。
 *
 * @param selected 用户在预览表格中勾选的行号集合
 */
function writeWizardModel(selected: number[]): EmployeeImportData {
  if (!previewData.value) {
    return { departments: [], positions: [], employees: [] }
  }

  const validSelectedRows = previewData.value.items.filter(
    (item) => selected.includes(item.rowIndex) && item.status === 'VALID'
  )

  // 1) 从勾选行的部门名去重生成 departments[]
  const deptNames: string[] = []
  for (const row of validSelectedRows) {
    if (!deptNames.includes(row.department)) {
      deptNames.push(row.department)
    }
  }
  const departments: DepartmentEntry[] = deptNames.map((name, idx) => ({
    parentId: null,
    name,
    sort: idx,
  }))

  // 2) employees[]：每行一条，tempId 形如 emp-1、emp-2
  const today = new Date().toISOString().slice(0, 10)
  const employees: EmployeeImportEntry[] = validSelectedRows.map((row) => {
    tempIdCounter.value += 1
    return {
      tempId: `emp-${tempIdCounter.value}`,
      payload: {
        name: row.name,
        phone: row.phone,
        // 默认 employee 角色；wizard 后续步骤中可被父组件覆盖
        roleCode: 'employee',
        // 用部门名在本批次 departments 数组的下标作为客户端句柄；finalize 由后端处理映射
        departmentId: deptNames.indexOf(row.department),
        entryDate: today,
      },
    }
  })

  return {
    // wizard 模式整体替换 modelValue（保持父组件单向数据流可预测）
    departments,
    positions: [],
    employees,
  }
}

/**
 * "确认导入"按钮处理：
 *   - 至少勾选一条记录
 *   - wizard 模式：构造 EmployeeImportData 写入 modelValue → emit apply-done → 推进 Step 3
 *   - operation 模式：emit apply-request 让父组件调 /directory/import-apply，
 *                     父组件成功后必须调 applyImportResult(message) 来推进 Step 3
 */
function handleImport(): void {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请至少选择一条记录进行导入')
    return
  }

  if (props.mode === 'wizard') {
    const next = writeWizardModel(selectedRowKeys.value)
    emit('update:modelValue', next)
    importMessage.value = `已选 ${selectedRowKeys.value.length} 条员工记录`
    currentStep.value = 2
    emit('change', { action: 'apply-done', message: importMessage.value })
    return
  }

  // operation 模式：交给父组件调 /directory/import-apply
  importLoading.value = true
  emit('change', { action: 'apply-request', indices: [...selectedRowKeys.value] })
}

/**
 * 父组件回调：operation 模式下 /directory/import-apply 成功后由父组件调用，
 * 通知组件推进到 Step 3 并展示成功文案。
 *
 * @param msg 后端返回的成功提示
 */
function applyImportResult(msg: string): void {
  importMessage.value = msg
  importLoading.value = false
  currentStep.value = 2
  emit('change', { action: 'apply-done', message: msg })
}

// ────────────────────────────────────────────────────────────────────
// modelValue 变更监听（wizard 模式下父组件可能外部清空 → 同步重置面板）
// ────────────────────────────────────────────────────────────────────

watch(
  () => props.modelValue.employees.length,
  (len) => {
    if (props.mode === 'wizard' && len === 0 && currentStep.value === 2) {
      // 父组件清空数据 → 等价于"再次导入"
      currentStep.value = 0
      csvInput.value = ''
      previewData.value = null
      selectedRowKeys.value = []
    }
  }
)

// 暴露给父组件（operation 模式必用，wizard 模式忽略也无害）
defineExpose({
  applyPreviewResult,
  applyImportResult,
  setPreviewLoading,
  setImportLoading,
})
</script>

<style scoped>
.employee-import-panel {
  /* 自然流式布局 — 高度由内容决定，避免父容器 flex 干扰 */
}

.steps {
  margin-bottom: 24px;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.statistics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.stat-card {
  text-align: center;
}

.step-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
