import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { formName } from '../data/checklistMatrizInterior'
import { useProject, useProjectVisits, useUpdateProjectTechnicalData, type ProjectSummary, type VisitType } from '../state/ChecklistContext'
import { useReadOnly } from '../lib/auth'
import { formatDateCl } from '../utils/date'
import CenteredMessage from '../components/CenteredMessage'

export const visitTypeLabel: Record<VisitType, string> = { gas_prueba: 'Visita Gas de Prueba', gas_final: 'Visita Gas Final', visita_estandar: 'Visita Estándar' }
const statusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const statusColor = {
  en_curso: 'text-[#8A5300] md:text-warn bg-warn/10',
  aprobada: 'text-[#15803D] md:text-ok bg-ok/10',
  rechazada: 'text-[#B91C1C] md:text-danger bg-danger/10',
} as const

const inputCls =
  'w-full rounded-lg border border-hairline px-3 py-2 text-[14px] md:text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-base'

// Pressure / volume are not creation data: they are completed afterwards here.
function TechnicalData({ project, readOnly }: { project: ProjectSummary; readOnly: boolean }) {
  const update = useUpdateProjectTechnicalData()
  const [pressure, setPressure] = useState(project.servicePressureKpa?.toString() ?? '')
  const [volume, setVolume] = useState(project.matrixVolumeM3?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const parse = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))
  const p = parse(pressure)
  const v = parse(volume)
  const invalid = [p, v].some((n) => n !== undefined && (!Number.isFinite(n) || n <= 0))
  const dirty = p !== project.servicePressureKpa || v !== project.matrixVolumeM3

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      await update(project.id, { ...(p !== undefined && { servicePressureKpa: p }), ...(v !== undefined && { matrixVolumeM3: v }) })
      setMsg({ ok: true, text: 'Datos técnicos guardados.' })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'No se pudo guardar.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white border border-hairline rounded-xl px-4 md:px-5 py-4" aria-labelledby="datos-tecnicos">
      <h2 id="datos-tecnicos" className="text-[14px] font-semibold text-ink">Datos técnicos</h2>
      <p className="text-[12px] text-muted mt-0.5">Se usan para contrastar la prueba de hermeticidad (1,5× la presión de servicio).</p>
      <div className="grid gap-3 md:grid-cols-2 mt-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-ink">Presión de servicio (kPa)</span>
          <input inputMode="decimal" value={pressure} onChange={(e) => setPressure(e.target.value)} disabled={readOnly || saving} placeholder={readOnly ? '—' : 'Ej: 2,5'} className={inputCls} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-ink">Volumen de la matriz (m³)</span>
          <input inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} disabled={readOnly || saving} placeholder={readOnly ? '—' : 'Ej: 0,4'} className={inputCls} />
        </label>
      </div>
      {!readOnly && (
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={save}
            disabled={saving || invalid || !dirty}
            className="min-h-[44px] md:min-h-0 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-[14px] md:text-[12.5px] font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          {invalid && <span className="text-[12px] text-danger">Ingresa números positivos.</span>}
          {msg && <span role="status" className={`text-[12px] ${msg.ok ? 'text-ok' : 'text-danger'}`}>{msg.text}</span>}
        </div>
      )}
    </section>
  )
}

export default function ObraVisitas() {
  const { projectId = '' } = useParams()
  const nav = useNavigate()
  const readOnly = useReadOnly()
  const project = useProject(projectId)
  const { visits, loading, error, createVisit } = useProjectVisits(projectId)

  if (project.loading || loading) return <CenteredMessage text="Cargando..." />
  if (error || !project.data) {
    return <CenteredMessage text="Proyecto no encontrado" linkTo="/checklist" linkLabel="← Volver al listado de proyectos" />
  }
  const projectData = project.data

  const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date))
  const open = visits.find((v) => v.status === 'en_curso')

  async function startVisit(visitType: VisitType) {
    const visitId = await createVisit(visitType)
    nav(`/checklist/${projectId}/${visitId}`)
  }

  // One primary CTA per screen: continue the open visit, or start a new one.
  const actions = (cls: string) =>
    open ? (
      <Link to={`/checklist/${projectId}/${open.id}`} className={cls}>
        Continuar visita en curso
      </Link>
    ) : readOnly ? null : (
      (Object.keys(visitTypeLabel) as VisitType[]).map((t) => (
        <button key={t} type="button" onClick={() => startVisit(t)} className={cls}>
          {visitTypeLabel[t]}
        </button>
      ))
    )

  const primaryCls =
    'min-h-[44px] inline-flex items-center justify-center bg-brand hover:bg-brand-dark text-white text-[14px] md:text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand md:min-h-0'

  return (
    <div className="bg-base">
      <header className="px-4 pt-2 md:px-8 md:pt-8">
        <div className="max-w-4xl">
          <Link
            to="/checklist"
            className="inline-flex items-center gap-1 min-h-[44px] -ml-2 px-2 text-[14px] md:text-[12.5px] font-semibold text-brand hover:underline md:min-h-0 md:ml-0 md:px-0"
          >
            ← Proyectos
          </Link>
          <h1 className="text-2xl font-bold text-ink md:mt-2">{projectData.name}</h1>
          <p className="text-[14px] md:text-[13px] text-muted mt-1">
            {formName} · Contratista {projectData.installer}
          </p>
        </div>
      </header>

      <main className="px-4 py-4 md:px-8 md:py-6 pb-40 md:pb-6">
        <div className="max-w-4xl flex flex-col gap-4">
          <TechnicalData project={projectData} readOnly={readOnly} />
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[14px] font-semibold text-ink">Historial de visitas</h2>
            <div className="hidden md:flex items-center gap-2 flex-wrap">{actions(primaryCls)}</div>
          </div>

          {sorted.length === 0 && (
            <p className="text-[14px] md:text-[13px] text-muted italic">Todavía no hay visitas registradas para esta obra.</p>
          )}

          <div className="flex flex-col gap-2">
            {sorted.map((v) => (
              <Link
                key={v.id}
                to={`/checklist/${projectId}/${v.id}`}
                className="flex items-center justify-between gap-3 bg-white border border-hairline rounded-xl px-4 md:px-5 py-4 min-h-[64px] active:bg-brand/5 hover:shadow-sm hover:border-brand/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="min-w-0">
                  <p className="text-[15px] md:text-[13.5px] font-medium text-ink">{formatDateCl(v.date)}</p>
                  <p className="text-[13px] md:text-[11.5px] text-muted">{visitTypeLabel[v.visitType ?? 'gas_prueba']}</p>
                </div>
                <span className={`shrink-0 text-[13px] md:text-[11px] font-semibold px-2.5 md:px-2 py-1 rounded-md ${statusColor[v.status]}`}>
                  {statusLabel[v.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {(open || !readOnly) && (
        <div className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-hairline px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2">{actions(`${primaryCls} w-full`)}</div>
        </div>
      )}
    </div>
  )
}
