<template>
  <!--
    RoleConfigPanel — 自定义角色配置面板（向导态 + 运营态共用）

    场景：
      - mode='wizard'    用于 /setup 初始化向导步骤 5（DESIGN.md §2.2 步骤 5）
      - mode='operation' 用于 /role 角色管理页（CEO 运营期维护）

    数据走向：
      父组件通过 v-model 双向绑定 CustomRole[]，本组件只负责
      表格渲染、模态框新增/编辑/删除交互；
      所有 API 调用（/api/roles）由父组件根据 @change 事件分发。
  -->
  <div class="role-config-panel">
    <!-- 顶部操作栏：新增按钮 -->
    <div class="panel-toolbar">
      <a-button
        type="primary"
        data-catch="role-config-add-btn"
        @click="openCreateModal"
      >
        新增自定义角色
      </a-button>
    </div>

    <!-- 角色列表表格：code / name / 权限数量 / 操作 -->
    <a-table
      :columns="columns"
      :data-source="modelValue"
      :pagination="false"
      row-key="code"
      size="small"
      :locale="emptyLocale"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'permissions'">
          <a-tag>{{ ((record as CustomRole).permissions || []).length }} 项</a-tag>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="(record as CustomRole).status === 'active' ? 'success' : 'default'">
            {{ (record as CustomRole).status === 'active' ? '启用' : '禁用' }}
          </a-tag>
        </template>
        <template v-if="column.key === 'action'">
          <a-button
            type="link"
            size="small"
            :data-catch="'role-config-edit-btn-' + (record as CustomRole).code"
            @click="openEditModal(record as CustomRole)"
          >
            编辑
          </a-button>
          <a-popconfirm
            title="确定删除该自定义角色吗？删除后该角色下的成员将丢失对应权限。"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDelete(record as CustomRole)"
          >
            <a-button
              type="link"
              size="small"
              danger
              :data-catch="'role-config-delete-btn-' + (record as CustomRole).code"
            >
              删除
            </a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 新增/编辑模态框 -->
    <a-modal
      v-model:open="modalVisible"
      :title="isEditMode ? '编辑自定义角色' : '新增自定义角色'"
      :width="640"
      ok-text="保存"
      @ok="handleModalOk"
      @cancel="closeModal"
    >
      <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
      >
        <a-form-item label="角色编码" name="code">
          <a-input
            v-model:value="formState.code"
            placeholder="请输入角色编码（小写字母+下划线，如 site_supervisor）"
            :disabled="isEditMode"
            data-catch="role-config-modal-code"
          />
        </a-form-item>
        <a-form-item label="角色名称" name="name">
          <a-input
            v-model:value="formState.name"
            placeholder="请输入角色名称（如 现场监工）"
            data-catch="role-config-modal-name"
          />
        </a-form-item>
        <a-form-item label="描述" name="description">
          <a-textarea
            v-model:value="formState.description"
            placeholder="请输入角色描述（可选，建议填写职责范围）"
            :rows="2"
            data-catch="role-config-modal-description"
          />
        </a-form-item>
        <a-form-item v-if="mode === 'operation'" label="状态" name="status">
          <a-select
            v-model:value="formState.status"
            :options="statusOptions"
            data-catch="role-config-modal-status"
          />
        </a-form-item>

        <a-divider style="margin: 8px 0">
          权限矩阵（DESIGN §2.2 步骤 5：4 级 × 6 模块）
        </a-divider>
        <a-alert
          type="info"
          show-icon
          message="上级权限包含下级：勾选「增删」自动覆盖「查看 / 修改」；勾选「审批」可独立授予审批能力。"
          style="margin-bottom: 12px"
        />
        <table class="perm-matrix">
          <thead>
            <tr>
              <th>模块</th>
              <th
                v-for="lvl in PERMISSION_LEVELS"
                :key="lvl.code"
              >
                {{ lvl.label }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="mod in PERMISSION_MODULES"
              :key="mod.code"
            >
              <td>{{ mod.label }}</td>
              <td
                v-for="lvl in PERMISSION_LEVELS"
                :key="lvl.code"
              >
                <a-checkbox
                  :checked="hasPermission(mod.code, lvl.code)"
                  :data-catch="'role-config-perm-' + mod.code + '-' + lvl.code"
                  @change="
                    (e: CheckboxChangeEvent) =>
                      togglePermission(mod.code, lvl.code, Boolean(e.target.checked))
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * RoleConfigPanel — 自定义角色配置面板组件
 *
 * 设计依据：DESIGN.md §2.2 步骤 5 — 系统初始化向导内嵌入与 /role 共用的
 * <RoleConfigPanel /> 组件，实现"一处实现、两处复用"。
 *
 * 数据契约：
 *   父组件通过 v-model 维护 CustomRole[] 列表；用户在面板内的
 *   新增/编辑/删除交互会以 (action, role) 通过 'change' 事件回传给父组件，
 *   再由父组件分发到对应 API（向导态：先收集，最后随 setup 一并提交；
 *   运营态：立即调用 /api/roles 增删改）。
 *
 * 不变量：
 *   - 本组件不调用任何后端接口
 *   - 角色编码 code 一旦创建不可改（后端唯一键，编辑模式下置灰）
 *   - 状态字段 status 仅在 mode='operation' 显示（向导期不需要禁用切换）
 *   - 权限矩阵在两种模式下都显示且可编辑（向导期亦可配权限）
 */
import { ref, reactive, computed } from 'vue'
import type { Rule } from 'ant-design-vue/es/form'
import type { CheckboxChangeEvent } from 'ant-design-vue/es/checkbox/interface'

// ────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────

/**
 * CustomRole — 自定义角色数据模型（5 字段）
 *
 * 与后端 SetupFinalizeRequest.RoleConfigDto 字段对齐；运营态下从
 * /api/roles 拉到的 RoleViewResponse 由父组件映射至本结构后传入。
 *
 * @property code        角色编码，lower_snake_case，全系统唯一，创建后不可改
 * @property name        角色显示名（中文，界面展示用）
 * @property description 角色描述（可选，建议填写职责范围）
 * @property status      状态（仅 operation 模式显示与可编）；wizard 模式下父组件应固定为 'active'
 * @property permissions DESIGN §2.2 系统权限总表权限码数组
 *                       命名格式：MODULE_LEVEL（如 HR_VIEW, PAYROLL_APPROVE）
 */
export interface CustomRole {
  code: string
  name: string
  description?: string
  status?: 'active' | 'inactive'
  permissions: string[]
}

/**
 * Change 事件载荷
 *
 * 父组件根据 action 类型分发处理：
 *   - create  → POST /api/roles（运营态）/ 加入待提交列表（向导态）
 *   - update  → PUT  /api/roles/{id}
 *   - delete  → DELETE /api/roles/{id}
 *
 * @property action 用户操作类型
 * @property role   操作目标角色（包含完整 5 字段快照）
 */
interface ChangePayload {
  action: 'create' | 'update' | 'delete'
  role: CustomRole
}

/**
 * 表单内部状态：与 CustomRole 一致，但 status 为非可选
 * （向导态固定 'active'，避免运行时 undefined 干扰 select 渲染）
 */
interface FormState {
  code: string
  name: string
  description: string
  status: 'active' | 'inactive'
  permissions: string[]
}

// ────────────────────────────────────────────────────────────────────
// Props & Emits
// ────────────────────────────────────────────────────────────────────

/**
 * Props
 *
 * @property modelValue v-model 双向绑定的 CustomRole 列表（必填）
 * @property mode       面板模式；wizard 模式隐藏 status 字段，operation 模式全字段开放
 */
const props = withDefaults(
  defineProps<{
    modelValue: CustomRole[]
    mode?: 'wizard' | 'operation'
  }>(),
  {
    mode: 'operation',
  },
)

/**
 * Emits
 *
 * @event update:modelValue v-model 同步事件，新数组（不可变更新）
 * @event change            用户操作通知；父组件据此发起 API 调用或加入待提交集合
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: CustomRole[]): void
  (e: 'change', payload: ChangePayload): void
}>()

// ────────────────────────────────────────────────────────────────────
// 权限矩阵：DESIGN §2.2 步骤 5（4 级 × 6 模块）
// 与现有 /role/index.vue PERMISSION_MODULES/LEVELS 完全一致，避免向导态/运营态语义漂移。
// 权限码格式：MODULE_LEVEL（如 HR_VIEW, EXPENSE_APPROVE）。
// ────────────────────────────────────────────────────────────────────

/**
 * 系统六大权限模块；与 DESIGN.md §2.2 系统权限总表对齐。
 * 注：DESIGN 列出的"六模块"为人员/审批流/考勤/薪资/项目/报销/系统管理，
 * /role 现网实现简化为 6 项（HR/PROJECT/PAYROLL/ATTENDANCE/EXPENSE/INJURY），
 * 本组件遵循现网 24 个权限码常量保持向后兼容。
 */
const PERMISSION_MODULES: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'HR', label: '人员' },
  { code: 'PROJECT', label: '项目' },
  { code: 'PAYROLL', label: '薪资' },
  { code: 'ATTENDANCE', label: '考勤' },
  { code: 'EXPENSE', label: '报销' },
  { code: 'INJURY', label: '工伤' },
]

/** 四级权限：查看 / 修改 / 增删 / 审批（含义见 DESIGN.md §2.2） */
const PERMISSION_LEVELS: ReadonlyArray<{ code: string; label: string }> = [
  { code: 'VIEW', label: '查看' },
  { code: 'EDIT', label: '修改' },
  { code: 'MANAGE', label: '增删' },
  { code: 'APPROVE', label: '审批' },
]

/**
 * 拼接权限码：MODULE_LEVEL（如 HR_VIEW）
 * @param mod 模块代码（PERMISSION_MODULES.code）
 * @param lvl 级别代码（PERMISSION_LEVELS.code）
 * @returns 权限码字符串
 */
function permCode(mod: string, lvl: string): string {
  return `${mod}_${lvl}`
}

// ────────────────────────────────────────────────────────────────────
// 表格列定义
// ────────────────────────────────────────────────────────────────────

/**
 * 表格列；status 列仅 operation 模式显示
 */
const columns = computed(() => {
  const base = [
    { title: '角色编码', dataIndex: 'code', key: 'code', width: 180 },
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '权限数量', key: 'permissions', width: 100 },
  ]
  if (props.mode === 'operation') {
    base.push({ title: '状态', key: 'status', width: 100 })
  }
  base.push({ title: '操作', key: 'action', width: 160 })
  return base
})

// ────────────────────────────────────────────────────────────────────
// 模态框状态
// ────────────────────────────────────────────────────────────────────

const modalVisible = ref(false)
const isEditMode = ref(false)
/** Ant Design Vue Form 实例引用；validate() 由模板内 ref="formRef" 提供 */
const formRef = ref<{ validate: () => Promise<void>; resetFields: () => void } | null>(null)

const formState = reactive<FormState>({
  code: '',
  name: '',
  description: '',
  status: 'active',
  permissions: [],
})

const statusOptions = [
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '禁用' },
]

/** 表格空态文案；提取到 script 避免 Vue 模板解析器对中文引号的误报 */
const emptyLocale = {
  emptyText: '暂无自定义角色，点击右上角「新增自定义角色」创建',
}

const rules: Record<string, Rule[]> = {
  code: [
    { required: true, message: '角色编码不能为空', trigger: 'blur' },
    {
      // 仅小写字母 + 下划线 + 数字；首字符必须是字母（避免 1abc / _abc 等无效编码）
      pattern: /^[a-z][a-z0-9_]*$/,
      message: '角色编码须为小写字母开头，仅含小写字母、数字和下划线',
      trigger: 'blur',
    },
  ],
  name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
}

// ────────────────────────────────────────────────────────────────────
// 权限矩阵交互
// ────────────────────────────────────────────────────────────────────

/**
 * 判断指定模块/级别是否已在 formState.permissions 中
 * @param mod 模块代码
 * @param lvl 级别代码
 */
function hasPermission(mod: string, lvl: string): boolean {
  return formState.permissions.includes(permCode(mod, lvl))
}

/**
 * 切换权限矩阵单元格勾选状态
 * @param mod     模块代码
 * @param lvl     级别代码
 * @param checked 勾选后的新状态（true=添加，false=移除）
 */
function togglePermission(mod: string, lvl: string, checked: boolean): void {
  const code = permCode(mod, lvl)
  if (checked && !formState.permissions.includes(code)) {
    formState.permissions.push(code)
  } else if (!checked) {
    formState.permissions = formState.permissions.filter((p) => p !== code)
  }
}

// ────────────────────────────────────────────────────────────────────
// 模态框打开/关闭/重置
// ────────────────────────────────────────────────────────────────────

/** 重置表单到初始状态（新增前调用） */
function resetForm(): void {
  formState.code = ''
  formState.name = ''
  formState.description = ''
  formState.status = 'active'
  formState.permissions = []
}

/** 打开新增模态框 */
function openCreateModal(): void {
  isEditMode.value = false
  resetForm()
  modalVisible.value = true
}

/**
 * 打开编辑模态框；将既有角色字段填入 formState
 * @param record 表格行对应的 CustomRole 数据
 */
function openEditModal(record: CustomRole): void {
  isEditMode.value = true
  formState.code = record.code
  formState.name = record.name
  formState.description = record.description ?? ''
  formState.status = record.status ?? 'active'
  // 复制数组引用，避免直接修改 props.modelValue 中的对象（保持单向数据流）
  formState.permissions = [...(record.permissions ?? [])]
  modalVisible.value = true
}

/** 关闭模态框；表单字段同时被 ant-design-vue 的 resetFields 清空校验状态 */
function closeModal(): void {
  modalVisible.value = false
  formRef.value?.resetFields()
}

// ────────────────────────────────────────────────────────────────────
// 提交：验证 → 构建 CustomRole → 更新 modelValue → 触发 change 事件
// ────────────────────────────────────────────────────────────────────

/**
 * 模态框确认按钮处理：执行表单校验，校验通过后更新 v-model 并触发 change 事件。
 * 失败（校验未过）时静默返回，错误提示由 ant-design-vue 表单内联显示。
 */
async function handleModalOk(): Promise<void> {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 构建快照角色对象；wizard 模式下不写入 status（保持模型纯净）
  const role: CustomRole = {
    code: formState.code.trim().toLowerCase(),
    name: formState.name.trim(),
    description: formState.description.trim() || undefined,
    permissions: [...formState.permissions],
  }
  if (props.mode === 'operation') {
    role.status = formState.status
  }

  if (isEditMode.value) {
    // 编辑：按 code 匹配替换；code 在编辑态置灰，不会变化
    const next = props.modelValue.map((r) => (r.code === role.code ? role : r))
    emit('update:modelValue', next)
    emit('change', { action: 'update', role })
  } else {
    // 新增：检查 code 重复
    if (props.modelValue.some((r) => r.code === role.code)) {
      // 校验提示通过 form 控件已展示，此处兜底防御性返回
      return
    }
    emit('update:modelValue', [...props.modelValue, role])
    emit('change', { action: 'create', role })
  }

  modalVisible.value = false
}

/**
 * 删除按钮处理：从 modelValue 移除对应角色并触发 change 事件
 * @param record 待删除的角色（按 code 匹配）
 */
function handleDelete(record: CustomRole): void {
  const next = props.modelValue.filter((r) => r.code !== record.code)
  emit('update:modelValue', next)
  emit('change', { action: 'delete', role: record })
}

// 显式导出权限常量供外部（测试 / 父组件展示）复用
defineExpose({ PERMISSION_MODULES, PERMISSION_LEVELS, permCode })
</script>

<style scoped>
.role-config-panel {
  /* 自然流式布局 — 高度由内容决定 */
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.perm-matrix {
  width: 100%;
  border-collapse: collapse;
}

.perm-matrix th,
.perm-matrix td {
  border: 1px solid #f0f0f0;
  padding: 6px 8px;
  text-align: center;
}

.perm-matrix th {
  background: #fafafa;
  font-weight: 500;
}

.perm-matrix td:first-child {
  font-weight: 500;
  background: #fafafa;
  text-align: left;
}
</style>
