import { Link, useParams } from 'react-router-dom'
import { checklistDef, requiredEvidenceState, missingEvidenceHint } from '../data/checklistMatrizInterior'
import { useProject, useProjectChecklist } from '../state/ChecklistContext'
import ChatPanel from '../components/ChatPanel'
import StatusControl from '../components/StatusControl'
import EvidenceField from '../components/EvidenceField'
import CenteredMessage from '../components/CenteredMessage'

const statusLabel = { ok: 'Cumple', warn: 'Parcial', pending: 'Pendiente', na: 'No aplica' } as const
const statusColor = {
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  pending: 'text-danger bg-danger/10',
  na: 'text-muted bg-muted/10',
} as const

const resultBorderClass = {
  ok: 'border-ok',
  warn: 'border-warn',
  pending: 'border-danger',
  na: 'border-muted',
} as const

export default function ChecklistItemPage() {
  const { projectId = '', visitId = '', itemId } = useParams()
  const project = useProject(projectId)
  const { itemsState, markManually, addEvidence, sendItemMessage, loading: checklistLoading } = useProjectChecklist(projectId, visitId)
  const def = checklistDef.find((d) => d.id === itemId)

  if (project.loading || checklistLoading) return <CenteredMessage text="Cargando..." />
  if (!project.data || !def) {
    return (
      <CenteredMessage
        text={!project.data ? 'Proyecto no encontrado' : 'Ítem no encontrado'}
        linkTo="/checklist"
        linkLabel="← Volver al listado de proyectos"
      />
    )
  }
  const projectData = project.data

  const state = itemsState[def.id]
  const requirements = requiredEvidenceState(def, state.evidence)
  const manualMark = state.evidence.find((e) => e.source === 'manual-mark')

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <Link to={`/checklist/${projectId}/${visitId}`} className="inline-flex items-center gap-1 text-[12.5px] text-brand mb-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
          </svg>
          Volver al checklist completo
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] uppercase tracking-wide text-muted font-semibold">
              {projectData.name} · {def.section}
            </p>
            <h1 className="text-[19px] font-bold text-ink mt-0.5 leading-tight">{def.title}</h1>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md ${statusColor[state.status]}`}>
            {statusLabel[state.status]}
          </span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="max-w-xl mx-auto flex flex-col gap-5">
            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold">Qué busca validar la app</p>
              <ul className="mt-1.5 flex flex-col gap-1 list-disc pl-4">
                {def.appValidates.map((line, i) => (
                  <li key={i} className="text-[13.5px] text-ink leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold">Criterio normativo</p>
              <p className="mt-1.5 text-[13px] text-ink leading-relaxed">{def.regulatoryCriteria}</p>
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2.5">Conclusión</p>
              <StatusControl
                status={state.status}
                allowsNotApplicable={def.allowsNotApplicable}
                onMark={(status, reason) => markManually(def.id, status, reason)}
                size="md"
                hint={missingEvidenceHint(def, state.evidence)}
              />
              {state.status === 'na' && state.notApplicableReason && (
                <p className="text-[12px] text-muted mt-2 italic">No aplica: {state.notApplicableReason}</p>
              )}
              {state.source && (
                <p className="text-[11px] text-muted mt-2">
                  Origen actual: {state.source === 'manual' ? 'conclusión' : 'confirmado con evidencia de chat'}
                </p>
              )}
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2">
                Evidencia requerida ({requirements.filter((r) => r.fulfilled).length}/{requirements.length})
              </p>
              <div className="flex flex-col gap-3">
                {requirements.map((req, i) => (
                  <EvidenceField
                    key={i}
                    requirement={req}
                    onAdd={(text, previewUrl) =>
                      addEvidence(def.id, i, req.type === 'photo' ? 'photo' : 'text', text, previewUrl)
                    }
                  />
                ))}
                <div
                  className={`border-l-2 ${manualMark && manualMark.result ? resultBorderClass[manualMark.result] : 'border-hairline'} pl-3`}
                >
                  <p className="text-[12.5px] font-medium text-ink">Conclusión</p>
                  {manualMark ? (
                    <p className="mt-0.5 text-[12.5px] text-muted leading-snug">
                      <span className="font-mono text-[10.5px]">{manualMark.time}</span> — {manualMark.text}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[12.5px] text-muted italic">Pendiente — usa los botones Cumple/No cumple arriba.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside className="w-[380px] shrink-0 min-h-0 border-l border-hairline bg-white">
          <ChatPanel
            title="Chat de este ítem"
            subtitle="Todo lo que hables, escribas o subas acá queda asociado solo a este ítem — no hace falta que digas a cuál te refieres."
            messages={state.chat}
            placeholder="Cuéntame qué observaste para este ítem..."
            onSend={(text, type, previewUrl) => sendItemMessage(def.id, text, type, previewUrl)}
            micHint="Ya revisé este punto, cumple con lo que exige la norma."
          />
        </aside>
      </div>
    </div>
  )
}
