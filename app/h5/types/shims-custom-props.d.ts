/**
 * Global Vue component prop shims
 * Purpose: Allow data-catch (test hook attribute) on any Vue component without TS errors.
 * Mechanism: Vue 3 ComponentCustomProps — applied to all components project-wide.
 */
import '@vue/runtime-core'

declare module '@vue/runtime-core' {
  interface ComponentCustomProps {
    'data-catch'?: string
  }
}

export {}
