import { Link } from 'react-router-dom'
import { useAuth, useIsGlobalAdmin } from '../lib/auth'
import { useCompanies, useUsers, useObrasCount } from '../state/adminHooks'

const CARDS = [
  { to: '/admin/empresas', label: 'Empresas', description: 'Empresas que usan la plataforma, dueñas de las obras.', globalOnly: true },
  { to: '/admin/usuarios', label: 'Usuarios', description: 'Administradores, líderes de supervisores y supervisores de proyecto.' },
  { to: '/checklist/nueva-obra', label: 'Obras', description: 'Obras registradas en el sistema.' },
] as const

export default function AdminDashboard() {
  const { auth } = useAuth()
  const isGlobalAdmin = useIsGlobalAdmin()
  const companyId = auth?.user.companyId
  const { companies, loading: companiesLoading } = useCompanies(isGlobalAdmin)
  const { users, loading: usersLoading } = useUsers()
  const { count: obrasCount, loading: obrasLoading } = useObrasCount()

  const counts: Record<(typeof CARDS)[number]['label'], number | null> = {
    Empresas: companiesLoading ? null : companies.length,
    Usuarios: usersLoading ? null : (isGlobalAdmin ? users : users.filter((u) => u.companyId === companyId)).length,
    Obras: obrasLoading ? null : obrasCount,
  }

  return (
    <div className="flex bg-base">
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-4xl">
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Dashboard</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Hola {auth?.user.name}. Desde acá administras las empresas, sus proyectos y usuarios de la plataforma.
          </p>
        </header>

        <div className="mt-8 grid grid-cols-2 gap-4">
          {CARDS.filter((card) => !('globalOnly' in card) || isGlobalAdmin).map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-white border border-hairline rounded-xl p-5 hover:shadow-sm hover:border-brand/30 transition-all"
            >
              <p className="text-[11.5px] uppercase tracking-wide text-muted font-semibold">{card.label}</p>
              <p className="text-3xl font-bold text-ink mt-2">{counts[card.label] ?? '—'}</p>
              <p className="text-[12.5px] text-muted mt-2">{card.description}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 bg-white border border-hairline rounded-xl p-5">
          <h2 className="text-[13px] font-semibold text-ink mb-3">Accesos rápidos</h2>
          <div className="flex flex-wrap gap-2">
            {isGlobalAdmin && (
            <Link
              to="/admin/empresas"
              className="text-[12.5px] font-semibold text-white bg-brand hover:bg-brand-dark px-3 py-2 rounded-lg transition-colors"
            >
              + Nueva empresa
            </Link>
            )}
            <Link
              to="/admin/usuarios"
              className="text-[12.5px] font-semibold text-white bg-brand hover:bg-brand-dark px-3 py-2 rounded-lg transition-colors"
            >
              + Nuevo usuario
            </Link>
            <Link
              to="/checklist/nueva-obra"
              className="text-[12.5px] font-semibold text-brand bg-brand-soft hover:bg-brand-soft/70 px-3 py-2 rounded-lg transition-colors"
            >
              + Nueva obra
            </Link>
            {isGlobalAdmin && (
            <Link
              to="/admin/ia"
              className="text-[12.5px] font-semibold text-brand bg-brand-soft hover:bg-brand-soft/70 px-3 py-2 rounded-lg transition-colors"
            >
              Configuración de IA
            </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
