import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { checklistDef, SECTIONS, formName, type ChecklistStatus } from '../data/checklistMatrizInterior'
import { useProjectChecklist, useProjectVisits, currentInspector } from '../state/ChecklistContext'
import { projects } from '../data/mock'
import ChecklistDesktopRow from '../components/ChecklistDesktopRow'
import ChatPanel from '../components/ChatPanel'
import RichTextEditor from '../components/RichTextEditor'
import { formatDateCl } from '../utils/date'

const statusSortOrder: Record<ChecklistStatus, number> = { pending: 0, warn: 1, ok: 2, na: 2 }

const reportRecipients = ['supervisor@metrogas.cl', 'jefeobra@andes.cl', 'operaciones@gastec.cl']

const visitStatusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const visitStatusColor = {
  en_curso: 'text-warn bg-warn/10',
  aprobada: 'text-ok bg-ok/10',
  rechazada: 'text-danger bg-danger/10',
} as const

export default function ChecklistProject() {
  const { projectId = '', visitId = '' } = useParams()
  const project = projects.find((p) => p.id === projectId)
  const { itemsState, markManually, generalChat, sendGeneralMessage, resolveGeneralMessage, observations, setObservations } =
    useProjectChecklist(projectId, visitId)
  const { visits, closeVisit, sendReport } = useProjectVisits(projectId)
  const visit = visits.find((v) => v.id === visitId)
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({})

  if (!project || !visit) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <div className="text-center">
          <p className="text-ink font-semibold">{!project ? 'Proyecto no encontrado' : 'Visita no encontrada'}</p>
          <Link to="/checklist" className="text-brand text-[13px] mt-2 inline-block">
            ← Volver al listado de proyectos
          </Link>
        </div>
      </div>
    )
  }

  const total = checklistDef.length
  const completed = checklistDef.filter((d) => ['ok', 'na'].includes(itemsState[d.id].status)).length

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10.5px] font-semibold uppercase tracking-wide mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Nuevo · versión desktop
            </div>
            <h1 className="text-[19px] font-bold text-ink leading-tight">{project.name}</h1>
            <p className="text-[12.5px] text-muted mt-0.5 flex items-center gap-1.5">
              {formName} · Visita {formatDateCl(visit.date)}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${visitStatusColor[visit.status]}`}>
                {visitStatusLabel[visit.status]}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted">
              {currentInspector.name} · {currentInspector.role}
            </p>
            <div className="mt-1.5 flex items-center gap-2 justify-end">
              <span className="text-[12px] font-semibold text-brand whitespace-nowrap">
                {completed}/{total} completados
              </span>
              <div className="w-28 h-1.5 bg-hairline rounded-full overflow-hidden">
                <div className="h-full bg-ok transition-all" style={{ width: `${(completed / total) * 100}%` }} />
              </div>
            </div>
            {visit.status === 'en_curso' ? (
              <button
                type="button"
                onClick={() => closeVisit(visitId)}
                className="mt-2 text-[11.5px] font-semibold text-brand hover:underline"
              >
                Cerrar visita
              </button>
            ) : visit.reportSentAt ? (
              <div className="mt-2">
                <p className="text-[11px] text-ok font-medium">Informe enviado el {formatDateCl(visit.reportSentAt)}</p>
                <p className="text-[10.5px] text-muted mt-0.5">a {reportRecipients.join(', ')}</p>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="mt-1 text-[11.5px] font-semibold text-brand hover:underline"
                >
                  Descargar PDF
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => sendReport(visitId)}
                className="mt-2 text-[11.5px] font-semibold text-ok hover:underline"
              >
                Enviar informe
              </button>
            )}
          </div>
        </div>
        <Link to={`/checklist/${projectId}`} className="inline-flex items-center gap-1 text-[12px] text-brand mt-3">
          ← Volver al historial de visitas
        </Link>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {SECTIONS.map((section) => {
              const items = checklistDef.filter((d) => d.section === section)
              if (items.length === 0) return null

              const sectionComplete = items.every((d) => ['ok', 'na'].includes(itemsState[d.id].status))
              const expanded = expandedOverride[section] ?? !sectionComplete
              const sortedItems = [...items].sort(
                (a, b) => statusSortOrder[itemsState[a.id].status] - statusSortOrder[itemsState[b.id].status],
              )
              const doneCount = items.filter((d) => ['ok', 'na'].includes(itemsState[d.id].status)).length

              return (
                <section key={section}>
                  <button
                    type="button"
                    onClick={() => setExpandedOverride((prev) => ({ ...prev, [section]: !expanded }))}
                    className="w-full flex items-center justify-between gap-2 mb-3 group"
                  >
                    <span className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`h-3.5 w-3.5 text-brand transition-transform ${expanded ? 'rotate-90' : ''}`}
                      >
                        <path d="M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L13.58 12 9.3 7.7a1 1 0 0 1 0-1.4Z" />
                      </svg>
                      <h2 className="text-[12px] uppercase tracking-wide text-brand font-semibold">{section}</h2>
                      {sectionComplete && (
                        <span className="text-[10px] font-medium text-ok bg-ok/10 px-1.5 py-0.5 rounded-md">
                          completa
                        </span>
                      )}
                    </span>
                    <span className="text-[11px] text-muted group-hover:text-brand">
                      {doneCount}/{items.length}
                    </span>
                  </button>
                  {expanded && (
                    <div className="flex flex-col gap-2">
                      {sortedItems.map((def) => (
                        <ChecklistDesktopRow
                          key={def.id}
                          def={def}
                          state={itemsState[def.id]}
                          projectId={projectId}
                          visitId={visitId}
                          onMark={(status, reason) => markManually(def.id, status, reason)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )
            })}

            <section>
              <h2 className="text-[12px] uppercase tracking-wide text-brand font-semibold mb-1">Observaciones</h2>
              <p className="text-[11.5px] text-muted mb-3">Notas generales del inspector — se agregan al final del informe.</p>
              <RichTextEditor
                key={visitId}
                value={observations}
                onChange={setObservations}
                placeholder="Escribe aquí observaciones generales de la visita..."
              />
            </section>
          </div>
        </main>

        <aside className="w-[380px] shrink-0 min-h-0 border-l border-hairline bg-white">
          <ChatPanel
            title="Chat general del checklist"
            subtitle="Cuéntame qué revisaste sin indicar el ítem — yo identifico a cuál (o cuáles) corresponde y actualizo su estado."
            messages={generalChat}
            placeholder="Ej: la matriz está pintada y a la vista..."
            onSend={sendGeneralMessage}
            micHint="Revisé el manifold, está pintado, y el bastón de la red interior tiene marcado el número de cada departamento."
            attachHint="Aquí tienes una foto."
            onSelectOption={resolveGeneralMessage}
          />
        </aside>
      </div>
    </div>
  )
}
