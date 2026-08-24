import { Link, useNavigate, useParams } from 'react-router-dom'
import { projects } from '../data/mock'
import { formName } from '../data/checklistMatrizInterior'
import { currentInspector, useProjectVisits } from '../state/ChecklistContext'

const statusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const statusColor = {
  en_curso: 'text-warn bg-warn/10',
  aprobada: 'text-ok bg-ok/10',
  rechazada: 'text-danger bg-danger/10',
} as const

export default function ObraVisitas() {
  const { projectId = '' } = useParams()
  const nav = useNavigate()
  const project = projects.find((p) => p.id === projectId)
  const { visits, createVisit } = useProjectVisits(projectId)

  if (!project) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <div className="text-center">
          <p className="text-ink font-semibold">Proyecto no encontrado</p>
          <Link to="/checklist" className="text-brand text-[13px] mt-2 inline-block">
            ← Volver al listado de proyectos
          </Link>
        </div>
      </div>
    )
  }

  const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date))
  const open = visits.find((v) => v.status === 'en_curso')

  function startVisit() {
    const visitId = createVisit()
    nav(`/checklist/${projectId}/${visitId}`)
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[19px] font-bold text-ink leading-tight">{project.name}</h1>
            <p className="text-[12.5px] text-muted mt-0.5">
              {formName} · Contratista {project.installer}
            </p>
          </div>
          <p className="text-[12px] text-muted">
            {currentInspector.name} · {currentInspector.role}
          </p>
        </div>
        <Link to="/checklist" className="inline-flex items-center gap-1 text-[12px] text-brand mt-3">
          ← Volver al listado de proyectos
        </Link>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[14px] font-semibold text-ink">Historial de visitas</h2>
            <button
              type="button"
              onClick={startVisit}
              className="bg-brand hover:bg-brand-dark text-white text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {open ? 'Continuar visita en curso' : 'Nueva visita'}
            </button>
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
                <p className="text-[13.5px] font-medium text-ink">{v.date}</p>
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
