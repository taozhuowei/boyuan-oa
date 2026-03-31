import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from './Badge.vue'

describe('Badge', () => {
  it('renders with default props', () => {
    const wrapper = mount(Badge, {
      slots: { default: '标签' }
    })
    expect(wrapper.find('.badge').exists()).toBe(true)
    expect(wrapper.text()).toBe('标签')
  })

  it('applies variant classes correctly', () => {
    const variants = ['default', 'success', 'warning', 'danger', 'info'] as const
    for (const variant of variants) {
      const wrapper = mount(Badge, { props: { variant } })
      expect(wrapper.find(`.badge-${variant}`).exists()).toBe(true)
    }
  })
})
