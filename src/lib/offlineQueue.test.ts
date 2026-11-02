import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { enqueueOp, listOps, processQueue, removeOp, retryOp, type QueuedOp } from './offlineQueue'

const base = { projectId: 'p1', visitId: 'v1', label: 'x' }
const ev = (clientId: string, itemId = 'i1'): Omit<QueuedOp, 'seq' | 'state'> => ({
  ...base, kind: 'evidence', itemId, body: { requirementIndex: 0, type: 'photo', text: clientId, previewUrl: 'data:image/jpeg;base64,xyz', clientId },
})

beforeEach(async () => {
  for (const o of await listOps()) await removeOp(o.seq!)
})

describe('offline queue', () => {
  it('persists ops (photo included) and replays them in enqueue order', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp({ ...base, kind: 'mark', itemId: 'i1', body: { status: 'ok' } })
    await enqueueOp(ev('b'))
    expect((await listOps())[0].body.previewUrl).toBe('data:image/jpeg;base64,xyz')
    const sent: string[] = []
    const res = await processQueue(async (r) => { sent.push(r.path.split('/').slice(-1)[0] + ':' + (r.body.clientId ?? r.body.status)); return {} })
    expect(sent).toEqual(['evidence:a', 'mark:ok', 'evidence:b'])
    expect(res.sent).toBe(3)
    expect(await listOps()).toHaveLength(0)
  })

  it('stops on a network error and keeps order for the retry', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    let calls = 0
    const res = await processQueue(async () => { calls++; throw new TypeError('Failed to fetch') })
    expect(res.stopped).toBe(true)
    expect(calls).toBe(1) // b is not attempted before a
    expect((await listOps()).map((o) => o.body.clientId)).toEqual(['a', 'b'])
    const sent: unknown[] = []
    await processQueue(async (r) => { sent.push(r.body.clientId); return {} })
    expect(sent).toEqual(['a', 'b'])
  })

  it('treats 5xx as retryable (kept pending, run stops)', async () => {
    await enqueueOp(ev('a'))
    const res = await processQueue(async () => { throw new ApiError(503, 'unavailable') })
    expect(res.stopped).toBe(true)
    expect((await listOps())[0].state).toBe('pending')
  })

  it('marks a 4xx as failed, keeps it, and continues with the next op', async () => {
    await enqueueOp(ev('a'))
    await enqueueOp(ev('b'))
    const sent: unknown[] = []
    await processQueue(async (r) => {
      if (r.body.clientId === 'a') throw new ApiError(409, 'Visita cerrada')
      sent.push(r.body.clientId); return {}
    })
    expect(sent).toEqual(['b'])
    const left = await listOps()
    expect(left).toHaveLength(1)
    expect(left[0]).toMatchObject({ state: 'failed', error: 'Visita cerrada' })
    // failed ops are not resent automatically, only after an explicit retry
    let calls = 0
    await processQueue(async () => { calls++; return {} })
    expect(calls).toBe(0)
    await retryOp(left[0].seq!)
    await processQueue(async () => { calls++; return {} })
    expect(calls).toBe(1)
  })

  it('keeps a 401/404 change instead of losing it', async () => {
    await enqueueOp(ev('a'))
    await processQueue(async () => { throw new ApiError(401, 'No autorizado') })
    expect((await listOps())[0]).toMatchObject({ state: 'failed' })
  })

  it('resends the same clientId on retry so the API can dedupe', async () => {
    await enqueueOp(ev('same'))
    const ids: unknown[] = []
    await processQueue(async (r) => { ids.push(r.body.clientId); throw new TypeError('offline') })
    await processQueue(async (r) => { ids.push(r.body.clientId); return {} })
    expect(ids).toEqual(['same', 'same'])
  })

  it('coalesces pending observations edits per visit into the latest one', async () => {
    for (const html of ['<p>a</p>', '<p>ab</p>', '<p>abc</p>']) await enqueueOp({ ...base, kind: 'observations', body: { observations: html } })
    const ops = await listOps()
    expect(ops).toHaveLength(1)
    expect(ops[0].body.observations).toBe('<p>abc</p>')
  })
})
