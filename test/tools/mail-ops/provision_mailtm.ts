/**
 * 在 mail.tm（免费一次性邮箱服务）创建一个账号，输出 address / password。
 *
 * <p>用途：用户想实际测试 SMTP 发信链路时（非 dev profile），可用此账号替换测试邮箱。
 * 账号通过官方 HTTP API 创建，不需要验证码/captcha。
 *
 * <p>生成后把地址写入 test/.env.test 的 TEST_EMAIL 字段，登录 https://mail.tm
 * 可在网页端查看收件箱。
 *
 * <p>运行：`npx tsx test/tools/mail-ops/provision_mailtm.ts`
 *
 * <p>**仅测试/开发环境工具**，与业务代码解耦。
 */
import { randomBytes } from 'crypto'

const API = 'https://api.mail.tm'

async function main() {
  // 1. 拉可用域名列表
  const domainsResp = await fetch(`${API}/domains`)
  if (!domainsResp.ok) throw new Error(`domains list failed: ${domainsResp.status}`)
  const domainsJson = (await domainsResp.json()) as {
    'hydra:member': Array<{ domain: string }>
  }
  const domain = domainsJson['hydra:member']?.[0]?.domain
  if (!domain) throw new Error('no available mail.tm domain')
  console.log('Using domain:', domain)

  // 2. 生成随机地址 / 密码
  const local = 'oa-test-' + randomBytes(6).toString('hex')
  const address = `${local}@${domain}`
  const password = randomBytes(12).toString('base64url')

  // 3. 注册
  const createResp = await fetch(`${API}/accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  })
  if (!createResp.ok) {
    throw new Error(`create account failed: ${createResp.status} ${await createResp.text()}`)
  }

  // 4. 取 token（验证能登录）
  const tokenResp = await fetch(`${API}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  })
  if (!tokenResp.ok) {
    throw new Error(`token fetch failed: ${tokenResp.status}`)
  }
  const tokenJson = (await tokenResp.json()) as { token: string }

  console.log('\n=== mail.tm 账号创建成功 ===')
  console.log(`TEST_EMAIL=${address}`)
  console.log(`TEST_EMAIL_PASSWORD=${password}`)
  console.log(`MAIL_TM_TOKEN=${tokenJson.token.slice(0, 40)}...`)
  console.log('\n网页访问：https://mail.tm （用上面 email + password 登录）')
  console.log('HTTP API：GET https://api.mail.tm/messages?page=1 （Authorization: Bearer ...）')
  console.log('\n请手动把 TEST_EMAIL / TEST_EMAIL_PASSWORD 写入 test/.env.test，')
  console.log('并在数据库里把 employee.demo.email 改为新地址（通过 DevToolbar "恢复 employee.demo 首次登录" 后在 /setup-account 重新绑定即可）')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
