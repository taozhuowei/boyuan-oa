<template>
  <!--
    组织架构页 — /org

    部门树展示（所有登录用户可看；CEO 可新建/编辑/删除）
    数据来源：GET /api/departments（返回树形结构） + GET /api/employees?size=500（汇报关系）

    UI 由两个可复用 SFC 组件承担（D-M08 初始化向导改造，向导态共用同两个组件）：
      - DepartmentManager  ：部门 CRUD（v-model 双向绑定 DepartmentNode[]）
      - SupervisorTree     ：汇报关系拖拽（v-model 双向绑定 SupervisorMapping[]）

    本页（运营态）职责：
      - 拉取 /api/departments、/api/employees 数据并以组件期望的形状传入
      - 接收 change 事件后调对应 API（POST/PUT/DELETE /departments、PUT /employees/{id}），
        API 成功后 reload 以同步真实状态
      - 接收 invalid 事件后用 antd message 输出提示文案（向导态由 SetupWizard 自行处理）
  -->
  <div class="org-page">
    <!-- 顶部标题 + 新建部门按钮（按钮放在 DepartmentManager 内部，这里只放标题） -->
    <div class="page-header">
      <h2 class="page-title">组织架构</h2>
    </div>

    <a-spin :spinning="loadingDepartments">
      <DepartmentManager
        v-model="departmentTree"
        mode="operation"
        :can-edit="isCeo"
        :loading="deptLoading"
        @change="handleDepartmentChange"
      />
    </a-spin>

    <!-- 汇报关系（直系领导可视化 + 拖拽重组） -->
    <a-card title="汇报关系" class="supervisor-card">
      <template #extra>
        <a-space>
          <span class="extra-hint">拖拽左侧节点到右侧树指定上级下方</span>
          <a-button :loading="loadingTree" size="small" @click="loadSupervisorTree">
            刷新
          </a-button>
        </a-space>
      </template>
      <a-spin :spinning="loadingTree">
        <SupervisorTree
          v-model="supervisorMappings"
          :employees="employeeBriefs"
          mode="operation"
          :can-edit="isCeoOrHr"
          @change="handleSupervisorChange"
          @invalid="handleSupervisorInvalid"
        />
      </a-spin>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * /org/index.vue — 组织架构页（运营态）
 *
 * 设计依据：
 *   - DESIGN.md §3.x 组织架构（运营期 CEO/HR 维护）
 *   - D-M08 初始化向导改造：抽 DepartmentManager + SupervisorTree 两个 SFC 复用
 *
 * 不变量：
 *   - 本页只负责 API 调用 + 数据形状转换；UI 与交互完全交给两个子组件
 *   - tempId 在运营态以 "emp-{realId}" 形式生成（逐字符不与向导态 "emp-1" 等冲突）
 *   - 对 SupervisorTree 提交的 change 事件，在 changed tempId 上反解析回真实 employeeId
 *     后调 PUT /api/employees/{id} 更新 directSupervisorId
 */
import { ref, computed, onMounted } from 'vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import { message } from 'ant-design-vue'
import DepartmentManager from '~/components/setup/DepartmentManager.vue'
import SupervisorTree from '~/components/setup/SupervisorTree.vue'

// 与 DepartmentManager / SupervisorTree 组件公共类型对齐
// 由于 Vue SFC 在 type-only 导入时常被工具误判为副作用导入，这里采用结构性接口本地复刻，
// 字段命名与组件 export 完全一致，保证编译期一致性。
interface DepartmentNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  employeeCount: number
  children: DepartmentNode[]
}

interface DepartmentChangePayload {
  action: 'create' | 'update' | 'delete'
  node: DepartmentNode
  parentId?: number | null
}

interface EmployeeBrief {
  tempId: string
  name: string
  roleCode?: string
  roleName?: string
  isCeo?: boolean
}

interface SupervisorMapping {
  employeeTempId: string
  supervisorTempId: string | null
}

interface SupervisorChangePayload {
  mappings: SupervisorMapping[]
  changed: string
  newSupervisorTempId: string | null
}

interface SupervisorInvalidPayload {
  reason: 'CYCLE' | 'CEO_IMMUTABLE' | 'DROP_TO_GAP' | 'SELF'
  employeeTempId: string
  attemptedSupervisorTempId: string | null
}

// ────────────────────────────────────────────────────────────────────
// 角色判定
// ────────────────────────────────────────────────────────────────────

const userStore = useUserStore()
const isCeo = computed(() => userStore.userInfo?.role === 'ceo')
const isCeoOrHr = computed(() =>
  ['ceo', 'hr'].includes(userStore.userInfo?.role ?? ''),
)

// ────────────────────────────────────────────────────────────────────
// 部门树（DepartmentManager 数据源）
// ────────────────────────────────────────────────────────────────────

interface ApiDeptNode {
  id: number
  name: string
  parentId: number | null
  sort: number
  employeeCount: number
  children: ApiDeptNode[]
}

const loadingDepartments = ref(false)
const deptLoading = ref(false)
const departmentTree = ref<DepartmentNode[]>([])

/**
 * API 部门节点 → 组件期望的 DepartmentNode（字段名一致，仅做深拷贝以避免引用泄漏）
 */
function toDepartmentNodes(nodes: ApiDeptNode[]): DepartmentNode[] {
  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    parentId: n.parentId,
    sort: n.sort,
    employeeCount: n.employeeCount ?? 0,
    children: toDepartmentNodes(n.children ?? []),
  }))
}

async function loadDepartments(): Promise<void> {
  loadingDepartments.value = true
  try {
    const res = await request<ApiDeptNode[]>({ url: '/departments', method: 'GET' })
    departmentTree.value = toDepartmentNodes(res ?? [])
  } catch {
    message.error('加载部门数据失败')
  } finally {
    loadingDepartments.value = false
  }
}

/**
 * 处理 DepartmentManager change 事件：根据 action 分发 API 调用，成功后 reload 同步真实状态
 */
async function handleDepartmentChange(payload: DepartmentChangePayload): Promise<void> {
  if (!isCeo.value) return
  deptLoading.value = true
  try {
    if (payload.action === 'create') {
      const body: Record<string, unknown> = {
        name: payload.node.name,
        sort: payload.node.sort,
      }
      if (payload.parentId !== null && payload.parentId !== undefined) {
        body.parentId = payload.parentId
      }
      await request({ url: '/departments', method: 'POST', body })
      message.success('部门已创建')
    } else if (payload.action === 'update') {
      await request({
        url: `/departments/${payload.node.id}`,
        method: 'PUT',
        body: { name: payload.node.name, sort: payload.node.sort },
      })
      message.success('已更新')
    } else if (payload.action === 'delete') {
      await request({ url: `/departments/${payload.node.id}`, method: 'DELETE' })
      message.success('已删除')
    }
    await loadDepartments()
  } catch {
    if (payload.action === 'delete') {
      message.error('删除失败（可能存在员工或子部门）')
    } else {
      message.error('操作失败')
    }
    // 失败时强制 reload 以纠正 v-model 中的乐观更新
    await loadDepartments()
  } finally {
    deptLoading.value = false
  }
}

// ────────────────────────────────────────────────────────────────────
// 汇报关系（SupervisorTree 数据源）
// ────────────────────────────────────────────────────────────────────

interface ApiEmployee {
  id: number
  name: string
  employeeNo?: string
  roleName?: string
  roleCode?: string
  directSupervisorId?: number | null
}

const loadingTree = ref(false)
const allEmployees = ref<ApiEmployee[]>([])

/**
 * 把真实 employeeId 包装为 tempId（运营态约定 "emp-{id}"）
 * 注：此前缀与 SetupWizard 向导态 tempId（如 "emp-1"）形式相同但语义不同，
 * 由组件本身视为不透明字符串，调用方负责反解析。
 */
function realIdToTempId(id: number): string {
  return `emp-${id}`
}

function tempIdToRealId(tempId: string): number | null {
  const match = /^emp-(\d+)$/.exec(tempId)
  return match ? Number(match[1]) : null
}

const ceoEmployee = computed<ApiEmployee | undefined>(() =>
  allEmployees.value.find(
    (e) =>
      e.roleCode === 'ceo' ||
      e.roleName?.includes('CEO') === true ||
      e.roleName?.includes('总裁') === true,
  ),
)

/**
 * 把 ApiEmployee[] 投影成 SupervisorTree 期望的 EmployeeBrief[]
 */
const employeeBriefs = computed<EmployeeBrief[]>(() =>
  allEmployees.value.map((e) => ({
    tempId: realIdToTempId(e.id),
    name: e.name,
    roleCode: e.roleCode,
    roleName: e.roleName,
    isCeo: ceoEmployee.value?.id === e.id,
  })),
)

/**
 * 把 ApiEmployee[].directSupervisorId 投影成 SupervisorMapping[]
 * 仅纳入 directSupervisorId !== null 的员工 — null 的员工自动通过组件的"未分配区"展示
 */
const supervisorMappings = computed<SupervisorMapping[]>({
  get: () =>
    allEmployees.value
      .filter((e) => e.directSupervisorId !== null && e.directSupervisorId !== undefined)
      .map((e) => ({
        employeeTempId: realIdToTempId(e.id),
        supervisorTempId:
          e.directSupervisorId !== null && e.directSupervisorId !== undefined
            ? realIdToTempId(e.directSupervisorId)
            : null,
      })),
  // 写入路径有意为空：运营态以"API 调用 + reload"为唯一真理来源，
  // 由 handleSupervisorChange 负责落库后 reload allEmployees，
  // 避免组件本地的乐观更新与服务端最终状态产生闪烁。
  set: () => {
    // intentional no-op
  },
})

async function loadSupervisorTree(): Promise<void> {
  loadingTree.value = true
  try {
    const data = await request<{ content: ApiEmployee[] }>({
      url: '/employees?size=500',
    })
    allEmployees.value = data?.content ?? []
  } catch {
    allEmployees.value = []
  } finally {
    loadingTree.value = false
  }
}

/**
 * 处理 SupervisorTree change 事件：把 tempId 反解析回 employeeId，调 PUT /employees/{id}
 */
async function handleSupervisorChange(payload: SupervisorChangePayload): Promise<void> {
  if (!isCeoOrHr.value) return
  const employeeId = tempIdToRealId(payload.changed)
  if (employeeId === null) {
    message.error('无效的员工句柄')
    return
  }
  const supervisorId =
    payload.newSupervisorTempId !== null
      ? tempIdToRealId(payload.newSupervisorTempId)
      : null
  try {
    await request({
      url: `/employees/${employeeId}`,
      method: 'PUT',
      body: { directSupervisorId: supervisorId },
    })
    message.success(supervisorId === null ? '已移出汇报关系' : '汇报关系已更新')
    await loadSupervisorTree()
  } catch {
    message.error('保存失败')
    await loadSupervisorTree()
  }
}

/**
 * 处理 SupervisorTree invalid 事件：根据 reason 输出对应中文提示
 */
function handleSupervisorInvalid(payload: SupervisorInvalidPayload): void {
  switch (payload.reason) {
    case 'CYCLE':
      message.error('不允许循环汇报：目标上级是当前节点的下属')
      break
    case 'CEO_IMMUTABLE':
      message.warning('CEO 节点不可移动')
      break
    case 'DROP_TO_GAP':
      message.warning('当前仅支持拖拽到具体上级节点')
      break
    case 'SELF':
      message.error('不能将自己设为自己的上级')
      break
  }
}

// ────────────────────────────────────────────────────────────────────
// 生命周期
// ────────────────────────────────────────────────────────────────────

onMounted(() => {
  void loadDepartments()
  void loadSupervisorTree()
})
</script>

<style scoped>
.org-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #003466;
  margin: 0 0 16px 0;
}

.supervisor-card {
  margin-top: 16px;
}

.extra-hint {
  color: #999;
  font-size: 12px;
}
</style>
