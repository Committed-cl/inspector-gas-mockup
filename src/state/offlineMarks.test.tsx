// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checklistDef } from '../data/checklistMatrizInterior'
import { ApiError } from '../lib/api'
import { clearQueue } from '../lib/offlineQueue'

const ids = checklistDef.slice(0, 15).map((d) => d.id)
const allIds = checklistDef.slice(0, 31).map((d) => d.id)
const stale = () => ({
  observations: '',
  generalChat: [],
  itemsState: Object.fromEntries(allIds.map((id) => [id, { status: 'pending', source: 'manual', evidence: [] }])),
})
const post = vi.fn()
vi.mock('../lib/api', async (orig) => ({ ...(await orig<typeof import('../lib/api')>()), api: { get: vi.fn(async () => stale()), post: (...a: unknown[]) => post(...a), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ auth: { user: { id: 'u1' } } }) }))
vi.mock('../lib/useOnline', () => ({ useOnline: () => true }))
vi.mock('../components/SyncStatus', () => ({ default: () => null }))

const { ChecklistProvider, useProjectChecklist, useChecklist } = await import('./ChecklistContext')
const wrapper = ({ children }: { children: ReactNode }) => <ChecklistProvider>{children}</ChecklistProvider>
const useBoth = () => ({ cl: useProjectChecklist('p1', 'v1'), sync: useChecklist().sync })
const naCount = (r: { current: ReturnType<typeof useBoth> }) => Object.values(r.current.cl.itemsState).filter((i) => i.status === 'na').length
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Slow, out-of-order responses (each one carries a stale server snapshot). `fault` injects errors.
async function burst(fault: (n: number) => ApiError | null) {
  let n = 0
  post.mockImplementation(async (_path: string, body: { ops: { opId: string }[] }) => {
    const k = ++n
    await sleep(150 - (k % 3) * 40)
    const f = fault(k)
    if (f) throw f
    return { results: body.ops.map((o) => ({ opId: o.opId, status: 'ok' })), state: stale() }
  })
  const { result } = renderHook(useBoth, { wrapper })
  await waitFor(() => expect(result.current.cl.loading).toBe(false))
  const samples: number[] = []
  for (const id of ids) {
    await act(async () => { await result.current.cl.markManually(id, 'na', 'x') })
    samples.push(naCount(result))
    await sleep(20)
    samples.push(naCount(result))
  }
  for (let i = 0; i < 40; i++) { await sleep(25); samples.push(naCount(result)) }
  return { result, samples }
}
const monotonic = (s: number[]) => s.every((v, i) => i === 0 || v >= s[i - 1])

beforeEach(async () => {
  post.mockReset()
  await clearQueue()
})

describe('offline marks: local state is the source of truth', () => {
  it('delayed, out-of-order, stale responses never change what is painted', async () => {
    const { result, samples } = await burst(() => null)
    expect(monotonic(samples)).toBe(true)
    await waitFor(() => expect(result.current.sync.pendingCount).toBe(0), { timeout: 4000 })
    samples.push(naCount(result))
    expect(monotonic(samples)).toBe(true)
    expect(naCount(result)).toBe(15)
    expect(post.mock.calls.length).toBeLessThanOrEqual(3) // 15 clicks, a couple of /sync requests (not 15)
    expect(post.mock.calls.every((c) => String(c[0]).endsWith('/sync'))).toBe(true)
    const sent = post.mock.calls.flatMap((c) => (c[1] as { ops: { itemId: string }[] }).ops.map((o) => o.itemId))
    expect([...sent].sort()).toEqual([...ids].sort()) // each click delivered exactly once
  })

  it('a 500 and a 429 leave the buttons alone and nothing is lost', async () => {
    const { result, samples } = await burst((k) => (k === 3 ? new ApiError(500, 'boom') : k === 6 ? new ApiError(429, 'slow') : null))
    expect(monotonic(samples)).toBe(true)
    expect(naCount(result)).toBe(15)
  })

  it('a definitive 4xx keeps the buttons painted and lists the ops as not sent', async () => {
    const { result, samples } = await burst((k) => (k === 1 ? new ApiError(409, 'Visita cerrada') : null))
    expect(monotonic(samples)).toBe(true)
    expect(naCount(result)).toBe(15)
    await waitFor(() => expect(result.current.sync.failed.length).toBeGreaterThan(0))
    expect(result.current.sync.failed[0].error).toBe('409: Visita cerrada')
  })

  it('31 clicks with 800 ms latency: the server gets all 31 in at most 3 /sync requests, the UI never changes', async () => {
    const delivered: string[] = []
    post.mockImplementation(async (_path: string, body: { ops: { opId: string; itemId: string }[] }) => {
      await sleep(800)
      delivered.push(...body.ops.map((o) => o.itemId))
      return { results: body.ops.map((o) => ({ opId: o.opId, status: 'ok' })), state: stale() }
    })
    const { checklistDef: def } = await import('../data/checklistMatrizInterior')
    const many = def.slice(0, 31).map((d) => d.id)
    const { result } = renderHook(useBoth, { wrapper })
    await waitFor(() => expect(result.current.cl.loading).toBe(false))
    for (const id of many) {
      await act(async () => { await result.current.cl.markManually(id, 'na', 'x') })
      await sleep(30)
    }
    await waitFor(() => expect(result.current.sync.pendingCount).toBe(0), { timeout: 8000 })
    expect(post.mock.calls.length).toBeLessThanOrEqual(3)
    expect(post.mock.calls.every((c) => String(c[0]).endsWith('/sync'))).toBe(true)
    expect(delivered).toHaveLength(many.length)
    expect(Object.values(result.current.cl.itemsState).filter((i) => i.status === 'na')).toHaveLength(many.length)
  }, 20000)
})
