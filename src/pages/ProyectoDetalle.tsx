import { Link, useNavigate, useParams } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import { proyectos } from '../data/mock'

export default function ProyectoDetalle() {
  const { id } = useParams()
  const nav = useNavigate()
  const proyecto = proyectos.find((p) => p.id === id) ?? proyectos[0]

  return (
    <PhoneFrame
      header={
        <div className="px-5 pt-5 pb-4 border-b border-hairline bg-white">
          <button onClick={() => nav('/proyectos')} className="flex items-center gap-1 text-[12.5px] text-brand mb-3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
            </svg>
            Volver
          </button>
          <p className="font-bold text-ink text-[18px] leading-tight">{proyecto.nombre}</p>
          <p className="text-[12px] text-muted mt-1">{proyecto.direccion}</p>
        </div>
      }
      footer={
        <div className="p-4 bg-white border-t border-hairline">
          <Link
            to="/visita/nueva"
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 rounded-xl shadow-md transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z" />
              <path d="M19 11.5a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-1.57A7 7 0 0 0 19 11.5Z" />
            </svg>
            Iniciar nueva visita
          </Link>
        </div>
      }
    >
      <div className="px-5 py-4 flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <Meta label="Constructora" value={proyecto.constructora} />
          <Meta label="Instaladora" value={proyecto.instaladora} />
          <Meta label="Pisos" value={`${proyecto.pisos}`} />
          <Meta label="Etapa vigente" value={`${proyecto.etapaNumero} — ${proyecto.etapaNombre}`} />
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted mb-2">Avance por etapa</p>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const state = n < proyecto.etapaNumero ? 'done' : n === proyecto.etapaNumero ? 'current' : 'upcoming'
              return (
                <div
                  key={n}
                  className={`flex-1 h-2 rounded-full ${
                    state === 'done' ? 'bg-ok' : state === 'current' ? 'bg-accent' : 'bg-hairline'
                  }`}
                  title={`Etapa ${n}`}
                />
              )
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted font-mono">
            <span>E1</span>
            <span>E2</span>
            <span>E3</span>
            <span>E4</span>
            <span>E5</span>
          </div>
        </div>

        <div>
          <p className="text-[12px] font-semibold uppercase tracking-wide text-muted mb-2">Visitas realizadas</p>
          <div className="flex flex-col gap-2">
            {proyecto.visitasPrevias.length === 0 && (
              <p className="text-[12px] text-muted italic">Aún no hay visitas registradas en este proyecto.</p>
            )}
            {proyecto.visitasPrevias.map((v) => (
              <div key={v.fecha} className="bg-white rounded-lg border border-hairline p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-ink">Visita N°{v.numero}</p>
                    <p className="text-[11.5px] text-muted mt-0.5">{v.descripcion}</p>
                  </div>
                  <span className="text-[10.5px] text-muted font-mono">{v.fecha}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-ok font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                    {v.itemsOk}/{v.itemsTotal} ítems
                  </span>
                  <span className="text-[11px] text-muted">· Reporte enviado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-brand-soft/60 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-brand/60 font-semibold">{label}</p>
      <p className="text-[12.5px] text-ink mt-0.5 leading-tight">{value}</p>
    </div>
  )
}
