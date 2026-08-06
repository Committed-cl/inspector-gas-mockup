import { Link } from 'react-router-dom'
import ManualEstadoControl from './ManualEstadoControl'
import type { ChecklistItemDef, ChecklistStatus, ItemState } from '../data/checklistMatrizInterior'

const dotClass: Record<ChecklistStatus, string> = {
  ok: 'bg-ok shadow-[0_0_0_4px_rgba(34,197,94,0.18)]',
  warn: 'bg-warn shadow-[0_0_0_4px_rgba(245,158,11,0.2)]',
  pending: 'bg-danger shadow-[0_0_0_4px_rgba(220,38,38,0.18)]',
  na: 'bg-muted/50',
}

const badgeText: Record<ChecklistStatus, string> = {
  ok: 'Cumple',
  warn: 'Parcial',
  pending: 'Pendiente',
  na: 'No aplica',
}

const badgeClass: Record<ChecklistStatus, string> = {
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  pending: 'text-danger bg-danger/10',
  na: 'text-muted bg-muted/10',
}

type Props = {
  def: ChecklistItemDef
  state: ItemState
  proyectoId: string
  onMarcar: (status: ChecklistStatus, justificacion?: string) => void
}

export default function ChecklistDesktopRow({ def, state, proyectoId, onMarcar }: Props) {
  const itemHref = `/checklist/${proyectoId}/${def.id}`
  return (
    <div className="rounded-xl border border-hairline bg-white px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dotClass[state.status]}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <Link
              to={itemHref}
              className="text-[13.5px] font-semibold text-ink leading-tight hover:text-brand hover:underline underline-offset-2"
            >
              {def.titulo}
            </Link>
            <span className={`shrink-0 text-[10.5px] font-medium px-1.5 py-0.5 rounded-md ${badgeClass[state.status]}`}>
              {badgeText[state.status]}
            </span>
          </div>

          {state.origen && (
            <p className="text-[10.5px] text-muted mt-0.5">
              {state.origen === 'manual' ? 'Marcado manual' : 'Confirmado con evidencia de chat'}
            </p>
          )}

          {state.status === 'na' && state.justificacionNoAplica && (
            <p className="text-[11.5px] text-muted mt-1 italic">No aplica: {state.justificacionNoAplica}</p>
          )}

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <ManualEstadoControl
              status={state.status}
              permiteNoAplica={def.permiteNoAplica}
              onMarcar={onMarcar}
              size="sm"
              hint={
                def.requiereFoto && !state.evidencia.some((e) => e.tipo === 'foto')
                  ? 'Requiere foto para quedar en verde.'
                  : undefined
              }
            />
            <Link to={itemHref} className="text-[11px] text-brand/80 hover:underline">
              {state.evidencia.length > 0
                ? `${state.evidencia.length} evidencia${state.evidencia.length > 1 ? 's' : ''}`
                : 'Sin evidencia'}{' '}
              · abrir chat del ítem →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
