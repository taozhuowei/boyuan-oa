<template>
  <!--
    SupervisorTree — 汇报关系拖拽编辑器（向导态 + 运营态共用）

    场景：
      - mode='wizard'    用于 /setup 初始化向导步骤 7（DESIGN.md §2.2 步骤 7：组织架构汇报关系）
                         tempId 为前端在 step 6 为员工分配的临时句柄（如 "emp-1"、"emp-2"），
                         finalize 单次原子提交时由后端解析为真实 ID。
      - mode='operation' 用于 /org 组织架构页（CEO / HR 运营期维护汇报树）
                         tempId 由父组件由真实 employeeId 拼装而成（如 "emp-123"），
                         父组件在 change 事件中按相同规则反解析回 employeeId 后调 PUT /api/employees/{id}。

    数据走向：
      父组件通过 v-model 双向绑定 SupervisorMapping[]（员工 tempId → 上级 tempId 列表），
      并通过 employees prop 传入员工清单（含 tempId / 显示文本 / 角色 / 是否 CEO 标识）；
      用户拖拽后本组件以新的 mappings 数组 emit 'update:modelValue' + 'change' 事件，
      父组件在 operation 模式下据此发起 API 调用。

    本组件不调任何 API，不持有 store / message 等运行时副作用。
    循环汇报检测、CEO 节点不可移动等业务规则在本组件内强制；违反规则时只 emit 'invalid' 事件，
    UI 提示由父组件根据 reason 决定文案与展示方式（保证向导态/运营态复用同一规则）。
  -->
  <div class="supervisor-tree-panel">
    <div class="supervisor-tree-layout">
      <!-- 左侧：未分配上级的员工备选区 -->
      <div class="supervisor-tree-left" data-catch="org-unassigned-panel">
        <div class="panel-heading">备选节点（未纳入汇报关系）</div>
        <div v-if="unassignedEmployees.length === 0" class="panel-empty">
          暂无未分配人员
        </div>
        <div
          v-for="emp in unassignedEmployees"
          :key="emp.tempId"
          draggable="true"
          class="unassigned-card"
          data-catch="org-unassigned-node"
          @dragstart="onLeftItemDragStart($event, emp.tempId)"
        >
          <span class="emp-name">{{ emp.name }}</span>
          <span v-if="emp.roleName" class="emp-role">
            {{ emp.roleName }}
          </span>
        </div>
      </div>

      <!-- 右侧：CEO 汇报树 -->
      <div class="supervisor-tree-right">
        <div class="panel-heading">汇报关系树（CEO 固定在顶端）</div>
        <a-tree
          v-if="ceoTree.length"
          :tree-data="ceoTree"
          :default-expand-all="true"
          :selectable="false"
          :draggable="canEdit"
          data-catch="org-supervisor-tree"
          @drop="onSupervisorDrop"
        >
          <template #title="node">
            <span
              class="tree-node-title"
              :class="{ 'tree-node-dragover': dragOverTempId === node.empTempId }"
              @dragover="onRightNodeDragOver($event, node.empTempId)"
              @drop="onRightNodeDrop($event, node.empTempId)"
              @dragleave="dragOverTempId = null"
            >
              <span class="emp-name">{{ node.title }}</span>
              <a-tag
                v-if="node.empTempId === ceoEmployee?.tempId"
                color="gold"
                class="ceo-tag"
              >
                固定
              </a-tag>
              <span v-else-if="node.subtitle" class="emp-role">
                {{ node.subtitle }}
              </span>
            </span>
          </template>
        </a-tree>
        <a-empty v-else description="暂无员工（请先在员工管理中创建员工）" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SupervisorTree — 汇报关系拖拽编辑器
 *
 * 设计依据：
 *   - DESIGN.md §2.2 步骤 7 — 初始化向导：组织架构汇报关系
 *   - DESIGN.md §3.x 组织架构 — 运营态 CEO/HR 维护汇报树
 *
 * 数据契约：
 *   - 员工以 tempId（不透明字符串）标识；本组件不区分向导期 tempId 与运营期 "emp-{realId}"，
 *     调用方负责按场景生成与反解析。
 *   - SupervisorMapping = { employeeTempId, supervisorTempId | null }；
 *     employeeTempId 为下级员工句柄，supervisorTempId 为直系上级句柄（null 表示无上级，对应"未分配"）。
 *   - CEO 员工通过 employees[].isCeo 标识（同一 employees 数组内有且仅有 1 个 isCeo=true）；
 *     CEO 不可被拖动、不可被设为下级。
 *
 * 不变量：
 *   - 本组件不调用任何后端接口
 *   - 拖拽产生的 modelValue 满足"无环"（环检测在本组件内强制）
 *   - 父组件在 'change' 事件中得到下一状态 + 操作上下文，可据此决定是否调 API
 */
import { ref, computed } from 'vue'

// ────────────────────────────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────────────────────────────

/**
 * EmployeeBrief — 员工显示信息（仅本组件内部使用）
 *
 * @property tempId    员工句柄；向导态由前端生成（如 "emp-1"），运营态推荐 "emp-{realId}"
 * @property name      员工姓名（必填）
 * @property roleCode  角色编码，用于识别 CEO 等关键节点（备用）
 * @property roleName  角色显示名（用于树节点 subtitle）
 * @property isCeo     是否为 CEO（true 时节点显示固定标签且不可拖动）
 */
export interface EmployeeBrief {
  tempId: string
  name: string
  roleCode?: string
  roleName?: string
  isCeo?: boolean
}

/**
 * SupervisorMapping — 汇报关系映射项
 *
 * 字段命名与后端 SetupFinalizeRequest.SupervisorMappingDto 保持一致。
 *
 * @property employeeTempId   下级员工句柄
 * @property supervisorTempId 直系上级句柄；null 表示该员工尚未纳入汇报关系
 */
export interface SupervisorMapping {
  employeeTempId: string
  supervisorTempId: string | null
}

/**
 * Change 事件载荷
 *
 * @property mappings   下一状态完整 mappings 数组（已写入 v-model）
 * @property changed    本次变更涉及的下级员工 tempId
 * @property newSupervisorTempId 新上级 tempId；null 表示移出汇报树（暂不支持）
 */
interface ChangePayload {
  mappings: SupervisorMapping[]
  changed: string
  newSupervisorTempId: string | null
}

/**
 * Invalid 事件载荷（违反业务规则时触发；父组件决定提示文案）
 *
 * @property reason
 *   - 'CYCLE'           检测到循环汇报
 *   - 'CEO_IMMUTABLE'   尝试移动 CEO 节点
 *   - 'DROP_TO_GAP'     把节点拖到节点间隙（向导态/运营态都仅支持拖到具体节点上）
 *   - 'SELF'            目标上级与员工本人相同
 */
interface InvalidPayload {
  reason: 'CYCLE' | 'CEO_IMMUTABLE' | 'DROP_TO_GAP' | 'SELF'
  employeeTempId: string
  attemptedSupervisorTempId: string | null
}

/**
 * AntD Tree 节点（前缀 emp 避免与 Tree 内部字段冲突）
 */
interface TreeNode {
  key: string
  title: string
  empTempId: string
  subtitle: string
  children: TreeNode[]
}

/**
 * AntD Vue Tree 拖拽事件载荷的最小投影
 * （EventDataNode 泛型与 TreeDropEvent 在 antdv 内部不完全兼容，这里只取需要的字段）
 */
interface AntdTreeDropInfo {
  dragNode: { empTempId: string }
  node: { empTempId: string }
  dropToGap: boolean
}

// ────────────────────────────────────────────────────────────────────
// Props & Emits
// ────────────────────────────────────────────────────────────────────

/**
 * Props
 *
 * @property modelValue 汇报关系映射数组，v-model 双向绑定
 * @property employees  员工清单（含 tempId / name / role / isCeo）；CEO 必须存在 1 个 isCeo=true 否则树不显示
 * @property mode       面板模式；wizard / operation 在本组件行为完全一致，留给父组件区分 API 路径
 * @property canEdit    是否允许拖拽编辑（默认 true）；运营态由父组件根据角色判断
 */
const props = withDefaults(
  defineProps<{
    modelValue: SupervisorMapping[]
    employees: EmployeeBrief[]
    mode?: 'wizard' | 'operation'
    canEdit?: boolean
  }>(),
  {
    mode: 'operation',
    canEdit: true,
  },
)

/**
 * Emits
 *
 * @event update:modelValue v-model 同步事件
 * @event change            合法变更通知，父组件据此调 API（运营态）或保留至 finalize（向导态）
 * @event invalid           违反业务规则的尝试，父组件决定提示文案
 */
const emit = defineEmits<{
  (e: 'update:modelValue', value: SupervisorMapping[]): void
  (e: 'change', payload: ChangePayload): void
  (e: 'invalid', payload: InvalidPayload): void
}>()

// ────────────────────────────────────────────────────────────────────
// 派生状态：CEO 节点 / 树结构 / 未分配员工
// ────────────────────────────────────────────────────────────────────

const ceoEmployee = computed<EmployeeBrief | undefined>(() =>
  props.employees.find((e) => e.isCeo === true),
)

/**
 * 把 mappings 数组转成 supervisor → 下级 tempId 列表的索引表，避免每次构树都 O(n²)。
 */
const subordinatesIndex = computed<Map<string, string[]>>(() => {
  const idx = new Map<string, string[]>()
  for (const m of props.modelValue) {
    if (m.supervisorTempId === null) continue
    const list = idx.get(m.supervisorTempId) ?? []
    list.push(m.employeeTempId)
    idx.set(m.supervisorTempId, list)
  }
  return idx
})

/**
 * 给定根 tempId，递归找出整个子树的 tempId 集合（包含自身）
 */
function getSubtreeTempIds(rootTempId: string): Set<string> {
  const ids = new Set<string>([rootTempId])
  const queue = [rootTempId]
  while (queue.length > 0) {
    const curr = queue.shift()
    if (curr === undefined) break
    const subs = subordinatesIndex.value.get(curr) ?? []
    for (const sub of subs) {
      if (!ids.has(sub)) {
        ids.add(sub)
        queue.push(sub)
      }
    }
  }
  return ids
}

const ceoSubtreeTempIds = computed<Set<string>>(() => {
  const ceo = ceoEmployee.value
  if (!ceo) return new Set<string>()
  return getSubtreeTempIds(ceo.tempId)
})

/**
 * 未分配员工 = CEO 子树以外的所有员工
 */
const unassignedEmployees = computed<EmployeeBrief[]>(() =>
  props.employees.filter((e) => !ceoSubtreeTempIds.value.has(e.tempId)),
)

/**
 * 递归构建 AntD Tree 数据
 */
function buildSubtree(rootTempId: string): TreeNode[] {
  const emp = props.employees.find((e) => e.tempId === rootTempId)
  if (!emp) return []
  const subs = subordinatesIndex.value.get(rootTempId) ?? []
  return [
    {
      key: emp.tempId,
      title: emp.name,
      empTempId: emp.tempId,
      subtitle: emp.roleName ?? '',
      children: subs.flatMap((sub) => buildSubtree(sub)),
    },
  ]
}

const ceoTree = computed<TreeNode[]>(() => {
  const ceo = ceoEmployee.value
  if (!ceo) return []
  return buildSubtree(ceo.tempId)
})

// ────────────────────────────────────────────────────────────────────
// 拖拽状态
// ────────────────────────────────────────────────────────────────────

/** 当前正在被拖拽的左侧未分配员工 tempId（仅左→右拖拽用） */
const draggingTempId = ref<string | null>(null)

/** 当前 dragover 的右侧节点 tempId（用于 hover 高亮） */
const dragOverTempId = ref<string | null>(null)

function onLeftItemDragStart(e: DragEvent, tempId: string): void {
  draggingTempId.value = tempId
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onRightNodeDragOver(e: DragEvent, nodeTempId: string): void {
  if (draggingTempId.value === null) return
  e.preventDefault()
  dragOverTempId.value = nodeTempId
}

/**
 * 左侧未分配员工拖到右侧某节点：把该员工挂到目标节点下
 */
function onRightNodeDrop(e: DragEvent, targetTempId: string): void {
  e.preventDefault()
  const dragId = draggingTempId.value
  draggingTempId.value = null
  dragOverTempId.value = null
  if (dragId === null) return
  applySupervisorChange(dragId, targetTempId)
}

/**
 * AntD Tree 内部拖拽（树内重组）
 */
function onSupervisorDrop(info: AntdTreeDropInfo): void {
  if (!props.canEdit) return
  const ceo = ceoEmployee.value
  if (ceo && info.dragNode.empTempId === ceo.tempId) {
    emit('invalid', {
      reason: 'CEO_IMMUTABLE',
      employeeTempId: info.dragNode.empTempId,
      attemptedSupervisorTempId: info.node.empTempId,
    })
    return
  }
  if (info.dropToGap) {
    emit('invalid', {
      reason: 'DROP_TO_GAP',
      employeeTempId: info.dragNode.empTempId,
      attemptedSupervisorTempId: null,
    })
    return
  }
  applySupervisorChange(info.dragNode.empTempId, info.node.empTempId)
}

// ────────────────────────────────────────────────────────────────────
// 业务规则：循环检测 + 应用变更
// ────────────────────────────────────────────────────────────────────

/**
 * 判断 candidateAncestor 是否在 employee 的子树中（即把 candidateAncestor 设为 employee 的上级会成环）
 */
function isAncestorOfTarget(employeeTempId: string, candidateAncestorTempId: string): boolean {
  const subtree = getSubtreeTempIds(employeeTempId)
  return subtree.has(candidateAncestorTempId)
}

/**
 * 把 employeeTempId 的上级改为 newSupervisorTempId；触发循环检测，合法则 emit 同步事件
 */
function applySupervisorChange(
  employeeTempId: string,
  newSupervisorTempId: string,
): void {
  if (employeeTempId === newSupervisorTempId) {
    emit('invalid', {
      reason: 'SELF',
      employeeTempId,
      attemptedSupervisorTempId: newSupervisorTempId,
    })
    return
  }
  if (isAncestorOfTarget(employeeTempId, newSupervisorTempId)) {
    emit('invalid', {
      reason: 'CYCLE',
      employeeTempId,
      attemptedSupervisorTempId: newSupervisorTempId,
    })
    return
  }

  const next: SupervisorMapping[] = upsertMapping(
    props.modelValue,
    employeeTempId,
    newSupervisorTempId,
  )
  emit('update:modelValue', next)
  emit('change', {
    mappings: next,
    changed: employeeTempId,
    newSupervisorTempId,
  })
}

/**
 * 不可变 upsert：若 employeeTempId 已存在则替换 supervisorTempId，否则追加。
 */
function upsertMapping(
  list: SupervisorMapping[],
  employeeTempId: string,
  supervisorTempId: string | null,
): SupervisorMapping[] {
  const existed = list.some((m) => m.employeeTempId === employeeTempId)
  if (existed) {
    return list.map((m) =>
      m.employeeTempId === employeeTempId ? { ...m, supervisorTempId } : m,
    )
  }
  return [...list, { employeeTempId, supervisorTempId }]
}

// 显式暴露关键工具供测试 / 父组件复用
defineExpose({ isAncestorOfTarget, getSubtreeTempIds })
</script>

<style scoped>
.supervisor-tree-panel {
  /* 自然流式布局；父容器决定外边距 */
}

.supervisor-tree-layout {
  display: flex;
  gap: 16px;
  min-height: 300px;
}

.supervisor-tree-left {
  width: 220px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  flex-shrink: 0;
}

.supervisor-tree-right {
  flex: 1;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  position: relative;
}

.panel-heading {
  font-weight: 500;
  margin-bottom: 8px;
  color: #555;
}

.panel-empty {
  color: #bbb;
  font-size: 12px;
}

.unassigned-card {
  padding: 6px 10px;
  margin-bottom: 6px;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  border: 1px solid #e8e8e8;
}

.emp-name {
  font-weight: 500;
}

.emp-role {
  color: #999;
  font-size: 11px;
  margin-left: 6px;
}

.tree-node-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: background 0.2s;
}

.tree-node-dragover {
  background: #e6f4ff;
}

.ceo-tag {
  margin: 0;
  font-size: 11px;
}
</style>
