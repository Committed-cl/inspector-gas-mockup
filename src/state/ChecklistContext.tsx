import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import {
  checklistDef,
  chatGeneralInicialParaProyecto,
  estadoInicialParaProyecto,
  matchItemsByKeyword,
  siguienteRequisitoPendiente,
  tieneEvidenciaSuficiente,
  inspector,
  type ChatMessage,
  type ChecklistStatus,
  type Evidencia,
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
  agregarEvidencia: (
    proyectoId: string,
    itemId: string,
    requisitoIndex: number,
    tipo: EvidenciaTipo,
    texto: string,
    previewUrl?: string,
  ) => void
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
      const hora = horaAhora()
      setPorProyecto((prev) => {
        const base = ensureProyecto(proyectoId, prev)
        const proyectoState = base[proyectoId]
        const prevItem = proyectoState.itemsState[itemId]
        const def = checklistDef.find((d) => d.id === itemId)

        // No puede quedar en verde por marcado manual si al ítem le falta la evidencia
        // que exige el checklist — se queda en amarillo hasta que se cargue.
        const statusFinal: ChecklistStatus =
          status === 'ok' && def && !tieneEvidenciaSuficiente(def, prevItem.evidencia) ? 'warn' : status

        // El marcado manual aparece en la lista de evidencias como el estado actual
        // del marcado — no como historial. Un clic nuevo reemplaza al anterior, no
        // se acumulan entradas por cada vez que se tocó Cumple/No cumple.
        const textoEvidencia =
          statusFinal === 'na'
            ? `Marcado manualmente como no aplica${justificacion ? `: ${justificacion}` : '.'}`
            : statusFinal === 'ok'
              ? 'Marcado manualmente como cumplido.'
              : statusFinal === 'warn'
                ? 'Marcado como cumplido, pero falta evidencia para confirmarlo.'
                : 'Marcado manualmente como no cumple.'

        const marcaManual: Evidencia = {
          id: nextId('ev'),
          tipo: 'texto',
          origen: 'marcado-manual',
          texto: textoEvidencia,
          hora,
          resultado: statusFinal,
        }

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
                evidencia: [...prevItem.evidencia.filter((e) => e.origen !== 'marcado-manual'), marcaManual],
              },
            },
          },
        }
      })
    },
    [],
  )

  const agregarEvidencia = useCallback(
    (proyectoId: string, itemId: string, requisitoIndex: number, tipo: EvidenciaTipo, texto: string, previewUrl?: string) => {
      if (!texto.trim()) return
      const hora = horaAhora()
      setPorProyecto((prev) => {
        const base = ensureProyecto(proyectoId, prev)
        const proyectoState = base[proyectoId]
        const prevItem = proyectoState.itemsState[itemId]
        const nuevaEvidencia: Evidencia = { id: nextId('ev'), tipo, origen: 'manual', texto, hora, requisitoIndex, previewUrl }
        return {
          ...base,
          [proyectoId]: {
            ...proyectoState,
            itemsState: {
              ...proyectoState.itemsState,
              [itemId]: { ...prevItem, evidencia: [...prevItem.evidencia, nuevaEvidencia] },
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
      const actualizados: string[] = []
      for (const def of matched) {
        const prevItem = nextItemsState[def.id]
        if (prevItem.status === 'na') continue
        const requisitoIndex = siguienteRequisitoPendiente(def, prevItem.evidencia, tipo)
        const nuevaEvidencia: Evidencia = { id: nextId('ev'), tipo, origen: 'chat-general', texto, hora, requisitoIndex }
        const evidencia = [...prevItem.evidencia, nuevaEvidencia]
        const suficiente = tieneEvidenciaSuficiente(def, evidencia)
        nextItemsState[def.id] = { ...prevItem, status: suficiente ? 'ok' : 'warn', origen: 'chat', evidencia }
        if (suficiente) actualizados.push(def.titulo)
      }

      const titulos = actualizados.map((t) => `"${t}"`).join(' y ')
      const iaTexto =
        actualizados.length > 0
          ? `Marqué ${titulos} como cumplido${actualizados.length > 1 ? 's' : ''} con tu ${
              tipo === 'foto' ? 'mensaje y la foto adjunta' : tipo === 'audio' ? 'declaración por voz' : 'mensaje'
            }.`
          : `Anoté esto en ${matched.length > 1 ? 'los ítems correspondientes' : `"${matched[0].titulo}"`}, pero todavía falta evidencia para darlos por cumplidos.`
      const iaMsg: ChatMessage = { id: nextId('gm'), role: 'ia', texto: iaTexto, hora }

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
        const requisitoIndex = siguienteRequisitoPendiente(def, prevItem.evidencia, tipo)
        const nuevaEvidencia: Evidencia = { id: nextId('ev'), tipo, origen: 'chat-item', texto, hora, requisitoIndex }
        const evidencia = [...prevItem.evidencia, nuevaEvidencia]
        const suficiente = tieneEvidenciaSuficiente(def, evidencia)

        const iaTexto = suficiente
          ? `Marqué "${def.titulo}" como cumplido con ${tipo === 'foto' ? 'la foto adjunta' : 'tu declaración'}.`
          : `Todavía falta evidencia para dar "${def.titulo}" por cumplido — ${def.criterioNormativo}. ¿Puedes contarme o adjuntar lo que falta?`

        const iaMsg: ChatMessage = { id: nextId('im'), role: 'ia', texto: iaTexto, hora }

        const nextItem: ItemState = {
          ...prevItem,
          status: prevItem.status === 'na' ? prevItem.status : suficiente ? 'ok' : 'warn',
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
    () => ({ getProyectoState, marcarManual, agregarEvidencia, enviarMensajeGeneral, enviarMensajeItem }),
    [getProyectoState, marcarManual, agregarEvidencia, enviarMensajeGeneral, enviarMensajeItem],
  )

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export function useProyectoChecklist(proyectoId: string) {
  const { getProyectoState, marcarManual, agregarEvidencia, enviarMensajeGeneral, enviarMensajeItem } = useChecklist()
  const { itemsState, chatGeneral } = getProyectoState(proyectoId)
  return {
    itemsState,
    chatGeneral,
    marcarManual: (itemId: string, status: ChecklistStatus, justificacion?: string) =>
      marcarManual(proyectoId, itemId, status, justificacion),
    agregarEvidencia: (itemId: string, requisitoIndex: number, tipo: EvidenciaTipo, texto: string, previewUrl?: string) =>
      agregarEvidencia(proyectoId, itemId, requisitoIndex, tipo, texto, previewUrl),
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
