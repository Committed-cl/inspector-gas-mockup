import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useIsGlobalAdmin } from '../lib/auth'
import { ROLES } from '../state/adminHooks'
import Icon from './Icon'

type Item = { to: string; label: string; adminOnly?: boolean; globalOnly?: boolean; convenioOnly?: boolean }

const items: Item[] = [
  { to: '/admin', label: 'Dashboard', adminOnly: true },
  { to: '/admin/empresas', label: 'Empresa', adminOnly: true, globalOnly: true },
  { to: '/admin/mi-empresa', label: 'Mi empresa', adminOnly: true, convenioOnly: true },
  { to: '/checklist', label: 'Proyectos' },
  { to: '/admin/usuarios', label: 'Usuario', adminOnly: true },
  { to: '/admin/informes', label: 'Informes', adminOnly: true },
  { to: '/checklist/nueva-obra', label: 'Nuevo proyecto', adminOnly: true },
  { to: '/admin/uso', label: 'Uso', adminOnly: true, globalOnly: true },
  { to: '/admin/ia', label: 'Configuración de IA', adminOnly: true, globalOnly: true },
]

function isActive(to: string, pathname: string): boolean {
  if (to === '/admin') return pathname === '/admin'
  // «Proyectos» covers the whole checklist flow except the admin-only form.
  if (to === '/checklist') return pathname.startsWith('/checklist') && !pathname.startsWith('/checklist/nueva-obra')
  return pathname.startsWith(to)
}

// Desktop: static column. Below md: a slim top bar in the page flow (it never
// overlaps content) that opens the same nav as an off-canvas drawer.
export default function Sidebar() {
  const { pathname } = useLocation()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const { auth, logout } = useAuth()
  const isGlobalAdmin = useIsGlobalAdmin()
  const user = auth?.user
  const isAdminUser = !!user && (user.isAdmin || user.role === 'admin-convenio')
  const visibleItems = items.filter(
    (i) =>
      (!i.adminOnly || isAdminUser) && (!i.globalOnly || isGlobalAdmin) && (!i.convenioOnly || !isGlobalAdmin),
  )
  const roleLabel = ROLES.find((r) => r.value === user?.role)?.label ?? user?.role

  return (
    <>
      <div className="md:hidden sticky top-0 z-30 h-14 flex items-center gap-1 pl-1 pr-3 pt-[env(safe-area-inset-top)] box-content border-b border-hairline bg-white print:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="w-11 h-11 grid place-items-center rounded-lg text-ink hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M3 5.5h14M3 10h14M3 14.5h14" />
          </svg>
        </button>
        <p className="text-brand font-bold text-[15px] leading-none">Inspector Gas</p>
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-ink/30 z-40 print:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`w-60 shrink-0 border-r border-hairline bg-white md:bg-white/60 md:backdrop-blur p-5 fixed inset-y-0 left-0 z-50 overflow-y-auto flex flex-col transition-transform duration-200 md:sticky md:top-0 md:h-screen md:translate-x-0 print:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between mb-6">
          <Link to="/checklist" className="block" onClick={() => setOpen(false)}>
            <p className="text-brand font-bold text-lg leading-none">Inspector Gas</p>
            <p className="text-muted text-xs mt-1">{isAdminUser ? 'Backoffice' : 'Checklist'}</p>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="md:hidden text-muted w-11 h-11 -mt-2 -mr-2 grid place-items-center">
            <Icon name="close" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {visibleItems.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              onClick={() => setOpen(false)}
              className={`px-3 py-2 min-h-[44px] md:min-h-0 flex items-center rounded-lg text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive(i.to, pathname) ? 'bg-brand text-white' : 'text-ink hover:bg-brand/5'
              }`}
            >
              {i.label}
            </Link>
          ))}
        </nav>
        {user && (
          <div className="mt-auto pt-6 border-t border-hairline">
            <p className="text-[13px] font-semibold text-ink leading-tight">{user.name}</p>
            <p className="text-[11.5px] text-muted mt-0.5">{[roleLabel, user.companyName].filter(Boolean).join(' · ')}</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                logout()
                nav('/login')
              }}
              className="mt-3 text-[12px] font-semibold text-brand hover:underline min-h-[44px] md:min-h-0"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
