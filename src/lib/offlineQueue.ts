// Offline change queue persisted in IndexedDB (photos included, as data URLs).
// Only plain checklist edits are queued — AI chat, closing a visit and sending
// the report need a connection and are never stored here.
import { ApiError } from './api'

export type QueuedOpKind = 'mark' | 'evidence' | 'observations'

export type QueuedOp = {
  seq?: number // autoincrement key — defines the sync order
  userId: string // owner: only this user's session may sync, see or act on the op
  kind: QueuedOpKind
  projectId: string
  visitId: string
  itemId?: string
  body: Record<string, unknown>
  label: string // human description, shown if the change fails for good
  state: 'pending' | 'failed'
  error?: string
  reason?: 'visit_closed' // the op is held (still pending, never dropped) because its visit is closed
}

export const VISIT_CLOSED_MESSAGE = 'La visita está cerrada y no admite cambios'
const isVisitClosedMessage = (m: string) => /visit is closed|visita está cerrada/i.test(m)
// Held ops are not sent while the visit stays closed; they go out by themselves once it is reopened.
export const isHeldOp = (op: QueuedOp) => op.state === 'pending' && op.reason === 'visit_closed'
// Ops stored by an earlier version as "failed: visit closed" are held too (see processQueue).
const isLegacyClosedOp = (op: QueuedOp) => op.state === 'failed' && isVisitClosedMessage(op.error ?? '')

const DB_NAME = 'ig_offline_queue'
const STORE = 'ops'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'seq', autoIncrement: true })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const t = db.transaction(STORE, mode)
      const r = run(t.objectStore(STORE))
      t.oncomplete = () => resolve(r.result)
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error)
    })
  } finally {
    db.close()
  }
}

const listeners = new Set<() => void>()
export function subscribeQueue(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const notify = () => listeners.forEach((fn) => fn())

async function allOps(): Promise<QueuedOp[]> {
  const all = await tx('readonly', (s) => s.getAll() as IDBRequest<QueuedOp[]>)
  return all.sort((a, b) => a.seq! - b.seq!)
}

// Only the given user's ops. Other users' ops stay untouched in the store
// until that user signs in again.
export async function listOps(userId: string): Promise<QueuedOp[]> {
  return (await allOps()).filter((o) => o.userId === userId)
}

// Wipes the whole store (all users). For tests only.
export async function clearQueue(): Promise<void> {
  await tx('readwrite', (s) => s.clear())
  notify()
}

export async function enqueueOp(op: Omit<QueuedOp, 'seq' | 'state'>): Promise<void> {
  // The editor autosaves the whole observations HTML: only the latest matters.
  if (op.kind === 'observations') {
    const stale = (await listOps(op.userId)).filter((o) => o.kind === 'observations' && o.visitId === op.visitId && o.state === 'pending')
    for (const o of stale) await tx('readwrite', (s) => s.delete(o.seq!))
  }
  // Only the latest mark of an item matters: replace a pending one for the same item and visit.
  if (op.kind === 'mark') {
    const stale = (await listOps(op.userId)).filter(
      (o) => o.kind === 'mark' && o.visitId === op.visitId && o.projectId === op.projectId && o.itemId === op.itemId && o.state === 'pending',
    )
    for (const o of stale) await tx('readwrite', (s) => s.delete(o.seq!))
  }
  await tx('readwrite', (s) => s.add({ ...op, state: 'pending' }))
  notify()
}

export async function removeOp(seq: number, userId: string): Promise<void> {
  const op = (await listOps(userId)).find((o) => o.seq === seq)
  if (!op) return
  await tx('readwrite', (s) => s.delete(seq))
  notify()
}

async function updateOp(op: QueuedOp): Promise<void> {
  await tx('readwrite', (s) => s.put(op))
  notify()
}

export async function retryOp(seq: number, userId: string): Promise<void> {
  const op = (await listOps(userId)).find((o) => o.seq === seq)
  if (op) await updateOp({ ...op, state: 'pending', error: undefined, reason: undefined })
}

// The visit is open again: its held ops become regular pending ops. Returns how many were released.
export async function releaseVisit(visitId: string, userId: string): Promise<number> {
  const held = (await listOps(userId)).filter((o) => o.visitId === visitId && (isHeldOp(o) || isLegacyClosedOp(o)))
  for (const o of held) await updateOp({ ...o, state: 'pending', error: undefined, reason: undefined })
  return held.length
}

export function opRequest(op: QueuedOp): { method: 'POST' | 'PUT'; path: string; body: Record<string, unknown> } {
  const base = `/projects/${op.projectId}/visits/${op.visitId}`
  switch (op.kind) {
    case 'mark':
      return { method: 'POST', path: `${base}/items/${op.itemId}/mark`, body: op.body }
    case 'evidence':
      return { method: 'POST', path: `${base}/items/${op.itemId}/evidence`, body: op.body }
    case 'observations':
      return { method: 'PUT', path: `${base}/observations`, body: op.body }
  }
}

// A fetch that never reached the server (offline, DNS, dropped connection).
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError
}

export type SyncBlock = { status: number | null; message: string; auth: boolean }
export type SyncResult = {
  sent: number
  stopped: boolean
  // Why the run stopped (null when it ran to the end). `auth`: 401, the session must be renewed.
  blocked: SyncBlock | null
  // Last server response per visit, from non-mark ops only: a mark response never repaints the UI
  // (the local state is the source of truth; a sent mark is just removed from the queue).
  lastByVisit: Record<string, unknown>
}

// 401 pauses the queue until a new login; network errors, 408/425/429 and 5xx are transient;
// any other 4xx (400/403/404/409/422...) is a real rejection of that one operation.
export function classifyError(err: unknown): 'auth' | 'retry' | 'fail' {
  if (!(err instanceof ApiError)) return 'retry'
  if (err.status === 401) return 'auth'
  if (err.status === 408 || err.status === 425 || err.status === 429 || err.status >= 500) return 'retry'
  return err.status >= 400 && err.status < 500 ? 'fail' : 'retry'
}

const closedVisit = (err: unknown) => err instanceof ApiError && err.status === 409 && isVisitClosedMessage(err.message)
const describe = (err: unknown) =>
  closedVisit(err) ? VISIT_CLOSED_MESSAGE : err instanceof ApiError ? `${err.status}: ${err.message}` : 'Sin conexión con el servidor'

// Sends the user's pending ops one at a time, in order. A network error, 401, 408/425/429 or
// 5xx stops the run: the op stays pending (with the reason) and order is kept. A rejection because
// the visit is closed holds that op (and the rest of its visit, to keep order) as pending until the
// visit is reopened. Any other 4xx is definitive for that op only: it is marked failed and kept —
// never dropped — and the run goes on.
export async function processQueue(userId: string, send: (req: ReturnType<typeof opRequest>) => Promise<unknown>): Promise<SyncResult> {
  const result: SyncResult = { sent: 0, stopped: false, blocked: null, lastByVisit: {} }
  for (const op of await listOps(userId)) if (isLegacyClosedOp(op)) await updateOp({ ...op, state: 'pending', error: VISIT_CLOSED_MESSAGE, reason: 'visit_closed' })
  const held = new Set<string>()
  for (const op of await listOps(userId)) {
    if (op.state !== 'pending') continue
    if (isHeldOp(op)) { held.add(op.visitId); continue }
    if (held.has(op.visitId)) continue
    try {
      const res = await send(opRequest(op))
      await removeOp(op.seq!, userId)
      result.sent++
      if (op.kind !== 'mark') result.lastByVisit[`${op.projectId}::${op.visitId}`] = res
    } catch (err) {
      if (closedVisit(err)) {
        // Hold this op and every later pending op of the visit (order is kept; none is dropped).
        held.add(op.visitId)
        for (const o of await listOps(userId)) {
          if (o.visitId === op.visitId && o.state === 'pending' && !isHeldOp(o)) await updateOp({ ...o, error: VISIT_CLOSED_MESSAGE, reason: 'visit_closed' })
        }
        continue
      }
      const kind = classifyError(err)
      if (kind === 'fail') {
        await updateOp({ ...op, state: 'failed', error: describe(err) })
        continue
      }
      await updateOp({ ...op, error: describe(err) })
      result.stopped = true
      result.blocked = { status: err instanceof ApiError ? err.status : null, message: describe(err), auth: kind === 'auth' }
      break
    }
  }
  return result
}
