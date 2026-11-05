import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CardListSkeleton } from '../components/Skeleton'
import { api, ApiError } from '../lib/api'
import { useCompanies } from '../state/adminHooks'

type ProblemType = 'errors' | 'stuck_queue' | 'held_changes' | 'login' | 'old_version' | 'unsupervised_project'
type Severity = 'high' | 'medium' | 'low'
type Problem = {
  id: string
  type: ProblemType
  severity: Severity
  userId: string | null
  userName: string
  companyName: string
  since: string | null
  lastAt: string | null
  count: number
  detail: string
  status?: number
  projectId?: string
  projectName?: string
  visitId?: string
}
type Health = {
  from: string
  to: string
  problems: Problem[]
  serverErrorsByRoute: { route: string; count: number; lastAt: string; lastMessage: string }[]
  appVersions: { version: string; users: number; current: boolean }[]
}

const TYPE_LABEL: Record<ProblemType, string> = {
  errors: 'Errores',
  stuck_queue: 'Cola atascada',
  held_changes: 'Cambios retenidos',
  login: 'Acceso',
  old_version: 'Versión antigua',
  unsupervised_project: 'Sin supervisor',
}
const SEVERITY: Record<Severity, { label: string; cls: string }> = {
  high: { label: 'Alta', cls: 'bg-danger/10 text-danger' },
  medium: { label: 'Media', cls: 'bg-amber-100 text-amber-800' },
  low: { label: 'Baja', cls: 'bg-brand-soft text-brand' },
}

const dayInput = (iso: string) => iso.slice(0, 10)
const dateTime = (iso: string) => new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

// Read-only link to the affected visit or project (the visit page when both are known).
function target(p: Problem): string | null {
  if (p.projectId && p.visitId) return `/checklist/${encodeURIComponent(p.projectId)}/${encodeURIComponent(p.visitId)}`
  if (p.projectId) return `/checklist/${encodeURIComponent(p.projectId)}`
  return null
}

export default function AdminSalud() {
  const { companies } = useCompanies()
  const [range, setRange] = useState<{ from: string; to: string }>({ from: '', to: '' })
  const [companyId, setCompanyId] = useState('')
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback((from: string, to: string, company: string) => {
    setLoading(true)
    setError(null)
    const qs = new URLSearchParams()
    if (from) qs.set('from', from)
    if (to) qs.set('to', to)
    if (company) qs.set('companyId', company)
    api.get<Health>(`/admin/health${qs.size ? `?${qs}` : ''}`).then(
      (h) => {
        setHealth(h)
        setRange((r) => (r.from || r.to ? r : { from: dayInput(h.from), to: dayInput(h.to) }))
        setLoading(false)
      },
      (err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo cargar la salud del sistema.')
        setLoading(false)
      },
    )
  }, [])

  useEffect(() => load('', '', ''), [load])

  const invalidRange = !!range.from && !!range.to && range.from > range.to

  return (
    <div className="flex bg-base">
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-5xl">
        <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
        <h1 className="text-2xl font-bold text-ink mt-1">Salud</h1>
        <p className="text-[13px] text-muted mt-1 max-w-xl">Qué está fallando y a quién le pasa: errores, colas atascadas, accesos y versiones. Solo metadatos, sin contenido de fotos, audio ni chat.</p>

        <form
          className="mt-5 flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!invalidRange) load(range.from, range.to, companyId)
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
          <label className="text-[12px] text-muted font-semibold">
            Empresa
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} className="block mt-1 h-10 px-3 rounded-lg border border-hairline bg-white text-[14px] text-ink">
              <option value="">Todas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={invalidRange || loading} className="h-10 px-4 rounded-lg bg-brand text-white text-[13.5px] font-semibold disabled:opacity-60">
            Aplicar
          </button>
          {invalidRange && <p className="text-[13px] text-danger">«Desde» no puede ser posterior a «Hasta».</p>}
        </form>

        {error && (
          <div role="alert" className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => load(range.from, range.to, companyId)} className="text-brand font-semibold hover:underline">Reintentar</button>
          </div>
        )}
        {loading && !health && !error && <div className="mt-6"><CardListSkeleton /></div>}

        {health && (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={loading}>
            <h2 className="text-[15px] font-bold text-ink mt-8 mb-3">Problemas ({health.problems.length})</h2>
            {health.problems.length === 0 ? (
              <p className="text-[13px] text-muted italic">Sin problemas en el período. Todo en orden.</p>
            ) : (
              <ul className="space-y-3">
                {health.problems.map((p) => {
                  const link = target(p)
                  return (
                    <li key={p.id} className="bg-white rounded-xl border border-hairline p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full ${SEVERITY[p.severity].cls}`}>{SEVERITY[p.severity].label}</span>
                        <span className="text-[11.5px] uppercase tracking-wide text-muted font-semibold">{TYPE_LABEL[p.type]}</span>
                        {p.count > 1 && <span className="text-[12px] text-muted">× {p.count}</span>}
                      </div>
                      <p className="text-[14px] text-ink font-medium mt-2">
                        {p.userName}
                        {p.companyName && <span className="text-muted font-normal"> · {p.companyName}</span>}
                      </p>
                      <p className="text-[13px] text-ink mt-1 break-words">{p.detail}{p.status ? ` (${p.status})` : ''}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted">
                        {p.since && <span>Desde {dateTime(p.since)}</span>}
                        {p.lastAt && <span>Último {dateTime(p.lastAt)}</span>}
                        {link && (
                          <Link to={link} className="text-brand font-semibold hover:underline">
                            Ver {p.visitId ? 'visita' : 'proyecto'}{p.projectName ? ` · ${p.projectName}` : ''}
                          </Link>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <h2 className="text-[15px] font-bold text-ink mt-8 mb-3">Errores 5xx por ruta</h2>
            <div className="bg-white rounded-xl border border-hairline overflow-x-auto">
              <table className="w-full min-w-[520px] text-[13.5px]">
                <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-3">Ruta</th>
                    <th className="text-left px-4 py-3">Errores</th>
                    <th className="text-left px-4 py-3">Último</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {health.serverErrorsByRoute.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-4 text-muted italic">Sin errores de servidor.</td></tr>
                  )}
                  {health.serverErrorsByRoute.map((r) => (
                    <tr key={r.route}>
                      <td className="px-4 py-3 text-ink font-medium">{r.route}</td>
                      <td className="px-4 py-3">{r.count}</td>
                      <td className="px-4 py-3">{dateTime(r.lastAt)} · {r.lastMessage}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-[15px] font-bold text-ink mt-8 mb-3">Versiones de la app en uso</h2>
            {health.appVersions.length === 0 ? (
              <p className="text-[13px] text-muted italic">Aún no hay versiones registradas.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {health.appVersions.map((v) => (
                  <li key={v.version} className="bg-white rounded-lg border border-hairline px-3 py-2 text-[13px]">
                    <span className="font-mono text-ink">{v.version}</span> · {v.users} {v.users === 1 ? 'usuario' : 'usuarios'}
                    {v.current && <span className="ml-2 text-brand font-semibold">más reciente</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
