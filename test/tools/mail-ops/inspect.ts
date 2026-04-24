/**
 * 诊断脚本：列出 QQ 邮箱所有文件夹里匹配「OA系统」主题的邮件数量和示例。只读，不删。
 *
 * 运行：`npx tsx test/tools/mail-ops/inspect.ts`
 *
 * 注意：**仅测试/开发环境运维工具**，与业务代码完全解耦，不在项目构建链中被引用。
 */
import { ImapFlow } from 'imapflow'
import { config as loadEnv } from 'dotenv'
import { join } from 'path'

loadEnv({ path: join(__dirname, '../../.env.test') })

async function main() {
  const client = new ImapFlow({
    host: 'imap.qq.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.TEST_EMAIL ?? '',
      pass: process.env.TEST_EMAIL_IMAP_PASSWORD ?? '',
    },
    logger: false,
  })

  try {
    await client.connect()
    console.log('Connected as', process.env.TEST_EMAIL)

    const boxes = await client.list()
    console.log('\n== All folders ==')
    for (const b of boxes) console.log(`  ${b.path}  (flags: ${[...(b.flags ?? [])].join(',')})`)

    for (const b of boxes) {
      const lock = await client.getMailboxLock(b.path).catch(() => null)
      if (!lock) continue
      try {
        const status = await client.status(b.path, { messages: true })
        // 搜含 OA系统 的主题
        const uidsOa = (await client.search(
          { subject: 'OA系统' },
          { uid: true },
        )) as number[] | false
        const uidsBind = (await client.search(
          { subject: '【OA系统】邮箱绑定验证码' },
          { uid: true },
        )) as number[] | false
        const uidsPwd = (await client.search(
          { subject: '【OA系统】密码重置验证码' },
          { uid: true },
        )) as number[] | false
        const count = (arr: number[] | false) => (arr ? arr.length : 0)
        console.log(
          `\n[${b.path}] total=${status.messages} | subject:OA系统=${count(uidsOa)} | bind=${count(uidsBind)} | pwd=${count(uidsPwd)}`,
        )
        // 示例 5 条
        if (uidsOa && uidsOa.length > 0) {
          const sample = uidsOa.slice(-5)
          for await (const msg of client.fetch(
            sample,
            { envelope: true, flags: true },
            { uid: true },
          )) {
            console.log(
              `  uid=${msg.uid} flags=${[...(msg.flags ?? [])].join(',')} subject=${msg.envelope?.subject} date=${msg.envelope?.date}`,
            )
          }
        }
      } finally {
        lock.release()
      }
    }
  } finally {
    client.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
