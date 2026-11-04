import { Link } from 'react-router-dom'
import { actionButtonSecondary } from '../lib/actionButton'
import StatusControl from './StatusControl'
import {
  requiredEvidenceState,
  missingEvidenceHint,
  type ChecklistItemDef,
  type ChecklistStatus,
  type ItemState,
} from '../data/checklistMatrizInterior'
import Icon from './Icon'

const dotClass: Record<ChecklistStatus, string> = {
  ok: 'bg-ok shadow-[0_0_0_4px_rgba(34,197,94,0.18)]',
  warn: 'bg-danger shadow-[0_0_0_4px_rgba(220,38,38,0.18)]',
  pending: 'bg-warn shadow-[0_0_0_4px_rgba(245,158,11,0.2)]',
  na: 'bg-muted/50',
}

const badgeText: Record<ChecklistStatus, string> = {
  ok: 'Cumple',
  warn: 'No cumple',
  pending: 'Pendiente',
  na: 'No aplica',
}

const badgeClass: Record<ChecklistStatus, string> = {
  ok: 'text-ok-ink md:text-ok bg-ok/10',
  warn: 'text-danger bg-danger/10',
  pending: 'text-warn-ink md:text-warn bg-warn/10',
  na: 'text-muted bg-muted/10',
}

const resultDotClass: Record<ChecklistStatus, string> = {
  ok: 'bg-ok',
  warn: 'bg-danger',
  pending: 'bg-warn',
  na: 'bg-muted',
}

type Props = {
  def: ChecklistItemDef
  state: ItemState
  projectId: string
  visitId: string
  onMark: (status: ChecklistStatus, reason?: string) => void
}

export default function ChecklistDesktopRow({ def, state, projectId, visitId, onMark }: Props) {
  const itemHref = `/checklist/${projectId}/${visitId}/${def.id}`
  const manualMark = state.evidence.find((e) => e.source === 'manual-mark')
  return (
    <div className="rounded-xl border border-hairline bg-white px-3 py-3 md:px-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${dotClass[state.status]}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <Link
              to={itemHref}
              className="flex-1 min-w-0 inline-flex items-center gap-1 min-h-[44px] md:min-h-0 -my-2 py-2 md:my-0 md:py-0 text-[14.5px] md:text-[13.5px] font-semibold text-ink leading-tight hover:text-brand hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              <span>{def.title}</span>
              <svg viewBox="0 0 24 24" fill="currentColor" className="md:hidden h-4 w-4 shrink-0 text-muted" aria-hidden>
                <path d="M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L13.58 12 9.3 7.7a1 1 0 0 1 0-1.4Z" />
              </svg>
            </Link>
            <span className={`shrink-0 text-[11.5px] md:text-[10.5px] font-medium px-1.5 py-0.5 rounded-md ${badgeClass[state.status]}`}>
              {badgeText[state.status]}
            </span>
          </div>

          {state.source && (
            <p className="hidden md:block text-[10.5px] text-muted mt-0.5">
              {state.source === 'manual' ? 'Conclusión' : 'Confirmado con evidencia de chat'}
            </p>
          )}

          {state.status === 'na' && state.notApplicableReason && (
            <p className="text-[11.5px] text-muted mt-1 italic">No aplica: {state.notApplicableReason}</p>
          )}

          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <StatusControl
              status={state.status}
              onMark={onMark}
              size="sm"
              hint={missingEvidenceHint(def, state.evidence)}
            />
          </div>

          {state.status !== 'na' && (
            <div className="mt-2 hidden md:flex flex-col gap-1">
              {requiredEvidenceState(def, state.evidence).map((req, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      req.fulfilled ? 'bg-ok' : 'bg-hairline border border-muted/30'
                    }`}
                    aria-hidden
                  />
                  <span className={`truncate ${req.fulfilled ? 'text-ink' : 'text-muted'}`}>
                    {req.type === 'photo' && <Icon name="camera" size={13} className="mr-1 -mt-0.5" />}
                    {req.label}
                    {req.fulfilled && req.evidence ? `: ${req.evidence.text}` : ' (pendiente)'}
                  </span>
                </div>
              ))}
              {manualMark ? (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      manualMark.result ? resultDotClass[manualMark.result] : 'bg-ok'
                    }`}
                    aria-hidden
                  />
                  <span className="truncate text-ink">Conclusión: {manualMark.text}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] text-muted">
                  <span className="h-2 w-2 rounded-full bg-hairline border border-muted/30 shrink-0" aria-hidden />
                  <span>Conclusión (pendiente)</span>
                </div>
              )}
              <Link to={itemHref} className={`${actionButtonSecondary} self-start mt-1`}>
                Abrir ítem <Icon name="arrow-right" size={14} className="ml-1 -mt-0.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
