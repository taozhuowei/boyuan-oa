// Global route guard
// 1. Check system initialization status, redirect to /setup if not initialized
// 2. Redirect unauthenticated users to /login
// 3. Enforce role-based route access (whitelist per page)
// Backend controls menu visibility; this guard blocks direct URL access for restricted pages.

/**
 * Page access whitelist — maps each restricted route to the roles that MAY access it.
 * Routes not listed here are accessible to all authenticated users (e.g. /todo, /).
 * Uses role codes returned by the backend (e.g. 'ceo', 'hr', 'finance', 'project_manager', 'employee', 'worker').
 */
const PAGE_ACCESS: Record<string, string[]> = {
  '/config':           ['ceo'],
  '/org':              ['ceo', 'hr'],
  '/role':             ['ceo', 'hr'],
  '/employees':        ['ceo', 'hr'],
  '/positions':        ['ceo'],
  '/retention':        ['ceo'],
  '/settings':         ['ceo'],
  '/payroll':          ['ceo', 'hr', 'finance'],
  '/projects':         ['ceo', 'finance', 'project_manager', 'employee'],
  '/construction-log': ['ceo', 'project_manager', 'worker'],
  '/injury':           ['ceo', 'hr'],
}

export default defineNuxtRouteMiddleware(async (to) => {
  // Use Nuxt's useState for per-request initialization status (SSR-safe)
  const initState = useState<boolean | null>('setup-initialized', () => null)
  // Public routes (no auth needed)
  const publicPaths = ['/login', '/auth/forgot_password', '/setup']

  // Check system initialization status
  if (initState.value === null) {
    try {
      const response = await $fetch<{ initialized: boolean }>(
        '/api/setup/status'
      )
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

  // Skip auth check for public paths
  if (publicPaths.includes(to.path)) {
    return
  }

  const tokenCookie = useCookie<string | null>('oa-token')
  const userCookie = useCookie<{ role?: string } | null>('oa-user')

  // Redirect unauthenticated users
  if (!tokenCookie.value) {
    return navigateTo('/login')
  }

  // Role-based route access (whitelist check)
  const role = userCookie.value?.role ?? ''
  const allowedRoles = PAGE_ACCESS[to.path]
  if (allowedRoles !== undefined && !allowedRoles.includes(role)) {
    // Redirect to workbench — user lacks permission for this page
    return navigateTo('/')
  }
})
