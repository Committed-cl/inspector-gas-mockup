import { Link, useNavigate } from 'react-router-dom'
import { formName } from '../data/checklistMatrizInterior'
import { useProjects } from '../state/ChecklistContext'
import { useAuth } from '../lib/auth'
import { formatDateCl } from '../utils/date'
import CenteredMessage from '../components/CenteredMessage'

export default function ChecklistProjects() {
  const { data: projects, loading, error } = useProjects()
  const { auth, logout } = useAuth()
  const nav = useNavigate()

  if (loading) return <CenteredMessage text="Cargando proyectos..." />
  if (error || !projects) return <CenteredMessage text="No se pudieron cargar los proyectos." />

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[19px] font-bold text-ink leading-tight">Inspector Gas</h1>
            <p className="text-[12.5px] text-muted mt-0.5">{formName} · Selecciona un proyecto</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted">
              {auth?.user.name} · {auth?.user.role}
            </p>
            <div className="mt-1 flex items-center gap-3 justify-end">
              {auth?.user.isAdmin && (
                <Link to="/admin" className="text-[11.5px] font-semibold text-brand hover:underline">
                  Panel admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout()
                  nav('/login')
                }}
                className="text-[11.5px] font-semibold text-brand hover:underline"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="max-w-3xl mx-auto flex flex-col gap-3">
          {projects.map((p) => (
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
