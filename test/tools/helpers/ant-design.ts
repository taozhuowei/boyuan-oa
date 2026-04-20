/**
 * AntD 组件定位器助手
 *
 * 职责：封装 AntD 4.x 特有的 portal 渲染模式。
 * Select/DatePicker/Modal 等组件的下拉内容渲染在 document.body 末尾，
 * 不在触发元素的 DOM 子树内，需要用全局选择器定位。
 */
import { Page, Locator } from '@playwright/test'

/** 获取 AntD Select 下拉面板（body portal） */
export function getSelectDropdown(page: Page): Locator {
  return page.locator('.ant-select-dropdown').filter({ hasNotText: '' })
}

/** 获取 AntD DatePicker 日历面板（body portal） */
export function getDatePickerDropdown(page: Page): Locator {
  return page.locator('.ant-picker-dropdown').filter({ hasNotText: '' })
}

/** 获取 AntD Modal 内容区 */
export function getModal(page: Page): Locator {
  return page.locator('.ant-modal-content')
}

/** 获取 AntD Drawer 内容区 */
export function getDrawer(page: Page): Locator {
  return page.locator('.ant-drawer-content-wrapper')
}

/** 获取包含指定标签的 Form.Item 容器 */
export function getFormItem(page: Page, label: string): Locator {
  return page.locator('.ant-form-item').filter({ has: page.getByText(label, { exact: true }) })
}

/** 断言 Form.Item 处于错误状态 */
export async function expectFormItemError(page: Page, label: string, errorText?: string): Promise<void> {
  const item = getFormItem(page, label)
  await item.waitFor({ state: 'visible' })
  // AntD 4.x 错误 class
  const hasError = await item.evaluate(el => el.classList.contains('ant-form-item-has-error'))
  if (!hasError) throw new Error(`Form item "${label}" is not in error state`)
  if (errorText) {
    const msg = item.locator('.ant-form-item-explain-error')
    const text = await msg.first().textContent()
    if (!text?.includes(errorText)) {
      throw new Error(`Form item "${label}" error text "${text}" does not include "${errorText}"`)
    }
  }
}

/** 断言 Form.Item 不处于错误状态 */
export async function expectFormItemValid(page: Page, label: string): Promise<void> {
  const item = getFormItem(page, label)
  await item.waitFor({ state: 'visible' })
  const hasError = await item.evaluate(el => el.classList.contains('ant-form-item-has-error'))
  if (hasError) throw new Error(`Form item "${label}" is unexpectedly in error state`)
}
