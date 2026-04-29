<template>
  <!--
    DepartmentManager — 部门树管理面板（向导态 + 运营态共用）

    场景：
      - mode='wizard'    用于 /setup 初始化向导步骤 6（DESIGN.md §2.2 步骤 6 — 员工导入前置：先建部门）
      - mode='operation' 用于 /org 组织架构页（CEO 运营期维护部门树）

    数据走向：
      父组件通过 v-model 双向绑定 DepartmentNode[]（嵌套树结构）；本组件只负责
      树形展示、模态框新增 / 编辑 / 删除交互；
      所有 API 调用（/api/departments）由父组件根据 @change 事件分发：
        - wizard 模式：父组件把节点收集进 SetupFinalizeRequest.OrganizationDto / EmployeeImportDto.departments
                      （注意：向导期 id 字段为客户端生成的负数临时句柄，finalize 提交时由后端重写）
        - operation 模式：父组件立即调 POST/PUT/DELETE /api/departments（一次只针对 change 事件中的单个节点）
  -->
  <div class="department-manager">
    <!-- 顶部操作栏：新建顶级部门 -->
    <div class="panel-toolbar">
      <a-button
        v-if="canEdit"
        type="primary"
        data-catch="dept-create-btn"
        @click="openCreateModal(null)"
      >
        + 新建部门
      </a-button>
    </div>

    <!-- 部门树 -->
    <a-card v-if="modelValue.length === 0">
      <a-empty description="暂无部门数据" />
    </a-card>
    <a-card v-else>
      <a-tree
        :tree-data="treeData"
        :default-expand-all="true"
        :selectable="false"
        data-catch="org-tree"
      >
        <template #title="node">
          <div class="dept-tree-row">
            <span class="dept-name">{{ node.deptName }}</span>
            <a-tag color="blue" class="dept-count-tag">
              {{ node.employeeCount }} 人
            </a-tag>
            <template v-if="canEdit">
              <a-button
                type="link"
                size="small"
                class="dept-action-btn"
                @click.stop="openCreateModal(node.deptId)"
              >
                + 子部门
              </a-button>
              <a-button
                type="link"
                size="small"
                class="dept-action-btn"
                :data-catch="'org-dept-edit-btn-' + node.deptName"
                @click.stop="
                  openEditModal({
                    id: node.deptId,
                    name: node.deptName,
                    parentId: node.deptParentId,
                    sort: node.deptSort,
                    employeeCount: node.employeeCount,
                    children: [],
                  })
                "
              >
                编辑
              </a-button>
              <a-popconfirm
                title="确认删除该部门？（需无员工且无子部门）"
                @confirm="emitDelete(node.deptId)"
                @click.stop
              >
                <a-button
                  type="link"
                  size="small"
                  danger
                  class="dept-action-btn"
                  :data-catch="'org-dept-delete-btn-' + node.deptName"
                >
                  删除
                </a-button>
              </a-popconfirm>
            </template>
          </div>
        </template>
      </a-tree>
    </a-card>

    <!-- 新建 / 编辑部门弹窗 -->
    <a-modal
      v-model:open="showDeptModal"
      :title="modalTitle"
      :confirm-loading="loading"
      @ok="handleSubmit"
      @cancel="resetDeptForm"
    >
      <a-form :model="deptForm" layout="vertical">
        <a-form-item label="部门名称" required>
          <a-input
            v-model:value="deptForm.name"
            data-catch="dept-name-input"
            placeholder="请输入部门名称"
          />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number
            v-model:value="deptForm.sort"
            :min="0"
            class="dept-sort-input"
          />
        </a-form-item>
        <a-form-item v-if="parentId !== null" label="上级部门">
          <a-input :value="getParentName(parentId)" disabled />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="resetDeptForm">取消</a-button>
        <a-button
          type="primary"
          :loading="loading"
          data-catch="org-dept-modal-ok"
          @click="handleSubmit"
        >
          确定
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * DepartmentManager — 部门树管理面板组件
 *
 * 设计依据：
 *   - DESIGN.md §2.2 步骤 6 — 员工批量导入前置：先建部门
 *   - DESIGN.md §3.x 组织架构 — CEO 运营期维护部门树
 *
 * 数据契约：
 *   - 父组件通过 v-model 维护 DepartmentNode[]（嵌套树）
 *   - 用户在面板内的新建 / 编辑 / 删除交互通过 'change' 事件回传给父组件
 *     （载荷为 ChangePayload，父组件据此决定是否调 API 与如何更新本地树）
 *   - 本组件不调用任何后端接口
 *   - canEdit 由父组件传入（向导态默认 true，运营态由父组件根据角色判断）
 *
 * 不变量：
 *   - 内部不持有 API、Pinia store 或 message 等运行时副作用
 *   - 父组件负责接到 change 事件后调 API（运营态）或仅更新本地数组（向导态）
 *   - employeeCount 字段在向导态默认 0，运营态由后端返回
 */
import { ref, computed } from 'vue'

// ────────────────────────────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────────────────────────────

/**
 * DepartmentNode — 部门树节点数据模型
 *
 * @property id            部门 ID；运营态由后端分配（正数），向导态由父组件生成临时句柄（建议负数避免与真实 ID 冲突）
 * @property name          部门名称（必填）
 * @property parentId      上级部门 ID；顶级部门为 null
 * @property sort          排序号（升序）
 * @property employeeCount 部门下员工数；向导态默认 0，运营态由后端返回
 * @property children      子部门数组（递归结构）
 */
export interface DepartmentNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  employeeCount: number
  children: DepartmentNode[]
}

/**
 * Change 事件载荷（部门）
 *
 * 父组件根据 action 类型分发处理：
 *   - create：新建部门（向导态：加入待提交集合；运营态：POST /api/departments）
 *   - update：编辑部门（运营态：PUT /api/departments/{id}）
 *   - delete：删除部门（运营态：DELETE /api/departments/{id}）
 *
 * 注意：本组件触发 change 后会**同步更新** modelValue（emit update:modelValue），
 *       父组件无需在 change 处理器内重复修改 modelValue；如运营态 API 失败，父组件
 *       应主动调用 loadDepartments() 重新拉取以纠正状态。
 */
interface ChangePayload {
  action: 'create' | 'update' | 'delete'
  /** create / update：携带新建或更新后的节点；delete：仅 id 字段有意义 */
  node: DepartmentNode
  /** 仅 create 时有意义：待新建节点的 parentId（顶级 = null） */
  parentId?: number | null
}

/**
 * AntD Tree 渲染节点；将 DepartmentNode 字段展开避免与 Tree 内部 dataRef 冲突
 */
interface AntdTreeNode {
  key: number
  title: string
  deptId: number
  deptName: string
  deptParentId: number | null
  deptSort: number
  employeeCount: number
  children: AntdTreeNode[]
}

// ────────────────────────────────────────────────────────────────────
// Props & Emits
// ────────────────────────────────────────────────────────────────────

/**
 * Props
 *
 * @property modelValue 部门树（嵌套结构），v-model 双向绑定
 * @property mode       面板模式；wizard 模式可编辑且不依赖后端，operation 模式由父组件控制 canEdit
 * @property canEdit    是否允许编辑（默认 true）；operation 模式由父组件根据角色（如仅 CEO）判断
 * @property loading    确认按钮 loading 态；运营态由父组件控制（API 进行中）
 */
const props = withDefaults(
  defineProps<{
    modelValue: DepartmentNode[]
    mode?: 'wizard' | 'operation'
    canEdit?: boolean
    loading?: boolean
  }>(),
  {
    mode: 'operation',
    canEdit: true,
    loading: false,
  },
)

/**
 * Emits
 *
 * @event update:modelValue v-model 同步事件，新数组（不可变更新）
 * @event change            用户操作通知，载荷见 ChangePayload
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: DepartmentNode[]): void
  (e: 'change', payload: ChangePayload): void
}>()

// ────────────────────────────────────────────────────────────────────
// 派生状态
// ────────────────────────────────────────────────────────────────────

/**
 * 把业务模型转成 AntD Tree 期望的字段名结构
 */
function toAntdNodes(nodes: DepartmentNode[]): AntdTreeNode[] {
  return nodes.map((n) => ({
    key: n.id,
    title: n.name,
    deptId: n.id,
    deptName: n.name,
    deptParentId: n.parentId,
    deptSort: n.sort,
    employeeCount: n.employeeCount,
    children: toAntdNodes(n.children ?? []),
  }))
}

const treeData = computed<AntdTreeNode[]>(() => toAntdNodes(props.modelValue))

/**
 * 按 id 在树中递归查找节点
 */
function flattenDepts(nodes: DepartmentNode[]): DepartmentNode[] {
  return nodes.flatMap((n) => [n, ...flattenDepts(n.children ?? [])])
}

/**
 * 根据 parentId 取上级部门名称（用于模态框显示）
 */
function getParentName(id: number | null): string {
  if (id === null) return ''
  const found = flattenDepts(props.modelValue).find((d) => d.id === id)
  return found?.name ?? String(id)
}

// ────────────────────────────────────────────────────────────────────
// 模态框状态
// ────────────────────────────────────────────────────────────────────

const showDeptModal = ref(false)
const editingDept = ref<DepartmentNode | null>(null)
const parentId = ref<number | null>(null)
const deptForm = ref<{ name: string; sort: number }>({ name: '', sort: 0 })

const modalTitle = computed(() => {
  if (editingDept.value !== null) return '编辑部门'
  return parentId.value !== null ? '新建子部门' : '新建部门'
})

/** 打开新建模态框；pid=null 表示顶级部门 */
function openCreateModal(pid: number | null): void {
  editingDept.value = null
  parentId.value = pid
  deptForm.value = { name: '', sort: 0 }
  showDeptModal.value = true
}

/** 打开编辑模态框 */
function openEditModal(dept: DepartmentNode): void {
  editingDept.value = dept
  parentId.value = dept.parentId
  deptForm.value = { name: dept.name, sort: dept.sort }
  showDeptModal.value = true
}

/** 重置表单与模态框 */
function resetDeptForm(): void {
  editingDept.value = null
  parentId.value = null
  deptForm.value = { name: '', sort: 0 }
  showDeptModal.value = false
}

// ────────────────────────────────────────────────────────────────────
// 提交：构建节点 → 触发事件
// ────────────────────────────────────────────────────────────────────

/**
 * 在树中按 id 替换或插入节点（不可变更新）
 */
function replaceNode(nodes: DepartmentNode[], target: DepartmentNode): DepartmentNode[] {
  return nodes.map((n) => {
    if (n.id === target.id) return target
    if (n.children?.length) {
      return { ...n, children: replaceNode(n.children, target) }
    }
    return n
  })
}

function appendNode(
  nodes: DepartmentNode[],
  target: DepartmentNode,
  pid: number | null,
): DepartmentNode[] {
  if (pid === null) {
    return [...nodes, target]
  }
  return nodes.map((n) => {
    if (n.id === pid) {
      return { ...n, children: [...(n.children ?? []), target] }
    }
    if (n.children?.length) {
      return { ...n, children: appendNode(n.children, target, pid) }
    }
    return n
  })
}

function removeNode(nodes: DepartmentNode[], id: number): DepartmentNode[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) =>
      n.children?.length ? { ...n, children: removeNode(n.children, id) } : n,
    )
}

/**
 * 生成临时负数 ID（仅向导态本地新建时使用，避免与后端真实 ID 冲突）
 *
 * 运营态 create 操作不能直接落入 modelValue（API 尚未返回真实 ID），
 * 因此运营态的 create 仅触发 change 事件，由父组件等 API 返回后再用真实 ID
 * 重新加载或手动 emit('update:modelValue', ...)；本函数仅向导态生效。
 */
function nextWizardTempId(nodes: DepartmentNode[]): number {
  const ids = flattenDepts(nodes).map((n) => n.id)
  const minId = ids.length > 0 ? Math.min(...ids) : 0
  return minId > 0 ? -1 : minId - 1
}

/**
 * 模态框确认按钮：根据 editingDept 区分新增 / 编辑路径
 *
 * - 编辑：在树中替换节点，立即 emit update:modelValue + change(update)
 * - 新建（wizard）：分配负数临时 id，插入树中，emit update:modelValue + change(create)
 * - 新建（operation）：仅 emit change(create)；父组件在 API 成功后再 emit update:modelValue
 */
function handleSubmit(): void {
  const trimmedName = deptForm.value.name.trim()
  if (!trimmedName) {
    return
  }

  if (editingDept.value !== null) {
    const updated: DepartmentNode = {
      ...editingDept.value,
      name: trimmedName,
      sort: deptForm.value.sort,
    }
    emit('update:modelValue', replaceNode(props.modelValue, updated))
    emit('change', { action: 'update', node: updated })
  } else if (props.mode === 'wizard') {
    const newNode: DepartmentNode = {
      id: nextWizardTempId(props.modelValue),
      name: trimmedName,
      parentId: parentId.value,
      sort: deptForm.value.sort,
      employeeCount: 0,
      children: [],
    }
    emit('update:modelValue', appendNode(props.modelValue, newNode, parentId.value))
    emit('change', { action: 'create', node: newNode, parentId: parentId.value })
  } else {
    // operation 模式：父组件等 API 返回真实 id 后再决定是否更新 modelValue
    const draftNode: DepartmentNode = {
      id: 0,
      name: trimmedName,
      parentId: parentId.value,
      sort: deptForm.value.sort,
      employeeCount: 0,
      children: [],
    }
    emit('change', { action: 'create', node: draftNode, parentId: parentId.value })
  }

  resetDeptForm()
}

/**
 * 删除按钮：从树中移除节点（向导态本地移除；运营态由父组件 API 成功后再决定刷新）
 *
 * - wizard：立即 emit update:modelValue（本地树移除）+ change(delete)
 * - operation：仅 emit change(delete)；父组件在 API 成功后调用 reload 接口
 */
function emitDelete(id: number): void {
  const target = flattenDepts(props.modelValue).find((d) => d.id === id)
  if (!target) return

  if (props.mode === 'wizard') {
    emit('update:modelValue', removeNode(props.modelValue, id))
  }
  emit('change', { action: 'delete', node: target })
}

// 导出供父组件 / 测试访问
defineExpose({ openCreateModal, openEditModal })
</script>

<style scoped>
.department-manager {
  /* 自然流式布局 — 高度由内容决定 */
}

.panel-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.dept-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.dept-name {
  font-weight: 500;
}

.dept-count-tag {
  margin: 0;
}

.dept-action-btn {
  padding: 0 4px;
}

.dept-sort-input {
  width: 100%;
}
</style>
