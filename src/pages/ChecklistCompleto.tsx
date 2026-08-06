import { Link, useParams } from 'react-router-dom'
import { checklistDef, SECCIONES, nombreFormulario } from '../data/checklistMatrizInterior'
import { useProyectoChecklist, inspectorActual } from '../state/ChecklistContext'
import { proyectos } from '../data/mock'
import ChecklistDesktopRow from '../components/ChecklistDesktopRow'
import ChatPanel from '../components/ChatPanel'

export default function ChecklistCompleto() {
  const { proyectoId = '' } = useParams()
  const proyecto = proyectos.find((p) => p.id === proyectoId)
  const { itemsState, marcarManual, chatGeneral, enviarMensajeGeneral } = useProyectoChecklist(proyectoId)

  if (!proyecto) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <div className="text-center">
          <p className="text-ink font-semibold">Proyecto no encontrado</p>
          <Link to="/checklist" className="text-brand text-[13px] mt-2 inline-block">
            ← Volver al listado de proyectos
          </Link>
        </div>
      </div>
    )
  }

  const total = checklistDef.length
  const completados = checklistDef.filter((d) => ['ok', 'na'].includes(itemsState[d.id].status)).length

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-[10.5px] font-semibold uppercase tracking-wide mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Nuevo · versión desktop
            </div>
            <h1 className="text-[19px] font-bold text-ink leading-tight">{proyecto.nombre}</h1>
            <p className="text-[12.5px] text-muted mt-0.5">
              {nombreFormulario} · Contratista {proyecto.instaladora}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] text-muted">
              {inspectorActual.nombre} · {inspectorActual.rol}
            </p>
            <div className="mt-1.5 flex items-center gap-2 justify-end">
              <span className="text-[12px] font-semibold text-brand whitespace-nowrap">
                {completados}/{total} completados
              </span>
              <div className="w-28 h-1.5 bg-hairline rounded-full overflow-hidden">
                <div className="h-full bg-ok transition-all" style={{ width: `${(completados / total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <Link to="/checklist" className="inline-flex items-center gap-1 text-[12px] text-brand mt-3">
          ← Volver al listado de proyectos
        </Link>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="max-w-3xl mx-auto flex flex-col gap-8">
            {SECCIONES.map((seccion) => {
              const items = checklistDef.filter((d) => d.seccion === seccion)
              if (items.length === 0) return null
              return (
                <section key={seccion}>
                  <h2 className="text-[12px] uppercase tracking-wide text-brand font-semibold mb-3">{seccion}</h2>
                  <div className="flex flex-col gap-2">
                    {items.map((def) => (
                      <ChecklistDesktopRow
                        key={def.id}
                        def={def}
                        state={itemsState[def.id]}
                        proyectoId={proyectoId}
                        onMarcar={(status, justificacion) => marcarManual(def.id, status, justificacion)}
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        </main>

        <aside className="w-[380px] shrink-0 min-h-0 border-l border-hairline bg-white">
          <ChatPanel
            title="Chat general del checklist"
            subtitle="Cuéntame qué revisaste sin indicar el ítem — yo identifico a cuál (o cuáles) corresponde y actualizo su estado."
            messages={chatGeneral}
            placeholder="Ej: la matriz está pintada y a la vista..."
            onSend={enviarMensajeGeneral}
            micHint="Revisé el manifold, está pintado, y el bastón de la red interior tiene marcado el número de cada departamento."
            attachHint="Aquí tienes una foto."
          />
        </aside>
      </div>
    </div>
  )
}
