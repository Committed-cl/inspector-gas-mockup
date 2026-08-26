import { useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import { useCompanies } from '../state/adminHooks'
import { ApiError } from '../lib/api'

export default function AdminEmpresas() {
  const { companies, loading, createCompany } = useCompanies()
  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createCompany(name, logoUrl)
      setName('')
      setLogoUrl('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la empresa.')
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
          <h1 className="text-2xl font-bold text-ink mt-1">Empresas</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Una empresa es un cliente de la plataforma (por ejemplo, Metrogas). Dentro de cada empresa existen clientes,
            y cada cliente tiene sus obras.
          </p>
        </header>

        <div className="mt-8 bg-white rounded-xl border border-hairline overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Logo</th>
                <th className="text-left px-4 py-3">Nombre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {loading && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-muted italic">
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && companies.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-muted italic">
                    Todavía no hay empresas.
                  </td>
                </tr>
              )}
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <img src={c.logoUrl} alt={c.name} className="h-8 max-w-[120px] object-contain" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="mt-6 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-4 max-w-md">
          <h2 className="text-[13px] font-semibold text-ink">Nueva empresa</h2>
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
            <span className="text-[12px] font-medium text-ink">URL del logo</span>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              required
              type="url"
              placeholder="https://..."
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Creando...' : 'Crear empresa'}
          </button>
        </form>
      </main>
    </div>
  )
}
