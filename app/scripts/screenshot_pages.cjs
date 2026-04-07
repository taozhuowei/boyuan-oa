/**
 * screenshot_pages.cjs
 * 用途：对 OA H5 各业务页面截图，验证重构效果
 * 登录后通过 uni.navigateTo 在 SPA 内部跳转，避免页面刷新清空 Pinia 状态
 */
const puppeteer = require('puppeteer')
const os = require('os')
const path = require('path')

const BASE = 'http://localhost:4173'
const OUT = '/tmp'

const PAGES = [
  { name: 'workbench',  path: '/pages/index/index' },
  { name: 'attendance', path: '/pages/attendance/index' },
  { name: 'payroll',    path: '/pages/payroll/index' },
  { name: 'projects',   path: '/pages/projects/index' },
  { name: 'employees',  path: '/pages/employees/index' },
  { name: 'role',       path: '/pages/role/index' },
  { name: 'todo',       path: '/pages/todo/index' },
  { name: 'config',     path: '/pages/config/index' },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

;(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    userDataDir: path.join(os.tmpdir(), 'puppeteer_oa_' + Date.now()),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })

  // 1. 打开登录页
  await page.goto(BASE + '/pages/login/index', { waitUntil: 'networkidle0', timeout: 12000 })
  await sleep(800)
  await page.screenshot({ path: path.join(OUT, 'oa_login.png') })
  console.log('✓ login')

  // 2. 注入账号密码并触发 Vue 响应式更新
  await page.evaluate(() => {
    const inputs = document.querySelectorAll('input')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    function fire(el, val) {
      setter.call(el, val)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    if (inputs[0]) fire(inputs[0], 'ceo.demo')
    if (inputs[1]) fire(inputs[1], '123456')
  })
  await sleep(400)

  // 3. 点击登录按钮（uni-app view 编译成 div）
  await page.evaluate(() => {
    const btn = document.querySelector('.login-btn')
    if (btn) btn.click()
  })
  await sleep(3000)
  console.log('after login url:', page.url())

  // 4. 登录后用 uni.navigateTo 在 SPA 内跳转，不触发整页刷新
  for (const p of PAGES) {
    await page.evaluate((routePath) => {
      // eslint-disable-next-line no-undef
      uni.navigateTo({ url: routePath })
    }, p.path)
    await sleep(1500)
    await page.screenshot({ path: path.join(OUT, 'oa_' + p.name + '.png') })
    console.log('✓', p.name, '—', page.url())

    // 回到工作台再跳下一个（navigateBack 保证栈不溢出）
    if (p.name !== PAGES[PAGES.length - 1].name) {
      await page.evaluate(() => { uni.navigateBack({ delta: 1 }) })
      await sleep(600)
    }
  }

  await browser.close()
  console.log('\n所有截图已保存到 /tmp/oa_*.png')
})()
