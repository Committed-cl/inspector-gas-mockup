// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const createProject = vi.fn(async () => 'obra-1')
const project = { id: 'p1', clientId: 'c1', name: 'Edificio A', address: 'Calle 1', openVisit: null }

vi.mock('../state/adminHooks', () => ({
  useCompanies: () => ({ companies: [{ id: 'co1', name: 'Terracon' }], loading: false }),
  useClients: () => ({ clients: [{ id: 'c1', companyId: 'co1', name: 'Terracon' }], loading: false, createClient: vi.fn() }),
}))
vi.mock('../state/ChecklistContext', () => ({
  useCreateProject: () => createProject,
  useUpdateProjectTechnicalData: () => vi.fn(),
  useProjects: () => ({ data: [project], loading: false, error: null }),
  useChecklist: () => ({ fetchProjectsIfNeeded: vi.fn() }),
}))

import ChecklistNuevaObra from './ChecklistNuevaObra'
import ChecklistProjects from './ChecklistProjects'

afterEach(cleanup)

describe('optional project fields', () => {
  it('submits with only empresa, nombre and dirección, omitting the optional fields', async () => {
    const { container } = render(
      <MemoryRouter>
        <ChecklistNuevaObra />
      </MemoryRouter>,
    )
    const required = [...container.querySelectorAll('[required]')]
    expect(required).toHaveLength(3)
    fireEvent.change(container.querySelector('select')!, { target: { value: 'co1' } })
    const [name, address] = required.filter((e) => e.tagName === 'INPUT') as HTMLInputElement[]
    fireEvent.change(name!, { target: { value: 'Edificio A' } })
    fireEvent.change(address!, { target: { value: 'Calle 1' } })
    fireEvent.submit(container.querySelector('form')!)
    await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1))
    expect(createProject).toHaveBeenCalledWith({ clientId: 'c1', name: 'Edificio A', address: 'Calle 1' })
  })

  it('shows "—" in the project list when builder, installer and stage are missing', () => {
    render(
      <MemoryRouter>
        <ChecklistProjects />
      </MemoryRouter>,
    )
    expect(screen.getByText('Constructora — · Instaladora —')).toBeTruthy()
  })
})
