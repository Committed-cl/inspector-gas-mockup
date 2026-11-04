import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { clearQueue, enqueueOp, listOps, processQueue, removeOp, retryOp, type QueuedOp } from './offlineQueue'

const U = 'userA'
const base = { userId: U, projectId: 'p1', visitId: 'v1', label: 'x' }
const ev = (clientId: string, itemId = 'i1'): Omit<QueuedOp, 'seq' | 'state'> => ({
  ...base, kind: 'evidence', itemId, body: { requirementIndex: 0, type: 'photo', text: clientId, previewUrl: 'data:image/jpeg;base64,xyz', clientId },
})

beforeEach(async () => {
  await clearQueue()
})

describe('offline queue', () => {
  it('replaces a pending mark of the same item and keeps marks of other items', async () => {
    const mark = (itemId: string, status: string) => enqueueOp({ ...base, kind: 'mark', itemId, body: { status } })
    await mark('i1', 'ok')
    await mark('i2', 'na')
    for (const st of ['warn', 'ok', 'warn', 'na']) await mark('i1', st)
    const ops = await listOps(U)
    expect(ops.map((o) => `${o.itemId}:${o.body.status}`)).toEqual(['i2:na', 'i1:na'])
  })

  it('persists ops (photo included) and replays them in enqueue order', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp({ ...base, kind: 'mark', itemId: 'i1', body: { status: 'ok' } })
    await enqueueOp(ev('b'))
    expect((await listOps(U))[0].body.previewUrl).toBe('data:image/jpeg;base64,xyz')
    const sent: string[] = []
    const res = await processQueue(U, async (r) => { sent.push(r.path.split('/').slice(-1)[0] + ':' + (r.body.clientId ?? r.body.status)); return {} })
    expect(sent).toEqual(['evidence:a', 'mark:ok', 'evidence:b'])
    expect(res.sent).toBe(3)
    expect(await listOps(U)).toHaveLength(0)
  })

  it('stops on a network error and keeps order for the retry', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    let calls = 0
    const res = await processQueue(U, async () => { calls++; throw new TypeError('Failed to fetch') })
    expect(res.stopped).toBe(true)
    expect(calls).toBe(1) // b is not attempted before a
    expect((await listOps(U)).map((o) => o.body.clientId)).toEqual(['a', 'b'])
    const sent: unknown[] = []
    await processQueue(U, async (r) => { sent.push(r.body.clientId); return {} })
    expect(sent).toEqual(['a', 'b'])
  })

  it('treats 5xx as retryable (kept pending, run stops)', async () => {
    await enqueueOp(ev('a'))
    const res = await processQueue(U, async () => { throw new ApiError(503, 'unavailable') })
    expect(res.stopped).toBe(true)
    expect((await listOps(U))[0].state).toBe('pending')
  })

  it('marks a 4xx as failed, keeps it, and continues with the next op', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const sent: unknown[] = []
    await processQueue(U, async (r) => {
      if (r.body.clientId === 'a') throw new ApiError(409, 'Visita cerrada')
      sent.push(r.body.clientId); return {}
    })
    expect(sent).toEqual(['b'])
    const left = await listOps(U)
    expect(left).toHaveLength(1)
    expect(left[0]).toMatchObject({ state: 'failed', error: '409: Visita cerrada' })
    // failed ops are not resent automatically, only after an explicit retry
    let calls = 0
    await processQueue(U, async () => { calls++; return {} })
    expect(calls).toBe(0)
    await retryOp(left[0].seq!, U)
    await processQueue(U, async () => { calls++; return {} })
    expect(calls).toBe(1)
  })

  it('pauses on 401: ops stay pending (with the reason), order kept, nothing failed', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const res = await processQueue(U, async () => { throw new ApiError(401, 'No autorizado') })
    expect(res.blocked).toEqual({ status: 401, message: '401: No autorizado', auth: true })
    expect((await listOps(U)).map((o) => [o.body.clientId, o.state])).toEqual([['a', 'pending'], ['b', 'pending']])
    const sent: unknown[] = []
    await processQueue(U, async (r) => { sent.push(r.body.clientId); return {} })
    expect(sent).toEqual(['a', 'b'])
  })

  it.each([408, 425, 429, 500, 502])('treats %i as transient: stays pending, run stops', async (status) => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    let calls = 0
    const res = await processQueue(U, async () => { calls++; throw new ApiError(status, 'x') })
    expect(calls).toBe(1)
    expect(res.stopped).toBe(true)
    expect(res.blocked).toMatchObject({ status, auth: false })
    expect((await listOps(U)).every((o) => o.state === 'pending')).toBe(true)
  })

  it.each([400, 403, 404, 409, 422])('fails only that op on %i with status + message and goes on', async (status) => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const sent: unknown[] = []
    const res = await processQueue(U, async (r) => {
      if (r.body.clientId === 'a') throw new ApiError(status, 'nope')
      sent.push(r.body.clientId); return {}
    })
    expect(sent).toEqual(['b'])
    expect(res.blocked).toBeNull()
    expect(await listOps(U)).toMatchObject([{ state: 'failed', error: `${status}: nope` }])
  })

  it('burst of 31 marks with an intermittent 429 and 401: none lost, all delivered in order after recovery', async () => {
    const ids = Array.from({ length: 31 }, (_, i) => `i${i}`)
    for (const id of ids) await enqueueOp({ ...base, kind: 'mark', itemId: id, body: { status: 'na' } })
    const delivered: string[] = []
    let n = 0
    const send = async (r: { path: string }) => {
      n++
      if (n === 5) throw new ApiError(429, 'Too many requests')
      if (n === 12) throw new ApiError(401, 'expired')
      delivered.push(r.path.split('/')[6])
      return {}
    }
    let runs = 0
    while ((await listOps(U)).length > 0 && runs++ < 10) await processQueue(U, send)
    expect(delivered).toEqual(ids)
    expect(await listOps(U)).toHaveLength(0)
  })

  it('resends the same clientId on retry so the API can dedupe', async () => {
    await enqueueOp(ev('same'))
    const ids: unknown[] = []
    await processQueue(U, async (r) => { ids.push(r.body.clientId); throw new TypeError('offline') })
    await processQueue(U, async (r) => { ids.push(r.body.clientId); return {} })
    expect(ids).toEqual(['same', 'same'])
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
    const sentB: unknown[] = []
    expect(await listOps(B)).toHaveLength(0)
    const res = await processQueue(B, async (r) => { sentB.push(r.body.clientId); return {} })
    expect(res.sent).toBe(0)
    const seq = (await listOps(U))[0].seq!
    await removeOp(seq, B)
    await retryOp(seq, B)
    expect(sentB).toEqual([])
    expect(await listOps(U)).toHaveLength(1)
    // the owner signs in again and the change goes out
    const sentA: unknown[] = []
    await processQueue(U, async (r) => { sentA.push(r.body.clientId); return {} })
    expect(sentA).toEqual(['a'])
    expect(await listOps(U)).toHaveLength(0)
  })
})
