import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import {
  checklistDef,
  chatGeneralInicialParaProyecto,
  estadoInicialParaProyecto,
  matchItemsByKeyword,
  inspector,
  type ChatMessage,
  type ChecklistStatus,
  type EvidenciaTipo,
  type ItemState,
} from '../data/checklistMatrizInterior'

let seq = 0
function nextId(prefix: string) {
  seq += 1
  return `${prefix}-${seq}`
}

function horaAhora() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

type ProyectoChecklistState = {
  itemsState: Record<string, ItemState>
  chatGeneral: ChatMessage[]
}

function estadoInicialProyecto(proyectoId: string): ProyectoChecklistState {
  return {
    itemsState: estadoInicialParaProyecto(proyectoId),
    chatGeneral: chatGeneralInicialParaProyecto(proyectoId),
  }
}

function ensureProyecto(
  proyectoId: string,
  porProyecto: Record<string, ProyectoChecklistState>,
): Record<string, ProyectoChecklistState> {
  if (porProyecto[proyectoId]) return porProyecto
  return { ...porProyecto, [proyectoId]: estadoInicialProyecto(proyectoId) }
}

type ChecklistContextValue = {
  getProyectoState: (proyectoId: string) => ProyectoChecklistState
  marcarManual: (proyectoId: string, itemId: string, status: ChecklistStatus, justificacion?: string) => void
  enviarMensajeGeneral: (proyectoId: string, texto: string, tipo?: EvidenciaTipo) => void
  enviarMensajeItem: (proyectoId: string, itemId: string, texto: string, tipo?: EvidenciaTipo) => void
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null)

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [porProyecto, setPorProyecto] = useState<Record<string, ProyectoChecklistState>>({})

  const getProyectoState = useCallback(
    (proyectoId: string) => porProyecto[proyectoId] ?? estadoInicialProyecto(proyectoId),
    [porProyecto],
  )

  const marcarManual = useCallback(
    (proyectoId: string, itemId: string, status: ChecklistStatus, justificacion?: string) => {
      setPorProyecto((prev) => {
        const base = ensureProyecto(proyectoId, prev)
        const proyectoState = base[proyectoId]
        const prevItem = proyectoState.itemsState[itemId]
        const def = checklistDef.find((d) => d.id === itemId)

        // No puede quedar en verde por marcado manual si al ítem le falta la evidencia
        // fotográfica que exige el checklist — se queda en amarillo hasta que se adjunte.
        const tieneFoto = prevItem.evidencia.some((e) => e.tipo === 'foto')
        const statusFinal: ChecklistStatus = status === 'ok' && def?.requiereFoto && !tieneFoto ? 'warn' : status

        return {
          ...base,
          [proyectoId]: {
            ...proyectoState,
            itemsState: {
              ...proyectoState.itemsState,
              [itemId]: {
                ...prevItem,
                status: statusFinal,
                origen: 'manual',
                justificacionNoAplica: statusFinal === 'na' ? justificacion : undefined,
              },
            },
          },
        }
      })
    },
    [],
  )

  const enviarMensajeGeneral = useCallback((proyectoId: string, texto: string, tipo: EvidenciaTipo = 'texto') => {
    if (!texto.trim()) return
    const hora = horaAhora()
    const inspectorMsg: ChatMessage = { id: nextId('gm'), role: 'inspector', texto, tipo, hora }
    const matched = matchItemsByKeyword(texto)

    setPorProyecto((prev) => {
      const base = ensureProyecto(proyectoId, prev)
      const proyectoState = base[proyectoId]

      if (matched.length === 0) {
        const iaMsg: ChatMessage = {
          id: nextId('gm'),
          role: 'ia',
          texto:
            'No logro identificar a qué ítem del checklist corresponde esto. ¿Me puedes decir a cuál te refieres, o contármelo dentro del chat de ese ítem?',
          hora,
        }
        return {
          ...base,
          [proyectoId]: { ...proyectoState, chatGeneral: [...proyectoState.chatGeneral, inspectorMsg, iaMsg] },
        }
      }

      const nextItemsState = { ...proyectoState.itemsState }
      for (const def of matched) {
        const prevItem = nextItemsState[def.id]
        if (prevItem.status === 'na') continue
        nextItemsState[def.id] = {
          ...prevItem,
          status: 'ok',
          origen: 'chat',
          evidencia: [...prevItem.evidencia, { id: nextId('ev'), tipo, origen: 'chat-general', texto, hora }],
        }
      }

      const titulos = matched.map((d) => `"${d.titulo}"`).join(' y ')
      const iaMsg: ChatMessage = {
        id: nextId('gm'),
        role: 'ia',
        texto: `Marqué ${titulos} como cumplido${matched.length > 1 ? 's' : ''} con tu ${
          tipo === 'foto' ? 'mensaje y la foto adjunta' : tipo === 'audio' ? 'declaración por voz' : 'mensaje'
        }.`,
        hora,
      }

      return {
        ...base,
        [proyectoId]: {
          itemsState: nextItemsState,
          chatGeneral: [...proyectoState.chatGeneral, inspectorMsg, iaMsg],
        },
      }
    })
  }, [])

  const enviarMensajeItem = useCallback(
    (proyectoId: string, itemId: string, texto: string, tipo: EvidenciaTipo = 'texto') => {
      if (!texto.trim()) return
      const def = checklistDef.find((d) => d.id === itemId)
      if (!def) return
      const hora = horaAhora()
      const inspectorMsg: ChatMessage = { id: nextId('im'), role: 'inspector', texto, tipo, hora }

      setPorProyecto((prev) => {
        const base = ensureProyecto(proyectoId, prev)
        const proyectoState = base[proyectoId]
        const prevItem = proyectoState.itemsState[itemId]
        const evidencia = [...prevItem.evidencia, { id: nextId('ev'), tipo, origen: 'chat-item' as const, texto, hora }]
        const tieneFoto = tipo === 'foto' || evidencia.some((e) => e.tipo === 'foto')

        let iaTexto: string
        let status: ChecklistStatus

        if (def.requiereFoto && !tieneFoto) {
          status = 'warn'
          iaTexto = `Para dar este ítem por cumplido necesito una foto que respalde tu declaración — ${def.criterioNormativo}. ¿Puedes subir una foto?`
        } else {
          status = 'ok'
          iaTexto = `Marqué "${def.titulo}" como cumplido con ${tipo === 'foto' ? 'la foto adjunta' : 'tu declaración'}.`
        }

        const iaMsg: ChatMessage = { id: nextId('im'), role: 'ia', texto: iaTexto, hora }

        const nextItem: ItemState = {
          ...prevItem,
          status: prevItem.status === 'na' ? prevItem.status : status,
          origen: 'chat',
          evidencia,
          chat: [...prevItem.chat, inspectorMsg, iaMsg],
        }

        return {
          ...base,
          [proyectoId]: {
            ...proyectoState,
            itemsState: { ...proyectoState.itemsState, [itemId]: nextItem },
          },
        }
      })
    },
    [],
  )

  const value = useMemo(
    () => ({ getProyectoState, marcarManual, enviarMensajeGeneral, enviarMensajeItem }),
    [getProyectoState, marcarManual, enviarMensajeGeneral, enviarMensajeItem],
  )

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export function useProyectoChecklist(proyectoId: string) {
  const { getProyectoState, marcarManual, enviarMensajeGeneral, enviarMensajeItem } = useChecklist()
  const { itemsState, chatGeneral } = getProyectoState(proyectoId)
  return {
    itemsState,
    chatGeneral,
    marcarManual: (itemId: string, status: ChecklistStatus, justificacion?: string) =>
      marcarManual(proyectoId, itemId, status, justificacion),
    enviarMensajeGeneral: (texto: string, tipo?: EvidenciaTipo) => enviarMensajeGeneral(proyectoId, texto, tipo),
    enviarMensajeItem: (itemId: string, texto: string, tipo?: EvidenciaTipo) =>
      enviarMensajeItem(proyectoId, itemId, texto, tipo),
  }
}

export const inspectorActual = inspector

export function ChecklistLayout() {
  return (
    <ChecklistProvider>
      <Outlet />
    </ChecklistProvider>
  )
}
