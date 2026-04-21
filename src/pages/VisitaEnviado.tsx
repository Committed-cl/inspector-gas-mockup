import { Link } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'

export default function VisitaEnviado() {
  return (
    <PhoneFrame>
      <div className="px-6 py-10 flex flex-col items-center text-center gap-6">
        <div className="h-24 w-24 rounded-full bg-ok/15 grid place-items-center animate-pop">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-12 w-12 text-ok">
            <path d="M9 16.17 5.53 12.7a1 1 0 1 0-1.42 1.42l4.18 4.17a1 1 0 0 0 1.42 0L20.88 7.12a1 1 0 1 0-1.42-1.42L9 16.17Z" />
          </svg>
        </div>
        <div>
          <p className="text-ink font-bold text-[18px]">Reporte enviado</p>
          <p className="text-[13px] text-muted mt-1">
            Los Tres Antonios · Etapa 1 · Visita N°4
          </p>
        </div>

        <div className="w-full bg-white border border-hairline rounded-xl p-4 text-left">
          <p className="text-[11px] uppercase tracking-wide text-muted font-semibold">Resumen del envío</p>
          <dl className="mt-3 grid grid-cols-3 gap-y-2 text-[12.5px]">
            <dt className="col-span-1 text-muted">Hora</dt>
            <dd className="col-span-2 font-mono">14:48 · 17 abr 2026</dd>
            <dt className="col-span-1 text-muted">Destinatarios</dt>
            <dd className="col-span-2">3 emails</dd>
            <dt className="col-span-1 text-muted">Ítems</dt>
            <dd className="col-span-2">7 verificados</dd>
            <dt className="col-span-1 text-muted">Audio</dt>
            <dd className="col-span-2">Archivado · 4m 23s</dd>
          </dl>
        </div>

        <div className="w-full flex flex-col gap-2">
          <Link
            to="/proyectos"
            className="w-full bg-brand text-white font-semibold py-3 rounded-xl hover:bg-brand-dark transition text-center"
          >
            Volver a proyectos
          </Link>
          <button className="w-full border border-hairline text-ink font-semibold py-3 rounded-xl hover:bg-brand-soft transition">
            Descargar PDF
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}
