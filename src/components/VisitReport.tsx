import { Fragment } from 'react'
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
  supervisorCompany?: string
  reportRef?: React.Ref<HTMLDivElement>
}

const visitTypeLabel = { gas_prueba: 'Gas de prueba', gas_final: 'Gas final', visita_estandar: 'Estándar' } as const
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
export default function VisitReport({ project, visit, visits, itemsState, observations, supervisorName, supervisorCompany, reportRef }: Props) {
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

  const supervisorRole = supervisorCompany ? `Supervisor de ${supervisorCompany}` : 'Supervisor de obra'
  const sorted = [...visits].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex((v) => v.id === visit.id)
  const previous = idx > 0 ? sorted[idx - 1] : undefined
  const approved = visit.status === 'aprobada'

  // Pending actions, grouped by cause (section + kind of problem) instead of one line per item:
  // items in "No cumple" or "Pendiente", plus items missing mandatory evidence.
  const actionKinds = [
    { kind: 'warn', blocking: true, text: (titles: string[], section: string) => `Corregir en ${section}: ${titles.join('; ')}.` },
    { kind: 'pending', blocking: false, text: (titles: string[], section: string) => `Declarar el estado en ${section}: ${titles.join('; ')}.` },
    { kind: 'evidence', blocking: false, text: (titles: string[], section: string) => `Cargar la evidencia obligatoria faltante en ${section}: ${titles.join('; ')}.` },
  ]
  const kindOf = (id: string) => {
    const s = statusOf(id)
    if (s === 'warn' || s === 'pending') return s
    return s === 'ok' && reqs(id).some((r) => !r.fulfilled) ? 'evidence' : null
  }
  const actions = SECTIONS.flatMap((section) =>
    actionKinds.flatMap((k) => {
      const titles = defs.filter((d) => d.section === section && kindOf(d.id) === k.kind).map((d) => d.title)
      return titles.length ? [{ key: `${section}-${k.kind}`, text: k.text(titles, section), blocking: k.blocking }] : []
    }),
  )

  const qualityAlerts = detectQualityAlerts(defs, itemsState, {
    servicePressureKpa: project.servicePressureKpa,
    matrixVolumeM3: project.matrixVolumeM3,
  })

  const sentOn = visit.reportSentAt ? formatDateCl(visit.reportSentAt) : 'pendiente de envío'
  // Label/value pairs laid out two per row (4 columns) to use the page width.
  const kvGrid = (pairs: [string, string][]) => (
    <table className="w-full border-collapse table-fixed">
      <tbody>
        {Array.from({ length: Math.ceil(pairs.length / 2) }, (_, i) => pairs.slice(i * 2, i * 2 + 2)).map((row) => (
          <tr key={row[0][0]}>
            {row.map(([label, value]) => (
              <Fragment key={label}>
                <td className={`${td} font-semibold w-[17%] bg-base`}>{label}</td>
                <td className={`${td} w-[33%]`}>{value}</td>
              </Fragment>
            ))}
            {row.length < 2 && <td className={td} colSpan={2} />}
          </tr>
        ))}
      </tbody>
    </table>
  )

  const indicators: { label: string; value: string; detail?: string; color: string }[] = [
    { label: 'Total de ítems', value: String(total), color: 'text-ink' },
    { label: 'Cumple', value: String(ok), color: 'text-ok' },
    { label: 'No cumple', value: String(warn), color: 'text-danger' },
    { label: 'No aplica', value: String(na), color: 'text-muted' },
    { label: '% de cumplimiento (ítems aplicables)', value: `${compliance}%`, detail: `(${ok} de ${applicable} aplicables)`, color: 'text-brand' },
    { label: 'Fotos obligatorias cargadas', value: `${photosLoaded}/${photoReqs.length}`, color: 'text-ink' },
  ]

  return (
    <div ref={reportRef} className="hidden print:block text-[10.5px] text-ink leading-snug">
      <header className="border-b-2 border-brand pb-2">
        <div className="text-[9px] text-muted">Logo de la empresa cliente</div>
        <h1 className="text-[17px] font-bold text-brand">INFORME DE VISITA DE SUPERVISOR DE OBRA</h1>
        <p className="text-[11px] font-semibold text-muted">Supervisa360</p>
        <p className="font-semibold">{formName}</p>
        <p>
          Visita {visitTypeLabel[visit.visitType]} · {project.name}
        </p>
        <p className="text-muted">
          Fecha de visita: {formatDateCl(visit.date)} · Fecha de envío: {sentOn}
        </p>
        <p>
          <span className="font-semibold">Supervisor de obra {supervisorName ?? '—'}</span> · {supervisorRole} · realizó la
          visita y emite este informe
        </p>
      </header>

      <Section n={1} title="Datos de la visita">
        {kvGrid([
          ['Proyecto', project.name],
          ['Código de proyecto', project.projectCode ?? '—'],
          ['Dirección', project.address],
          ['Constructora', project.builder],
          ['Instaladora', project.installer],
          ['Supervisor de obra', supervisorCompany ? `${supervisorName ?? '—'} · ${supervisorRole}` : (supervisorName ?? '—')],
          ['Tipo de visita', `${visitTypeLabel[visit.visitType]} (${total} ítems)`],
          ['N° de visita', `${idx + 1}${previous ? ` — anterior (${formatDateCl(previous.date)}): ${previous.status === 'aprobada' ? 'Aprobada' : previous.status === 'rechazada' ? 'Rechazada' : 'En curso'}` : ''}`],
          ['Fecha de visita', formatDateCl(visit.date)],
          ['Fecha de envío', sentOn],
          ['ID de la visita', visit.id],
        ])}
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
        <div className="grid grid-cols-6 gap-2">
          {indicators.map((i) => (
            <div key={i.label} className="border border-hairline rounded px-2 py-2 text-center">
              <div className={`text-[20px] font-extrabold ${i.color}`}>{i.value}</div>
              {i.detail && <div className="text-[9px] font-semibold text-muted">{i.detail}</div>}
              <div className="text-muted">{i.label}</div>
            </div>
          ))}
        </div>
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
              const allNa = count('na', list) === list.length
              return (
                <tr key={s}>
                  <td className={td}>{s}</td>
                  <td className={td}>{list.length}</td>
                  <td className={td}>{count('ok', list)}</td>
                  <td className={td}>{w}</td>
                  <td className={td}>{count('na', list)}</td>
                  <td className={`${td} font-semibold ${w ? 'text-danger' : p ? 'text-warn' : allNa ? 'text-muted' : 'text-ok'}`}>
                    {w || p ? 'Con brechas' : allNa ? 'No aplica' : 'Cumple'}
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
            {actions.map((a) => (
              <li key={a.key}>
                {a.text}
                {a.blocking && <span className="font-semibold text-danger"> (bloqueante)</span>}
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

      <Section n={7} title="Observaciones del supervisor">
        {observations && observations !== '<p></p>' ? (
          <div dangerouslySetInnerHTML={{ __html: observations }} />
        ) : (
          <p>Sin observaciones.</p>
        )}
      </Section>

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
        <p className="mt-1">
          Distribución: Para: Líder de Supervisores. Copia: {supervisorName ?? 'supervisor que emite el informe'}.
        </p>
        <p className="text-muted mt-1">
          Este informe consolida las declaraciones y evidencias registradas en terreno por el supervisor. No reemplaza la declaración ni la certificación de la instalación ante la SEC.
        </p>
        <p className="text-muted mt-1">
          El respaldo completo (fotos en resolución completa, documentos y la conversación de la visita) queda disponible en la
          plataforma bajo el ID de visita {visit.id}.
        </p>
      </Section>
    </div>
  )
}
