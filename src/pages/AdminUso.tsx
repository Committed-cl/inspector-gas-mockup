import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../lib/api'
import { formatDateCl } from '../utils/date'
import { ROLES } from '../state/adminHooks'

type Usage = {
  from: string
  to: string
  users: { total: number; active7d: number; active30d: number }
  visits: { created: number; closed: number }
  reportsSent: number
  byCompany: { companyId: string; companyName: string; users: number; active7d: number; active30d: number; visitsCreated: number; visitsClosed: number; reportsSent: number }[]
  byProject: { projectId: string; projectName: string; companyName: string; visitsCreated: number; visitsClosed: number; reportsSent: number }[]
  inactiveProjects: { projectId: string; projectName: string; companyName: string; lastActivityAt: string | null }[]
  inactiveUsers: { userId: string; name: string; companyName: string; role: string; lastAccessAt: string | null }[]
}

const dayInput = (iso: string) => iso.slice(0, 10)

function Card({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-hairline p-4">
      <p className="text-[11.5px] uppercase tracking-wide text-muted font-semibold">{label}</p>
      <p className="text-3xl font-bold text-ink mt-1">{value}</p>
      {hint && <p className="text-[12px] text-muted mt-1">{hint}</p>}
    </div>
  )
}

function Table({ head, rows, empty }: { head: string[]; rows: (string | number | null)[][]; empty: string }) {
  return (
    <div className="bg-white rounded-xl border border-hairline overflow-x-auto">
      <table className="w-full min-w-[520px] text-[13.5px]">
        <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
          <tr>
            {head.map((h) => (
              <th key={h} className="text-left px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.length === 0 && (
            <tr>
              <td colSpan={head.length} className="px-4 py-4 text-muted italic">{empty}</td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? 'text-ink font-medium' : ''}`}>{cell ?? <span className="text-muted italic">Nunca</span>}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminUso() {
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [usage, setUsage] = useState<Usage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback((from: string, to: string) => {
    setLoading(true)
    setError(null)
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    api.get<Usage>(`/admin/usage${qs.size ? `?${qs}` : ''}`).then(
      (u) => {
        setUsage(u)
        // First load (no range yet): adopt the API's default window.
        setRange((r) => (r.from || r.to ? r : { from: dayInput(u.from), to: dayInput(u.to) }))
        setLoading(false)
      },
      (err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar el uso.')
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => load('', ''), [load])

  const invalidRange = !!range.from && !!range.to && range.from > range.to
  const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role
  const empty = usage && usage.users.total === 0 && usage.byProject.length === 0

  return (
    <div className="flex bg-base">
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-5xl">
        <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
        <h1 className="text-2xl font-bold text-ink mt-1">Uso</h1>
        <p className="text-[13px] text-muted mt-1 max-w-xl">Si el software se está usando: usuarios activos, visitas e informes. Solo cifras, sin contenido de fotos, audio ni chat.</p>

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!invalidRange) load(range.from, range.to)
          }}
        >
          <label className="text-[12px] text-muted font-semibold">
            Desde
            <input type="date" value={range.from} max={range.to || undefined} onChange={(e) => setRange({ ...range, from: e.target.value })} className="block mt-1 h-10 px-3 rounded-lg border border-hairline bg-white text-[14px] text-ink" />
          </label>
          <label className="text-[12px] text-muted font-semibold">
            Hasta
            <input type="date" value={range.to} min={range.from || undefined} onChange={(e) => setRange({ ...range, to: e.target.value })} className="block mt-1 h-10 px-3 rounded-lg border border-hairline bg-white text-[14px] text-ink" />
          </label>
          <button type="submit" disabled={invalidRange || loading} className="h-10 px-4 rounded-lg bg-brand text-white text-[13.5px] font-semibold disabled:opacity-60">
            Aplicar
          </button>
          {invalidRange && <p className="text-[13px] text-danger">«Desde» no puede ser posterior a «Hasta».</p>}
        </form>

        {error && (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => load(range.from, range.to)} className="text-brand font-semibold hover:underline">Reintentar</button>
          </div>
        )}
        {loading && !usage && !error && <p className="mt-6 text-[13px] text-muted italic">Cargando...</p>}

        {usage && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            {empty ? (
              <p className="mt-8 text-[13px] text-muted italic">Aún no hay usuarios ni proyectos para medir.</p>
            ) : (
              <>
                <section className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3" aria-label="Totales">
                  <Card label="Usuarios activos 7 días" value={usage.users.active7d} hint={`de ${usage.users.total} usuarios`} />
                  <Card label="Usuarios activos 30 días" value={usage.users.active30d} hint={`de ${usage.users.total} usuarios`} />
                  <Card label="Visitas creadas" value={usage.visits.created} hint="en el período" />
                  <Card label="Visitas cerradas" value={usage.visits.closed} hint="en el período" />
                  <Card label="Informes enviados" value={usage.reportsSent} hint="en el período" />
                </section>

                <h2 className="text-[15px] font-bold text-ink mt-8 mb-3">Por empresa</h2>
                <Table
                  head={['Empresa', 'Usuarios', 'Activos 7 d', 'Activos 30 d', 'Visitas creadas', 'Visitas cerradas', 'Informes']}
                  rows={usage.byCompany.map((c) => [c.companyName || '—', c.users, c.active7d, c.active30d, c.visitsCreated, c.visitsClosed, c.reportsSent])}
                  empty="Sin empresas."
                />

                <h2 className="text-[15px] font-bold text-ink mt-8 mb-3">Informes por proyecto</h2>
                <Table
                  head={['Proyecto', 'Empresa', 'Visitas creadas', 'Visitas cerradas', 'Informes']}
                  rows={usage.byProject.map((p) => [p.projectName, p.companyName || '—', p.visitsCreated, p.visitsClosed, p.reportsSent])}
                  empty="Sin proyectos."
                />

                <h2 className="text-[15px] font-bold text-ink mt-8 mb-1">Proyectos sin actividad</h2>
                <p className="text-[12.5px] text-muted mb-3">Sin visitas ni informes en los últimos 14 días.</p>
                <Table
                  head={['Proyecto', 'Empresa', 'Última actividad']}
                  rows={usage.inactiveProjects.map((p) => [p.projectName, p.companyName || '—', p.lastActivityAt ? formatDateCl(p.lastActivityAt) : null])}
                  empty="Todos los proyectos tuvieron actividad."
                />

                <h2 className="text-[15px] font-bold text-ink mt-8 mb-1">Usuarios inactivos</h2>
                <p className="text-[12.5px] text-muted mb-3">Sin acceso hace 14 días o más.</p>
                <Table
                  head={['Nombre', 'Empresa', 'Rol', 'Último acceso']}
                  rows={usage.inactiveUsers.map((u) => [u.name, u.companyName || '—', roleLabel(u.role), u.lastAccessAt ? formatDateCl(u.lastAccessAt) : null])}
                  empty="Todos los usuarios accedieron recientemente."
                />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
