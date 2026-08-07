import { Link, useParams } from 'react-router-dom'
import { checklistDef, estadoEvidenciasRequeridas, hintEvidenciaFaltante } from '../data/checklistMatrizInterior'
import { useProyectoChecklist } from '../state/ChecklistContext'
import { proyectos } from '../data/mock'
import ChatPanel from '../components/ChatPanel'
import ManualEstadoControl from '../components/ManualEstadoControl'
import CampoEvidencia from '../components/CampoEvidencia'

const statusLabel = { ok: 'Cumple', warn: 'Parcial', pending: 'Pendiente', na: 'No aplica' } as const
const statusColor = {
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  pending: 'text-danger bg-danger/10',
  na: 'text-muted bg-muted/10',
} as const

const borderResultado = {
  ok: 'border-ok',
  warn: 'border-warn',
  pending: 'border-danger',
  na: 'border-muted',
} as const

export default function ChecklistItemDetalle() {
  const { proyectoId = '', itemId } = useParams()
  const proyecto = proyectos.find((p) => p.id === proyectoId)
  const { itemsState, marcarManual, agregarEvidencia, enviarMensajeItem } = useProyectoChecklist(proyectoId)
  const def = checklistDef.find((d) => d.id === itemId)

  if (!proyecto || !def) {
    return (
      <div className="min-h-screen grid place-items-center bg-base">
        <div className="text-center">
          <p className="text-ink font-semibold">{!proyecto ? 'Proyecto no encontrado' : 'Ítem no encontrado'}</p>
          <Link to="/checklist" className="text-brand text-[13px] mt-2 inline-block">
            ← Volver al listado de proyectos
          </Link>
        </div>
      </div>
    )
  }

  const state = itemsState[def.id]
  const requisitos = estadoEvidenciasRequeridas(def, state.evidencia)
  const marcadoManual = state.evidencia.find((e) => e.origen === 'marcado-manual')

  return (
    <div className="h-screen flex flex-col bg-base overflow-hidden">
      <header className="border-b border-hairline bg-white px-6 py-4">
        <Link to={`/checklist/${proyectoId}`} className="inline-flex items-center gap-1 text-[12.5px] text-brand mb-2">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
          </svg>
          Volver al checklist completo
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11.5px] uppercase tracking-wide text-muted font-semibold">
              {proyecto.nombre} · {def.seccion}
            </p>
            <h1 className="text-[19px] font-bold text-ink mt-0.5 leading-tight">{def.titulo}</h1>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-md ${statusColor[state.status]}`}>
            {statusLabel[state.status]}
          </span>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <main className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
          <div className="max-w-xl mx-auto flex flex-col gap-5">
            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold">Qué busca validar la app</p>
              <p className="mt-1.5 text-[13.5px] text-ink leading-relaxed">{def.queValidaApp}</p>
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold">Criterio normativo</p>
              <p className="mt-1.5 text-[13px] text-ink leading-relaxed">{def.criterioNormativo}</p>
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2.5">Conclusión</p>
              <ManualEstadoControl
                status={state.status}
                permiteNoAplica={def.permiteNoAplica}
                onMarcar={(status, justificacion) => marcarManual(def.id, status, justificacion)}
                size="md"
                hint={hintEvidenciaFaltante(def, state.evidencia)}
              />
              {state.status === 'na' && state.justificacionNoAplica && (
                <p className="text-[12px] text-muted mt-2 italic">No aplica: {state.justificacionNoAplica}</p>
              )}
              {state.origen && (
                <p className="text-[11px] text-muted mt-2">
                  Origen actual: {state.origen === 'manual' ? 'conclusión' : 'confirmado con evidencia de chat'}
                </p>
              )}
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2">
                Evidencia requerida ({requisitos.filter((r) => r.cumplido).length}/{requisitos.length})
              </p>
              <div className="flex flex-col gap-3">
                {requisitos.map((req, i) => (
                  <CampoEvidencia
                    key={i}
                    requisito={req}
                    onAgregar={(texto, previewUrl) =>
                      agregarEvidencia(def.id, i, req.tipo === 'foto' ? 'foto' : 'texto', texto, previewUrl)
                    }
                  />
                ))}
                <div className={`border-l-2 ${marcadoManual && marcadoManual.resultado ? borderResultado[marcadoManual.resultado] : 'border-hairline'} pl-3`}>
                  <p className="text-[12.5px] font-medium text-ink">Conclusión</p>
                  {marcadoManual ? (
                    <p className="mt-0.5 text-[12.5px] text-muted leading-snug">
                      <span className="font-mono text-[10.5px]">{marcadoManual.hora}</span> — {marcadoManual.texto}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[12.5px] text-muted italic">Pendiente — usa los botones Cumple/No cumple arriba.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside className="w-[380px] shrink-0 min-h-0 border-l border-hairline bg-white">
          <ChatPanel
            title="Chat de este ítem"
            subtitle="Todo lo que hables, escribas o subas acá queda asociado solo a este ítem — no hace falta que digas a cuál te refieres."
            messages={state.chat}
            placeholder="Cuéntame qué observaste para este ítem..."
            onSend={(texto, tipo) => enviarMensajeItem(def.id, texto, tipo)}
            micHint="Ya revisé este punto, cumple con lo que exige la norma."
            attachHint="Aquí tienes la foto que respalda este ítem."
          />
        </aside>
      </div>
    </div>
  )
}
