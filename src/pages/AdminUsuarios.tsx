import { useEffect, useRef, useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import { useCompanies, useProjects, useUsers, type AdminUser, type UserRole } from '../state/adminHooks'
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
  const { projects } = useProjects()
  const { users, loading, createUser, updateUser, deleteUser, resetPassword } = useUsers()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('inspector-metrogas')
  const [isAdmin, setIsAdmin] = useState(false)
  const [companyId, setCompanyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState<{ email: string; value: string } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? id
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id

  // The table is too wide for a phone screen, so it scrolls horizontally —
  // this tracks whether it actually needs to, so the "more columns →" fade
  // only shows when there's really more to scroll to (e.g. not on desktop,
  // where the table fits).
  const tableWrapRef = useRef<HTMLDivElement>(null)
  const [tableOverflows, setTableOverflows] = useState(false)
  useEffect(() => {
    const el = tableWrapRef.current
    if (!el) return
    const check = () => setTableOverflows(el.scrollWidth > el.clientWidth + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [users])

  // Tapping a row action near the right edge can auto-scroll the table
  // sideways to keep it in view; reset so the name column (now pinned via
  // sticky, but still the reader's anchor) is never mid-scroll on entry.
  useEffect(() => {
    if (tableWrapRef.current) tableWrapRef.current.scrollLeft = 0
  }, [editingId])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await createUser(email, name, role, isAdmin, companyId)
      setPassword({ email: result.user.email, value: result.provisionalPassword })
      setEmail('')
      setName('')
      setIsAdmin(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el usuario.')
    } finally {
      setSubmitting(false)
    }
  }

  const onResetPassword = async (user: AdminUser) => {
    try {
      const result = await resetPassword(user.id)
      setPassword({ email: user.email, value: result.provisionalPassword })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña.')
    }
  }

  const onDelete = async (user: AdminUser) => {
    if (!window.confirm(`¿Eliminar a ${user.name}? Sus revisiones anteriores no se eliminan.`)) return
    try {
      await deleteUser(user.id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar el usuario.')
    }
  }

  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar demoMode={false} />
      <main className="flex-1 min-w-0 p-5 pt-16 md:p-8 max-w-5xl">
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Usuarios</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Al crear un usuario, o restablecer su contraseña, se genera una contraseña provisoria. No hay envío de
            email todavía — cópiala y entrégasela tú mismo, porque no se volverá a mostrar.
          </p>
        </header>

        {password && (
          <div className="mt-6 bg-ok/10 border border-ok/30 rounded-xl p-4 flex items-start justify-between gap-4">
            <p className="text-[13px] text-ink leading-relaxed">
              Contraseña provisoria para <span className="font-semibold">{password.email}</span>:{' '}
              <span className="font-mono font-semibold bg-white px-2 py-0.5 rounded border border-hairline">{password.value}</span>
              <br />
              <span className="text-muted">Cópiala ahora — no volverá a mostrarse.</span>
            </p>
            <button type="button" onClick={() => setPassword(null)} className="text-[12px] text-brand hover:underline shrink-0">
              Cerrar
            </button>
          </div>
        )}

        {error && (
          <div className="mt-6 bg-danger/10 border border-danger/30 rounded-xl p-4">
            <p className="text-[13px] text-danger">{error}</p>
          </div>
        )}

        {/* Phones: stacked cards — a 7-column table has no good answer at 390px,
            so this is the primary layout below md, not a fallback. */}
        <div className="mt-6 flex flex-col gap-3 md:hidden">
          {loading && <p className="text-muted italic text-[13px]">Cargando...</p>}
          {!loading && users.length === 0 && <p className="text-muted italic text-[13px]">Todavía no hay usuarios.</p>}
          {users.map((u) => (
            <div key={u.id} className="bg-white border border-hairline rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-[14.5px]">{u.name}</p>
                  <p className="text-muted text-[12.5px] truncate">{u.email}</p>
                </div>
                {u.isAdmin && (
                  <span className="shrink-0 text-[10.5px] font-semibold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md">Admin</span>
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12.5px]">
                <div>
                  <dt className="text-muted">Rol</dt>
                  <dd className="text-ink mt-0.5">{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</dd>
                </div>
                <div>
                  <dt className="text-muted">Empresa</dt>
                  <dd className="text-ink mt-0.5">{companyName(u.companyId)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted">Proyectos</dt>
                  <dd className="text-ink mt-0.5">
                    {u.projectIds && u.projectIds.length > 0 ? u.projectIds.map(projectName).join(', ') : '—'}
                  </dd>
                </div>
              </dl>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] pt-3 border-t border-hairline">
                <button type="button" onClick={() => setEditingId(u.id)} className="text-brand font-medium">
                  Editar
                </button>
                <button type="button" onClick={() => onResetPassword(u)} className="text-brand font-medium">
                  Restablecer contraseña
                </button>
                <button type="button" onClick={() => onDelete(u)} className="text-danger font-medium">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet/desktop: the table fits comfortably, with a scroll+sticky-name
            fallback for the narrow end of that range. */}
        <div className="hidden md:block mt-6 bg-white rounded-xl border border-hairline overflow-hidden relative">
          <div className="overflow-x-auto" ref={tableWrapRef}>
          <table className="w-full text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 sticky left-0 z-10 bg-brand-soft/60 border-r border-hairline">Nombre</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Proyectos</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-muted italic">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-muted italic">
                    Todavía no hay usuarios.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className={editingId === u.id ? 'bg-brand-soft/20' : undefined}>
                  <td
                    className={`px-4 py-3 font-semibold text-ink sticky left-0 z-10 border-r border-hairline ${editingId === u.id ? 'bg-brand-soft/20' : 'bg-white'}`}
                  >
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-muted">{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</td>
                  <td className="px-4 py-3">
                    {u.isAdmin && <span className="text-[10.5px] font-semibold text-brand bg-brand-soft px-1.5 py-0.5 rounded-md">Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{companyName(u.companyId)}</td>
                  <td className="px-4 py-3 text-muted">
                    {u.projectIds && u.projectIds.length > 0 ? u.projectIds.map(projectName).join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 text-[12px]">
                      <button type="button" onClick={() => setEditingId(u.id)} className="text-brand hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => onResetPassword(u)} className="text-brand hover:underline">
                        Restablecer contraseña
                      </button>
                      <button type="button" onClick={() => onDelete(u)} className="text-danger hover:underline">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {tableOverflows && (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
          )}
        </div>

        {editingId &&
          (() => {
            const editingUser = users.find((u) => u.id === editingId)
            if (!editingUser) return null
            return (
              <EditUserCard
                key={editingUser.id}
                user={editingUser}
                companies={companies}
                projects={projects}
                onCancel={() => setEditingId(null)}
                onSave={async (input) => {
                  await updateUser(editingUser.id, input)
                  setEditingId(null)
                }}
              />
            )
          })()}

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

type EditUserInput = { name: string; role: UserRole; isAdmin: boolean; companyId: string; projectIds: string[] }

function EditUserCard({
  user,
  companies,
  projects,
  onCancel,
  onSave,
}: {
  user: AdminUser
  companies: { id: string; name: string }[]
  projects: { id: string; name: string }[]
  onCancel: () => void
  onSave: (input: EditUserInput) => Promise<void>
}) {
  const [name, setName] = useState(user.name)
  const [role, setRole] = useState<UserRole>(user.role)
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [companyId, setCompanyId] = useState(user.companyId)
  const [projectIds, setProjectIds] = useState<string[]>(user.projectIds ?? [])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const toggleProject = (id: string) => {
    setProjectIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      await onSave({ name, role, isAdmin, companyId, projectIds })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el usuario.')
      setSaving(false)
    }
  }

  return (
    <div className="mt-6 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-3 max-w-2xl">
      <h2 className="text-[13px] font-semibold text-ink">Editando a {user.name}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-medium text-ink">Nombre</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg border border-hairline px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-medium text-ink">Rol</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="rounded-lg border border-hairline px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[11.5px] font-medium text-ink">Empresa</span>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="rounded-lg border border-hairline px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-ink self-end pb-2">
              <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="h-4 w-4 rounded accent-brand" />
              Es administrador
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-medium text-ink">Proyectos asignados</span>
            {projects.length === 0 && <p className="text-[12px] text-muted italic">Todavía no hay proyectos creados.</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 max-h-32 overflow-y-auto">
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-1.5 text-[12.5px] text-ink">
                  <input
                    type="checkbox"
                    checked={projectIds.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                    className="h-3.5 w-3.5 rounded accent-brand"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-[12.5px] text-danger">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="bg-brand hover:bg-brand-dark text-white font-semibold px-3.5 py-1.5 rounded-lg text-[12.5px] disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button type="button" onClick={onCancel} className="text-[12.5px] text-muted hover:underline">
              Cancelar
            </button>
          </div>
    </div>
  )
}
