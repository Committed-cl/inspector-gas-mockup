import { useRef, useState } from 'react'
import { useReadOnly } from '../lib/auth'
import type { ChecklistStatus } from '../data/checklistMatrizInterior'

type Props = {
  status: ChecklistStatus
  onMark: (status: ChecklistStatus, reason?: string) => Promise<void>
  size?: 'sm' | 'md'
  hint?: string
}

function Spinner() {
  return (
    <span
      data-testid="status-spinner"
      className="absolute inset-0 flex items-center justify-center"
    >
      <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
    </span>
  )
}

export default function StatusControl({ status, onMark, size = 'sm', hint }: Props) {
  const readOnly = useReadOnly()
  const [pending, setPending] = useState<ChecklistStatus | null>(null)
  const inFlight = useRef(false)
  if (readOnly) return null
  const touch = 'min-h-[44px] md:min-h-0'
  const pad = `${touch} ${size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12.5px]'}`

  const mark = async (next: ChecklistStatus) => {
    // Re-pressing the active status is a no-op; the ref guards against clicks
    // that land before React re-renders the disabled buttons.
    if (next === status || inFlight.current) return
    inFlight.current = true
    setPending(next)
    try {
      await onMark(next)
    } catch {
      // mutate already surfaces the error / offline queue; just release the buttons.
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }

  const busy = pending !== null
  const btn = (value: ChecklistStatus, label: string, active: string, hover: string, extra = '') => (
    <button
      type="button"
      onClick={() => mark(value)}
      disabled={busy}
      aria-busy={busy || undefined}
      className={`${pad} relative font-medium ${extra} transition-colors disabled:cursor-wait ${
        status === value ? active : `text-ink ${hover}`
      }`}
    >
      <span className={pending === value ? 'invisible' : undefined}>{label}</span>
      {pending === value && <Spinner />}
    </button>
  )

  return (
    <div>
      <div className="inline-flex rounded-lg border border-hairline overflow-hidden">
        {btn('ok', 'Cumple', 'bg-ok text-white', 'hover:bg-ok/10')}
        {btn('warn', 'No cumple', 'bg-danger text-white', 'hover:bg-danger/10', 'border-l border-hairline')}
        {btn('na', 'No aplica', 'bg-muted text-white', 'hover:bg-muted/10', 'border-l border-hairline')}
      </div>
      {hint && status !== 'ok' && status !== 'na' && <p className="text-[11px] text-warn mt-1.5">{hint}</p>}
    </div>
  )
}
