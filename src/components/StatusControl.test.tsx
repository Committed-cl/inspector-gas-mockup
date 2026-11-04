// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import StatusControl from './StatusControl'

vi.mock('../lib/auth', () => ({ useReadOnly: () => false }))

afterEach(cleanup)

describe('StatusControl', () => {
  it('reports every press on a different status immediately, with no spinner or disabled buttons', () => {
    const onMark = vi.fn()
    render(<StatusControl status="pending" onMark={onMark} />)
    const seq = ['Cumple', 'No cumple', 'No aplica', 'Cumple', 'No cumple']
    for (const name of seq) fireEvent.click(screen.getByRole('button', { name }))

    expect(onMark.mock.calls.map((c) => c[0])).toEqual(['ok', 'warn', 'na', 'ok', 'warn'])
    screen.getAllByRole('button').forEach((b) => {
      expect(b).toHaveProperty('disabled', false)
      expect(b.getAttribute('aria-busy')).toBeNull()
    })
    expect(screen.queryByTestId('status-spinner')).toBeNull()
  })

  it('ignores a press on the already active status', () => {
    const onMark = vi.fn()
    render(<StatusControl status="ok" onMark={onMark} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cumple' }))
    expect(onMark).not.toHaveBeenCalled()
  })
})
