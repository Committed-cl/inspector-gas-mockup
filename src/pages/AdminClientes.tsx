import { useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import { useClients, useCompanies } from '../state/adminHooks'
import { ApiError } from '../lib/api'

export default function AdminClientes() {
  const { companies } = useCompanies()
  const { clients, loading, createClient } = useClients()
  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const companyName = (id: string) => companies.find((c) => c.id === id)?.name ?? id

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createClient(companyId, name)
      setName('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el cliente.')
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
          <h1 className="text-2xl font-bold text-ink mt-1">Clientes</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Un cliente pertenece a una empresa (por ejemplo, una constructora o instaladora que trabaja con Metrogas).
            Cada cliente tiene sus propias obras.
          </p>
        </header>

        <div className="mt-8 bg-white rounded-xl border border-hairline overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Empresa</th>
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
              {!loading && clients.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-muted italic">
                    Todavía no hay clientes.
                  </td>
                </tr>
              )}
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-semibold text-ink">{c.name}</td>
                  <td className="px-4 py-3 text-muted">{companyName(c.companyId)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form onSubmit={submit} className="mt-6 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-4 max-w-md">
          <h2 className="text-[13px] font-semibold text-ink">Nuevo cliente</h2>
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
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Nombre</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Creando...' : 'Crear cliente'}
          </button>
        </form>
      </main>
    </div>
  )
}
