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
    const components = await Promise.all(names.map(name => getComponent(name)))
    names.forEach((name, i) => {
      refs[name].value = components[i]
    })
  })
  return refs
}
