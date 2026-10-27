import type { ChecklistStatus } from '../data/checklistMatrizInterior'

type Props = {
  status: ChecklistStatus
  onMark: (status: ChecklistStatus, reason?: string) => void
  size?: 'sm' | 'md'
  hint?: string
}

export default function StatusControl({ status, onMark, size = 'sm', hint }: Props) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12.5px]'

  return (
    <div>
      <div className="inline-flex rounded-lg border border-hairline overflow-hidden">
        <button
          onClick={() => onMark('ok')}
          className={`${pad} font-medium transition-colors ${status === 'ok' ? 'bg-ok text-white' : 'text-ink hover:bg-ok/10'}`}
        >
          Cumple
        </button>
        <button
          onClick={() => onMark('pending')}
          className={`${pad} font-medium border-l border-hairline transition-colors ${
            status === 'pending' ? 'bg-danger text-white' : 'text-ink hover:bg-danger/10'
          }`}
        >
          No cumple
        </button>
        <button
          onClick={() => onMark('na')}
          className={`${pad} font-medium border-l border-hairline transition-colors ${
            status === 'na' ? 'bg-muted text-white' : 'text-ink hover:bg-muted/10'
          }`}
        >
          No aplica
        </button>
      </div>
      {hint && status !== 'ok' && status !== 'na' && <p className="text-[11px] text-warn mt-1.5">{hint}</p>}
    </div>
  )
}
