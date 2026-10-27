import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { checklistDef, SECTIONS, formName, type ChecklistStatus } from '../data/checklistMatrizInterior'
import { useProject, useProjectChecklist, useProjectVisits } from '../state/ChecklistContext'
import { useAuth } from '../lib/auth'
import ChecklistDesktopRow from '../components/ChecklistDesktopRow'
import ChatPanel from '../components/ChatPanel'
import RichTextEditor from '../components/RichTextEditor'
import CenteredMessage from '../components/CenteredMessage'
import MobilePanelTabs, { type MobilePanel } from '../components/MobilePanelTabs'
import VisitReport from '../components/VisitReport'
import { formatDateCl } from '../utils/date'
import { visitReportToPdfBase64 } from '../utils/reportPdf'

const statusSortOrder: Record<ChecklistStatus, number> = { pending: 0, warn: 1, ok: 2, na: 2 }

const visitStatusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const visitStatusColor = {
  en_curso: 'text-warn bg-warn/10',
  aprobada: 'text-ok bg-ok/10',
  rechazada: 'text-danger bg-danger/10',
} as const

export default function ChecklistProject() {
  const { projectId = '', visitId = '' } = useParams()
  const { auth } = useAuth()
  const project = useProject(projectId)
  const { itemsState, markManually, generalChat, sendGeneralMessage, resolveGeneralMessage, observations, setObservations, loading: checklistLoading, error: checklistError } =
    useProjectChecklist(projectId, visitId)
  const { visits, loading: visitsLoading, closeVisit, sendReport } = useProjectVisits(projectId)
  const visit = visits.find((v) => v.id === visitId)
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({})
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('primary')
  const reportRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)

  if (project.loading || checklistLoading || visitsLoading) return <CenteredMessage text="Cargando..." />
  if (!project.data || checklistError || !visit) {
    return (
      <CenteredMessage
        text={!project.data ? 'Proyecto no encontrado' : !visit ? 'Visita no encontrada' : 'No se pudo cargar el checklist'}
        linkTo="/checklist"
        linkLabel="← Volver al listado de proyectos"
      />
    )
  }
  const projectData = project.data

  // A visit's state only holds the items of its visit type's checklist.
  const visitDefs = checklistDef.filter((d) => itemsState[d.id])
  const total = visitDefs.length
  const completed = visitDefs.filter((d) => ['ok', 'na'].includes(itemsState[d.id]?.status)).length

  return (
    <>
    <div className="h-screen flex flex-col bg-base overflow-hidden print:hidden">
      <header className="border-b border-hairline bg-white px-4 py-2.5 md:px-6 md:py-4">
        <Link to={`/checklist/${projectId}`} className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg px-3.5 py-2 text-[12.5px]">
          ← Volver al historial de visitas
        </Link>
        <div className="mt-1.5 flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[17px] md:text-[19px] font-bold text-ink leading-tight">{projectData.name}</h1>
              <span
                className={`shrink-0 whitespace-nowrap text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${visitStatusColor[visit.status]}`}
              >
                {visitStatusLabel[visit.status]}
              </span>
            </div>
            <p className="text-[11.5px] text-muted mt-0.5">
              {formName} · Visita {formatDateCl(visit.date)}
              <span className="hidden md:inline"> · {auth?.user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-semibold text-brand whitespace-nowrap">
              {completed}/{total}
            </span>
            <div className="w-16 md:w-28 h-1.5 bg-hairline rounded-full overflow-hidden">
              <div className="h-full bg-ok transition-all" style={{ width: `${(total ? completed / total : 0) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-[11px] flex items-center gap-1.5 flex-wrap">
          {visit.status === 'en_curso' ? (
            <button
              type="button"
              onClick={() => closeVisit(visitId)}
              className="text-[11.5px] font-semibold text-brand hover:underline"
            >
              Cerrar visita
            </button>
          ) : visit.reportSentAt ? (
            <>
              <span className="text-ok font-medium">Informe enviado el {formatDateCl(visit.reportSentAt)}</span>
              <span className="hidden md:inline text-muted">· al Líder de Supervisores, con copia a quien lo emitió</span>
              <button
                type="button"
                onClick={() => window.print()}
                className="font-semibold text-brand hover:underline"
              >
                Descargar PDF
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={sending}
                onClick={async () => {
                  if (!reportRef.current) return
                  setSending(true)
                  setSendError(null)
                  try {
                    await sendReport(visitId, await visitReportToPdfBase64(reportRef.current))
                  } catch (err) {
                    setSendError(err instanceof Error && err.message ? err.message : 'No se pudo enviar el informe')
                  } finally {
                    setSending(false)
                  }
                }}
                className="text-[11.5px] font-semibold text-ok hover:underline disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar informe'}
              </button>
              {sendError && <span className="text-danger font-medium">{sendError}</span>}
            </>
          )}
        </div>
      </header>

      <MobilePanelTabs active={mobilePanel} onChange={setMobilePanel} primaryLabel="Checklist" />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main
          className={`${mobilePanel === 'primary' ? 'block' : 'hidden'} md:block flex-1 min-h-0 overflow-y-auto px-6 py-6`}
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {SECTIONS.map((section) => {
              const items = visitDefs.filter((d) => d.section === section)
              if (items.length === 0) return null

              const sectionComplete = items.every((d) => ['ok', 'na'].includes(itemsState[d.id]?.status))
              const expanded = expandedOverride[section] ?? !sectionComplete
              const sortedItems = [...items].sort(
                (a, b) => statusSortOrder[itemsState[a.id]?.status] - statusSortOrder[itemsState[b.id]?.status],
              )
              const doneCount = items.filter((d) => ['ok', 'na'].includes(itemsState[d.id]?.status)).length

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

        <aside
          className={`${mobilePanel === 'chat' ? 'block' : 'hidden'} md:block w-full md:w-[380px] md:shrink-0 min-h-0 border-l-0 md:border-l border-hairline bg-white`}
        >
          <ChatPanel
            title="Chat general del checklist"
            subtitle="Cuéntame qué revisaste sin indicar el ítem — yo identifico a cuál (o cuáles) corresponde y actualizo su estado."
            chatId={visitId}
            messages={generalChat}
            placeholder="Ej: la matriz está pintada y a la vista..."
            onSend={sendGeneralMessage}
            onSelectOption={resolveGeneralMessage}
          />
        </aside>
      </div>
    </div>
    <VisitReport
      project={projectData}
      visit={visit}
      visits={visits}
      itemsState={itemsState}
      observations={observations}
      supervisorName={auth?.user.name}
      reportRef={reportRef}
    />
    </>
  )
}
