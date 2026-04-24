/**
 * 批量给所有测试账号创建 mail.tm 一次性邮箱 + 绑定数据库 + 写 test/.env.test。
 *
 * <p>目标账号列表与 test/tools/fixtures/auth.ts CREDENTIALS 对齐：
 * ceo / hr / finance / pm / employee / worker / dept_manager / sys_admin。
 *
 * <p>绑定走 H5 → backend API：先 CEO 登录拿 token，再 PUT /api/employees/{id} email=xxx。
 *
 * <p>运行：`npx tsx test/tools/mail-ops/provision_all_accounts.ts`
 *
 * <p>**仅测试/开发环境工具**，与业务代码完全解耦。
 */
import { randomBytes } from 'crypto'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

const API = 'https://api.mail.tm'
const BACKEND = process.env.E2E_API_URL ?? 'http://localhost:8080/api'

interface Account {
  role: string
  envKey: string
  employeeNo: string
}

const ACCOUNTS: Account[] = [
  { role: 'ceo', envKey: 'TEST_EMAIL_CEO', employeeNo: 'ceo.demo' },
  { role: 'hr', envKey: 'TEST_EMAIL_HR', employeeNo: 'hr.demo' },
  { role: 'finance', envKey: 'TEST_EMAIL_FINANCE', employeeNo: 'finance.demo' },
  { role: 'pm', envKey: 'TEST_EMAIL_PM', employeeNo: 'pm.demo' },
  { role: 'employee', envKey: 'TEST_EMAIL_EMPLOYEE', employeeNo: 'employee.demo' },
  { role: 'worker', envKey: 'TEST_EMAIL_WORKER', employeeNo: 'worker.demo' },
  { role: 'dept_manager', envKey: 'TEST_EMAIL_DEPT_MANAGER', employeeNo: 'dept_manager.demo' },
  { role: 'sys_admin', envKey: 'TEST_EMAIL_SYS_ADMIN', employeeNo: 'sys_admin.demo' },
]

async function getMailDomain(): Promise<string> {
  const resp = await fetch(`${API}/domains`)
  if (!resp.ok) throw new Error(`mail.tm domains ${resp.status}`)
  const json = (await resp.json()) as { 'hydra:member': Array<{ domain: string }> }
  const d = json['hydra:member']?.[0]?.domain
  if (!d) throw new Error('no mail.tm domain available')
  return d
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** mail.tm 有 QPS 限制（~1 req/sec）。429 时指数退避重试。 */
async function createMailAccount(
  domain: string,
  role: string,
): Promise<{ address: string; password: string }> {
  const local = `oa-${role.replace(/_/g, '-')}-${randomBytes(4).toString('hex')}`
  const address = `${local}@${domain}`
  const password = randomBytes(12).toString('base64url')
  for (let attempt = 1; attempt <= 6; attempt++) {
    const resp = await fetch(`${API}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    })
    if (resp.ok) return { address, password }
    if (resp.status === 429) {
      const waitMs = 2000 * attempt
      console.log(`  429 rate-limited, waiting ${waitMs}ms before retry #${attempt + 1}`)
      await sleep(waitMs)
      continue
    }
    throw new Error(`create ${address}: ${resp.status} ${await resp.text()}`)
  }
  throw new Error(`create ${address}: 6 attempts exhausted`)
}

async function ceoLogin(): Promise<string> {
  const resp = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ceo.demo', password: '123456' }),
  })
  if (!resp.ok) throw new Error(`CEO login ${resp.status}`)
  const body = (await resp.json()) as { token: string }
  return body.token
}

interface EmployeeRow {
  id: number
  employeeNo: string
}
interface EmployeePage {
  content: EmployeeRow[]
  totalPages: number
}

let employeeIdCache: Map<string, number> | null = null

async function loadAllEmployeeIds(token: string): Promise<Map<string, number>> {
  if (employeeIdCache) return employeeIdCache
  const map = new Map<string, number>()
  let page = 1
  while (true) {
    const resp = await fetch(`${BACKEND}/employees?page=${page}&size=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!resp.ok) throw new Error(`list employees page=${page}: ${resp.status}`)
    const body = (await resp.json()) as EmployeePage
    for (const e of body.content) map.set(e.employeeNo, e.id)
    if (page >= body.totalPages) break
    page += 1
  }
  employeeIdCache = map
  return map
}

async function bindEmail(token: string, employeeNo: string, email: string): Promise<void> {
  const map = await loadAllEmployeeIds(token)
  const id = map.get(employeeNo)
  if (!id) throw new Error(`employee ${employeeNo} not found in DB`)
  const putResp = await fetch(`${BACKEND}/employees/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })
  if (!putResp.ok) {
    throw new Error(
      `bind email ${employeeNo} -> ${email}: ${putResp.status} ${await putResp.text()}`,
    )
  }
}

/** 解析现有 .env.test，返回已有的 envKey -> {address, password} 映射。 */
function parseExistingEnv(path: string): Map<string, { address: string; password: string }> {
  const map = new Map<string, { address: string; password: string }>()
  if (!existsSync(path)) return map
  const content = readFileSync(path, 'utf8')
  const emails = new Map<string, string>()
  const passwords = new Map<string, string>()
  for (const line of content.split('\n')) {
    const m = line.match(/^(TEST_EMAIL_[A-Z_]+)=(.+)$/)
    if (!m) continue
    const key = m[1]
    const value = m[2].trim()
    if (key.endsWith('_PASSWORD')) {
      passwords.set(key.replace('_PASSWORD', ''), value)
    } else {
      emails.set(key, value)
    }
  }
  for (const [key, address] of emails) {
    const password = passwords.get(key)
    if (address && password) map.set(key, { address, password })
  }
  return map
}

async function main() {
  const envPath = join(__dirname, '../../.env.test')
  const existing = parseExistingEnv(envPath)
  if (existing.size > 0) {
    console.log(`Found ${existing.size} existing accounts in .env.test, will skip those`)
  }

  const ceoToken = await ceoLogin()
  console.log('CEO logged in')

  const results: Array<Account & { address: string; password: string }> = []
  let domain = ''
  for (const acc of ACCOUNTS) {
    const cached = existing.get(acc.envKey)
    if (cached) {
      console.log(`\n[${acc.role}] reusing ${cached.address} (from .env.test)`)
      // 仍要保证数据库绑定正确
      await bindEmail(ceoToken, acc.employeeNo, cached.address)
      console.log(`  bound to ${acc.employeeNo}`)
      results.push({ ...acc, ...cached })
      continue
    }
    if (!domain) {
      domain = await getMailDomain()
      console.log('Using mail.tm domain:', domain)
    }
    console.log(`\n[${acc.role}] provisioning...`)
    const { address, password } = await createMailAccount(domain, acc.role)
    console.log(`  created ${address}`)
    await bindEmail(ceoToken, acc.employeeNo, address)
    console.log(`  bound to ${acc.employeeNo}`)
    results.push({ ...acc, address, password })
    // mail.tm 限流：每次创建间隔 5s 避免 429
    await sleep(5000)
  }

  // 写 test/.env.test — 覆盖所有 TEST_EMAIL* 行，保留其他（E2E_BASE_URL 等）
  const existingEnvContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const filtered = existingEnvContent
    .split('\n')
    .filter(
      (l) =>
        !/^TEST_EMAIL(_|=)/.test(l.trim()) && !/^MAIL_TM_PASSWORD(_|=)/.test(l.trim()),
    )
    .join('\n')
    .trimEnd()

  const newLines = ['# mail.tm disposable 账号 × 8，由 provision_all_accounts.ts 生成']
  for (const r of results) newLines.push(`${r.envKey}=${r.address}`)
  newLines.push('')
  newLines.push('# mail.tm 登录密码（用于网页访问 https://mail.tm 查收件箱）')
  for (const r of results) newLines.push(`${r.envKey}_PASSWORD=${r.password}`)
  // 默认 TEST_EMAIL 指向 employee（保留向后兼容）
  const emp = results.find((r) => r.role === 'employee')
  if (emp) {
    newLines.push('')
    newLines.push('# 默认 TEST_EMAIL 指向 employee.demo（向后兼容）')
    newLines.push(`TEST_EMAIL=${emp.address}`)
    newLines.push(`TEST_EMAIL_PASSWORD=${emp.password}`)
  }

  writeFileSync(envPath, filtered + '\n\n' + newLines.join('\n') + '\n', 'utf8')
  console.log(`\nWrote ${results.length} email mappings to ${envPath}`)
  console.log('\n全部账号：')
  for (const r of results) {
    console.log(`  ${r.employeeNo.padEnd(22)} ${r.address}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
