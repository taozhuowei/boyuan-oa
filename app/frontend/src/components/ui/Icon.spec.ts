import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders with default props', () => {
    const wrapper = mount(Icon, {
      props: { name: 'home' }
    })
    expect(wrapper.find('.icon').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('applies custom size', () => {
    const wrapper = mount(Icon, {
      props: { name: 'home', size: 32 }
    })
    const icon = wrapper.find('.icon')
    expect(icon.attributes('style')).toContain('width: 32px')
    expect(icon.attributes('style')).toContain('height: 32px')
  })

  it('applies custom color', () => {
    const wrapper = mount(Icon, {
      props: { name: 'home', color: '#ff0000' }
    })
    expect(wrapper.find('.icon').attributes('style')).toContain('color:')
  })

  it('renders different icons based on name', () => {
    const names = ['home', 'person', 'settings', 'logout']
    for (const name of names) {
      const wrapper = mount(Icon, { props: { name } })
      expect(wrapper.find('svg').exists()).toBe(true)
    }
  })
})
