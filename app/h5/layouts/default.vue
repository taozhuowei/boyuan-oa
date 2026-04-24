<template>
  <!-- a-config-provider: disable AntD's auto space insertion between Chinese characters in buttons -->
  <a-config-provider :auto-insert-space-in-button="false" :locale="zhCN">
    <a-layout class="app-shell">
      <!-- Left sidebar navigation — role-based menus, grouped by cluster, icons always visible.
           折叠时显示图标（AntD sider collapsed=80px + MenuItemGroup 隐藏 title） -->
      <a-layout-sider v-model:collapsed="collapsed" collapsible width="220" theme="dark">
        <div class="logo">
          <span v-if="!collapsed" class="logo-text">
            {{ companyName ? companyName + ' OA 工作台' : '博渊 OA 工作台' }}
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
          <a-menu-item-group v-for="group in groupedMenus" :key="group.title">
            <template #title>
              <span class="group-title">{{ group.title }}</span>
            </template>
            <a-menu-item
              v-for="item in group.items"
              :key="item.path"
              :data-catch="'nav-item-' + item.path"
            >
              <template #icon>
                <component :is="item.iconComponent" />
              </template>
              <span>{{ item.label }}</span>
            </a-menu-item>
          </a-menu-item-group>
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
import { ref, computed, watch, onMounted, shallowRef, markRaw } from 'vue'
import type { Component } from 'vue'
import { Modal } from 'ant-design-vue'
import {
  HomeOutlined,
  AuditOutlined,
  FormOutlined,
  ProjectOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  TeamOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  ScheduleOutlined,
  MoneyCollectOutlined,
  AccountBookOutlined,
  FileSearchOutlined,
  MedicineBoxOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ExportOutlined,
  SolutionOutlined,
  FileDoneOutlined,
} from '@ant-design/icons-vue'
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

/**
 * 路径 → 图标组件。新页面必须在此登记，否则默认用 HomeOutlined（能看到但不贴切）。
 * 用 markRaw 避免 Vue 把图标 Component 变成 reactive proxy。
 */
const PATH_ICON: Record<string, Component> = {
  '/': markRaw(HomeOutlined),
  '/todo': markRaw(AuditOutlined),
  '/forms': markRaw(FormOutlined),
  '/projects': markRaw(ProjectOutlined),
  '/construction_log': markRaw(FileTextOutlined),
  '/construction_log/templates': markRaw(AppstoreOutlined),
  '/employees': markRaw(TeamOutlined),
  '/team': markRaw(TeamOutlined),
  '/org': markRaw(ApartmentOutlined),
  '/positions': markRaw(ProfileOutlined),
  '/role': markRaw(SafetyCertificateOutlined),
  '/leave_types': markRaw(ClockCircleOutlined),
  '/allowances': markRaw(GiftOutlined),
  '/attendance': markRaw(ScheduleOutlined),
  '/payroll': markRaw(MoneyCollectOutlined),
  '/expense/apply': markRaw(AccountBookOutlined),
  '/expense/records': markRaw(FileSearchOutlined),
  '/injury': markRaw(MedicineBoxOutlined),
  '/config': markRaw(SettingOutlined),
  '/retention': markRaw(DatabaseOutlined),
  '/data_export': markRaw(ExportOutlined),
  '/data_viewer': markRaw(DatabaseOutlined),
  '/operation_logs': markRaw(FileDoneOutlined),
  '/me': markRaw(SolutionOutlined),
}

/**
 * 路径 → 聚类组名。五大类：工作 / 项目 / 人事 / 考勤薪资 / 财务 / 系统。
 * "工资条"（worker/employee 视角的 /payroll）也归考勤薪资。
 * 新页面必须在此登记，否则默认进"其他"。
 */
const PATH_GROUP: Record<string, string> = {
  '/': '工作',
  '/todo': '工作',
  '/forms': '工作',
  '/projects': '项目',
  '/construction_log': '项目',
  '/construction_log/templates': '项目',
  '/employees': '人事',
  '/team': '人事',
  '/org': '人事',
  '/positions': '人事',
  '/role': '人事',
  '/leave_types': '人事',
  '/allowances': '人事',
  '/attendance': '考勤薪资',
  '/payroll': '考勤薪资',
  '/expense/apply': '财务',
  '/expense/records': '财务',
  '/injury': '财务',
  '/config': '系统',
  '/retention': '系统',
  '/data_export': '系统',
  '/data_viewer': '系统',
  '/operation_logs': '系统',
}

/** 聚类显示顺序。 */
const GROUP_ORDER = ['工作', '项目', '人事', '考勤薪资', '财务', '系统', '其他']

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
const apiMenus = shallowRef<MenuItem[] | null>(null)
const menuItems = computed<MenuItem[]>(() => {
  if (apiMenus.value) return apiMenus.value
  const role = userStore.userInfo?.role ?? 'employee'
  return ROLE_MENUS[role] ?? DEFAULT_MENUS
})

interface GroupedItem {
  path: string
  label: string
  iconComponent: Component
}
interface MenuGroup {
  title: string
  items: GroupedItem[]
}

/**
 * 将扁平 menuItems 按 PATH_GROUP 聚类成 MenuGroup[]。每个 item 带图标；未登记图标的用 HomeOutlined。
 * 若 menuItems 里含 children（来自后端的嵌套数据），展开为扁平后再聚类。
 */
const groupedMenus = computed<MenuGroup[]>(() => {
  const flat: MenuItem[] = []
  const walk = (items: MenuItem[]) => {
    for (const it of items) {
      if (it.children?.length) walk(it.children)
      else flat.push(it)
    }
  }
  walk(menuItems.value)

  const byGroup: Record<string, GroupedItem[]> = {}
  for (const it of flat) {
    const group = PATH_GROUP[it.path] ?? '其他'
    byGroup[group] = byGroup[group] ?? []
    byGroup[group].push({
      path: it.path,
      label: it.label,
      iconComponent: PATH_ICON[it.path] ?? markRaw(HomeOutlined),
    })
  }
  return GROUP_ORDER.filter((g) => byGroup[g]?.length).map((g) => ({
    title: g,
    items: byGroup[g],
  }))
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

.group-title {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.78);
  letter-spacing: 1px;
  font-weight: 600;
  text-transform: uppercase;
}

/* 折叠态隐藏组标题（AntD MenuItemGroup 的 title 默认仍显示） */
:deep(.ant-layout-sider-collapsed .ant-menu-item-group-title) {
  display: none;
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
