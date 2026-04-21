import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { itemDetalleExtintor } from '../data/mock'

export default function AdminItemDetalle() {
  const item = itemDetalleExtintor
  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar />
      <main className="flex-1 p-8 max-w-4xl">
        <Link to="/admin/etapas" className="text-[12.5px] text-brand flex items-center gap-1 mb-3">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
          </svg>
          Volver a etapas
        </Link>
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Ítem del checklist</p>
          <h1 className="text-2xl font-bold text-ink mt-1">{item.titulo}</h1>
          <p className="text-[13px] text-muted mt-1">{item.referencia}</p>
        </header>

        <section className="mt-6 bg-white border border-hairline rounded-xl p-5">
          <p className="text-[12px] uppercase tracking-wide text-brand/70 font-semibold">Descripción normativa</p>
          <p className="mt-2 text-[14px] text-ink leading-relaxed">{item.descripcionNormativa}</p>
        </section>

        <section className="mt-6 bg-white border border-hairline rounded-xl p-5">
          <p className="text-[12px] uppercase tracking-wide text-brand/70 font-semibold">
            Ejemplos de declaración (entrenamiento IA)
          </p>
          <p className="text-[12.5px] text-muted mt-1">
            Estas frases sirven para enseñar a la IA qué declaración del inspector pinta el ítem de verde,
            amarillo o rojo. Se editan sin tocar código.
          </p>

          <EjemploList titulo="Verde — cobertura correcta" color="ok" items={item.ejemplosVerdes} />
          <EjemploList titulo="Amarillo — cobertura parcial" color="warn" items={item.ejemplosAmarillos} />
          <EjemploList titulo="Rojo — sin cobertura" color="danger" items={item.ejemplosRojos} />
        </section>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button className="px-4 py-2.5 rounded-lg border border-hairline text-ink text-[13px] hover:bg-brand-soft">
            Cancelar
          </button>
          <button className="px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-dark text-white text-[13px] font-semibold">
            Guardar cambios
          </button>
        </div>
      </main>
    </div>
  )
}

function EjemploList({
  titulo,
  color,
  items,
}: {
  titulo: string
  color: 'ok' | 'warn' | 'danger'
  items: string[]
}) {
  const dot = color === 'ok' ? 'bg-ok' : color === 'warn' ? 'bg-warn' : 'bg-danger'
  const bg = color === 'ok' ? 'bg-ok/5' : color === 'warn' ? 'bg-warn/5' : 'bg-danger/5'
  return (
    <div className={`mt-4 rounded-lg p-4 ${bg}`}>
      <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {titulo}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t, i) => (
          <li key={i} className="text-[13px] text-ink italic">
            "{t}"
          </li>
        ))}
      </ul>
    </div>
  )
}
