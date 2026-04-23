<template>
  <!-- a-config-provider: disable AntD's auto space insertion between Chinese characters in buttons -->
  <a-config-provider :auto-insert-space-in-button="false" :locale="zhCN">
    <a-layout class="app-shell">
      <!-- Left sidebar navigation — menus fetched from /workbench/config (role-based) -->
      <a-layout-sider v-model:collapsed="collapsed" collapsible width="220" theme="dark">
        <div class="logo">
          <span v-if="!collapsed" class="logo-text">
            {{ companyName ? companyName + 'OA' : '博渊OA' }}工作台
          </span>
          <span v-else class="logo-icon">OA</span>
        </div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          theme="dark"
          mode="inline"
          data-catch="nav-sidebar"
          @click="onMenuClick"
        >
          <template v-for="item in menuItems" :key="item.key">
            <a-sub-menu v-if="item.children?.length" :key="item.key">
              <template #title>{{ item.label }}</template>
              <a-menu-item v-for="child in item.children" :key="child.path">
                <span :data-catch="'nav-item-' + child.path">{{ child.label }}</span>
              </a-menu-item>
            </a-sub-menu>
            <a-menu-item v-else :key="item.path">
              <span :data-catch="'nav-item-' + item.path">{{ item.label }}</span>
            </a-menu-item>
          </template>
        </a-menu>
      </a-layout-sider>

      <a-layout style="overflow: hidden">
        <!-- Top bar: 博渊 OA · [角色] [姓名]  [⚙系统]  [🔔通知 N]  [📋待办 N]  [●]▼ -->
        <a-layout-header class="app-header">
          <div class="header-brand">
            {{ companyName ? companyName + ' OA' : '博渊 OA' }}
            <span v-if="userStore.userInfo" class="header-user-label">
              · {{ userStore.userInfo.roleName ?? userStore.userInfo.role }}
              {{ userStore.userInfo.displayName }}
            </span>
          </div>
          <div class="header-actions">
            <!-- ⚙系统 — CEO only -->
            <a-button
              v-if="userStore.userInfo?.role === 'ceo'"
              type="text"
              class="action-btn"
              @click="navigateTo('/config')"
            >
              ⚙ 系统
            </a-button>

            <!-- 🔔通知 N -->
            <a-badge :count="notificationCount" :overflow-count="99" class="action-badge">
              <a-button
                type="text"
                class="action-btn"
                data-catch="notification-bell"
                @click="navigateTo('/notifications')"
              >
                🔔 通知
              </a-button>
            </a-badge>

            <!-- 📋待办 N -->
            <a-badge :count="todoCount" :overflow-count="99" class="action-badge">
              <a-button type="text" class="action-btn" @click="navigateTo('/todo')">
                📋 待办
              </a-button>
            </a-badge>

            <!-- ● 头像菜单 -->
            <a-dropdown placement="bottomRight">
              <a-button type="text" class="avatar-btn" data-catch="header-avatar-btn">
                <a-avatar size="small" :style="{ backgroundColor: '#003466' }">
                  {{ userStore.userInfo?.displayName?.slice(0, 1) ?? '?' }}
                </a-avatar>
                ▼
              </a-button>
              <template #overlay>
                <a-menu @click="onAvatarMenuClick">
                  <a-menu-item key="profile">个人信息</a-menu-item>
                  <a-menu-item key="password">修改密码</a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout">退出登录</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>

        <!-- Page content -->
        <a-layout-content class="app-content">
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Modal } from 'ant-design-vue'
import { useUserStore } from '~/stores/user'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface'

interface MenuItem {
  key: string
  label: string
  path: string
  icon?: string
  children?: MenuItem[]
}

interface WorkbenchMenu {
  code: string
  name: string
  icon: string
  path: string
  visible: boolean
  children: WorkbenchMenu[] | null
}

// Static role→menus map — mirrors backend WorkbenchController logic.
// Provides immediate rendering without async delay.
// Updated by API response in onMounted.
const ROLE_MENUS: Record<string, MenuItem[]> = {
  ceo: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/todo', label: '审批中心', path: '/todo' },
    { key: '/employees', label: '员工管理', path: '/employees' },
    { key: '/org', label: '组织架构', path: '/org' },
    { key: '/positions', label: '岗位管理', path: '/positions' },
    { key: '/allowances', label: '补贴配置', path: '/allowances' },
    { key: '/leave_types', label: '假期配额', path: '/leave_types' },
    { key: '/role', label: '角色管理', path: '/role' },
    { key: '/attendance', label: '考勤管理', path: '/attendance' },
    { key: '/projects', label: '项目管理', path: '/projects' },
    { key: '/payroll', label: '薪资管理', path: '/payroll' },
    { key: '/construction_log', label: '施工日志', path: '/construction_log' },
    { key: '/injury', label: '工伤补偿', path: '/injury' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
    { key: '/expense/records', label: '报销记录', path: '/expense/records' },
    { key: '/retention', label: '数据保留', path: '/retention' },
    { key: '/data_export', label: '数据导出', path: '/data_export' },
    { key: '/data_viewer', label: '数据查看', path: '/data_viewer' },
    { key: '/operation_logs', label: '操作日志', path: '/operation_logs' },
    { key: '/config', label: '系统配置', path: '/config' },
  ],
  finance: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/todo', label: '审批中心', path: '/todo' },
    { key: '/employees', label: '员工管理', path: '/employees' },
    { key: '/payroll', label: '薪资管理', path: '/payroll' },
    { key: '/injury', label: '工伤理赔', path: '/injury' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
    { key: '/expense/records', label: '报销记录', path: '/expense/records' },
    { key: '/allowances', label: '补贴配置', path: '/allowances' },
    { key: '/positions', label: '岗位薪资配置', path: '/positions' },
    { key: '/projects', label: '项目管理', path: '/projects' },
  ],
  project_manager: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/todo', label: '审批中心', path: '/todo' },
    { key: '/projects', label: '项目管理', path: '/projects' },
    { key: '/construction_log', label: '施工日志', path: '/construction_log' },
    {
      key: '/construction_log/templates',
      label: '工作项模板',
      path: '/construction_log/templates',
    },
    { key: '/forms', label: '表单中心', path: '/forms' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
  ],
  hr: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/employees', label: '员工管理', path: '/employees' },
    { key: '/org', label: '组织架构', path: '/org' },
    { key: '/positions', label: '岗位管理', path: '/positions' },
    { key: '/leave_types', label: '假期配额', path: '/leave_types' },
    { key: '/attendance', label: '考勤管理', path: '/attendance' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
    { key: '/expense/records', label: '报销记录', path: '/expense/records' },
  ],
  department_manager: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/todo', label: '审批中心', path: '/todo' },
    { key: '/team', label: '团队成员', path: '/team' },
    { key: '/attendance', label: '考勤管理', path: '/attendance' },
    { key: '/employees', label: '员工管理', path: '/employees' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
  ],
  worker: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/attendance', label: '考勤申请', path: '/attendance' },
    { key: '/construction_log', label: '施工日志', path: '/construction_log' },
    { key: '/injury', label: '工伤补偿', path: '/injury' },
    { key: '/forms', label: '表单中心', path: '/forms' },
    { key: '/payroll', label: '工资条', path: '/payroll' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
  ],
  // 总经理：可见全项目与营收，但不见考勤/薪资/HR 档案（设计 §3.2）
  general_manager: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/todo', label: '审批中心', path: '/todo' },
    { key: '/projects', label: '项目管理', path: '/projects' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
    { key: '/expense/records', label: '报销记录', path: '/expense/records' },
  ],
  sys_admin: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/config', label: '系统配置', path: '/config' },
    { key: '/data_export', label: '数据导出', path: '/data_export' },
    { key: '/data_viewer', label: '数据查看', path: '/data_viewer' },
    { key: '/operation_logs', label: '操作日志', path: '/operation_logs' },
  ],
  employee: [
    { key: '/', label: '工作台', path: '/' },
    { key: '/forms', label: '表单中心', path: '/forms' },
    { key: '/attendance', label: '考勤管理', path: '/attendance' },
    { key: '/payroll', label: '工资条', path: '/payroll' },
    { key: '/expense/apply', label: '费用报销', path: '/expense/apply' },
  ],
}

const DEFAULT_MENUS: MenuItem[] = [{ key: '/', label: '工作台', path: '/' }]

const companyName = useState<string | null>('company-name')
const userStore = useUserStore()
const route = useRoute()
const collapsed = ref(false)
const selectedKeys = ref([route.path])
const notificationCount = ref(0)
const todoCount = ref(0)

// Menus computed immediately from role (no async delay), overridden by API data
const apiMenus = ref<MenuItem[] | null>(null)
const menuItems = computed<MenuItem[]>(() => {
  if (apiMenus.value) return apiMenus.value
  const role = userStore.userInfo?.role ?? 'employee'
  return ROLE_MENUS[role] ?? DEFAULT_MENUS
})

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path]
  }
)

function buildMenuItems(menus: WorkbenchMenu[]): MenuItem[] {
  return menus.map((m) => ({
    key: m.path,
    label: m.name,
    path: m.path,
    icon: m.icon,
    children: m.children ? buildMenuItems(m.children) : undefined,
  }))
}

// Refresh menus and todo count from API (updates after initial static render)
onMounted(async () => {
  const token = userStore.token
  const headers: Record<string, string> = { 'X-Client-Type': 'web' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  await Promise.all([
    $fetch<{ menus: WorkbenchMenu[] }>('/api/workbench/config', { headers })
      .then((data) => {
        if (data.menus?.length) apiMenus.value = buildMenuItems(data.menus)
      })
      .catch(() => {
        /* keep computed fallback */
      }),
    $fetch<unknown[]>('/api/forms/todo', { headers })
      .then((list) => {
        todoCount.value = list?.length ?? 0
      })
      .catch(() => {
        todoCount.value = 0
      }),
    $fetch<{ companyName: string | null }>('/api/config/company-name', { headers })
      .then((data) => {
        companyName.value = data.companyName ?? null
      })
      .catch(() => {
        /* keep fallback display */
      }),
  ])
})

function onMenuClick({ key }: MenuInfo) {
  navigateTo(String(key))
}

async function onAvatarMenuClick({ key }: MenuInfo) {
  if (key === 'logout') {
    // Show confirmation dialog before logout — avoids accidental session termination
    Modal.confirm({
      title: '退出登录',
      content: '确定退出登录吗？',
      okText: '确定退出',
      cancelText: '取消',
      onOk: async () => {
        userStore.logout()
        await navigateTo('/login')
      },
    })
  } else if (key === 'profile') {
    await navigateTo('/me')
  } else if (key === 'password') {
    await navigateTo('/me/password')
  }
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  overflow: hidden;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 0 16px;
  overflow: hidden;
  white-space: nowrap;
}

.logo-icon {
  font-size: 18px;
  font-weight: 700;
}

.app-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.header-brand {
  font-size: 16px;
  font-weight: 600;
  color: #003466;
  white-space: nowrap;
}

.header-user-label {
  font-weight: 400;
  color: #333;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-badge {
  display: inline-flex;
  align-items: center;
}

.action-btn {
  font-size: 13px;
  color: #333;
  padding: 0 10px;
}

.action-btn:hover {
  color: #003466;
  background: #f0f4ff;
}

.avatar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #333;
  padding: 0 8px;
}

.avatar-btn:hover {
  color: #003466;
  background: #f0f4ff;
}

.app-content {
  margin: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  height: calc(100vh - 64px - 32px); /* 减去头部高度 64px 和 margin 16px * 2 */
  overflow-y: auto;
}
</style>
