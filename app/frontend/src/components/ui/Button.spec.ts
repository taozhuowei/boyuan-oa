import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('renders with default props', () => {
    const wrapper = mount(Button, {
      slots: { default: 'Click me' }
    })
    expect(wrapper.find('.btn').exists()).toBe(true)
    expect(wrapper.find('.btn-primary').exists()).toBe(true)
    expect(wrapper.text()).toBe('Click me')
  })

  it('emits click event', async () => {
    const wrapper = mount(Button)
    await wrapper.find('.btn').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mount(Button, {
      props: { disabled: true }
    })
    await wrapper.find('.btn').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('does not emit click when loading', async () => {
    const wrapper = mount(Button, {
      props: { loading: true }
    })
    await wrapper.find('.btn').trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('applies block class when block prop is true', () => {
    const wrapper = mount(Button, {
      props: { block: true }
    })
    expect(wrapper.find('.btn-block').exists()).toBe(true)
  })

  it('applies variant classes correctly', () => {
    const variants = ['primary', 'secondary', 'ghost', 'danger'] as const
    for (const variant of variants) {
      const wrapper = mount(Button, { props: { variant } })
      expect(wrapper.find(`.btn-${variant}`).exists()).toBe(true)
    }
  })
})
