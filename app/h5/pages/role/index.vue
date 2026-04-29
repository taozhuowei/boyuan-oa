<template>
  <!--
    /role 角色管理页（CEO 运营态）

    重构记录（D-M08 / DEF-SETUP-04 C2 方案）：
    - 自定义角色的新增/编辑/删除/权限矩阵全部下沉到共用组件 <RoleConfigPanel />，
      与 /setup 初始化向导步骤 5 共享 UI 与交互。
    - 本页继续承担数据加载（GET /api/roles）与持久化（POST/PUT/DELETE /api/roles），
      并保留系统内置角色的只读展示（系统角色不可编辑/删除，用单独的只读表格呈现）。
  -->
  <div class="roles-page">
    <h2 class="page-title">角色管理</h2>

    <!-- 系统角色只读展示：保持原页面的"类型/状态"信息可见 -->
    <a-card title="系统内置角色（只读）" class="role-section" size="small">
      <a-table
        :columns="systemColumns"
        :data-source="systemRoles"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'isSystem'">
            <a-tag color="blue">系统</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="(record as Role).status === 1 ? 'success' : 'default'">
              {{ (record as Role).status === 1 ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'permissions'">
            <a-tag>{{ ((record as Role).permissions || []).length }} 项</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 自定义角色：复用 RoleConfigPanel，CEO 才允许编辑（非 CEO 模式下面板仍渲染但所有交互按钮无效，
         由后端 @PreAuthorize('hasRole(CEO)') 二次保护，避免前端绕过） -->
    <a-card title="自定义角色" class="role-section" size="small">
      <template v-if="isCEO">
        <RoleConfigPanel
          v-model="customRoles"
          mode="operation"
          @change="handleRoleChange"
        />
      </template>
      <template v-else>
        <a-empty description="仅 CEO 可管理自定义角色" />
      </template>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * /role 页面脚本
 *
 * 职责：
 *   1. 拉取所有角色（GET /api/roles）并按 isSystem 拆分为
 *      systemRoles（只读展示）与 customRoles（绑定 RoleConfigPanel v-model）
 *   2. 在 RoleConfigPanel 'change' 事件触发时分发到对应 API：
 *        create → POST /api/roles
 *        update → PUT  /api/roles/{id}
 *        delete → DELETE /api/roles/{id}
 *   3. API 调用成功后重新拉取列表，保证乐观更新与后端真实状态一致
 *
 * 不变量：
 *   - 本页不直接操作权限矩阵 UI，矩阵交互全部由 RoleConfigPanel 承担
 *   - API 仍保留旧字段（roleCode/roleName/status:number），通过 mapper 与 CustomRole 双向转换
 */
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { request } from '~/utils/http'
import { useUserStore } from '~/stores/user'
import RoleConfigPanel, { type CustomRole } from '~/components/setup/RoleConfigPanel.vue'

// ────────────────────────────────────────────────────────────────────
// API 数据模型（与后端 RoleViewResponse / RoleUpsertRequest 对齐）
// ────────────────────────────────────────────────────────────────────

/**
 * 后端 RoleViewResponse 的前端镜像类型；与 CustomRole 通过 mapper 互转。
 *
 * @property id          数据库主键（PUT/DELETE 用）
 * @property roleCode    角色编码（系统唯一）
 * @property roleName    角色显示名
 * @property description 描述
 * @property status      1=启用，0=禁用（后端为 Integer）
 * @property isSystem    是否系统内置（true 时不可编辑/删除）
 * @property permissions 权限码数组
 */
interface Role {
  id: number
  roleCode: string
  roleName: string
  description: string
  status: number
  isSystem: boolean
  permissions: string[]
}

const userStore = useUserStore()
const isCEO = computed(() => userStore.userInfo?.role === 'ceo')

const loading = ref(false)
/** 全量角色列表（含系统 + 自定义），由 GET /api/roles 加载 */
const allRoles = ref<Role[]>([])
/**
 * 自定义角色列表（CustomRole 5 字段视图），与 RoleConfigPanel v-model 双向绑定。
 * 数据来源：allRoles 中 isSystem=false 的子集，经 toCustomRole 映射；
 * 用户在面板内编辑时本地数组先变更，再由 handleRoleChange 调用 API 同步。
 */
const customRoles = ref<CustomRole[]>([])

/** 系统角色列表（只读展示） */
const systemRoles = computed(() => allRoles.value.filter((r) => r.isSystem))

const systemColumns = [
  { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
  { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '类型', key: 'isSystem', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '权限数量', key: 'permissions', width: 100 },
]

// ────────────────────────────────────────────────────────────────────
// 数据映射
// ────────────────────────────────────────────────────────────────────

/**
 * Role(API) → CustomRole(panel)
 * @param r 后端返回的角色对象
 */
function toCustomRole(r: Role): CustomRole {
  return {
    code: r.roleCode,
    name: r.roleName,
    description: r.description ?? '',
    status: r.status === 1 ? 'active' : 'inactive',
    permissions: r.permissions ?? [],
  }
}

/**
 * CustomRole(panel) → 后端 Upsert 请求体
 * @param c 面板回调返回的角色对象
 */
function toUpsertPayload(c: CustomRole): {
  roleCode: string
  roleName: string
  description: string
  status: number
  permissions: string[]
} {
  return {
    roleCode: c.code,
    roleName: c.name,
    description: c.description ?? '',
    status: c.status === 'inactive' ? 0 : 1,
    permissions: c.permissions ?? [],
  }
}

// ────────────────────────────────────────────────────────────────────
// 数据加载
// ────────────────────────────────────────────────────────────────────

/**
 * 从后端拉取全部角色，按 isSystem 拆分到 systemRoles / customRoles。
 * 失败时静默置空，由 request 公共拦截器输出错误 toast。
 */
async function loadRoles(): Promise<void> {
  loading.value = true
  try {
    const data = await request<Role[]>({ url: '/roles' })
    allRoles.value = data ?? []
    customRoles.value = (data ?? []).filter((r) => !r.isSystem).map(toCustomRole)
  } catch {
    allRoles.value = []
    customRoles.value = []
  } finally {
    loading.value = false
  }
}

// ────────────────────────────────────────────────────────────────────
// RoleConfigPanel @change 事件分发
// ────────────────────────────────────────────────────────────────────

/**
 * 面板内交互事件分发：根据 action 调用对应 API。
 * 成功后重载完整列表（避免本地数组与后端真实主键 id 不同步）。
 *
 * @param payload 面板回传的事件载荷
 * @param payload.action 用户动作：create | update | delete
 * @param payload.role   关联角色（CustomRole 5 字段）
 */
async function handleRoleChange(payload: {
  action: 'create' | 'update' | 'delete'
  role: CustomRole
}): Promise<void> {
  const { action, role } = payload

  try {
    if (action === 'create') {
      await request({
        url: '/roles',
        method: 'POST',
        body: toUpsertPayload(role),
      })
      message.success('角色创建成功')
    } else if (action === 'update') {
      // 通过 code 找到对应的真实主键 id
      const target = allRoles.value.find((r) => r.roleCode === role.code)
      if (!target) {
        message.error('未找到目标角色，请刷新后重试')
        await loadRoles()
        return
      }
      await request({
        url: `/roles/${target.id}`,
        method: 'PUT',
        body: toUpsertPayload(role),
      })
      message.success('角色更新成功')
    } else if (action === 'delete') {
      const target = allRoles.value.find((r) => r.roleCode === role.code)
      if (!target) {
        message.error('未找到目标角色，请刷新后重试')
        await loadRoles()
        return
      }
      await request({
        url: `/roles/${target.id}`,
        method: 'DELETE',
      })
      message.success('角色删除成功')
    }
  } catch (err: unknown) {
    // 后端返回 400（系统角色不可删除等）时给出更具体提示
    const status = (err as { statusCode?: number }).statusCode
    const msg = (err as { message?: string }).message
    if (status === 400 && msg) {
      message.error(msg)
    }
    // 其他错误已由 request 拦截器统一提示
  } finally {
    // 不论成功失败均重载，确保 UI 与后端一致
    await loadRoles()
  }
}

onMounted(loadRoles)
</script>

<style scoped>
.roles-page {
  /* Flow layout: natural top-to-bottom content flow */
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #003466;
}

.role-section {
  margin-bottom: 16px;
}
</style>
