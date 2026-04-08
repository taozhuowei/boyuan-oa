// Global route guard
// 1. Redirect unauthenticated users to /login
// 2. Enforce role-based route access (blocked routes per role)
// Backend controls menu visibility; this guard blocks direct URL access for restricted pages.

/** Routes that require specific roles (undefined = all authenticated users allowed) */
const ROLE_REQUIRED_ROUTES: Record<string, string[]> = {
  '/role': ['ceo'],
  '/org': ['ceo', 'project_manager', 'employee', 'finance', 'worker'], // accessible to all, but /role is ceo-only
  '/config': ['ceo'],
  '/retention': ['ceo'],
  '/settings': ['ceo']
}

/** Routes that are blocked for specific roles */
const ROLE_BLOCKED_ROUTES: Record<string, string[]> = {
  '/role': ['finance', 'project_manager', 'employee', 'worker'],
  '/config': ['finance', 'project_manager', 'employee', 'worker'],
  '/retention': ['finance', 'project_manager', 'employee', 'worker'],
  '/settings': ['finance', 'project_manager', 'employee', 'worker']
}

export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie<string | null>('oa-token')
  const userCookie = useCookie<{ role?: string } | null>('oa-user')

  // Public routes (no auth needed)
  const publicPaths = ['/login', '/auth/forgot_password']
  if (publicPaths.includes(to.path)) {
    return
  }

  // Redirect unauthenticated users
  if (!tokenCookie.value) {
    return navigateTo('/login')
  }

  // Role-based route blocking
  const role = userCookie.value?.role ?? ''
  const blockedRoles = ROLE_BLOCKED_ROUTES[to.path]
  if (blockedRoles && blockedRoles.includes(role)) {
    // Redirect to workbench with 403-style behavior
    return navigateTo('/')
  }
})
