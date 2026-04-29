<template>
  <!--
    RetentionPanel — 数据保留策略面板（向导态 + 运营态共用）

    场景：
      - mode='wizard'    用于 /setup 初始化向导步骤 10（DESIGN.md §2.2 步骤 10）
                         CEO 可在此新增 / 编辑保留策略，结果写入 modelValue.policies；
                         不调任何 API，由父组件随 setup finalize 一并提交。
      - mode='operation' 用于 /retention 数据保留管理页（CEO 运营期使用）
                         展示已生效的保留策略表格（只读）；
                         运营态目前后端无策略增改 API，因此本面板仅作只读展示，
                         父组件保留"到期提醒 / 导出任务"两个其他模块（运营专属）。

    数据走向：
      父组件通过 v-model 维护 RetentionData；wizard 模式下用户操作直接更新 modelValue，
      并以 change 事件回传增量动作；operation 模式下父组件可在 mounted 时把
      已加载的策略数据塞回 modelValue 即可正确渲染表格。
  -->
  <div class="retention-panel">
    <div v-if="mode === 'wizard'" class="panel-toolbar">
      <a-button type="primary" data-catch="retention-config-add-btn" @click="openCreateModal">
        新增保留策略
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="modelValue.policies"
      :pagination="false"
      :loading="loading"
      row-key="dataType"
      size="small"
      :locale="emptyLocale"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'dataType'">
          {{ getDataTypeLabel((record as RetentionPolicyEntry).dataType) }}
        </template>
        <template v-if="column.key === 'retentionYears'">
          {{ (record as RetentionPolicyEntry).retentionYears }} 年
        </template>
        <template v-if="column.key === 'warnBeforeDays'">
          {{ (record as RetentionPolicyEntry).warnBeforeDays }} 天
        </template>
        <template v-if="column.key === 'action' && mode === 'wizard'">
          <a-button
            type="link"
            size="small"
            :data-catch="'retention-config-edit-btn-' + (record as RetentionPolicyEntry).dataType"
            @click="openEditModal(record as RetentionPolicyEntry)"
          >
            编辑
          </a-button>
          <a-popconfirm
            title="确定删除该保留策略吗？"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record as RetentionPolicyEntry)"
          >
            <a-button
              type="link"
              size="small"
              danger
              :data-catch="
                'retention-config-delete-btn-' + (record as RetentionPolicyEntry).dataType
              "
            >
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增 / 编辑模态框（仅 wizard 模式渲染） -->
    <a-modal
      v-if="mode === 'wizard'"
      v-model:open="modalVisible"
      :title="isEditMode ? '编辑保留策略' : '新增保留策略'"
      :width="520"
      ok-text="保存"
      @ok="handleModalOk"
      @cancel="closeModal"
    >
      <a-form ref="formRef" :model="formState" :rules="rules" layout="vertical">
        <a-form-item label="数据类型" name="dataType">
          <a-select
            v-model:value="formState.dataType"
            :options="dataTypeOptions"
            :disabled="isEditMode"
            data-catch="retention-config-modal-data-type"
            placeholder="请选择数据类型"
          />
        </a-form-item>
        <a-form-item label="保留年限（年）" name="retentionYears">
          <a-input-number
            v-model:value="formState.retentionYears"
            :min="1"
            :max="100"
            data-catch="retention-config-modal-retention-years"
            style="width: 100%"
          />
        </a-form-item>
        <a-form-item label="提前警告天数" name="warnBeforeDays">
          <a-input-number
            v-model:value="formState.warnBeforeDays"
            :min="0"
            :max="365"
            data-catch="retention-config-modal-warn-days"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * RetentionPanel — 数据保留策略面板组件
 *
 * 设计依据：DESIGN.md §2.2 步骤 10 — 系统初始化向导内嵌入与 /retention
 * 共用的 <RetentionPanel /> 组件，"一处实现、两处复用"。
 *
 * 数据契约：
 *   父组件通过 v-model 维护 RetentionData；wizard 模式下用户操作直接更新
 *   modelValue.policies；operation 模式下本组件只渲染策略表格，
 *   "到期提醒 / 导出任务"两块运营专属功能由父组件在面板外部维护。
 *
 * 不变量：
 *   - 本组件不调用任何后端接口；API 调用全部在父组件或 finalize 流程
 *   - 数据类型 dataType 一旦创建不可改（作为 RetentionPolicy 唯一键，编辑模式置灰）
 *   - operation 模式下不显示新增 / 编辑 / 删除按钮（运营态目前无对应 API）
 *   - 模态框仅在 mode='wizard' 时挂载，避免 operation 页面出现误触
 */
import { ref, reactive, computed } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'

// ────────────────────────────────────────────────────────────────────
// Types — 与 SetupFinalizeRequest.RetentionDto 字段对齐
// ────────────────────────────────────────────────────────────────────

/**
 * 单条保留策略，对齐后端 SetupFinalizeRequest.RetentionPolicyDto。
 *
 * @property dataType        数据类型枚举（PAYROLL_SLIP / FORM_RECORD 等）
 * @property retentionYears  保留年限（≥ 1）
 * @property warnBeforeDays  提前警告天数（≥ 0）
 */
export interface RetentionPolicyEntry {
  dataType: string
  retentionYears: number
  warnBeforeDays: number
}

/**
 * 保留策略数据包，对齐后端 SetupFinalizeRequest.RetentionDto。
 */
export interface RetentionData {
  policies: RetentionPolicyEntry[]
}

/**
 * change 事件载荷。
 *
 * @property action 用户操作类型
 * @property policy 操作目标策略快照
 */
export interface ChangePayload {
  action: 'create' | 'update' | 'delete'
  policy: RetentionPolicyEntry
}

/**
 * 表单内部状态（与 RetentionPolicyEntry 一致；提取为独立类型以便 reactive 推断）。
 */
interface FormState {
  dataType: string
  retentionYears: number
  warnBeforeDays: number
}

// ────────────────────────────────────────────────────────────────────
// Props & Emits
// ────────────────────────────────────────────────────────────────────

/**
 * Props
 *
 * @property modelValue v-model 双向绑定 RetentionData（必填）
 * @property mode       面板模式；wizard 显示编辑 UI、operation 仅展示
 * @property loading    表格 loading 标志（operation 模式拉接口期间使用）
 */
const props = withDefaults(
  defineProps<{
    modelValue: RetentionData
    mode?: 'wizard' | 'operation'
    loading?: boolean
  }>(),
  {
    mode: 'operation',
    loading: false,
  }
)

/**
 * Emits
 *
 * @event update:modelValue v-model 同步事件，新结构（不可变更新）
 * @event change            wizard 模式下用户操作类型与目标策略
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: RetentionData): void
  (e: 'change', payload: ChangePayload): void
}>()

// ────────────────────────────────────────────────────────────────────
// 数据类型枚举与中文标签（与现网 /retention/index.vue 完全一致）
// ────────────────────────────────────────────────────────────────────

/** 与 RetentionService 后端枚举一致；本组件不感知具体含义，仅用于显示 + 下拉。 */
const DATA_TYPE_LABELS: Record<string, string> = {
  PAYROLL_SLIP: '工资条',
  FORM_RECORD: '表单记录',
  ATTENDANCE_RECORD: '考勤记录',
  CONSTRUCTION_LOG: '施工日志',
  INJURY_CLAIM: '工伤理赔',
  OPERATION_LOG: '操作日志',
}

const dataTypeOptions = Object.entries(DATA_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

/**
 * 把数据类型枚举值转换为中文标签；未识别的值原样返回。
 */
function getDataTypeLabel(dataType: string): string {
  return DATA_TYPE_LABELS[dataType] ?? dataType
}

// ────────────────────────────────────────────────────────────────────
// 表格列定义；wizard 模式比 operation 多一列"操作"
// ────────────────────────────────────────────────────────────────────

const columns = computed(() => {
  const base = [
    { title: '数据类型', key: 'dataType' },
    { title: '保留年限', key: 'retentionYears', width: 120 },
    { title: '提前警告天数', key: 'warnBeforeDays', width: 140 },
  ]
  if (props.mode === 'wizard') {
    base.push({ title: '操作', key: 'action', width: 160 })
  }
  return base
})

const emptyLocale = {
  emptyText:
    props.mode === 'wizard' ? '暂无保留策略，点击右上角「新增保留策略」开始配置' : '暂无保留策略',
}

// ────────────────────────────────────────────────────────────────────
// 模态框状态（仅 wizard 模式启用）
// ────────────────────────────────────────────────────────────────────

const modalVisible = ref(false)
const isEditMode = ref(false)
const formRef = ref<{ validate: () => Promise<void>; resetFields: () => void } | null>(null)

const formState = reactive<FormState>({
  dataType: '',
  retentionYears: 5,
  warnBeforeDays: 30,
})

const rules: Record<string, Rule[]> = {
  dataType: [{ required: true, message: '数据类型不能为空', trigger: 'change' }],
  retentionYears: [
    { required: true, type: 'number', message: '保留年限不能为空', trigger: 'change' },
  ],
  warnBeforeDays: [
    { required: true, type: 'number', message: '提前警告天数不能为空', trigger: 'change' },
  ],
}

/** 把表单清回默认值（新增前调用）。 */
function resetForm(): void {
  formState.dataType = ''
  formState.retentionYears = 5
  formState.warnBeforeDays = 30
}

/** 打开新增模态框。 */
function openCreateModal(): void {
  isEditMode.value = false
  resetForm()
  modalVisible.value = true
}

/**
 * 打开编辑模态框；将既有策略字段填入 formState。
 *
 * @param record 表格行对应的 RetentionPolicyEntry
 */
function openEditModal(record: RetentionPolicyEntry): void {
  isEditMode.value = true
  formState.dataType = record.dataType
  formState.retentionYears = record.retentionYears
  formState.warnBeforeDays = record.warnBeforeDays
  modalVisible.value = true
}

/** 关闭模态框，清空校验状态。 */
function closeModal(): void {
  modalVisible.value = false
  formRef.value?.resetFields()
}

// ────────────────────────────────────────────────────────────────────
// 提交：新增 / 编辑 / 删除（仅 wizard 模式调用）
// ────────────────────────────────────────────────────────────────────

/**
 * 模态框确认按钮处理：执行表单校验，校验通过后更新 v-model 并触发 change 事件。
 * 校验失败时静默返回，错误提示由 ant-design-vue 表单内联展示。
 */
async function handleModalOk(): Promise<void> {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  const policy: RetentionPolicyEntry = {
    dataType: formState.dataType,
    retentionYears: formState.retentionYears,
    warnBeforeDays: formState.warnBeforeDays,
  }

  if (isEditMode.value) {
    // 按 dataType 匹配替换；编辑态下 dataType 置灰，不会变化
    const next = props.modelValue.policies.map((p) => (p.dataType === policy.dataType ? policy : p))
    emit('update:modelValue', { ...props.modelValue, policies: next })
    emit('change', { action: 'update', policy })
  } else {
    // 新增：dataType 唯一性兜底校验（select 已通过 disabled 控制，但防御性补充）
    if (props.modelValue.policies.some((p) => p.dataType === policy.dataType)) {
      return
    }
    emit('update:modelValue', {
      ...props.modelValue,
      policies: [...props.modelValue.policies, policy],
    })
    emit('change', { action: 'create', policy })
  }

  modalVisible.value = false
}

/**
 * 删除按钮处理：从 modelValue.policies 移除对应策略并触发 change 事件。
 *
 * @param record 待删除的策略（按 dataType 匹配）
 */
function handleDelete(record: RetentionPolicyEntry): void {
  const next = props.modelValue.policies.filter((p) => p.dataType !== record.dataType)
  emit('update:modelValue', { ...props.modelValue, policies: next })
  emit('change', { action: 'delete', policy: record })
}

// 显式导出常量供父组件展示 / 测试复用
defineExpose({ DATA_TYPE_LABELS, getDataTypeLabel })
</script>

<style scoped>
.retention-panel {
  /* 自然流式布局 — 高度由内容决定 */
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
