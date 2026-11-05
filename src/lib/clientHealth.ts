// Client state that rides along on the existing /sync requests (no extra endpoint, no queue of
// its own, nothing in the UI). Counters and a short error summary only — never user content.
export type ClientError = { status: number | null; message: string }
export type ClientHealth = {
  online: boolean
  pendingCount: number
  oldestPendingAgeSec: number
  heldClosedCount: number
  lastError?: ClientError
}

const MAX_MESSAGE = 200
let lastError: ClientError | null = null

// Message only: no stack, no URLs with query strings, truncated.
const summarize = (m: string) => m.split('\n')[0].replace(/\?[^\s)]*/g, '').slice(0, MAX_MESSAGE)

export function recordClientError(status: number | null, message: string) {
  lastError = { status, message: summarize(message) }
}
export const peekClientError = (): ClientError | null => lastError
// Cleared only after a /sync carrying it got a response, so a failed attempt keeps it for the next one.
export function clearClientError(sent: ClientError | null) {
  if (sent && lastError === sent) lastError = null
}

export function buildClientHealth(ops: { state: string; reason?: string; queuedAt?: number }[], now: number): ClientHealth {
  const pending = ops.filter((o) => o.state === 'pending')
  const held = pending.filter((o) => o.reason === 'visit_closed')
  const active = pending.filter((o) => o.reason !== 'visit_closed')
  const oldest = Math.min(...active.map((o) => o.queuedAt ?? now))
  const err = lastError
  return {
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    pendingCount: pending.length,
    oldestPendingAgeSec: active.length > 0 ? Math.max(0, Math.floor((now - oldest) / 1000)) : 0,
    heldClosedCount: held.length,
    ...(err ? { lastError: err } : {}),
  }
}

// Uncaught JS errors are summarized and sent with the next /sync.
export function installGlobalErrorCapture(target: Pick<Window, 'addEventListener'> = window) {
  target.addEventListener('error', (e) => recordClientError(null, (e as ErrorEvent).message || 'Uncaught error'))
  target.addEventListener('unhandledrejection', (e) => {
    const r = (e as PromiseRejectionEvent).reason
    recordClientError(null, r instanceof Error ? r.message : typeof r === 'string' ? r : 'Unhandled rejection')
  })
}
