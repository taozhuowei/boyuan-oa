/**
 * useCompanyName composable
 * Purpose: shared company-name state fetched from /api/setup/status.
 * Used by app.vue (page title) and login.vue (header display).
 * The useState key 'company-name' matches the SSR state written by app.vue
 * so both consumers share the same hydrated value without duplicate fetches.
 */

interface SetupStatusResponse {
  companyName?: string | null
}

export function useCompanyName() {
  // SSR-safe shared state — must use exactly this key to align with app.vue SSR hydration
  const companyName = useState<string | null>('company-name', () => null)

  /**
   * fetchIfNeeded
   * Fetches /api/setup/status and populates companyName only when not already set.
   * Errors are suppressed; the caller falls back to a default display value.
   */
  async function fetchIfNeeded(): Promise<void> {
    if (companyName.value) return
    try {
      const data = await $fetch<SetupStatusResponse>('/api/setup/status')
      if (data?.companyName) companyName.value = data.companyName
    } catch {
      // Silently ignore — callers fall back to their own default values
    }
  }

  return { companyName, fetchIfNeeded }
}
