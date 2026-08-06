import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import {
  checklistDef,
  chatGeneralInicial,
  estadoInicial,
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

type ChecklistContextValue = {
  itemsState: Record<string, ItemState>
  chatGeneral: ChatMessage[]
  marcarManual: (itemId: string, status: ChecklistStatus, justificacion?: string) => void
  enviarMensajeGeneral: (texto: string, tipo?: EvidenciaTipo) => void
  enviarMensajeItem: (itemId: string, texto: string, tipo?: EvidenciaTipo) => void
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null)

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [itemsState, setItemsState] = useState<Record<string, ItemState>>(estadoInicial)
  const [chatGeneral, setChatGeneral] = useState<ChatMessage[]>(chatGeneralInicial)

  const marcarManual = useCallback((itemId: string, status: ChecklistStatus, justificacion?: string) => {
    setItemsState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status,
        origen: 'manual',
        justificacionNoAplica: status === 'na' ? justificacion : undefined,
      },
    }))
  }, [])

  const enviarMensajeGeneral = useCallback((texto: string, tipo: EvidenciaTipo = 'texto') => {
    if (!texto.trim()) return
    const hora = horaAhora()
    const inspectorMsg: ChatMessage = { id: nextId('gm'), role: 'inspector', texto, tipo, hora }

    const matched = matchItemsByKeyword(texto)

    if (matched.length === 0) {
      const iaMsg: ChatMessage = {
        id: nextId('gm'),
        role: 'ia',
        texto:
          'No logro identificar a qué ítem del checklist corresponde esto. ¿Me puedes decir a cuál te refieres, o contármelo dentro del chat de ese ítem?',
        hora,
      }
      setChatGeneral((prev) => [...prev, inspectorMsg, iaMsg])
      return
    }

    setItemsState((prev) => {
      const next = { ...prev }
      for (const def of matched) {
        const prevState = next[def.id]
        if (prevState.status === 'na') continue
        next[def.id] = {
          ...prevState,
          status: 'ok',
          origen: 'chat',
          evidencia: [
            ...prevState.evidencia,
            { id: nextId('ev'), tipo, origen: 'chat-general', texto, hora },
          ],
        }
      }
      return next
    })

    const titulos = matched.map((d) => `"${d.titulo}"`).join(' y ')
    const iaMsg: ChatMessage = {
      id: nextId('gm'),
      role: 'ia',
      texto: `Marqué ${titulos} como cumplido${matched.length > 1 ? 's' : ''} con tu ${
        tipo === 'foto' ? 'mensaje y la foto adjunta' : tipo === 'audio' ? 'declaración por voz' : 'mensaje'
      }.`,
      hora,
    }
    setChatGeneral((prev) => [...prev, inspectorMsg, iaMsg])
  }, [])

  const enviarMensajeItem = useCallback((itemId: string, texto: string, tipo: EvidenciaTipo = 'texto') => {
    if (!texto.trim()) return
    const def = checklistDef.find((d) => d.id === itemId)
    if (!def) return
    const hora = horaAhora()
    const inspectorMsg: ChatMessage = { id: nextId('im'), role: 'inspector', texto, tipo, hora }

    setItemsState((prev) => {
      const prevState = prev[itemId]
      const evidencia = [...prevState.evidencia, { id: nextId('ev'), tipo, origen: 'chat-item' as const, texto, hora }]
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

      const nextState: ItemState = {
        ...prevState,
        status: prevState.status === 'na' ? prevState.status : status,
        origen: 'chat',
        evidencia,
        chat: [...prevState.chat, inspectorMsg, iaMsg],
      }
      return { ...prev, [itemId]: nextState }
    })
  }, [])

  const value = useMemo(
    () => ({ itemsState, chatGeneral, marcarManual, enviarMensajeGeneral, enviarMensajeItem }),
    [itemsState, chatGeneral, marcarManual, enviarMensajeGeneral, enviarMensajeItem],
  )

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export const inspectorActual = inspector

export function ChecklistLayout() {
  return (
    <ChecklistProvider>
      <Outlet />
    </ChecklistProvider>
  )
}
