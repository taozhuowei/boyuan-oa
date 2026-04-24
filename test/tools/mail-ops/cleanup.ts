/**
 * 清理 QQ 邮箱里 OA 系统发出的所有验证码邮件（INBOX + Junk + Deleted Messages）。
 *
 * <p>关键点：QQ Mail IMAP **不广播 UIDPLUS capability**，`UID EXPUNGE` 不可用；
 * `messageDelete` 仅标 \Deleted 不真正物理删除。但 QQ 支持 IMAP RFC 3501 §6.4.2
 * 的 CLOSE 命令（隐式 EXPUNGE 所有 \Deleted 标记的邮件）。ImapFlow 通过
 * `mailboxClose()` 发 CLOSE —— 这是 QQ 上唯一真删除的方法。
 *
 * <p>策略：
 *
 * <ol>
 *   <li>INBOX / Junk：MOVE 所有 OA 邮件到 Deleted Messages
 *   <li>Deleted Messages：select + STORE \Deleted + mailboxClose() → 触发 EXPUNGE
 * </ol>
 *
 * <p>运行：`npx tsx test/tools/mail-ops/cleanup.ts`
 *
 * <p>注意：**仅测试/开发环境运维工具**。不在项目构建链中被引用，不影响 prod 打包；
 * 路径隔离在 `test/tools/mail-ops/` 下，与业务代码解耦。
 */
import { ImapFlow } from 'imapflow'
import { config as loadEnv } from 'dotenv'
import { join } from 'path'

loadEnv({ path: join(__dirname, '../../.env.test') })

const TRASH = 'Deleted Messages'

async function moveToTrash(client: ImapFlow, folder: string): Promise<number> {
  const lock = await client.getMailboxLock(folder)
  try {
    const uids = (await client.search({ subject: 'OA系统' }, { uid: true })) as
      | number[]
      | false
    if (!uids || uids.length === 0) return 0
    await client.messageMove(uids, TRASH, { uid: true })
    console.log(`[${folder}] moved ${uids.length} OA emails → ${TRASH}`)
    return uids.length
  } finally {
    lock.release()
  }
}

/**
 * 清空 TRASH：select + STORE all \Deleted + mailboxClose() 触发 CLOSE→EXPUNGE。
 * 只清匹配 OA 主题的邮件，避免误删用户其他已删除邮件。
 */
async function purgeOaFromTrash(client: ImapFlow): Promise<number> {
  await client.mailboxOpen(TRASH)
  try {
    const uids = (await client.search({ subject: 'OA系统' }, { uid: true })) as
      | number[]
      | false
    if (!uids || uids.length === 0) {
      console.log(`[${TRASH}] 0 OA emails to purge`)
      return 0
    }
    await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true })
    console.log(`[${TRASH}] flagged ${uids.length} as \\Deleted`)
    // CLOSE 命令隐式 EXPUNGE 所有 \Deleted 标记项（RFC 3501 §6.4.2）
    await client.mailboxClose()
    console.log(`[${TRASH}] EXPUNGE triggered via CLOSE`)
    return uids.length
  } catch (e) {
    // mailboxClose 本身若失败也要释放
    try {
      await client.mailboxClose()
    } catch {}
    throw e
  }
}

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
    const movedInbox = await moveToTrash(client, 'INBOX')
    const movedJunk = await moveToTrash(client, 'Junk')
    const purged = await purgeOaFromTrash(client)
    console.log(
      `\nDone: moved INBOX=${movedInbox}, Junk=${movedJunk}; physically purged Trash=${purged}`,
    )
  } finally {
    await client.logout().catch(() => client.close())
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
