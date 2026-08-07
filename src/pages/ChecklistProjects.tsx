import { Link } from 'react-router-dom'
import { projects } from '../data/mock'
import { completedForProject, formName } from '../data/checklistMatrizInterior'
import { currentInspector } from '../state/ChecklistContext'

export default function ChecklistProjects() {
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
            const { completed, total } = completedForProject(p.id)
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
                      {completed}/{total} completados
                    </span>
                    <div className="mt-1.5 w-32 h-1.5 bg-hairline rounded-full overflow-hidden ml-auto">
                      <div className="h-full bg-ok transition-all" style={{ width: `${(completed / total) * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-muted mt-1.5">Última visita: {p.lastVisit}</p>
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
