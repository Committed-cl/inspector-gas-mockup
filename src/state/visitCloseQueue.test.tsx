// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { checklistDef } from '../data/checklistMatrizInterior'
import { ApiError } from '../lib/api'
import { clearQueue } from '../lib/offlineQueue'

const ids = checklistDef.slice(0, 15).map((d) => d.id)
const stale = () => ({
  observations: '',
  generalChat: [],
  itemsState: Object.fromEntries(ids.map((id) => [id, { status: 'pending', source: 'manual', evidence: [] }])),
})
const post = vi.fn()
vi.mock('../lib/api', async (orig) => ({ ...(await orig<typeof import('../lib/api')>()), api: { get: vi.fn(async () => stale()), post: (...a: unknown[]) => post(...a), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
vi.mock('../lib/auth', () => ({ useAuth: () => ({ auth: { user: { id: 'u1' } } }) }))
vi.mock('../lib/useOnline', () => ({ useOnline: () => true }))
vi.mock('../components/SyncStatus', () => ({ default: () => null }))

const { ChecklistProvider, useProjectChecklist, useChecklist } = await import('./ChecklistContext')
const wrapper = ({ children }: { children: ReactNode }) => <ChecklistProvider>{children}</ChecklistProvider>
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

beforeEach(async () => {
  post.mockReset()
  await clearQueue()
})

describe('visit close vs offline queue', () => {
  it('closing the visit waits for the queue; a closed-visit rejection is re-sent after reopen', async () => {
    const calls: string[] = []
    let closed = false
    post.mockImplementation(async (path: string) => {
      calls.push(path.split('/').slice(-1)[0])
      if (path.endsWith('/close')) { closed = true; return { id: 'v1', projectId: 'p1', status: 'aprobada' } }
      if (path.endsWith('/reopen')) { closed = false; return { id: 'v1', projectId: 'p1', status: 'en_curso' } }
      await sleep(120)
      if (closed) throw new ApiError(409, 'Visit is closed and cannot be modified: v1')
      return stale()
    })
    const useAll = () => ({ cl: useProjectChecklist('p1', 'v1'), ctx: useChecklist() })
    const { result } = renderHook(useAll, { wrapper })
    await waitFor(() => expect(result.current.cl.loading).toBe(false))
    for (const id of ids.slice(0, 3)) await act(async () => { await result.current.cl.markManually(id, 'na', 'x') })
    // close while marks are still in flight: the close request must go out after every mark
    await act(async () => { await result.current.ctx.closeVisit('p1', 'v1') })
    expect(calls.filter((c) => c === 'mark')).toHaveLength(3)
    expect(calls.indexOf('close')).toBeGreaterThan(calls.lastIndexOf('mark'))
    // now a mark that reaches a closed visit is rejected, grouped by reason and in Spanish
    await act(async () => { await result.current.cl.markManually(ids[5], 'na', 'x') })
    await waitFor(() => expect(result.current.ctx.sync.visitOps('v1').failed).toHaveLength(1))
    expect(result.current.ctx.sync.visitOps('v1').failed[0].error).toBe('La visita está cerrada y no admite cambios')
    await act(async () => { await result.current.ctx.sync.reopenAndResend('p1', 'v1') })
    expect(calls).toContain('reopen')
    expect(result.current.ctx.sync.visitOps('v1')).toEqual({ pending: 0, failed: [] })
  })
})
