import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/empresas', label: 'Empresas' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/ia', label: 'Configuración de IA' },
  { to: '/checklist', label: 'Ir a checklist' },
]

// Below md, the sidebar is a fixed width too wide for a phone screen to share
// with content, so it becomes an off-canvas drawer opened by a floating
// button — same nav, same links, just hidden until asked for.
export default function Sidebar({ demoMode = true }: { demoMode?: boolean }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-3 left-3 z-30 bg-white border border-hairline rounded-lg p-2 shadow-sm"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M3 5.5h14M3 10h14M3 14.5h14" />
        </svg>
      </button>

      {open && <div className="md:hidden fixed inset-0 bg-ink/30 z-40" onClick={() => setOpen(false)} />}

      <aside
        className={`w-60 shrink-0 border-r border-hairline bg-white md:bg-white/60 md:backdrop-blur min-h-screen p-5 fixed inset-y-0 left-0 z-50 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between mb-6">
          <Link to="/" className="block" onClick={() => setOpen(false)}>
            <p className="text-brand font-bold text-lg leading-none">Inspector Gas</p>
            <p className="text-muted text-xs mt-1">Backoffice</p>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="md:hidden text-muted p-1 -mt-1 -mr-1">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((i) => {
            const active = i.to === '/admin' || i.to === '/checklist' ? pathname === i.to : pathname.startsWith(i.to)
            return (
              <Link
                key={i.to}
                to={i.to}
                onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-lg text-[13px] transition-colors ${
                  active ? 'bg-brand text-white' : 'text-ink hover:bg-brand/5'
                }`}
              >
                {i.label}
              </Link>
            )
          })}
        </nav>
        {demoMode && (
          <div className="mt-10 p-3 rounded-lg bg-brand-soft text-[11.5px] text-brand leading-snug">
            Modo demo — los cambios no se persisten.
          </div>
        )}
      </aside>
    </>
  )
}
