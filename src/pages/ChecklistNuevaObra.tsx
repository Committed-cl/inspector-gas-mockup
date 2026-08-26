import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClients } from '../state/adminHooks'
import { useCreateProject } from '../state/ChecklistContext'
import { ApiError } from '../lib/api'

export default function ChecklistNuevaObra() {
  const { clients, loading: clientsLoading } = useClients()
  const createProject = useCreateProject()
  const nav = useNavigate()

  const [clientId, setClientId] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [builder, setBuilder] = useState('')
  const [installer, setInstaller] = useState('')
  const [floors, setFloors] = useState('')
  const [stageNumber, setStageNumber] = useState('')
  const [stageName, setStageName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const id = await createProject({
        clientId,
        name,
        address,
        builder,
        installer,
        floors: Number(floors),
        stageNumber: Number(stageNumber),
        stageName,
      })
      nav(`/checklist/${id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la obra.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <h1 className="text-[19px] font-bold text-ink leading-tight">Nueva obra</h1>
        <p className="text-[12.5px] text-muted mt-0.5">Registra una nueva obra bajo un cliente existente.</p>
        <Link to="/checklist" className="inline-flex items-center gap-1 text-[12px] text-brand mt-3">
          ← Volver al listado de proyectos
        </Link>
      </header>

      <main className="px-6 py-8">
        <form onSubmit={submit} className="max-w-lg mx-auto bg-white border border-hairline rounded-xl p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Cliente</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={clientsLoading}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="" disabled>
                {clientsLoading ? 'Cargando clientes...' : 'Selecciona un cliente'}
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Nombre de la obra</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Dirección</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink">Constructora</span>
              <input
                value={builder}
                onChange={(e) => setBuilder(e.target.value)}
                required
                className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink">Instaladora</span>
              <input
                value={installer}
                onChange={(e) => setInstaller(e.target.value)}
                required
                className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink">Pisos</span>
              <input
                type="number"
                min={1}
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                required
                className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </label>
            <label className="flex flex-col gap-1.5 col-span-2">
              <span className="text-[12px] font-medium text-ink">Etapa actual</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={stageNumber}
                  onChange={(e) => setStageNumber(e.target.value)}
                  required
                  placeholder="N°"
                  className="w-16 rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <input
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  required
                  placeholder="Nombre de la etapa"
                  className="flex-1 rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
              </div>
            </label>
          </div>

          {error && <p className="text-[12.5px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Creando...' : 'Crear obra'}
          </button>
        </form>
      </main>
    </div>
  )
}
