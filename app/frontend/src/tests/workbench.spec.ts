import DirectoryPage from '../pages/directory/index.vue'
import EmployeesPage from '../pages/employees/index.vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import FormsPage from '../pages/forms/index.vue'
import IndexPage from '../pages/index/index.vue'
import LoginPage from '../pages/login/index.vue'
import ProjectsPage from '../pages/projects/index.vue'
import RolePage from '../pages/role/index.vue'

const mountWithStore = (component: Parameters<typeof mount>[0]) =>
  mount(component, {
    global: {
      plugins: [createPinia()],
      stubs: {
        picker: {
          template: '<div><slot /></div>'
        }
      }
    }
  })

describe('OA 页面渲染', () => {
  it('渲染工作台骨架', () => {
    const wrapper = mountWithStore(IndexPage)

    expect(wrapper.find('[data-testid="workspace-shell"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-left"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="workspace-right"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="user-status"]').exists()).toBe(true)
  })

  it('渲染工作台核心内容', () => {
    const wrapper = mountWithStore(IndexPage)

    expect(wrapper.findAll('.pending-item').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.stat-card').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.module-card').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.notice-item').length).toBeGreaterThan(0)
  })

  it('渲染登录页结构', () => {
    const wrapper = mountWithStore(LoginPage)

    expect(wrapper.find('.login-card').exists()).toBe(true)
    expect(wrapper.findAll('.field-input').length).toBe(2)
    expect(wrapper.find('.login-btn').exists()).toBe(true)
  })

  it('渲染角色管理页结构', async () => {
    const wrapper = mountWithStore(RolePage)

    await flushPromises()

    expect(wrapper.find('.role-list').exists()).toBe(true)
    expect(wrapper.find('.role-form').exists()).toBe(true)
    expect(wrapper.findAll('.role-item').length).toBeGreaterThan(0)
  })

  it('渲染表单中心页结构', async () => {
    const wrapper = mountWithStore(FormsPage)

    await flushPromises()

    expect(wrapper.find('.forms-shell').exists()).toBe(true)
    expect(wrapper.find('.form-panel').exists()).toBe(true)
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
  })

  it('渲染员工管理页结构', async () => {
    const wrapper = mountWithStore(EmployeesPage)

    await flushPromises()

    expect(wrapper.find('.employees-shell').exists()).toBe(true)
    expect(wrapper.find('.employee-list').exists()).toBe(true)
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
  })

  it('渲染项目管理页结构', async () => {
    const wrapper = mountWithStore(ProjectsPage)

    await flushPromises()

    expect(wrapper.find('.projects-shell').exists()).toBe(true)
    expect(wrapper.find('.project-list').exists()).toBe(true)
    expect(wrapper.find('.detail-panel').exists()).toBe(true)
  })

  it('渲染通讯录导入页结构', async () => {
    const wrapper = mountWithStore(DirectoryPage)

    await flushPromises()

    expect(wrapper.find('.directory-shell').exists()).toBe(true)
    expect(wrapper.find('.input-panel').exists()).toBe(true)
    expect(wrapper.find('.result-panel').exists()).toBe(true)
  })
})
