// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

const usage = {
  from: '2026-08-01T00:00:00.000Z',
  to: '2026-08-25T00:00:00.000Z',
  users: { total: 2, active7d: 1, active30d: 1 },
  visits: { created: 0, closed: 0 },
  reportsSent: 0,
  byCompany: [],
  byProject: [],
  inactiveProjects: [],
  activeUsers: [{ userId: 'u1', name: 'Ana Pérez', companyName: 'Metrogas', role: 'supervisor-proyecto', logins: 3, lastLoginAt: '2026-08-20T15:00:00.000Z' }],
  inactiveUsers: [{ userId: 'u2', name: 'Luis Soto', companyName: 'Instaladora', role: 'supervisor-proyecto', lastAccessAt: null }],
}
const get = vi.fn(async () => usage)
vi.mock('../lib/api', () => ({ api: { get: (...a: unknown[]) => get(...(a as [])) }, ApiError: class extends Error {} }))

import AdminUso from './AdminUso'

afterEach(cleanup)

describe('AdminUso active users', () => {
  it('lists active users with login count above the inactive section', async () => {
    render(<AdminUso />)
    const heading = await screen.findByRole('heading', { name: 'Usuarios activos' })
    const section = heading.nextElementSibling!.nextElementSibling as HTMLElement
    expect(within(section).getByText('Ana Pérez')).toBeTruthy()
    expect(within(section).getByText('3')).toBeTruthy()
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings.indexOf('Usuarios activos')).toBeLessThan(headings.indexOf('Usuarios inactivos'))
  })
})
