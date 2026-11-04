import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProjects, useChecklist } from '../state/ChecklistContext'
import { formatDateCl } from '../utils/date'

const SEARCH_THRESHOLD = 6

function ProjectsSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Cargando proyectos">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white border border-hairline rounded-xl px-4 py-4 md:px-5 animate-pulse">
          <div className="h-4 w-2/3 bg-hairline rounded" />
          <div className="h-3 w-full bg-hairline rounded mt-3" />
          <div className="h-3 w-1/2 bg-hairline rounded mt-2" />
          <div className="h-6 w-32 bg-hairline rounded-full mt-4" />
        </div>
      ))}
    </div>
  )
}

export default function ChecklistProjects() {
  const { data: projects, loading, error } = useProjects()
  const { fetchProjectsIfNeeded } = useChecklist()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = (projects ?? []).filter(
    (p) => !q || [p.name, p.address, p.projectCode ?? '', p.builder, p.installer].some((s) => s.toLowerCase().includes(q)),
  )

  return (
    <div className="bg-base min-h-[calc(100vh-3.5rem)] md:min-h-0">
      <header className="px-4 pt-4 md:px-8 md:pt-8">
        <div className="max-w-4xl">
          <p className="hidden md:block text-[12px] uppercase tracking-wide text-muted font-semibold">Checklist</p>
          <h1 className="text-2xl font-bold text-ink md:mt-1">Visita de Supervisor</h1>
          <p className="text-[14px] md:text-[13px] text-muted mt-1">Proyectos a su cargo — Selecciona un Proyecto</p>
        </div>
      </header>

      <main className="px-4 py-4 md:px-8 md:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="max-w-4xl flex flex-col gap-3">
          {projects && projects.length > SEARCH_THRESHOLD && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proyecto, dirección o código"
              aria-label="Buscar proyecto"
              className="w-full min-h-[44px] text-[16px] bg-white border border-hairline rounded-xl px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            />
          )}

          {loading && <ProjectsSkeleton />}

          {!loading && (error || !projects) && (
            <div className="bg-white border border-hairline rounded-xl px-4 py-8 text-center">
              <p className="text-ink font-semibold">No se pudieron cargar los proyectos.</p>
              <button
                type="button"
                onClick={fetchProjectsIfNeeded}
                className="mt-4 min-h-[44px] bg-brand text-white text-[14px] font-semibold px-6 rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand"
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && projects && projects.length === 0 && (
            <div className="bg-white border border-hairline rounded-xl px-4 py-8 text-center">
              <p className="text-ink font-semibold">Aún no tienes proyectos asignados</p>
              <p className="text-[14px] text-muted mt-1">Cuando te asignen uno aparecerá aquí.</p>
            </div>
          )}

          {!loading && projects && projects.length > 0 && visible.length === 0 && (
            <p className="text-[14px] text-muted text-center py-6">Ningún proyecto coincide con «{query}».</p>
          )}

          {!loading &&
            visible.map((p) => (
              <Link
                key={p.id}
                to={`/checklist/${p.id}`}
                className="block bg-white border border-hairline rounded-xl px-4 py-4 md:px-5 active:bg-brand/5 hover:shadow-sm hover:border-brand/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] md:text-[15px] font-semibold text-ink">
                      {p.name}
                      {p.projectCode && <span className="ml-2 text-[13px] md:text-[12px] font-medium text-muted">· {p.projectCode}</span>}
                    </p>
                    <p className="text-[14px] md:text-[12.5px] text-muted mt-0.5">{p.address}</p>
                    <p className="md:hidden text-[14px] text-ink mt-1.5">
                      Etapa {p.stageNumber} · {p.stageName}
                    </p>
                    <p className="text-[13px] md:text-[12px] text-muted mt-1 md:mt-1.5">
                      Constructora {p.builder} · Instaladora {p.installer}
                    </p>
                  </div>
                  <div className="md:text-right shrink-0 mt-1 md:mt-0 flex items-center justify-between md:block">
                    {p.openVisit ? (
                      <p className="text-[13px] md:text-[11px] text-muted">
                        Visita en curso desde{' '}
                        <span className="font-semibold text-[#8A5300] md:text-warn bg-warn/15 md:bg-warn/10 px-2 md:px-1.5 py-1 md:py-0.5 rounded-md">
                          {formatDateCl(p.openVisit.date)}
                        </span>
                      </p>
                    ) : (
                      <p className="text-[13px] md:text-[11px] text-muted">
                        <span aria-hidden className="md:hidden">○ </span>Sin visita en curso
                      </p>
                    )}
                    <span aria-hidden className="md:hidden text-brand text-xl leading-none">›</span>
                  </div>
                </div>
              </Link>
            ))}
        </div>
      </main>
    </div>
  )
}
