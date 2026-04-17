<template>
  <!-- 组织架构页 — 部门树展示（所有登录用户可看；CEO 可新建/编辑/删除）
       数据来源：GET /api/departments（返回树形结构） -->
  <div class="org-page">
    <div class="page-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
      <h2 class="page-title" style="margin: 0;">组织架构</h2>
      <a-button v-if="isCeo" type="primary" data-catch="dept-create-btn" @click="openCreateModal(null)">+ 新建部门</a-button>
    </div>

    <a-spin :spinning="loading">
      <a-card v-if="departments.length === 0 && !loading">
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
            <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0;">
              <span style="font-weight: 500;">{{ node.deptName }}</span>
              <a-tag color="blue" style="margin: 0;">{{ node.employeeCount }} 人</a-tag>
              <template v-if="isCeo">
                <a-button type="link" size="small" style="padding: 0 4px;" @click.stop="openCreateModal(node.deptId)">
                  + 子部门
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  style="padding: 0 4px;"
                  :data-catch="'org-dept-edit-btn-' + node.deptName"
                  @click.stop="openEditModal({ id: node.deptId, name: node.deptName, parentId: node.deptParentId, sort: node.deptSort, employeeCount: node.employeeCount, children: [] })"
                >
                  编辑
                </a-button>
                <a-popconfirm
                  title="确认删除该部门？（需无员工且无子部门）"
                  @confirm="doDeleteDept(node.deptId)"
                  @click.stop
                >
                  <a-button type="link" size="small" danger style="padding: 0 4px;" :data-catch="'org-dept-delete-btn-' + node.deptName">删除</a-button>
                </a-popconfirm>
              </template>
            </div>
          </template>
        </a-tree>
      </a-card>
    </a-spin>

    <!-- 新建/编辑部门弹窗 -->
    <a-modal
      v-model:open="showDeptModal"
      :title="editingDept ? '编辑部门' : (parentId ? '新建子部门' : '新建部门')"
      @ok="doSaveDept"
      :confirm-loading="deptLoading"
      @cancel="resetDeptForm"
    >
      <a-form :model="deptForm" layout="vertical">
        <a-form-item label="部门名称" required>
          <a-input v-model:value="deptForm.name" data-catch="dept-name-input" placeholder="请输入部门名称" />
        </a-form-item>
        <a-form-item label="排序">
          <a-input-number v-model:value="deptForm.sort" :min="0" style="width: 100%;" />
        </a-form-item>
        <a-form-item v-if="parentId" label="上级部门">
          <a-input :value="getParentName(parentId)" disabled />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="resetDeptForm">取消</a-button>
        <a-button type="primary" :loading="deptLoading" data-catch="org-dept-modal-ok" @click="doSaveDept">确定</a-button>
      </template>
    </a-modal>

    <!-- 汇报关系（直系领导可视化 + 拖拽重组） -->
    <a-card title="汇报关系" style="margin-top: 16px;">
      <template #extra>
        <a-space>
          <span style="color: #999; font-size: 12px;">拖拽左侧节点到右侧树指定上级下方</span>
          <a-button :loading="loadingTree" size="small" @click="loadSupervisorTree">刷新</a-button>
        </a-space>
      </template>
      <a-spin :spinning="loadingTree">
        <div style="display: flex; gap: 16px; min-height: 300px;">
          <!-- Left panel: unassigned employees -->
          <div style="width: 220px; border: 1px dashed #d9d9d9; border-radius: 6px; padding: 12px; flex-shrink: 0;">
            <div style="font-weight: 500; margin-bottom: 8px; color: #555;">备选节点（未纳入汇报关系）</div>
            <div v-if="unassignedEmployees.length === 0" style="color: #bbb; font-size: 12px;">暂无未分配人员</div>
            <div
              v-for="emp in unassignedEmployees"
              :key="emp.id"
              draggable="true"
              style="padding: 6px 10px; margin-bottom: 6px; background: #f5f5f5; border-radius: 4px; cursor: grab; user-select: none; border: 1px solid #e8e8e8;"
              data-catch="org-unassigned-node"
              @dragstart="onLeftItemDragStart($event, emp.id)"
            >
              <span style="font-weight: 500;">{{ emp.name }}</span>
              <span v-if="emp.roleName" style="color: #999; font-size: 11px; margin-left: 6px;">{{ emp.roleName }}</span>
            </div>
          </div>

          <!-- Right panel: CEO subtree -->
          <div style="flex: 1; border: 1px solid #e8e8e8; border-radius: 6px; padding: 12px; position: relative;">
            <div style="font-weight: 500; margin-bottom: 8px; color: #555;">汇报关系树（CEO 固定在顶端）</div>
            <a-tree
              v-if="ceoTree.length"
              :tree-data="ceoTree"
              :default-expand-all="true"
              :selectable="false"
              :draggable="isCeoOrHr"
              data-catch="org-supervisor-tree"
              @drop="(info: AntdTreeDropInfo) => onSupervisorDrop(info)"
            >
              <template #title="node">
                <span
                  style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 4px; border-radius: 3px; transition: background 0.2s;"
                  :style="dragOverNodeId === node.employeeId ? 'background: #e6f4ff;' : ''"
                  @dragover="onRightNodeDragOver($event, node.employeeId)"
                  @drop="onRightNodeDrop($event, node.employeeId)"
                  @dragleave="dragOverNodeId = null"
                >
                  <span style="font-weight: 500;">{{ node.title }}</span>
                  <a-tag v-if="node.employeeId === ceoEmployee?.id" color="gold" style="margin: 0; font-size: 11px;">固定</a-tag>
                  <span v-else-if="node.subtitle" style="color: #999; font-size: 12px;">{{ node.subtitle }}</span>
                </span>
              </template>
            </a-tree>
            <a-empty v-else description="暂无员工（请先在员工管理中创建员工）" />
          </div>
        </div>
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 组织架构页 — org/index.vue
 * 数据来源：GET /api/departments（树形，含 children）
 * CEO 可 POST /departments 创建、PUT /departments/{id} 编辑、DELETE /departments/{id} 删除
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'

interface DeptNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  employeeCount: number
  children: DeptNode[]
}

interface TreeNode {
  key: number
  title: string
  // AntD Tree 内部会占用 dataRef，因此把所有字段直接展开在节点上
  deptId: number
  deptName: string
  deptParentId: number | null
  deptSort: number
  employeeCount: number
  children: TreeNode[]
}

const userStore = useUserStore()
const isCeo = computed(() => userStore.userInfo?.role === 'ceo')

const loading = ref(false)
const departments = ref<DeptNode[]>([])

function toTreeNodes(nodes: DeptNode[]): TreeNode[] {
  return nodes.map(n => ({
    key: n.id,
    title: n.name,
    deptId: n.id,
    deptName: n.name,
    deptParentId: n.parentId,
    deptSort: n.sort,
    employeeCount: n.employeeCount,
    children: toTreeNodes(n.children ?? [])
  }))
}

const treeData = computed(() => toTreeNodes(departments.value))

async function loadDepartments() {
  loading.value = true
  try {
    const res = await request<DeptNode[]>({ url: '/departments', method: 'GET' })
    departments.value = res
  } catch {
    message.error('加载部门数据失败')
  } finally {
    loading.value = false
  }
}

function flattenDepts(nodes: DeptNode[]): DeptNode[] {
  return nodes.flatMap(n => [n, ...flattenDepts(n.children ?? [])])
}

function getParentName(id: number | null): string {
  if (!id) return ''
  const found = flattenDepts(departments.value).find((d: DeptNode) => d.id === id)
  return found?.name ?? String(id)
}

const showDeptModal = ref(false)
const deptLoading = ref(false)
const editingDept = ref<DeptNode | null>(null)
const parentId = ref<number | null>(null)
const deptForm = ref({ name: '', sort: 0 })

function openCreateModal(pid: number | null) {
  editingDept.value = null
  parentId.value = pid
  deptForm.value = { name: '', sort: 0 }
  showDeptModal.value = true
}

function openEditModal(dept: DeptNode) {
  editingDept.value = dept
  parentId.value = dept.parentId
  deptForm.value = { name: dept.name, sort: dept.sort }
  showDeptModal.value = true
}

function resetDeptForm() {
  editingDept.value = null
  parentId.value = null
  deptForm.value = { name: '', sort: 0 }
}

async function doSaveDept() {
  if (!deptForm.value.name.trim()) {
    message.warning('部门名称不能为空')
    return
  }
  deptLoading.value = true
  try {
    const body: Record<string, unknown> = {
      name: deptForm.value.name,
      sort: deptForm.value.sort
    }
    if (parentId.value) body.parentId = parentId.value

    if (editingDept.value) {
      await request({ url: `/departments/${editingDept.value.id}`, method: 'PUT', body })
      message.success('已更新')
    } else {
      await request({ url: '/departments', method: 'POST', body })
      message.success('部门已创建')
    }
    showDeptModal.value = false
    resetDeptForm()
    await loadDepartments()
  } catch {
    message.error('操作失败')
  } finally {
    deptLoading.value = false
  }
}

async function doDeleteDept(id: number) {
  try {
    await request({ url: `/departments/${id}`, method: 'DELETE' })
    message.success('已删除')
    await loadDepartments()
  } catch {
    message.error('删除失败（可能存在员工或子部门）')
  }
}

// ── 汇报关系（直系领导）可视化 + 拖拽重组 ──────────────────────

interface EmployeeBrief { id: number; name: string; employeeNo?: string; roleName?: string; roleCode?: string; directSupervisorId?: number | null }
interface SupervisorTreeNode { key: string; title: string; subtitle?: string; employeeId: number; children: SupervisorTreeNode[] }

const isCeoOrHr = computed(() => ['ceo', 'hr'].includes(userStore.userInfo?.role ?? ''))
const allEmployees = ref<EmployeeBrief[]>([])
const loadingTree = ref(false)

const ceoEmployee = computed(() => allEmployees.value.find(e => e.roleCode === 'ceo' || e.roleName?.includes('CEO') || e.roleName?.includes('总裁')))

function getSubtreeIds(rootId: number): Set<number> {
  const ids = new Set<number>([rootId])
  const queue = [rootId]
  while (queue.length) {
    const curr = queue.shift()!
    allEmployees.value.filter(e => e.directSupervisorId === curr).forEach(e => {
      ids.add(e.id)
      queue.push(e.id)
    })
  }
  return ids
}

const ceoSubtreeIds = computed(() => {
  const ceo = ceoEmployee.value
  if (!ceo) return new Set<number>()
  return getSubtreeIds(ceo.id)
})

const unassignedEmployees = computed(() =>
  allEmployees.value.filter(e => !ceoSubtreeIds.value.has(e.id))
)

function buildSubtree(rootId: number): SupervisorTreeNode[] {
  const emp = allEmployees.value.find(e => e.id === rootId)
  if (!emp) return []
  const node: SupervisorTreeNode = {
    key: 'emp-' + emp.id,
    title: emp.name,
    subtitle: emp.roleName ?? '',
    employeeId: emp.id,
    children: allEmployees.value
      .filter(e => e.directSupervisorId === emp.id)
      .flatMap(e => buildSubtree(e.id))
  }
  return [node]
}

const ceoTree = computed(() => {
  const ceo = ceoEmployee.value
  if (!ceo) return []
  return buildSubtree(ceo.id)
})

const draggingEmployeeId = ref<number | null>(null)
const dragOverNodeId = ref<number | null>(null)

function onLeftItemDragStart(e: DragEvent, empId: number) {
  draggingEmployeeId.value = empId
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onRightNodeDragOver(e: DragEvent, nodeEmpId: number) {
  if (draggingEmployeeId.value == null) return
  e.preventDefault()
  dragOverNodeId.value = nodeEmpId
}

async function onRightNodeDrop(e: DragEvent, targetEmpId: number) {
  e.preventDefault()
  const dragId = draggingEmployeeId.value
  draggingEmployeeId.value = null
  dragOverNodeId.value = null
  if (!dragId || dragId === targetEmpId) return
  if (isAncestor(dragId, targetEmpId)) {
    message.error('不允许循环汇报')
    return
  }
  try {
    await request({ url: `/employees/${dragId}`, method: 'PUT', body: { directSupervisorId: targetEmpId } })
    message.success('已加入汇报关系')
    await loadSupervisorTree()
  } catch {
    message.error('保存失败')
  }
}

async function loadSupervisorTree() {
  loadingTree.value = true
  try {
    const data = await request<{ content: EmployeeBrief[] }>({ url: '/employees?size=500' })
    allEmployees.value = data?.content ?? []
  } catch {
    allEmployees.value = []
  } finally { loadingTree.value = false }
}

interface AntdTreeDropInfo {
  dragNode: any // 原因：AntDV EventDataNode 泛型与 TreeDropEvent 不兼容，暂无精确类型
  node: { employeeId: number }
  dropToGap: boolean
}
async function onSupervisorDrop(info: AntdTreeDropInfo) {
  if (!isCeoOrHr.value) return
  const ceo = ceoEmployee.value
  if (ceo && info.dragNode.employeeId === ceo.id) {
    message.warning('CEO 节点不可移动')
    return
  }
  const dragId = info.dragNode.employeeId
  const newSupervisorId = info.dropToGap ? null : info.node.employeeId
  if (!newSupervisorId) {
    message.warning('当前仅支持拖拽到具体上级节点')
    return
  }
  if (dragId === newSupervisorId) return
  if (isAncestor(dragId, newSupervisorId)) {
    message.error('不允许循环汇报：目标上级是当前节点的下属')
    return
  }
  try {
    await request({ url: `/employees/${dragId}`, method: 'PUT', body: { directSupervisorId: newSupervisorId } })
    message.success('汇报关系已更新')
    await loadSupervisorTree()
  } catch {
    message.error('保存失败')
  }
}

function isAncestor(employeeId: number, candidateAncestorId: number): boolean {
  // 从 employeeId 向下查找其子树，若 candidateAncestorId 在子树中则成立
  const queue: number[] = [employeeId]
  while (queue.length) {
    const curr = queue.shift()!
    const children = allEmployees.value.filter(e => e.directSupervisorId === curr)
    for (const c of children) {
      if (c.id === candidateAncestorId) return true
      queue.push(c.id)
    }
  }
  return false
}

onMounted(() => {
  loadDepartments()
  loadSupervisorTree()
})
</script>

<style scoped>
.org-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}

/* Removed flex constraints to allow natural content flow */
</style>
