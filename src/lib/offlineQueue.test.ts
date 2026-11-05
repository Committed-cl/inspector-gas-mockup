import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { clearClientError, peekClientError, recordClientError } from './clientHealth'
import { clearQueue, enqueueOp, isHeldOp, releaseVisit, listOps, MAX_BATCH_OPS, processQueue, removeOp, retryOp, VISIT_CLOSED_MESSAGE, type BatchRequest, type BatchResponse, type QueuedOp } from './offlineQueue'

const U = 'userA'
const base = { userId: U, projectId: 'p1', visitId: 'v1', label: 'x' }
const ev = (clientId: string, itemId = 'i1', visitId = 'v1'): Omit<QueuedOp, 'seq' | 'state'> => ({
  ...base, visitId, kind: 'evidence', itemId, body: { requirementIndex: 0, type: 'photo', text: clientId, previewUrl: 'data:image/jpeg;base64,xyz', clientId },
})
const mark = (itemId: string, status = 'na') => enqueueOp({ ...base, kind: 'mark', itemId, body: { status } })
const tag = (o: { kind: string; itemId?: string; body: Record<string, unknown> }) => (o.kind === 'mark' ? `mark:${o.itemId}:${o.body.status}` : `${o.kind}:${o.body.clientId ?? o.body.observations}`)
const okAll = (r: BatchRequest): BatchResponse => ({ results: r.body.ops.map((o) => ({ opId: o.opId, status: 'ok' as const })) })
// Records each request (one entry per request, the ops it carried) and answers via `answer`.
function recorder(answer: (r: BatchRequest, n: number) => BatchResponse | Promise<BatchResponse> = okAll) {
  const requests: string[][] = []
  const paths: string[] = []
  const send = async (r: BatchRequest) => {
    requests.push(r.body.ops.map(tag))
    paths.push(r.path)
    return answer(r, requests.length)
  }
  return { send, requests, paths }
}
const closed = (r: BatchRequest): BatchResponse => ({ results: r.body.ops.map((o) => ({ opId: o.opId, status: 'rejected' as const, code: 'visit_closed', error: VISIT_CLOSED_MESSAGE })) })

beforeEach(async () => {
  await clearQueue()
})

describe('offline queue (batched sync)', () => {
  it('replaces a pending mark of the same item and keeps marks of other items', async () => {
    await mark('i1', 'ok')
    await mark('i2', 'na')
    for (const st of ['warn', 'ok', 'warn', 'na']) await mark('i1', st)
    expect((await listOps(U)).map((o) => `${o.itemId}:${o.body.status}`)).toEqual(['i2:na', 'i1:na'])
  })

  it('gives every op an opId and persists photos', async () => {
    await enqueueOp(ev('a'))
    await mark('i1')
    const ops = await listOps(U)
    expect(ops[0].body.previewUrl).toBe('data:image/jpeg;base64,xyz')
    expect(ops.every((o) => typeof o.opId === 'string' && o.opId.length > 0)).toBe(true)
    expect(new Set(ops.map((o) => o.opId)).size).toBe(2)
  })

  it('sends everything pending of a visit in ONE request, in enqueue order', async () => {
    await enqueueOp(ev('a'))
    await mark('i1', 'ok')
    await enqueueOp(ev('b'))
    const { send, requests, paths } = recorder()
    const res = await processQueue(U, send)
    expect(requests).toEqual([['evidence:a', 'mark:i1:ok', 'evidence:b']])
    expect(paths).toEqual(['/projects/p1/visits/v1/sync'])
    expect(res.sent).toBe(3)
    expect(await listOps(U)).toHaveLength(0)
  })

  it('burst of 31 marks → a single request; with more than 100 ops it splits in order', async () => {
    for (let i = 0; i < 31; i++) await mark(`i${i}`)
    const first = recorder()
    await processQueue(U, first.send)
    expect(first.requests).toHaveLength(1)
    expect(first.requests[0]).toHaveLength(31)
    for (let i = 0; i < MAX_BATCH_OPS + 5; i++) await mark(`j${i}`)
    const second = recorder()
    await processQueue(U, second.send)
    expect(second.requests.map((r) => r.length)).toEqual([MAX_BATCH_OPS, 5])
    expect(second.requests.flat()[0]).toBe('mark:j0:na')
  })

  it('splits heavy (photo) bodies by size and keeps order', async () => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(1_400_000)
    for (const id of ['a', 'b', 'c']) await enqueueOp({ ...ev(id), body: { ...ev(id).body, previewUrl: big } })
    const { send, requests } = recorder()
    await processQueue(U, send)
    expect(requests).toEqual([['evidence:a', 'evidence:b'], ['evidence:c']])
  })

  it('one request per visit', async () => {
    await enqueueOp(ev('a', 'i1', 'v1'))
    await enqueueOp(ev('b', 'i1', 'v2'))
    await enqueueOp(ev('c', 'i1', 'v1'))
    const { send, requests, paths } = recorder()
    await processQueue(U, send)
    expect(requests).toEqual([['evidence:a', 'evidence:c'], ['evidence:b']])
    expect(paths).toEqual(['/projects/p1/visits/v1/sync', '/projects/p1/visits/v2/sync'])
  })

  it('a network error keeps the whole batch pending, in order; the retry resends the same opIds', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const before = (await listOps(U)).map((o) => o.opId)
    let calls = 0
    const res = await processQueue(U, async () => { calls++; throw new TypeError('Failed to fetch') })
    expect(res.stopped).toBe(true)
    expect(calls).toBe(1)
    expect((await listOps(U)).map((o) => [o.body.clientId, o.state])).toEqual([['a', 'pending'], ['b', 'pending']])
    const sentIds: unknown[] = []
    await processQueue(U, async (r) => { sentIds.push(...r.body.ops.map((o) => o.opId)); return okAll(r) })
    expect(sentIds).toEqual(before)
    expect(await listOps(U)).toHaveLength(0)
  })

  it('partial rejection: ok ops leave the queue, the rejected one is kept as failed with the server message', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    await enqueueOp(ev('c'))
    const { send } = recorder((r) => ({ results: r.body.ops.map((o) => (o.body.clientId === 'b' ? { opId: o.opId, status: 'rejected' as const, error: 'Unknown checklist item' } : { opId: o.opId, status: 'ok' as const })) }))
    const res = await processQueue(U, send)
    expect(res.sent).toBe(2)
    expect(await listOps(U)).toMatchObject([{ body: { clientId: 'b' }, state: 'failed', error: 'Unknown checklist item' }])
    // failed ops are not resent automatically, only after an explicit retry
    const again = recorder()
    await processQueue(U, again.send)
    expect(again.requests).toHaveLength(0)
    await retryOp((await listOps(U))[0].seq!, U)
    await processQueue(U, again.send)
    expect(again.requests).toEqual([['evidence:b']])
  })

  it('closed visit: ops are held (pending, not failed), not sent while closed, and go out in order after release', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    await processQueue(U, recorder(closed).send)
    const ops = await listOps(U)
    expect(ops).toHaveLength(2)
    expect(ops[0]).toMatchObject({ state: 'pending', error: VISIT_CLOSED_MESSAGE, reason: 'visit_closed' })
    expect(ops.every(isHeldOp)).toBe(true)
    const while_ = recorder()
    await processQueue(U, while_.send)
    expect(while_.requests).toEqual([])
    expect(await releaseVisit('v1', U)).toBe(2)
    const after = recorder()
    await processQueue(U, after.send)
    expect(after.requests).toEqual([['evidence:a', 'evidence:b']])
    expect(await listOps(U)).toHaveLength(0)
  })

  it('also holds when the whole request comes back 409 "visit is closed" (older API)', async () => {
    await enqueueOp(ev('a'))
    await processQueue(U, async () => { throw new ApiError(409, 'Visit is closed and cannot be modified: v1') })
    expect(isHeldOp((await listOps(U))[0])).toBe(true)
  })

  it('pauses on 401: batch stays pending (with the reason), nothing failed', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const res = await processQueue(U, async () => { throw new ApiError(401, 'No autorizado') })
    expect(res.blocked).toEqual({ status: 401, message: '401: No autorizado', auth: true })
    expect((await listOps(U)).map((o) => [o.body.clientId, o.state])).toEqual([['a', 'pending'], ['b', 'pending']])
    const after = recorder()
    await processQueue(U, after.send)
    expect(after.requests).toEqual([['evidence:a', 'evidence:b']])
  })

  it.each([408, 425, 429, 500, 502, 503])('treats %i as transient: whole batch stays pending, run stops', async (status) => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b', 'i1', 'v2'))
    let calls = 0
    const res = await processQueue(U, async () => { calls++; throw new ApiError(status, 'x') })
    expect(calls).toBe(1) // the next visit is not attempted: order and backoff are kept
    expect(res.stopped).toBe(true)
    expect(res.blocked).toMatchObject({ status, auth: false })
    expect((await listOps(U)).every((o) => o.state === 'pending')).toBe(true)
  })

  it.each([400, 403, 404, 422])('a definitive %i on the request fails that batch (kept, with status + message) and goes on', async (status) => {
    await enqueueOp(ev('a', 'i1', 'v1'))
    await enqueueOp(ev('b', 'i1', 'v2'))
    const { send, requests } = recorder((r, n) => { if (n === 1) throw new ApiError(status, 'nope'); return okAll(r) })
    const res = await processQueue(U, send)
    expect(requests).toHaveLength(2)
    expect(res.blocked).toBeNull()
    expect(await listOps(U)).toMatchObject([{ body: { clientId: 'a' }, state: 'failed', error: `${status}: nope` }])
  })

  it('31 marks with an intermittent 429, 500 and 401: none lost, all delivered once and in order after recovery', async () => {
    const ids = Array.from({ length: 31 }, (_, i) => `i${i}`)
    for (const id of ids) await mark(id)
    const delivered: string[] = []
    const requestsSeen: number[] = []
    let n = 0
    const send = async (r: BatchRequest) => {
      n++
      requestsSeen.push(r.body.ops.length)
      if (n === 1) throw new ApiError(429, 'Too many requests')
      if (n === 2) throw new ApiError(500, 'boom')
      if (n === 3) throw new ApiError(401, 'expired')
      delivered.push(...r.body.ops.map((o) => o.itemId!))
      return okAll(r)
    }
    let runs = 0
    while ((await listOps(U)).length > 0 && runs++ < 10) await processQueue(U, send)
    expect(delivered).toEqual(ids)
    expect(requestsSeen).toEqual([31, 31, 31, 31]) // every retry carries the whole untouched batch
    expect(await listOps(U)).toHaveLength(0)
  })

  it('returns the server state only for batches that carry evidence/observations (marks never repaint)', async () => {
    await mark('i1')
    const onlyMarks = await processQueue(U, async (r) => ({ ...okAll(r), state: { s: 1 } }))
    expect(onlyMarks.lastByVisit).toEqual({})
    await mark('i1')
    await enqueueOp(ev('a'))
    const mixed = await processQueue(U, async (r) => ({ ...okAll(r), state: { s: 2 } }))
    expect(mixed.lastByVisit).toEqual({ 'p1::v1': { s: 2 } })
  })

  it('coalesces pending observations edits per visit into the latest one', async () => {
    for (const html of ['<p>a</p>', '<p>ab</p>', '<p>abc</p>']) await enqueueOp({ ...base, kind: 'observations', body: { observations: html } })
    const ops = await listOps(U)
    expect(ops).toHaveLength(1)
    expect(ops[0].body.observations).toBe('<p>abc</p>')
  })

  it('keeps each change with its owner: another user neither syncs, sees nor touches it', async () => {
    await enqueueOp(ev('a'))
    const B = 'userB'
    const sentB = recorder()
    expect(await listOps(B)).toHaveLength(0)
    const res = await processQueue(B, sentB.send)
    expect(res.sent).toBe(0)
    const seq = (await listOps(U))[0].seq!
    await removeOp(seq, B)
    await retryOp(seq, B)
    expect(sentB.requests).toEqual([])
    expect(await listOps(U)).toHaveLength(1)
    const sentA = recorder()
    await processQueue(U, sentA.send)
    expect(sentA.requests).toEqual([['evidence:a']])
    expect(await listOps(U)).toHaveLength(0)
  })
})

describe('client health attached to /sync', () => {
  beforeEach(async () => {
    await clearQueue()
    clearClientError(peekClientError())
  })

  it('every request carries counters, the oldest pending age and no content', async () => {
    await enqueueOp({ ...base, kind: 'mark', itemId: 'i1', body: { status: 'ok' }, queuedAt: Date.now() - 20 * 60_000 })
    const seen: unknown[] = []
    await processQueue(U, async (r) => {
      seen.push(r.body.client)
      return okAll(r)
    })
    expect(seen[0]).toMatchObject({ online: true, pendingCount: 1, heldClosedCount: 0 })
    expect((seen[0] as { oldestPendingAgeSec: number }).oldestPendingAgeSec).toBeGreaterThanOrEqual(1200)
    expect(seen[0]).not.toHaveProperty('lastError')
  })

  it('a 429 is remembered, sent with the next sync, then cleared once answered', async () => {
    await mark('i1')
    const first = await processQueue(U, async () => {
      throw new ApiError(429, 'Too many requests')
    })
    expect(first.stopped).toBe(true)
    expect(peekClientError()).toMatchObject({ status: 429, message: 'Too many requests' })

    const seen: unknown[] = []
    await processQueue(U, async (r) => {
      seen.push(r.body.client)
      return okAll(r)
    })
    expect(seen[0]).toMatchObject({ lastError: { status: 429, message: 'Too many requests' } })
    expect(peekClientError()).toBeNull()
  })

  it('uncaught JS errors are summarized: first line, no query strings, truncated', () => {
    recordClientError(null, `boom at https://x.cl/a?token=secret\n    at stack ${'x'.repeat(300)}`)
    expect(peekClientError()!.message).toBe('boom at https://x.cl/a')
    recordClientError(null, 'y'.repeat(500))
    expect(peekClientError()!.message).toHaveLength(200)
  })
})
