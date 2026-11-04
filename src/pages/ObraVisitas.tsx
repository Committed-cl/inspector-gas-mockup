import { Link, useNavigate, useParams } from 'react-router-dom'
import { formName } from '../data/checklistMatrizInterior'
import { useProject, useProjectVisits, type VisitType } from '../state/ChecklistContext'
import { useReadOnly } from '../lib/auth'
import { formatDateCl } from '../utils/date'
import CenteredMessage from '../components/CenteredMessage'

export const visitTypeLabel: Record<VisitType, string> = { gas_prueba: 'Visita Gas de Prueba', gas_final: 'Visita Gas Final', visita_estandar: 'Visita Estándar' }
const statusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const statusColor = {
  en_curso: 'text-warn bg-warn/10',
  aprobada: 'text-ok bg-ok/10',
  rechazada: 'text-danger bg-danger/10',
} as const

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

  return (
    <div className="bg-base">
      <header className="px-5 pt-5 md:px-8 md:pt-8">
        <div className="max-w-4xl">
          <Link to="/checklist" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand hover:underline">
            ← Proyectos
          </Link>
          <h1 className="text-2xl font-bold text-ink mt-2">{projectData.name}</h1>
          <p className="text-[13px] text-muted mt-1">
            {formName} · Contratista {projectData.installer}
          </p>
        </div>
      </header>

      <main className="px-5 py-6 md:px-8">
        <div className="max-w-4xl flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[14px] font-semibold text-ink">Historial de visitas</h2>
            {open ? (
              <Link
                to={`/checklist/${projectId}/${open.id}`}
                className="bg-brand hover:bg-brand-dark text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Continuar visita en curso
              </Link>
            ) : readOnly ? null : (
              <div className="flex items-center gap-2 flex-wrap">
                {(Object.keys(visitTypeLabel) as VisitType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => startVisit(t)}
                    className="bg-brand hover:bg-brand-dark text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    {visitTypeLabel[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {sorted.length === 0 && (
            <p className="text-[13px] text-muted italic">Todavía no hay visitas registradas para esta obra.</p>
          )}

          <div className="flex flex-col gap-2">
            {sorted.map((v) => (
              <Link
                key={v.id}
                to={`/checklist/${projectId}/${v.id}`}
                className="flex items-center justify-between gap-4 bg-white border border-hairline rounded-xl px-5 py-4 hover:shadow-sm hover:border-brand/30 transition-all"
              >
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{formatDateCl(v.date)}</p>
                  <p className="text-[11.5px] text-muted">{visitTypeLabel[v.visitType ?? 'gas_prueba']}</p>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-1 rounded-md ${statusColor[v.status]}`}>
                  {statusLabel[v.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
