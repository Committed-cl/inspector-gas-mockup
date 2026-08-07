import { Link } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import { inspector, projects } from '../data/mock'

export default function Proyectos() {
  return (
    <PhoneFrame
      header={
        <div className="px-5 pt-5 pb-4 border-b border-hairline bg-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Hola,</p>
              <p className="text-ink font-semibold text-[16px] leading-tight">{inspector.nombre}</p>
              <p className="text-[11.5px] text-brand mt-0.5">{inspector.rol}</p>
            </div>
            <button className="h-9 w-9 grid place-items-center rounded-full bg-brand/5 text-brand">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
              </svg>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 bg-brand-soft rounded-lg px-3 py-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-brand/60">
              <path d="M10 2a8 8 0 1 0 5.29 14.01l4.85 4.85a1 1 0 1 0 1.42-1.42l-4.85-4.85A8 8 0 0 0 10 2Zm0 2a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" />
            </svg>
            <input
              placeholder="Buscar proyecto, constructora, dirección…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-brand/50"
            />
          </div>
        </div>
      }
    >
      <div className="px-5 py-4 flex flex-col gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted">Proyectos asignados · {projects.length}</p>
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/proyectos/${p.id}`}
            className="block bg-white rounded-xl border border-hairline p-4 hover:border-brand/40 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink text-[15px] leading-tight">{p.name}</p>
                <p className="text-[12px] text-muted mt-0.5 truncate">
                  {p.builder} · {p.installer}
                </p>
              </div>
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted shrink-0 mt-1">
                <path d="M9.3 6.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L13.58 12 9.3 7.7a1 1 0 0 1 0-1.4Z" />
              </svg>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                Etapa {p.stageNumber} · {p.stageName}
              </span>
              <span className="text-[11px] text-muted">Última visita: {p.lastVisit}</span>
            </div>
          </Link>
        ))}
      </div>
    </PhoneFrame>
  )
}
