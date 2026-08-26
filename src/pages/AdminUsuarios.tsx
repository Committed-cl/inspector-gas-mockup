import { useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import { useCompanies, useUsers, type UserRole } from '../state/adminHooks'
import { ApiError } from '../lib/api'

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'inspector-metrogas', label: 'Inspector Metrogas' },
  { value: 'inspector-instaladora', label: 'Inspector Instaladora' },
  { value: 'jefe-obra', label: 'Jefe de Obra' },
  { value: 'supervisor-metrogas', label: 'Supervisor Metrogas' },
  { value: 'admin', label: 'Administrador' },
]

export default function AdminUsuarios() {
  const { companies } = useCompanies()
  const { users, loading, createUser } = useUsers()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('inspector-metrogas')
  const [isAdmin, setIsAdmin] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null)

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? id

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await createUser(email, name, role, isAdmin, companyId)
      setCreated({ email: result.user.email, password: result.provisionalPassword })
      setEmail('')
      setName('')
      setIsAdmin(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar demoMode={false} />
      <main className="flex-1 p-8 max-w-3xl">
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Usuarios</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Al crear un usuario se genera una contraseña provisoria. No hay envío de email todavía — cópiala y
            entrégasela tú mismo, porque no se volverá a mostrar.
          </p>
        </header>

        {created && (
          <div className="mt-6 bg-ok/10 border border-ok/30 rounded-xl p-4 flex items-start justify-between gap-4">
            <p className="text-[13px] text-ink leading-relaxed">
              Contraseña provisoria para <span className="font-semibold">{created.email}</span>:{' '}
              <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-hairline">{created.password}</span>
              <br />
              <span className="text-muted">Cópiala ahora — no volverá a mostrarse.</span>
            </p>
            <button type="button" onClick={() => setCreated(null)} className="text-[12px] text-brand hover:underline shrink-0">
              Cerrar
            </button>
          </div>
        )}

        <div className="mt-6 bg-white rounded-xl border border-hairline overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Empresa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted italic">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted italic">
                    Todavía no hay usuarios.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold text-ink">{u.name}</td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin && <span className="text-[10.5px] font-semibold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md">Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{companyName(u.companyId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="mt-6 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-4 max-w-md">
          <h2 className="text-[13px] font-semibold text-ink">Nuevo usuario</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Empresa</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="" disabled>
                Selecciona una empresa
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[12.5px] text-ink">
            <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 rounded accent-brand" />
            Es administrador
          </label>
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </main>
    </div>
  )
}
