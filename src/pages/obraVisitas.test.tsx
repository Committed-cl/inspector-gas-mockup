// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const project = { id: 'p1', name: 'Edificio A', installer: 'Terracon', servicePressureKpa: 2.5, matrixVolumeM3: 0.4 }

vi.mock('../state/ChecklistContext', () => ({
  useProject: () => ({ data: project, loading: false, error: null }),
  useProjectVisits: () => ({ visits: [], loading: false, error: null, createVisit: vi.fn() }),
}))
vi.mock('../lib/auth', () => ({ useReadOnly: () => false }))

import ObraVisitas from './ObraVisitas'

afterEach(cleanup)

describe('ObraVisitas', () => {
  it('does not show the technical data box (pressure / volume)', () => {
    render(
      <MemoryRouter initialEntries={['/obra/p1']}>
        <Routes><Route path="/obra/:projectId" element={<ObraVisitas />} /></Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Historial de visitas')).toBeTruthy()
    expect(screen.queryByText('Datos técnicos')).toBeNull()
    expect(screen.queryByText(/Presión de servicio/)).toBeNull()
  })
})
