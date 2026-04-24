/**
 * 一次性脚本：清理 QQ 邮箱里 OA 系统发出的所有验证码邮件。
 *
 * <p>背景：dev 环境下 SMTP 偶尔能绕过 QQ Mail 限流发成功，导致用户邮箱堆积
 * 历史验证码邮件，与 Caffeine 缓存的最新码不一致造成混淆。
 *
 * <p>使用 test/.env.test 中的 IMAP 凭证登录 876593497@qq.com，搜索主题匹配
 * `【OA系统】*验证码` 的全部邮件（INBOX + 已删除 + 垃圾），标记已读 + Expunge
 * 物理删除。
 *
 * <p>运行：`npx tsx test/tools/helpers/cleanup_qq_mail.ts`
 */
import { ImapFlow } from 'imapflow'
import { config as loadEnv } from 'dotenv'
import { join } from 'path'

loadEnv({ path: join(__dirname, '../../.env.test') })

const HOST = 'imap.qq.com'
const PORT = 993

async function cleanFolder(client: ImapFlow, folder: string): Promise<number> {
  const lock = await client.getMailboxLock(folder)
  try {
    // 匹配 OA 系统发出的两种验证码主题
    const searchOr = [
      { subject: '【OA系统】邮箱绑定验证码' },
      { subject: '【OA系统】密码重置验证码' },
    ]
    let total = 0
    for (const criteria of searchOr) {
      const uids = (await client.search(criteria, { uid: true })) as number[] | false
      if (!uids || uids.length === 0) continue
      total += uids.length
      await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true })
      console.log(`[${folder}] marked ${uids.length} emails with subject="${criteria.subject}" as Deleted`)
    }
    if (total > 0) {
      // Expunge 物理清除（QQ Mail 支持）
      try {
        await client.messageDelete({ all: true, deleted: true })
      } catch (e) {
        console.warn(`[${folder}] expunge failed, emails may just be flagged: ${(e as Error).message}`)
      }
    }
    return total
  } finally {
    lock.release()
  }
}

async function main() {
  const client = new ImapFlow({
    host: HOST,
    port: PORT,
    secure: true,
    auth: {
      user: process.env.TEST_EMAIL ?? '',
      pass: process.env.TEST_EMAIL_IMAP_PASSWORD ?? '',
    },
    logger: false,
  })

  try {
    await client.connect()
    console.log('Connected to', HOST)

    // 列出所有文件夹，挑 INBOX / Trash / Junk 三处清理
    const boxes = await client.list()
    const targets: string[] = []
    for (const b of boxes) {
      const path = b.path
      const lower = path.toLowerCase()
      if (
        lower === 'inbox' ||
        lower.includes('trash') ||
        lower.includes('deleted') ||
        lower.includes('junk') ||
        lower.includes('spam') ||
        path.includes('已删除') ||
        path.includes('垃圾')
      ) {
        targets.push(path)
      }
    }
    console.log('Cleaning folders:', targets)

    let total = 0
    for (const folder of targets) {
      try {
        total += await cleanFolder(client, folder)
      } catch (e) {
        console.warn(`skip ${folder}: ${(e as Error).message}`)
      }
    }
    console.log(`Total cleaned: ${total} emails`)
  } finally {
    client.close()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
