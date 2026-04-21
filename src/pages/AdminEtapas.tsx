import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { etapas } from '../data/mock'

export default function AdminEtapas() {
  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar />
      <main className="flex-1 p-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Parametrización</p>
            <h1 className="text-2xl font-bold text-ink mt-1">Etapas de proyecto</h1>
            <p className="text-[13px] text-muted mt-1 max-w-xl">
              Cada etapa determina el subconjunto de ítems que la app mostrará al inspector. El inspector no verá
              el checklist eterno; solo los ítems parametrizados para la etapa vigente del proyecto.
            </p>
          </div>
          <button className="bg-brand hover:bg-brand-dark text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M11 11V5a1 1 0 1 1 2 0v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6Z" />
            </svg>
            Nueva etapa
          </button>
        </header>

        <div className="mt-8 bg-white rounded-xl border border-hairline overflow-hidden">
          <table className="w-full text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">N°</th>
                <th className="text-left px-4 py-3">Nombre de la etapa</th>
                <th className="text-left px-4 py-3">Ítems asociados</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {etapas.map((e) => (
                <tr key={e.id} className="hover:bg-brand-soft/20">
                  <td className="px-4 py-3 font-mono text-muted">E{e.numero}</td>
                  <td className="px-4 py-3 font-semibold text-ink">{e.nombre}</td>
                  <td className="px-4 py-3 text-muted">{e.items} ítems</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-ok text-[12px] font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                      Activa
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/items/extintor"
                      className="text-brand text-[12.5px] hover:underline"
                    >
                      Ver ítems →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-[12px] text-muted max-w-2xl">
          El orden de etapas define la secuencia esperada en obra. El inspector declara la etapa al iniciar la
          visita y el sistema recupera automáticamente el checklist correspondiente.
        </p>
      </main>
    </div>
  )
}
