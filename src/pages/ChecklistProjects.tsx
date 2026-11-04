import { Link } from 'react-router-dom'
import { useProjects } from '../state/ChecklistContext'
import { formatDateCl } from '../utils/date'
import CenteredMessage from '../components/CenteredMessage'

export default function ChecklistProjects() {
  const { data: projects, loading, error } = useProjects()

  if (loading) return <CenteredMessage text="Cargando proyectos..." />
  if (error || !projects) return <CenteredMessage text="No se pudieron cargar los proyectos." />

  return (
    <div className="bg-base">
      <header className="px-5 pt-5 md:px-8 md:pt-8">
        <div className="max-w-4xl">
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Checklist</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Visita de Supervisor</h1>
          <p className="text-[13px] text-muted mt-1">Proyectos a su cargo — Selecciona un Proyecto</p>
        </div>
      </header>

      <main className="px-5 py-6 md:px-8">
        <div className="max-w-4xl flex flex-col gap-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/checklist/${p.id}`}
              className="block bg-white border border-hairline rounded-xl px-5 py-4 hover:shadow-sm hover:border-brand/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{p.name}
                    {p.projectCode && <span className="ml-2 text-[12px] font-medium text-muted">· {p.projectCode}</span>}
                  </p>
                  <p className="text-[12.5px] text-muted mt-0.5">{p.address}</p>
                  <p className="text-[12px] text-muted mt-1.5">
                    Constructora {p.builder} · Instaladora {p.installer}
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  {p.openVisit ? (
                    <p className="text-[11px] text-muted">
                      Visita en curso desde{' '}
                      <span className="font-semibold text-warn bg-warn/10 px-1.5 py-0.5 rounded-md">{formatDateCl(p.openVisit.date)}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted">Sin visita en curso</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
