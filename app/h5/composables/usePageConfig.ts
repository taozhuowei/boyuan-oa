import { ref, type Ref } from 'vue'
import { request } from '~/utils/http'

/**
 * Page configuration type
 * @property fields - List of field identifiers to display
 * @property buttons - List of button identifiers to show
 */
export interface PageConfig {
  fields: string[]
  buttons: string[]
}

/**
 * Result type for usePageConfig composable
 * @property config - The page configuration or null if not loaded/error
 * @property loading - Whether a request is in progress
 * @property error - Error message if the request failed
 */
export interface UsePageConfigResult {
  config: Ref<PageConfig | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

/**
 * Generates the sessionStorage key for a given route code
 * @param routeCode - The route code to generate key for
 * @returns The sessionStorage key
 */
function getStorageKey(routeCode: string): string {
  return `page-config-${routeCode}`
}

/**
 * Fetches page configuration from the API
 * @param routeCode - The route code to fetch configuration for
 * @returns Promise resolving to the page configuration
 * @throws Error if the request fails
 */
async function fetchPageConfig(routeCode: string): Promise<PageConfig> {
  // X-Client-Type: web is injected by default in http.ts
  return request<PageConfig>({
    url: `/page-config/${routeCode}`
  })
}

/**
 * Retrieves cached configuration from sessionStorage
 * @param routeCode - The route code to get cached config for
 * @returns The cached configuration or null if not found
 */
function getCachedConfig(routeCode: string): PageConfig | null {
  if (typeof window === 'undefined') return null

  try {
    const key = getStorageKey(routeCode)
    const cached = sessionStorage.getItem(key)
    if (cached) {
      return JSON.parse(cached) as PageConfig
    }
  } catch {
    // Ignore parsing errors and return null
  }
  return null
}

/**
 * Stores configuration in sessionStorage
 * @param routeCode - The route code to cache config for
 * @param config - The configuration to cache
 */
function setCachedConfig(routeCode: string, config: PageConfig): void {
  if (typeof window === 'undefined') return

  try {
    const key = getStorageKey(routeCode)
    sessionStorage.setItem(key, JSON.stringify(config))
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

/**
 * Clears cached configuration from sessionStorage
 * @param routeCode - The route code to clear cache for
 */
export function clearPageConfigCache(routeCode: string): void {
  if (typeof window === 'undefined') return

  try {
    const key = getStorageKey(routeCode)
    sessionStorage.removeItem(key)
  } catch {
    // Ignore errors
  }
}

/**
 * Composable for fetching and caching page configuration
 *
 * This composable checks sessionStorage for cached configuration first.
 * If not cached, it fetches from the API with the X-Client-Type: web header
 * and stores the result in sessionStorage for the current session only.
 *
 * @param routeCode - The route code to fetch configuration for
 * @returns Object containing config ref, loading state, and error message
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { config, loading, error } = usePageConfig('employee-list')
 *
 * // Access configuration
 * const visibleFields = computed(() => config.value?.fields ?? [])
 * const visibleButtons = computed(() => config.value?.buttons ?? [])
 * </script>
 * ```
 */
export function usePageConfig(routeCode: string): UsePageConfigResult {
  const config = ref<PageConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Check for cached config immediately
  const cached = getCachedConfig(routeCode)
  if (cached) {
    config.value = cached
  } else {
    // Fetch from API if not cached
    loading.value = true

    fetchPageConfig(routeCode)
      .then((data) => {
        config.value = data
        setCachedConfig(routeCode, data)
        error.value = null
      })
      .catch((err: unknown) => {
        const errObj = err as { data?: { message?: string }; message?: string }
        config.value = null
        error.value = errObj.data?.message ?? errObj.message ?? '加载页面配置失败'
      })
      .finally(() => {
        loading.value = false
      })
  }

  return {
    config,
    loading,
    error
  }
}
