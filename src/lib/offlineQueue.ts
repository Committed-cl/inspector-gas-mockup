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
}

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
  if (op) await updateOp({ ...op, state: 'pending', error: undefined })
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

export type SyncResult = { sent: number; stopped: boolean; lastByVisit: Record<string, unknown> }

// Sends the user's pending ops one at a time, in order. A network error or 5xx stops the
// run (retry later, order kept). A 4xx is definitive: the op is marked failed
// and kept — never dropped — and the run continues with the next one.
export async function processQueue(userId: string, send: (req: ReturnType<typeof opRequest>) => Promise<unknown>): Promise<SyncResult> {
  const result: SyncResult = { sent: 0, stopped: false, lastByVisit: {} }
  for (const op of await listOps(userId)) {
    if (op.state !== 'pending') continue
    try {
      const res = await send(opRequest(op))
      await removeOp(op.seq!, userId)
      result.sent++
      result.lastByVisit[`${op.projectId}::${op.visitId}`] = res
    } catch (err) {
      if (err instanceof ApiError && err.status >= 400 && err.status < 500) {
        await updateOp({ ...op, state: 'failed', error: err.message })
        continue
      }
      result.stopped = true
      break
    }
  }
  return result
}
