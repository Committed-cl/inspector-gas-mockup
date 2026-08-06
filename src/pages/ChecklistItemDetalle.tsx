import { Link, useParams } from 'react-router-dom'
import { checklistDef } from '../data/checklistMatrizInterior'
import { useProyectoChecklist } from '../state/ChecklistContext'
import { proyectos } from '../data/mock'
import ChatPanel from '../components/ChatPanel'
import ManualEstadoControl from '../components/ManualEstadoControl'

const statusLabel = { ok: 'Cumple', warn: 'Parcial', pending: 'Pendiente', na: 'No aplica' } as const
const statusColor = {
  ok: 'text-ok bg-ok/10',
  warn: 'text-warn bg-warn/10',
  pending: 'text-danger bg-danger/10',
  na: 'text-muted bg-muted/10',
} as const

const origenEvidencia = {
  'chat-general': 'chat general',
  'chat-item': 'chat del ítem',
  manual: 'manual',
} as const

export default function ChecklistItemDetalle() {
  const { proyectoId = '', itemId } = useParams()
  const proyecto = proyectos.find((p) => p.id === proyectoId)
  const { itemsState, marcarManual, enviarMensajeItem } = useProyectoChecklist(proyectoId)
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
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2.5">Marcado manual</p>
              <ManualEstadoControl
                status={state.status}
                permiteNoAplica={def.permiteNoAplica}
                onMarcar={(status, justificacion) => marcarManual(def.id, status, justificacion)}
                size="md"
                hint={
                  def.requiereFoto && !state.evidencia.some((e) => e.tipo === 'foto')
                    ? 'Requiere foto para quedar en verde.'
                    : undefined
                }
              />
              {state.status === 'na' && state.justificacionNoAplica && (
                <p className="text-[12px] text-muted mt-2 italic">No aplica: {state.justificacionNoAplica}</p>
              )}
              {state.origen && (
                <p className="text-[11px] text-muted mt-2">
                  Origen actual: {state.origen === 'manual' ? 'marcado manual' : 'confirmado con evidencia de chat'}
                </p>
              )}
            </section>

            <section className="bg-white border border-hairline rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-brand/70 font-semibold mb-2">
                Evidencia ({state.evidencia.length})
              </p>
              {state.evidencia.length === 0 && (
                <p className="text-[12.5px] text-muted italic">Sin evidencia registrada todavía.</p>
              )}
              <ul className="flex flex-col gap-2.5">
                {state.evidencia.map((e) => (
                  <li key={e.id} className="text-[12.5px] text-ink border-l-2 border-brand-soft pl-3">
                    <span className="text-muted font-mono text-[10.5px]">{e.hora}</span>{' '}
                    <span className="text-[10px] uppercase tracking-wide text-brand/70 font-semibold">
                      {origenEvidencia[e.origen]}
                    </span>
                    <p className="mt-0.5 leading-snug">
                      {e.tipo === 'foto' ? '📷 ' : e.tipo === 'audio' ? '🎙 ' : ''}
                      {e.texto}
                    </p>
                  </li>
                ))}
              </ul>
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
