import { useReadOnly } from '../lib/auth'
import type { ChecklistStatus } from '../data/checklistMatrizInterior'

type Props = {
  status: ChecklistStatus
  onMark: (status: ChecklistStatus, reason?: string) => void
  size?: 'sm' | 'md'
  hint?: string
}

export default function StatusControl({ status, onMark, size = 'sm', hint }: Props) {
  if (useReadOnly()) return null
  const touch = 'min-h-[44px] md:min-h-0'
  // Below md the segmented control spans the full width (one thumb-sized row).
  const pad = `${touch} flex-1 md:flex-none ${size === 'sm' ? 'px-2.5 py-1 text-[13px] md:text-[11px]' : 'px-3.5 py-1.5 text-[13px] md:text-[12.5px]'}`
  // Re-pressing the active status is a no-op; any other press applies instantly.
  const mark = (next: ChecklistStatus) => {
    if (next !== status) onMark(next)
  }

  return (
    <div className="w-full md:w-auto">
      <div className="flex md:inline-flex rounded-lg border border-hairline overflow-hidden">
        <button
          type="button"
          onClick={() => mark('ok')}
          className={`${pad} font-medium transition-colors active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${status === 'ok' ? 'bg-ok text-white' : 'text-ink hover:bg-ok/10'}`}
        >
          Cumple
        </button>
        <button
          type="button"
          onClick={() => mark('warn')}
          className={`${pad} font-medium border-l border-hairline transition-colors active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
            status === 'warn' ? 'bg-danger text-white' : 'text-ink hover:bg-danger/10'
          }`}
        >
          No cumple
        </button>
        <button
          type="button"
          onClick={() => mark('na')}
          className={`${pad} font-medium border-l border-hairline transition-colors active:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
            status === 'na' ? 'bg-muted text-white' : 'text-ink hover:bg-muted/10'
          }`}
        >
          No aplica
        </button>
      </div>
      {hint && status !== 'ok' && status !== 'na' && <p className="text-[12.5px] md:text-[11px] text-warn-ink md:text-warn mt-1.5">{hint}</p>}
    </div>
  )
}
