import type { ChecklistItem } from '../data/mock'

const dotClass: Record<ChecklistItem['status'], string> = {
  ok: 'bg-ok shadow-[0_0_0_4px_rgba(34,197,94,0.18)]',
  warn: 'bg-warn shadow-[0_0_0_4px_rgba(245,158,11,0.2)]',
  pending: 'bg-danger shadow-[0_0_0_4px_rgba(220,38,38,0.18)]',
}

const badgeText: Record<ChecklistItem['status'], string> = {
  ok: 'Verificado',
  warn: 'Parcial',
  pending: 'Pendiente',
}

const badgeClass: Record<ChecklistItem['status'], string> = {
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  pending: 'text-danger bg-danger/10',
}

type Props = {
  item: ChecklistItem
  compact?: boolean
}

export default function ChecklistItemRow({ item, compact = false }: Props) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-hairline bg-white px-3 ${
        compact ? 'py-2' : 'py-3'
      } transition-shadow hover:shadow-sm`}
    >
      <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dotClass[item.status]}`} aria-hidden />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-semibold text-ink leading-tight">{item.title}</p>
          <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-md ${badgeClass[item.status]}`}>
            {badgeText[item.status]}
          </span>
        </div>
        {!compact && <p className="text-[11.5px] text-muted mt-0.5">{item.descriptor}</p>}
        {!compact && item.declared && (
          <p className="text-[11.5px] text-brand mt-1.5 italic leading-snug">"{item.declared}"</p>
        )}
      </div>
    </div>
  )
}
