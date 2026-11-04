// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import StatusControl from './StatusControl'

vi.mock('../lib/auth', () => ({ useReadOnly: () => false }))

afterEach(cleanup)

describe('StatusControl', () => {
  it('disables all buttons while the mark promise is pending and sends one call', async () => {
    let resolve!: () => void
    const onMark = vi.fn(() => new Promise<void>((r) => { resolve = r }))
    render(<StatusControl status="pending" onMark={onMark} />)

    const ok = screen.getByRole('button', { name: 'Cumple' })
    for (let i = 0; i < 10; i++) fireEvent.click(ok)

    expect(onMark).toHaveBeenCalledTimes(1)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3)
    buttons.forEach((b) => {
      expect(b).toHaveProperty('disabled', true)
      expect(b.getAttribute('aria-busy')).toBe('true')
    })
    expect(screen.getByTestId('status-spinner')).toBeTruthy()

    await act(async () => { resolve() })
    screen.getAllByRole('button').forEach((b) => expect(b).toHaveProperty('disabled', false))
    expect(screen.queryByTestId('status-spinner')).toBeNull()
  })

  it('releases the buttons when the mark fails', async () => {
    const onMark = vi.fn(() => Promise.reject(new Error('boom')))
    render(<StatusControl status="pending" onMark={onMark} />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'No cumple' })) })
    screen.getAllByRole('button').forEach((b) => expect(b).toHaveProperty('disabled', false))
  })

  it('ignores a press on the already active status', () => {
    const onMark = vi.fn(() => Promise.resolve())
    render(<StatusControl status="ok" onMark={onMark} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cumple' }))
    expect(onMark).not.toHaveBeenCalled()
  })
})
