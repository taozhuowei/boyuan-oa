// Global route guard
// 1. Check system initialization status, redirect to /setup if not initialized
// 2. Redirect unauthenticated users to /login
// 3. Enforce role-based route access (whitelist per page)
// Backend controls menu visibility; this guard blocks direct URL access for restricted pages.

import type { SessionUser } from '@shared/types/auth'

/**
 * Page access whitelist — maps each restricted route to the roles that MAY access it.
 * Routes not listed here are accessible to all authenticated users (e.g. /workbench, /me, /notifications, /todo, /forms, /expense/apply, /expense/records).
 * Role codes returned by the backend: 'ceo', 'hr', 'finance', 'project_manager', 'department_manager', 'employee', 'worker', 'general_manager', 'sys_admin'.
 * Source of truth: DESIGN.md §5.
 */
const PAGE_ACCESS: Record<string, string[]> = {
  '/config': ['ceo', 'sys_admin'],
  '/org': ['ceo', 'hr'],
  '/role': ['ceo'],
  '/employees': ['ceo', 'hr', 'finance', 'project_manager', 'department_manager'],
  '/positions': ['ceo', 'hr', 'finance'],
  '/retention': ['ceo'],
  '/allowances': ['ceo'],
  '/leave_types': ['ceo', 'hr'],
  '/directory': ['ceo', 'hr', 'finance'],
  '/team': ['ceo', 'hr', 'project_manager', 'department_manager'],
  '/operation_logs': ['ceo', 'sys_admin'],
  '/data_export': ['ceo', 'sys_admin'],
  '/data_viewer': ['ceo', 'sys_admin'],
  '/attendance': [
    'ceo',
    'hr',
    'finance',
    'project_manager',
    'department_manager',
    'employee',
    'worker',
  ],
  '/payroll': ['ceo', 'finance', 'worker', 'employee'],
  '/projects': ['ceo', 'finance', 'project_manager', 'employee', 'general_manager'],
  '/construction_log': ['ceo', 'project_manager', 'worker'],
  '/injury': ['ceo', 'finance', 'worker', 'project_manager'],
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Use Nuxt's useState for per-request initialization status (SSR-safe)
  const initState = useState<boolean | null>('setup-initialized', () => null)
  // Public routes (no auth needed) — /setup-account requires auth so excluded here
  const publicPaths = ['/login', '/auth/forgot_password', '/setup']

  // Check system initialization status
  if (initState.value === null) {
    try {
      const response = await $fetch<{ initialized: boolean }>('/api/setup/status')
      initState.value = response.initialized
    } catch {
      // If API fails, assume system is initialized to avoid blocking
      initState.value = true
    }
  }

  // Redirect to setup if not initialized
  if (initState.value === false && to.path !== '/setup') {
    return navigateTo('/setup')
  }

  // Redirect away from /setup if already initialized
  if (initState.value === true && to.path === '/setup') {
    return navigateTo('/login')
  }

  // Skip auth check for public paths
  if (publicPaths.includes(to.path)) {
    return
  }

  const tokenCookie = useCookie<string | null>('oa-token')
  // Typed as full SessionUser so that role, isDefaultPassword, and email are accessible
  // without repeated useCookie calls or inline type casts
  const userCookie = useCookie<SessionUser | null>('oa-user')

  // Redirect unauthenticated users
  if (!tokenCookie.value) {
    return navigateTo('/login')
  }

  // First-login account setup guard (D-F-23):
  // If the user's session indicates they need to bind email or change default password,
  // force them to /setup-account before accessing any other page.
  // We check the oa-user cookie for the isDefaultPassword flag set after /auth/me.
  const needsSetup =
    userCookie.value?.isDefaultPassword === true ||
    userCookie.value?.email === null
  if (needsSetup && to.path !== '/setup-account') {
    return navigateTo('/setup-account')
  }
  // Prevent accessing /setup-account once account is fully configured
  if (!needsSetup && to.path === '/setup-account') {
    return navigateTo('/')
  }

  // Role-based route access (whitelist check)
  const role = userCookie.value?.role ?? ''
  const allowedRoles = PAGE_ACCESS[to.path]
  if (allowedRoles !== undefined && !allowedRoles.includes(role)) {
    // Redirect to workbench — user lacks permission for this page
    return navigateTo('/')
  }
})
