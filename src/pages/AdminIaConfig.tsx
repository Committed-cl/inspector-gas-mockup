import { useEffect, useState, type FormEvent } from 'react'
import Sidebar from '../components/Sidebar'
import { useAiConfig, useCompanies, type AiVendor } from '../state/adminHooks'
import { ApiError } from '../lib/api'

const VENDORS: { value: AiVendor; label: string; needsKey: boolean; hint?: string }[] = [
  { value: 'gemini', label: 'Gemini (Google)', needsKey: true },
  { value: 'anthropic', label: 'Claude (Anthropic)', needsKey: true },
  { value: 'openai', label: 'GPT (OpenAI)', needsKey: true },
  {
    value: 'claude-cli',
    label: 'Claude CLI (solo desarrollo local)',
    needsKey: false,
    hint: 'Usa la sesión del CLI de Claude ya autenticada en la máquina donde corre la API. No funciona en producción (Cloud Run).',
  },
]

export default function AdminIaConfig() {
  const { companies, loading: companiesLoading } = useCompanies()
  const [companyId, setCompanyId] = useState('')

  useEffect(() => {
    if (!companyId && companies.length > 0) setCompanyId(companies[0].id)
  }, [companies, companyId])

  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar demoMode={false} />
      <main className="flex-1 p-8 max-w-2xl">
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Configuración de IA</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">
            Elige qué proveedor de IA usa el chat para esta empresa y sus credenciales. Si no hay ninguno configurado, el
            chat sigue funcionando con coincidencia por palabras clave (sin IA real).
          </p>
        </header>

        <label className="flex flex-col gap-1.5 mt-6 max-w-sm">
          <span className="text-[12px] font-medium text-ink">Empresa</span>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            disabled={companiesLoading}
            className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {companyId && <AiConfigForm key={companyId} companyId={companyId} />}
      </main>
    </div>
  )
}

function AiConfigForm({ companyId }: { companyId: string }) {
  const { config, loading, saveConfig } = useAiConfig(companyId)
  const [vendor, setVendor] = useState<AiVendor>('gemini')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      setVendor(config.vendor)
      setModel(config.model ?? '')
    }
  }, [config])

  const vendorDef = VENDORS.find((v) => v.value === vendor)!

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSubmitting(true)
    try {
      await saveConfig(vendor, apiKey.trim() || undefined, model.trim() || undefined)
      setApiKey('')
      setSaved(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la configuración.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-4 max-w-sm">
      {loading ? (
        <p className="text-[12.5px] text-muted italic">Cargando...</p>
      ) : (
        <>
          {config && (
            <p className="text-[12px] text-muted bg-brand-soft/60 rounded-lg px-3 py-2">
              Vendor actual: <span className="font-semibold text-brand">{VENDORS.find((v) => v.value === config.vendor)?.label}</span>
              {config.apiKeySet && (
                <>
                  {' '}
                  · clave <span className="font-mono">{config.apiKeyPreview}</span>
                </>
              )}
            </p>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Vendor</span>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value as AiVendor)}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              {VENDORS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label}
                </option>
              ))}
            </select>
            {vendorDef.hint && <span className="text-[11.5px] text-muted leading-snug">{vendorDef.hint}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">API key{vendorDef.needsKey ? '' : ' (no requerida)'}</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={!vendorDef.needsKey}
              placeholder={config?.apiKeySet ? 'Dejar en blanco para mantener la actual' : 'sk-...'}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand disabled:bg-base disabled:text-muted"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Modelo (opcional)</span>
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Usa el modelo por defecto si se deja en blanco"
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          {error && <p className="text-[12.5px] text-danger">{error}</p>}
          {saved && !error && <p className="text-[12.5px] text-ok">Configuración guardada.</p>}

          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </>
      )}
    </form>
  )
}
