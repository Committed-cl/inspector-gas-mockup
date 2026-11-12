import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useClients, useCompanies } from '../state/adminHooks'
import { useCreateProject, useUpdateProjectTechnicalData } from '../state/ChecklistContext'
import { ApiError } from '../lib/api'
import Icon from '../components/Icon'

export default function ChecklistNuevaObra() {
  const { companies, loading: companiesLoading } = useCompanies()
  const { clients, loading: clientsLoading, createClient } = useClients()
  const createProject = useCreateProject()
  const updateTechnicalData = useUpdateProjectTechnicalData()
  const nav = useNavigate()

  const [companyId, setCompanyId] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [builder, setBuilder] = useState('')
  const [installer, setInstaller] = useState('')
  const [floors, setFloors] = useState('')
  const [stageNumber, setStageNumber] = useState('')
  const [stageName, setStageName] = useState('')
  const [projectCode, setProjectCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Step 2: set once the project exists; pressure / volume are optional.
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [pressure, setPressure] = useState('')
  const [volume, setVolume] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Project still hangs off a Client (keeps the Company→Client→Project access chain);
      // the user only picks the Empresa, so reuse its first Client or create one named after it.
      const existing = clients.find((c) => c.companyId === companyId)
      const clientId = existing
        ? existing.id
        : (await createClient(companyId, companies.find((c) => c.id === companyId)?.name ?? companyId)).id
      const id = await createProject({
        clientId,
        name,
        address,
        builder,
        installer,
        floors: Number(floors),
        stageNumber: Number(stageNumber),
        stageName,
        ...(projectCode.trim() && { projectCode: projectCode.trim() }),
      })
      setCreatedId(id)
      setSubmitting(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el proyecto.')
      setSubmitting(false)
    }
  }

  const parse = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))
  const p = parse(pressure)
  const v = parse(volume)
  const technicalInvalid = [p, v].some((n) => n !== undefined && (!Number.isFinite(n) || n <= 0))

  const saveTechnical = async (e: FormEvent) => {
    e.preventDefault()
    if (!createdId) return
    setError(null)
    setSubmitting(true)
    try {
      if (p !== undefined || v !== undefined) {
        await updateTechnicalData(createdId, {
          ...(p !== undefined && { servicePressureKpa: p }),
          ...(v !== undefined && { matrixVolumeM3: v }),
        })
      }
      nav(`/checklist/${createdId}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudieron guardar los datos técnicos.')
      setSubmitting(false)
    }
  }

  const inputCls =
    'rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'

  return (
    <div className="flex bg-base">
      <div className="flex-1 min-w-0">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <h1 className="text-[19px] font-bold text-ink leading-tight">Nuevo proyecto</h1>
        <p className="text-[12.5px] text-muted mt-0.5">Registra un nuevo proyecto bajo una empresa existente.</p>
        <Link to="/checklist" className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-lg px-3.5 py-2 text-[12.5px] mt-3">
          <Icon name="arrow-left" size={15} />Volver al listado de proyectos
        </Link>
      </header>

      <main className="px-6 py-8">
        {createdId ? (
          <form onSubmit={saveTechnical} className="max-w-lg mx-auto bg-white border border-hairline rounded-xl p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-[15px] font-semibold text-ink">Paso 2: datos técnicos</h2>
              <p className="text-[12.5px] text-muted mt-0.5">
                Se usan para contrastar la prueba de hermeticidad. Puedes omitirlos y completarlos después en "Datos técnicos".
              </p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink">Presión de servicio (kPa)</span>
              <input inputMode="decimal" value={pressure} onChange={(e) => setPressure(e.target.value)} placeholder="Ej: 2,5" className={inputCls} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-ink">Volumen de la matriz (m³)</span>
              <input inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="Ej: 0,4" className={inputCls} />
            </label>
            {technicalInvalid && <p className="text-[12.5px] text-danger">Ingresa números positivos.</p>}
            {error && <p className="text-[12.5px] text-danger">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting || technicalInvalid}
                className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
              >
                {submitting ? 'Guardando...' : 'Guardar y continuar'}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => nav(`/checklist/${createdId}`)}
                className="border border-hairline text-ink font-semibold px-4 py-2.5 rounded-lg hover:bg-base disabled:opacity-60"
              >
                Omitir
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={submit} className="max-w-lg mx-auto bg-white border border-hairline rounded-xl p-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Empresa</span>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              required
              disabled={companiesLoading || clientsLoading}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="" disabled>
                {companiesLoading ? 'Cargando empresas...' : 'Selecciona una empresa'}
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Nombre del proyecto</span>
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

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Código de proyecto (opcional)</span>
            <input
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value)}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-[12px] font-medium text-ink">Etapa actual</span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={stageNumber}
                  onChange={(e) => setStageNumber(e.target.value)}
                  required
                  placeholder="N°"
                  className="w-16 shrink-0 rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                />
                <input
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  required
                  placeholder="Nombre de la etapa"
                  className="flex-1 min-w-0 rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
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
            {submitting ? 'Creando...' : 'Crear proyecto'}
          </button>
        </form>
        )}
      </main>
      </div>
    </div>
  )
}
