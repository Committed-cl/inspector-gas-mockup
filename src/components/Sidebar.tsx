import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/admin/etapas', label: 'Etapas' },
  { to: '/admin/items/extintor', label: 'Ítems de checklist' },
  { to: '/proyectos', label: 'Proyectos (app inspector)' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="w-60 shrink-0 border-r border-hairline bg-white/60 backdrop-blur min-h-screen p-5">
      <Link to="/" className="block mb-6">
        <p className="text-brand font-bold text-lg leading-none">Inspector Gas</p>
        <p className="text-muted text-xs mt-1">Backoffice</p>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((i) => {
          const active = pathname.startsWith(i.to)
          return (
            <Link
              key={i.to}
              to={i.to}
              className={`px-3 py-2 rounded-lg text-[13px] transition-colors ${
                active ? 'bg-brand text-white' : 'text-ink hover:bg-brand/5'
              }`}
            >
              {i.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-10 p-3 rounded-lg bg-brand-soft text-[11.5px] text-brand leading-snug">
        Modo demo — los cambios no se persisten.
      </div>
    </aside>
  )
}
