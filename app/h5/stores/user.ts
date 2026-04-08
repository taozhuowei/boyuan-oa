// User session store — H5 web version
// Persists token and user info in cookies (SSR-safe via Nuxt useCookie)
// No uni.storage dependency

import { defineStore } from 'pinia'
import type { SessionUser } from '@shared/types'

export const useUserStore = defineStore('user', () => {
  const tokenCookie = useCookie<string | null>('oa-token', { maxAge: 604800 })
  const userCookie = useCookie<SessionUser | null>('oa-user', { maxAge: 604800 })

  const token = computed(() => tokenCookie.value ?? '')
  const userInfo = computed(() => userCookie.value ?? null)
  const isLoggedIn = computed(() => Boolean(token.value && userInfo.value))

  function setSession(nextToken: string, nextUser: SessionUser) {
    tokenCookie.value = nextToken
    userCookie.value = nextUser
  }

  function setUserInfo(partial: Partial<SessionUser>) {
    if (userCookie.value) {
      userCookie.value = { ...userCookie.value, ...partial }
    }
  }

  function logout() {
    tokenCookie.value = null
    userCookie.value = null
  }

  return { token, userInfo, isLoggedIn, setSession, setUserInfo, logout }
})
