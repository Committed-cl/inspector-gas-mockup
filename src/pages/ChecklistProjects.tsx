import { Link } from 'react-router-dom'
import { projects } from '../data/mock'
import { formName } from '../data/checklistMatrizInterior'
import { currentInspector, useChecklist } from '../state/ChecklistContext'
import { formatDateCl } from '../utils/date'

const visitStatusLabel = { en_curso: 'En curso', aprobada: 'Aprobada', rechazada: 'Rechazada' } as const
const visitStatusColor = {
  en_curso: 'text-warn bg-warn/10',
  aprobada: 'text-ok bg-ok/10',
  rechazada: 'text-danger bg-danger/10',
} as const

export default function ChecklistProjects() {
  const { getVisits } = useChecklist()
  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10.5px] font-semibold uppercase tracking-wide mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Nuevo · versión desktop
            </div>
            <h1 className="text-[19px] font-bold text-ink leading-tight">Inspector Gas</h1>
            <p className="text-[12.5px] text-muted mt-0.5">{formName} · Selecciona un proyecto</p>
          </div>
          <p className="text-[12px] text-muted">
            {currentInspector.name} · {currentInspector.role}
          </p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1 text-[12px] text-brand mt-3">
          ← Volver a la demo
        </Link>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {projects.map((p) => {
            const visits = getVisits(p.id)
            const lastVisit = [...visits].sort((a, b) => b.date.localeCompare(a.date))[0]
            return (
              <Link
                key={p.id}
                to={`/checklist/${p.id}`}
                className="block bg-white border border-hairline rounded-xl px-5 py-4 hover:shadow-sm hover:border-brand/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink">{p.name}</p>
                    <p className="text-[12.5px] text-muted mt-0.5">{p.address}</p>
                    <p className="text-[12px] text-muted mt-1.5">
                      Constructora {p.builder} · Instaladora {p.installer}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] font-semibold text-brand whitespace-nowrap">
                      {visits.length} {visits.length === 1 ? 'visita' : 'visitas'}
                    </span>
                    {lastVisit && (
                      <p className="mt-1.5 text-[11px] text-muted">
                        Última visita: {formatDateCl(lastVisit.date)}{' '}
                        <span className={`ml-1 font-semibold px-1.5 py-0.5 rounded-md ${visitStatusColor[lastVisit.status]}`}>
                          {visitStatusLabel[lastVisit.status]}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
