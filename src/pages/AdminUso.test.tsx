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

  it('shows never-signed-in users as inactive with "Nunca" and seen-without-login users as active with 0 accesses', async () => {
    get.mockResolvedValueOnce({
      ...usage,
      activeUsers: [{ userId: 'u3', name: 'Jaime Valls', companyName: 'Terracon', role: 'supervisor-proyecto', logins: 0, lastLoginAt: '2026-08-24T15:00:00.000Z' }],
      inactiveUsers: [{ userId: 'u4', name: 'Andrés Lee', companyName: 'Terracon', role: 'supervisor-proyecto', lastAccessAt: null }],
    })
    render(<AdminUso />)
    const active = (await screen.findByRole('heading', { name: 'Usuarios activos' })).nextElementSibling!.nextElementSibling as HTMLElement
    expect(within(active).getByText('Jaime Valls')).toBeTruthy()
    const inactive = screen.getByRole('heading', { name: 'Usuarios inactivos' }).nextElementSibling!.nextElementSibling as HTMLElement
    expect(within(inactive).getByText('Andrés Lee')).toBeTruthy()
    expect(within(inactive).getByText('Nunca')).toBeTruthy()
  })
})
