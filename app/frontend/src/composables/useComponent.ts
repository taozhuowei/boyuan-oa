import { ref, onMounted } from 'vue'
import type { Ref, Component } from 'vue'
import { getComponent } from '../adapters'

// Usage: const { Button, Card } = useComponent(['Button', 'Card'])
export function useComponent(names: string[]): Record<string, Ref<Component | null>> {
  const refs: Record<string, Ref<Component | null>> = {}
  for (const name of names) {
    refs[name] = ref<Component | null>(null)
  }
  onMounted(async () => {
    // allSettled：单个组件加载失败不影响其余组件
    const results = await Promise.allSettled(names.map(name => getComponent(name)))
    names.forEach((name, i) => {
      const result = results[i]
      refs[name].value = result.status === 'fulfilled' ? result.value : null
    })
  })
  return refs
}
