import { checklistDef, requiredEvidenceState, SECTIONS, formName, type ItemState } from '../data/checklistMatrizInterior'
import type { ProjectSummary, Visit } from '../state/ChecklistContext'
import { formatDateCl } from '../utils/date'
import { detectQualityAlerts } from '../utils/qualityAlerts'

type Props = {
  project: ProjectSummary
  visit: Visit
  visits: Visit[]
  itemsState: Record<string, ItemState>
  observations: string
  supervisorName?: string
  reportRef?: React.Ref<HTMLDivElement>
}

const visitTypeLabel = { gas_prueba: 'Gas de prueba', gas_final: 'Gas final' } as const
const resultLabel = { ok: 'Cumple', warn: 'No cumple', na: 'No aplica', pending: 'Pendiente' } as const
const resultColor = { ok: 'text-ok', warn: 'text-danger', na: 'text-muted', pending: 'text-warn' } as const

const th = 'border border-hairline bg-brand-soft px-2 py-1 text-left font-semibold'
const td = 'border border-hairline px-2 py-1 align-top'

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 break-inside-avoid-page">
      <h2 className="text-[13px] font-bold text-brand border-b border-hairline pb-1 mb-2 uppercase">
        {n}. {title}
      </h2>
      {children}
    </section>
  )
}

// Print-only visit report (the "Descargar PDF" action prints the page, see
// ChecklistProject). Hidden on screen.
export default function VisitReport({ project, visit, visits, itemsState, observations, supervisorName, reportRef }: Props) {
  const defs = checklistDef.filter((d) => itemsState[d.id])
  const statusOf = (id: string) => itemsState[id].status
  const count = (s: string, list = defs) => list.filter((d) => statusOf(d.id) === s).length
  const total = defs.length
  const ok = count('ok')
  const warn = count('warn')
  const na = count('na')
  const pending = count('pending')
  const applicable = total - na
  const compliance = applicable ? Math.round((ok / applicable) * 100) : 100

  // "No aplica" items demand no evidence, so they contribute no requirements.
  const reqs = (id: string) =>
    statusOf(id) === 'na' ? [] : requiredEvidenceState(defs.find((d) => d.id === id)!, itemsState[id].evidence)
  const allReqs = defs.flatMap((d) => reqs(d.id))
  const photoReqs = allReqs.filter((r) => r.type === 'photo')
  const photosLoaded = photoReqs.filter((r) => r.fulfilled).length
  const missingPhotos = photoReqs.length - photosLoaded
  const missingDeclarations = allReqs.filter((r) => r.type !== 'photo' && !r.fulfilled).length

  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex((v) => v.id === visit.id)
  const previous = idx > 0 ? sorted[idx - 1] : undefined
  const approved = visit.status === 'aprobada'

  // Pending actions: items not in "Cumple"/"No aplica", plus items missing mandatory evidence.
  const actions = defs.flatMap((d) => {
    const s = statusOf(d.id)
    const missing = reqs(d.id).filter((r) => !r.fulfilled).map((r) => r.label.toLowerCase())
    if (s === 'warn') return [{ d, text: `Corregir: ${d.title}.`, section: d.section }]
    if (s === 'pending') return [{ d, text: `Declarar el estado de: ${d.title}.`, section: d.section }]
    if (s === 'ok' && missing.length) return [{ d, text: `Cargar ${missing.join(', ')} en: ${d.title}.`, section: d.section }]
    return []
  })

  const qualityAlerts = detectQualityAlerts(defs, itemsState, {
    servicePressureKpa: project.servicePressureKpa,
    matrixVolumeM3: project.matrixVolumeM3,
  })

  const sentOn = visit.reportSentAt ? formatDateCl(visit.reportSentAt) : 'pendiente de envío'
  const kv = (label: string, value: string) => (
    <tr>
      <td className={`${td} font-semibold w-1/3 bg-base`}>{label}</td>
      <td className={td}>{value}</td>
    </tr>
  )

  return (
    <div ref={reportRef} className="hidden print:block text-[10.5px] text-ink leading-snug">
      <header className="border-b-2 border-brand pb-2">
        <div className="text-[9px] text-muted">Logo de la empresa cliente</div>
        <h1 className="text-[17px] font-bold text-brand">INFORME DE VISITA DE SUPERVISOR DE OBRA</h1>
        <p className="font-semibold">{formName}</p>
        <p>
          {visitTypeLabel[visit.visitType]} · {project.name}
        </p>
        <p className="text-muted">
          Fecha de visita: {formatDateCl(visit.date)} · Fecha de envío: {sentOn} · Supervisor: {supervisorName ?? '—'}
        </p>
      </header>

      <Section n={1} title="Datos de la visita">
        <table className="w-full border-collapse">
          <tbody>
            {kv('Proyecto', project.name)}
            {kv('Dirección', project.address)}
            {kv('Constructora', project.builder)}
            {kv('Instaladora', project.installer)}
            {kv('Supervisor de obra', supervisorName ?? '—')}
            {kv('Tipo de visita', `${visitTypeLabel[visit.visitType]} (${total} ítems)`)}
            {kv('Fecha de visita', formatDateCl(visit.date))}
            {kv('Fecha de envío', sentOn)}
            {kv(
              'N° de visita',
              `${idx + 1}${previous ? ` — visita anterior (${formatDateCl(previous.date)}): ${previous.status === 'aprobada' ? 'Aprobada' : previous.status === 'rechazada' ? 'Rechazada' : 'En curso'}` : ''}`,
            )}
            {kv('ID de la visita', visit.id)}
          </tbody>
        </table>
      </Section>

      <Section n={2} title="Resultado de la visita">
        <p className={`text-[24px] font-extrabold ${approved ? 'text-ok' : 'text-danger'}`}>
          {approved ? 'APROBADA' : 'RECHAZADA'}
        </p>
        <p>
          {approved
            ? 'Todos los ítems aplicables quedaron en "Cumple" con su evidencia obligatoria cargada.'
            : `La visita no cumple las condiciones de aprobación: ${warn} ítem(s) en "No cumple", ${pending} pendiente(s), ${missingPhotos} foto(s) obligatoria(s) sin cargar y ${missingDeclarations} declaración(es) obligatoria(s) faltante(s).`}
        </p>
        <p className="text-muted mt-1">
          Regla de dictamen: la visita se aprueba solo si el 100% de los ítems aplicables queda en "Cumple" con su evidencia
          obligatoria cargada. Un solo ítem en "No cumple" rechaza la visita.
        </p>
      </Section>

      <Section n={3} title="Indicadores">
        <table className="w-full border-collapse">
          <tbody>
            {kv('Total de ítems', String(total))}
            {kv('Cumple', String(ok))}
            {kv('No cumple', String(warn))}
            {kv('No aplica', String(na))}
            {kv('% de cumplimiento (sobre ítems aplicables)', `${compliance}%`)}
            {kv('Fotos obligatorias cargadas', `${photosLoaded}/${photoReqs.length}`)}
          </tbody>
        </table>
      </Section>

      <Section n={4} title="Resultado por sección">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Sección', 'Ítems', 'Cumple', 'No cumple', 'No aplica', 'Estado'].map((h) => (
                <th key={h} className={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => {
              const list = defs.filter((d) => d.section === s)
              if (!list.length) return null
              const w = count('warn', list)
              const p = count('pending', list)
              return (
                <tr key={s}>
                  <td className={td}>{s}</td>
                  <td className={td}>{list.length}</td>
                  <td className={td}>{count('ok', list)}</td>
                  <td className={td}>{w}</td>
                  <td className={td}>{count('na', list)}</td>
                  <td className={`${td} font-semibold ${w ? 'text-danger' : p ? 'text-warn' : 'text-ok'}`}>
                    {w ? 'No cumple' : p ? 'Pendiente' : 'Cumple'}
                  </td>
                </tr>
              )
            })}
            <tr className="font-bold">
              <td className={td}>Total</td>
              <td className={td}>{total}</td>
              <td className={td}>{ok}</td>
              <td className={td}>{warn}</td>
              <td className={td}>{na}</td>
              <td className={td}>{approved ? 'Aprobada' : 'Rechazada'}</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section n={5} title="Acciones requeridas antes de la próxima visita">
        {actions.length === 0 ? (
          <p>Sin acciones pendientes.</p>
        ) : (
          <ol className="list-decimal pl-5 space-y-0.5">
            {SECTIONS.flatMap((s) => actions.filter((a) => a.section === s)).map((a) => (
              <li key={a.d.id}>
                {a.text}
                {statusOf(a.d.id) === 'warn' && <span className="font-semibold text-danger"> (bloqueante)</span>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section n={6} title="Alertas de control de calidad (detectadas por la plataforma)">
        {qualityAlerts.length === 0 ? (
          <p>Sin alertas detectadas.</p>
        ) : (
          <ol className="list-decimal pl-5 space-y-0.5">
            {qualityAlerts.map((a, i) => (
              <li key={i}>
                <span className="font-semibold">{a.title}:</span> {a.text}
              </li>
            ))}
          </ol>
        )}
      </Section>

      {observations && observations !== '<p></p>' && (
        <Section n={7} title="Observaciones del supervisor">
          <div dangerouslySetInnerHTML={{ __html: observations }} />
        </Section>
      )}

      <Section n={8} title="Anexo de detalle del checklist">
        {SECTIONS.map((s) => {
          const list = defs.filter((d) => d.section === s)
          if (!list.length) return null
          return (
            <div key={s} className="mb-3">
              <h3 className="font-bold mb-1">
                {s} — {count('ok', list)} cumple, {count('warn', list)} no cumple, {count('na', list)} no aplica
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={th}>Ítem</th>
                    <th className={th}>Resultado</th>
                    <th className={th}>Comentario del supervisor</th>
                    <th className={th}>Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((d) => {
                    const st = itemsState[d.id]
                    // Evidence is appended chronologically: the last declaration is the current one.
                    const comment = [...st.evidence].reverse().find((e) => e.type !== 'photo' && e.source !== 'manual-mark')?.text
                    return (
                      <tr key={d.id} className="break-inside-avoid">
                        <td className={td}>{d.title}</td>
                        <td className={`${td} font-semibold ${resultColor[st.status]}`}>{resultLabel[st.status]}</td>
                        <td className={td}>{comment ?? st.notApplicableReason ?? 'sin comentario registrado'}</td>
                        <td className={td}>
                          {reqs(d.id).map((r, i) => (
                            <div key={i}>
                              {r.label}:{' '}
                              {r.fulfilled ? (
                                'cargada'
                              ) : r.type === 'photo' ? (
                                <b className="text-danger">FOTO OBLIGATORIA no cargada</b>
                              ) : (
                                'sin declaración'
                              )}
                              {r.evidence?.previewUrl && (
                                <img src={r.evidence.previewUrl} alt="" className="mt-1 h-16 w-auto border border-hairline" />
                              )}
                            </div>
                          ))}
                          {st.status === 'na' && <div className="text-muted">no aplica</div>}
                          {st.status !== 'na' && !d.requiredEvidence.some((r) => r.type === 'photo') && (
                            <div className="text-muted">no requiere imagen</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        })}
      </Section>

      <Section n={9} title="Validación y distribución">
        <p>
          Informe emitido por {supervisorName ?? 'el supervisor de obra'}
          {visit.reportSentAt ? ` el ${formatDateCl(visit.reportSentAt)}` : ''}.
        </p>
        <p className="text-muted mt-1">
          El respaldo completo (fotos en resolución completa, documentos y la conversación de la visita) queda disponible en la
          plataforma bajo el ID de visita {visit.id}.
        </p>
      </Section>
    </div>
  )
}
