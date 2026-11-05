import { useRef, useState } from 'react'
import { useOnline } from '../lib/useOnline'
import { Link, useParams } from 'react-router-dom'
import { checklistDef, SECTIONS, formName, type ChecklistStatus } from '../data/checklistMatrizInterior'
import { useChecklist, useProject, useProjectChecklist, useProjectVisits } from '../state/ChecklistContext'
import { useAuth, useRoleReadOnly, VisitClosedProvider } from '../lib/auth'
import ChecklistDesktopRow from '../components/ChecklistDesktopRow'
import ChatPanel from '../components/ChatPanel'
import RichTextEditor from '../components/RichTextEditor'
import CenteredMessage from '../components/CenteredMessage'
import ChatSheet from '../components/ChatSheet'
import VisitReport from '../components/VisitReport'
import { formatDateCl } from '../utils/date'
import { actionButtonPrimary, actionButtonSecondary } from '../lib/actionButton'
import { downloadVisitReportPdf, visitReportToPdfBase64 } from '../utils/reportPdf'
import { SyncSlot } from '../components/SyncStatus'
import Icon from '../components/Icon'

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
  const roleReadOnly = useRoleReadOnly()
  const project = useProject(projectId)
  const { itemsState, markManually, generalChat, sendGeneralMessage, resolveGeneralMessage, observations, setObservations, loading: checklistLoading, error: checklistError } =
    useProjectChecklist(projectId, visitId)
  const { visits, loading: visitsLoading, closeVisit, reopenVisit, sendReport } = useProjectVisits(projectId)
  const visit = visits.find((v) => v.id === visitId)
  const [expandedOverride, setExpandedOverride] = useState<Record<string, boolean>>({})
  const [chatOpen, setChatOpen] = useState(false)
  const [compact, setCompact] = useState(false)
  const { sync } = useChecklist()
  const reportRef = useRef<HTMLDivElement>(null)
  const [sending, setSending] = useState(false)
  const online = useOnline()
  const canReopen = !!auth && (auth.user.isAdmin || auth.user.role === 'admin-convenio')
  const [reopening, setReopening] = useState(false)
  const [reopenError, setReopenError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  if (project.loading || checklistLoading || visitsLoading) return <CenteredMessage text="Cargando..." />
  if (!project.data || checklistError || !visit) {
    return (
      <CenteredMessage
        text={!project.data ? 'Proyecto no encontrado' : !visit ? 'Visita no encontrada' : 'No se pudo cargar el checklist'}
        linkTo="/checklist"
        linkLabel="Volver al listado de proyectos"
      />
    )
  }
  const projectData = project.data

  // A visit's state only holds the items of its visit type's checklist.
  const visitDefs = checklistDef.filter((d) => itemsState[d.id])
  const total = visitDefs.length
  const completed = visitDefs.filter((d) => ['ok', 'na'].includes(itemsState[d.id]?.status)).length
  const pendingCount = visitDefs.filter((d) => itemsState[d.id]?.status === 'pending').length
  const syncBusy = sync.phase === 'syncing' || sync.pendingCount > 0
  const syncText = !sync.online ? `Sin conexión · ${sync.pendingCount} pendientes` : syncBusy ? 'Sincronizando…' : 'Sincronizado'
  const syncDot = !sync.online ? 'bg-warn' : syncBusy ? 'bg-brand animate-pulse' : 'bg-ok'

  const vops = sync.visitOps(visitId)
  const queueBusy = vops.pending > 0 || vops.held > 0 || vops.failed.length > 0
  const queueTitle = !online ? 'Requiere conexión' : queueBusy ? 'Primero deben sincronizarse los cambios de esta visita' : undefined
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

  const syncNotice = (
    <>
      {vops.pending > 0 && (
        <span className="text-brand font-medium" role="status" data-testid="visit-syncing">
          Sincronizando {plural(vops.pending, 'cambio', 'cambios')}…
        </span>
      )}
      {vops.held > 0 && (
        <span className="text-warn font-medium" role="status" data-testid="visit-closed-held">
          {plural(vops.held, 'cambio pendiente', 'cambios pendientes')}: visita cerrada. Se enviarán al reabrir la visita.
        </span>
      )}
      {vops.failed.length > 0 && (
        <>
          <span className="text-danger font-medium" role="alert">
            {plural(vops.failed.length, 'cambio rechazado', 'cambios rechazados')} por el servidor.
          </span>
          <button type="button" className="text-brand font-medium underline" onClick={() => sync.retryVisit(visitId)}>
            Reintentar
          </button>
          <button
            type="button"
            className="text-danger font-medium underline"
            onClick={() => window.confirm('¿Descartar los cambios no enviados de esta visita? No se podrán recuperar.') && sync.discardVisit(visitId)}
          >
            Descartar
          </button>
        </>
      )}
    </>
  )

  const actions = (mobile: boolean) => (
    <>
          {syncNotice}
          {roleReadOnly ? null : visit.status === 'en_curso' ? (
            <>
              {mobile && pendingCount > 0 && (
                <p className="w-full text-[13px] text-warn-ink font-medium" role="status">
                  No puedes cerrar: {pendingCount === 1 ? 'falta 1 ítem' : `faltan ${pendingCount} ítems`} por marcar.
                </p>
              )}
              <button
                type="button"
                disabled={!online || queueBusy || (mobile && pendingCount > 0)}
                title={queueTitle}
                onClick={() => closeVisit(visitId).catch((err) => setSendError(err instanceof Error ? err.message : 'No se pudo cerrar la visita'))}
                className={`${actionButtonPrimary} ${mobile ? 'w-full' : ''}`}
              >
                Cerrar visita
              </button>
              {sendError && <span className="text-danger font-medium">{sendError}</span>}
            </>
          ) : visit.reportSentAt && !(visit.reopenedAt && visit.reopenedAt > visit.reportSentAt) ? (
            <>
              <span className="text-ok font-medium">Informe enviado el {formatDateCl(visit.reportSentAt)}</span>
              <span className="hidden md:inline text-muted">· al Líder de Supervisores, con copia a quien lo emitió</span>
              <button
                type="button"
                disabled={queueBusy}
                title={queueTitle}
                onClick={() => reportRef.current && downloadVisitReportPdf(reportRef.current, visitId)}
                className={actionButtonSecondary}
              >
                Descargar informe
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={sending || !online || queueBusy}
                title={queueTitle}
                onClick={async () => {
                  if (!reportRef.current) return
                  setSending(true)
                  setSendError(null)
                  try {
                    await sendReport(visitId, await visitReportToPdfBase64(reportRef.current, visitId))
                  } catch (err) {
                    setSendError(err instanceof Error && err.message ? err.message : 'No se pudo enviar el informe')
                  } finally {
                    setSending(false)
                  }
                }}
                className={actionButtonPrimary}
              >
                {sending ? 'Enviando...' : 'Enviar informe'}
              </button>
              <button type="button" disabled={queueBusy} title={queueTitle} onClick={() => reportRef.current && downloadVisitReportPdf(reportRef.current, visitId)} className={actionButtonSecondary}>
                Descargar informe
              </button>
              {sendError &&<span className="text-danger font-medium">{sendError}</span>}
            </>
          )}
          {visit.status === 'en_curso' && visit.reopenedAt && (
            <span className="text-muted">Reabierta por {visit.reopenedBy?.name ?? 'un administrador'} el {formatDateCl(visit.reopenedAt)}</span>
          )}
          {canReopen && visit.status !== 'en_curso' && (
            <button
              type="button"
              disabled={reopening || !online}
              title={online ? undefined : 'Requiere conexión'}
              onClick={async () => {
                if (!window.confirm('¿Reabrir esta visita? Volverá a estar en curso y podrá editarse. El informe ya enviado se conserva; al volver a cerrarla se podrá enviar uno nuevo.')) return
                setReopening(true)
                setReopenError(null)
                try {
                  await reopenVisit(visitId)
                } catch (err) {
                  setReopenError(err instanceof Error && err.message ? err.message : 'No se pudo reabrir la visita')
                } finally {
                  setReopening(false)
                }
              }}
              className={actionButtonSecondary}
            >
              {reopening ? 'Reabriendo...' : 'Reabrir visita'}
            </button>
          )}
          {reopenError && <span className="text-danger font-medium">{reopenError}</span>}
    </>
  )

  return (
    <VisitClosedProvider value={visit.status !== 'en_curso'}>
    <div className="h-[calc(100dvh-3.5rem-env(safe-area-inset-top))] md:h-screen flex flex-col bg-base overflow-hidden print:hidden">
      <header className="md:hidden border-b border-hairline bg-white px-2 pt-1 pb-2 shrink-0">
        <div className="flex items-center gap-1">
          <Link
            to={`/checklist/${projectId}`}
            aria-label="Volver al historial de visitas"
            className="h-11 w-11 shrink-0 grid place-items-center rounded-lg text-brand hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
              <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
            </svg>
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-[16px] font-bold text-ink leading-tight">{projectData.name}</h1>
          <span className={`shrink-0 whitespace-nowrap text-[11.5px] font-semibold px-2 py-1 rounded-md ${visitStatusColor[visit.status]}`}>
            {visitStatusLabel[visit.status]}
          </span>
        </div>
        {!compact && (
          <p className="px-2.5 text-[12px] text-muted leading-snug">
            {formName} · Visita {formatDateCl(visit.date)}
          </p>
        )}
        <div className="mt-1.5 px-2.5 flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-brand whitespace-nowrap">
            {completed}/{total}
          </span>
          <div
            className="flex-1 h-2 bg-hairline rounded-full overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={completed}
            aria-label="Ítems cubiertos"
          >
            <div className="h-full bg-ok transition-all" style={{ width: `${(total ? completed / total : 0) * 100}%` }} />
          </div>
          <span className="flex items-center gap-1.5 text-[12px] text-muted whitespace-nowrap" data-testid="header-sync">
            <span className={`h-2 w-2 rounded-full ${syncDot}`} aria-hidden />
            {syncText}
          </span>
        </div>
        <SyncSlot />
      </header>
      <header className="hidden md:block border-b border-hairline bg-white px-4 py-2.5 md:px-6 md:py-4">
        <Link to={`/checklist/${projectId}`} className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg px-3.5 py-2 text-[12.5px]">
          <Icon name="arrow-left" size={15} />Volver al historial de visitas
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
        <div className="hidden md:flex mt-2 text-[11px] items-center gap-2 flex-wrap">
          {actions(false)}
        </div>
      </header>

      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <main
          onScroll={(e) => setCompact(e.currentTarget.scrollTop > 24)}
          className="flex-1 min-h-0 overflow-y-auto px-3 py-3 md:px-6 md:py-6"
        >
          <div className="max-w-3xl mx-auto flex flex-col gap-3 md:gap-8 pb-20 md:pb-0">
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
                    className="w-full flex items-center justify-between gap-2 mb-1 md:mb-3 min-h-[44px] md:min-h-0 group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                    aria-expanded={expanded}
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
                        <span className="text-[10px] font-medium text-ok-ink md:text-ok bg-ok/10 px-1.5 py-0.5 rounded-md">
                          completa
                        </span>
                      )}
                    </span>
                    <span className="text-[13px] md:text-[11px] text-muted group-hover:text-brand">
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
                readOnly={roleReadOnly || visit.status !== 'en_curso'}
                placeholder="Escribe aquí observaciones generales de la visita..."
              />
            </section>
          </div>
        </main>

        <ChatSheet open={chatOpen} onClose={() => setChatOpen(false)}>
          <ChatPanel
            title="Chat general del checklist"
            subtitle="Cuéntame qué revisaste sin indicar el ítem — yo identifico a cuál (o cuáles) corresponde y actualizo su estado."
            chatId={visitId}
            messages={generalChat}
            placeholder="Ej: la matriz está pintada y a la vista..."
            onSend={sendGeneralMessage}
            onSelectOption={resolveGeneralMessage}
          />
        </ChatSheet>
        {!chatOpen && (
          <button
            type="button"
            onClick={() => setChatOpen(true)}
            aria-label="Abrir chat con IA"
            className="md:hidden absolute right-3 bottom-3 z-30 h-14 w-14 grid place-items-center rounded-full bg-brand text-white shadow-lg active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6" aria-hidden>
              <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4.3 3.4A.8.8 0 0 1 3.4 20.8V18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
            </svg>
          </button>
        )}
      </div>
      {!roleReadOnly && (
        <div className="md:hidden shrink-0 border-t border-hairline bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-wrap items-center gap-2 text-[12px]">
          {actions(true)}
        </div>
      )}
    </div>
    <VisitReport
      project={projectData}
      visit={visit}
      visits={visits}
      itemsState={itemsState}
      observations={observations}
      supervisorName={auth?.user.name}
      supervisorCompany={auth?.user.companyName}
      reportRef={reportRef}
    />
    </VisitClosedProvider>
  )
}
