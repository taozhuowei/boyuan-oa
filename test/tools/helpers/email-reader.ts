/**
 * Verification code helpers for E2E tests.
 *
 * Two strategies are available:
 *   1. `getVerificationCodeFromDev` (primary): calls GET /dev/verification-code — reads directly
 *      from the in-process Caffeine cache. Instant, no network dependency. Requires dev profile.
 *   2. `readVerificationCode` (fallback): polls imap.qq.com:993 for the email. Slow due to QQ Mail
 *      delivery delays (3-30+ min under rate-limiting). Kept for reference only.
 *
 * Credentials for IMAP: loaded from test/.env.test (gitignored).
 */
import { ImapFlow } from 'imapflow'
import { config as loadEnv } from 'dotenv'
import { join } from 'path'

loadEnv({ path: join(__dirname, '../../.env.test') })

const DEV_API_URL = process.env.E2E_API_URL ?? 'http://localhost:8080/api'

/**
 * Fetches a live verification code from the backend's in-memory cache via the dev-only API.
 *
 * This is the preferred strategy for E2E tests: it bypasses SMTP delivery delays entirely.
 * The code is the same one emailed to the user — it is read from the Caffeine cache before
 * it expires (5-minute TTL).
 *
 * @param type 'bind' for email-bind flow, 'pwd' for password-reset flow
 * @param email the target email address that was passed to send-bind-code or send-reset-code
 * @returns the 6-digit code
 * @throws if the dev endpoint returns 404 (code not found or expired)
 */
export async function getVerificationCodeFromDev(type: 'bind' | 'pwd', email: string): Promise<string> {
  const url = `${DEV_API_URL}/dev/verification-code?type=${encodeURIComponent(type)}&email=${encodeURIComponent(email)}`
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(
      `[email-reader] Dev API returned ${resp.status} for type=${type} email=${email}. ` +
      'Ensure the backend is running with dev profile and the code was generated.'
    )
  }
  const body = await resp.json() as { code: string }
  if (!body.code || !/^\d{6}$/.test(body.code)) {
    throw new Error(`[email-reader] Dev API returned invalid code: ${JSON.stringify(body)}`)
  }
  return body.code
}

const IMAP_HOST = 'imap.qq.com'
const IMAP_PORT = 993

function buildClient(): ImapFlow {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: {
      user: process.env.TEST_EMAIL ?? '',
      pass: process.env.TEST_EMAIL_IMAP_PASSWORD ?? '',
    },
    logger: false,
    // Fail fast if TCP handshake + TLS + AUTHENTICATE takes over 15s
    connectionTimeout: 15_000,
  })
}

/**
 * Polls the IMAP inbox for a 6-digit verification code sent after `afterTime`.
 *
 * Retries every `pollIntervalMs` (default 4s) until `timeoutMs` (default 30s) elapses.
 * Marks the matching email as Seen after extraction.
 *
 * @returns the 6-digit code as a string
 * @throws if no code is found within the timeout
 */
export async function readVerificationCode(opts?: {
  /** Only consider emails received at or after this time. Defaults to 90 seconds ago. */
  afterTime?: Date
  /** Total wait time in ms before throwing. Defaults to 30_000. */
  timeoutMs?: number
  /** Interval between IMAP polls in ms. Defaults to 4_000. */
  pollIntervalMs?: number
}): Promise<string> {
  const {
    afterTime = new Date(Date.now() - 90_000),
    timeoutMs = 30_000,
    pollIntervalMs = 4_000,
  } = opts ?? {}

  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    // Each poll opens a fresh connection so QQ Mail always returns the current
    // mailbox state (persistent connections may not receive EXISTS updates).
    // Force-close (client.close()) avoids the blocking LOGOUT round-trip.
    const code = await Promise.race([
      tryFetchCode(afterTime).catch(() => null as null),
      sleep(15_000).then(() => null as null),
    ])
    if (code !== null) return code
    const remaining = deadline - Date.now()
    if (remaining > 0) await sleep(Math.min(pollIntervalMs, remaining))
  }

  throw new Error(
    `[email-reader] Verification code not received within ${timeoutMs}ms. ` +
    `Check that SMTP is configured and ${process.env.TEST_EMAIL} is the recipient.`
  )
}

/** Max number of most-recent unread emails to inspect per poll cycle. */
const MAX_FETCH_PER_POLL = 10

async function tryFetchCode(after: Date): Promise<string | null> {
  const client = buildClient()
  try {
    await client.connect()
    // getMailboxLock acquires a client-level mutex and SELECT-s the INBOX.
    // We skip lock.release() (which sends CLOSE and can hang) and rely on
    // client.close() in the outer finally to terminate the connection.
    await client.getMailboxLock('INBOX')

    const allUids = await client.search({ seen: false, since: after }, { uid: true })
    if (!allUids || (allUids as number[]).length === 0) return null

    // Take only the most recent UIDs — avoids scanning hundreds of old unread
    // emails in a cluttered inbox.
    const uids = (allUids as number[]).slice(-MAX_FETCH_PER_POLL)

    for await (const msg of client.fetch(
      uids,
      { source: true, internalDate: true },
      { uid: true },
    )) {
      if (!msg.source) continue
      // Filter by received timestamp with a 30-second clock-skew buffer.
      // IMAP `since` is date-only, so old same-day emails would otherwise interfere.
      // The buffer absorbs clock drift between the local machine and QQ Mail's IMAP server.
      const cutoff = new Date(after.getTime() - 30_000)
      if (msg.internalDate && msg.internalDate < cutoff) continue
      const raw = msg.source.toString('utf8')
      const code = extractVerificationCode(raw)
      if (code !== null) {
        await client.messageFlagsAdd(String(msg.uid), ['\\Seen'], { uid: true })
        return code
      }
    }
    return null
  } finally {
    // Force-close: skips LOGOUT/CLOSE round-trip that can hang on slow servers.
    client.close()
  }
}

/**
 * Extracts a 6-digit verification code from a raw MIME email.
 *
 * Handles both plain-text and base64-encoded body parts (Content-Transfer-Encoding: base64),
 * which QQ Mail uses for UTF-8 encoded messages.
 */
function extractVerificationCode(rawEmail: string): string | null {
  // Fast path: body is unencoded (quoted-printable or plain ASCII)
  const direct = rawEmail.match(/\b(\d{6})\b/)
  if (direct) return direct[1]

  // Scan for base64-encoded MIME parts and decode each one
  const lines = rawEmail.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    if (/^content-transfer-encoding:\s*base64$/i.test(lines[i].trim())) {
      i++
      // Skip blank separator line(s) between headers and body
      while (i < lines.length && lines[i].trim() === '') i++
      // Collect lines that contain only base64 characters
      const base64Lines: string[] = []
      while (i < lines.length && /^[A-Za-z0-9+/=]+$/.test(lines[i].trim())) {
        base64Lines.push(lines[i].trim())
        i++
      }
      if (base64Lines.length > 0) {
        try {
          const decoded = Buffer.from(base64Lines.join(''), 'base64').toString('utf8')
          const match = decoded.match(/\b(\d{6})\b/)
          if (match) return match[1]
        } catch {
          // Not valid base64 — skip
        }
      }
    } else {
      i++
    }
  }
  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
