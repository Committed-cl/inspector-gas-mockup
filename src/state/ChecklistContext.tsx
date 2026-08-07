import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import {
  checklistDef,
  initialGeneralChatForProject,
  initialStateForProject,
  matchItemsByKeyword,
  nextPendingRequirement,
  hasSufficientEvidence,
  inspector,
  type ChatMessage,
  type ChecklistStatus,
  type Evidence,
  type EvidenceType,
  type ItemState,
} from '../data/checklistMatrizInterior'

let seq = 0
function nextId(prefix: string) {
  seq += 1
  return `${prefix}-${seq}`
}

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

type ProjectChecklistState = {
  itemsState: Record<string, ItemState>
  generalChat: ChatMessage[]
}

function initialProjectState(projectId: string): ProjectChecklistState {
  return {
    itemsState: initialStateForProject(projectId),
    generalChat: initialGeneralChatForProject(projectId),
  }
}

function ensureProject(
  projectId: string,
  byProject: Record<string, ProjectChecklistState>,
): Record<string, ProjectChecklistState> {
  if (byProject[projectId]) return byProject
  return { ...byProject, [projectId]: initialProjectState(projectId) }
}

type ChecklistContextValue = {
  getProjectState: (projectId: string) => ProjectChecklistState
  markManually: (projectId: string, itemId: string, status: ChecklistStatus, reason?: string) => void
  addEvidence: (
    projectId: string,
    itemId: string,
    requirementIndex: number,
    type: EvidenceType,
    text: string,
    previewUrl?: string,
  ) => void
  sendGeneralMessage: (projectId: string, text: string, type?: EvidenceType) => void
  sendItemMessage: (projectId: string, itemId: string, text: string, type?: EvidenceType) => void
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null)

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [byProject, setByProject] = useState<Record<string, ProjectChecklistState>>({})

  const getProjectState = useCallback(
    (projectId: string) => byProject[projectId] ?? initialProjectState(projectId),
    [byProject],
  )

  const markManually = useCallback(
    (projectId: string, itemId: string, status: ChecklistStatus, reason?: string) => {
      const time = currentTime()
      setByProject((prev) => {
        const base = ensureProject(projectId, prev)
        const projectState = base[projectId]
        const prevItem = projectState.itemsState[itemId]
        const def = checklistDef.find((d) => d.id === itemId)

        // A manual mark can't reach green if the item is missing evidence the
        // checklist requires — it stays amber until that evidence is loaded.
        const finalStatus: ChecklistStatus =
          status === 'ok' && def && !hasSufficientEvidence(def, prevItem.evidence) ? 'warn' : status

        // The manual mark shows up in the evidence list as the current state of
        // the mark — not as history. A new click replaces the previous one;
        // entries don't pile up every time Cumple/No cumple gets touched.
        const evidenceText =
          finalStatus === 'na'
            ? `Marcado manualmente como no aplica${reason ? `: ${reason}` : '.'}`
            : finalStatus === 'ok'
              ? 'Marcado manualmente como cumplido.'
              : finalStatus === 'warn'
                ? 'Marcado como cumplido, pero falta evidencia para confirmarlo.'
                : 'Marcado manualmente como no cumple.'

        const manualMark: Evidence = {
          id: nextId('ev'),
          type: 'text',
          source: 'manual-mark',
          text: evidenceText,
          time,
          result: finalStatus,
        }

        return {
          ...base,
          [projectId]: {
            ...projectState,
            itemsState: {
              ...projectState.itemsState,
              [itemId]: {
                ...prevItem,
                status: finalStatus,
                source: 'manual',
                notApplicableReason: finalStatus === 'na' ? reason : undefined,
                evidence: [...prevItem.evidence.filter((e) => e.source !== 'manual-mark'), manualMark],
              },
            },
          },
        }
      })
    },
    [],
  )

  const addEvidence = useCallback(
    (projectId: string, itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) => {
      if (!text.trim()) return
      const time = currentTime()
      setByProject((prev) => {
        const base = ensureProject(projectId, prev)
        const projectState = base[projectId]
        const prevItem = projectState.itemsState[itemId]
        const newEvidence: Evidence = { id: nextId('ev'), type, source: 'manual', text, time, requirementIndex, previewUrl }
        // With at least one piece of evidence loaded, the item can no longer stay
        // red — it moves to amber even if more fields are still missing. It
        // still needs Cumple to reach green, and is left alone if it was already
        // green, amber, or not-applicable.
        const finalStatus = prevItem.status === 'pending' ? 'warn' : prevItem.status
        return {
          ...base,
          [projectId]: {
            ...projectState,
            itemsState: {
              ...projectState.itemsState,
              [itemId]: { ...prevItem, status: finalStatus, evidence: [...prevItem.evidence, newEvidence] },
            },
          },
        }
      })
    },
    [],
  )

  const sendGeneralMessage = useCallback((projectId: string, text: string, type: EvidenceType = 'text') => {
    if (!text.trim()) return
    const time = currentTime()
    const inspectorMsg: ChatMessage = { id: nextId('gm'), role: 'inspector', text, type, time }
    const matched = matchItemsByKeyword(text)

    setByProject((prev) => {
      const base = ensureProject(projectId, prev)
      const projectState = base[projectId]

      if (matched.length === 0) {
        const aiMsg: ChatMessage = {
          id: nextId('gm'),
          role: 'ai',
          text: 'No logro identificar a qué ítem del checklist corresponde esto. ¿Me puedes decir a cuál te refieres, o contármelo dentro del chat de ese ítem?',
          time,
        }
        return {
          ...base,
          [projectId]: { ...projectState, generalChat: [...projectState.generalChat, inspectorMsg, aiMsg] },
        }
      }

      const nextItemsState = { ...projectState.itemsState }
      const updated: string[] = []
      for (const def of matched) {
        const prevItem = nextItemsState[def.id]
        if (prevItem.status === 'na') continue
        const requirementIndex = nextPendingRequirement(def, prevItem.evidence, type)
        const newEvidence: Evidence = { id: nextId('ev'), type, source: 'general-chat', text, time, requirementIndex }
        const evidence = [...prevItem.evidence, newEvidence]
        const sufficient = hasSufficientEvidence(def, evidence)
        nextItemsState[def.id] = { ...prevItem, status: sufficient ? 'ok' : 'warn', source: 'chat', evidence }
        if (sufficient) updated.push(def.title)
      }

      const titles = updated.map((t) => `"${t}"`).join(' y ')
      const aiText =
        updated.length > 0
          ? `Marqué ${titles} como cumplido${updated.length > 1 ? 's' : ''} con tu ${
              type === 'photo' ? 'mensaje y la foto adjunta' : type === 'audio' ? 'declaración por voz' : 'mensaje'
            }.`
          : `Anoté esto en ${matched.length > 1 ? 'los ítems correspondientes' : `"${matched[0].title}"`}, pero todavía falta evidencia para darlos por cumplidos.`
      const aiMsg: ChatMessage = { id: nextId('gm'), role: 'ai', text: aiText, time }

      return {
        ...base,
        [projectId]: {
          itemsState: nextItemsState,
          generalChat: [...projectState.generalChat, inspectorMsg, aiMsg],
        },
      }
    })
  }, [])

  const sendItemMessage = useCallback(
    (projectId: string, itemId: string, text: string, type: EvidenceType = 'text') => {
      if (!text.trim()) return
      const def = checklistDef.find((d) => d.id === itemId)
      if (!def) return
      const time = currentTime()
      const inspectorMsg: ChatMessage = { id: nextId('im'), role: 'inspector', text, type, time }

      setByProject((prev) => {
        const base = ensureProject(projectId, prev)
        const projectState = base[projectId]
        const prevItem = projectState.itemsState[itemId]
        const requirementIndex = nextPendingRequirement(def, prevItem.evidence, type)
        const newEvidence: Evidence = { id: nextId('ev'), type, source: 'item-chat', text, time, requirementIndex }
        const evidence = [...prevItem.evidence, newEvidence]
        const sufficient = hasSufficientEvidence(def, evidence)

        const aiText = sufficient
          ? `Marqué "${def.title}" como cumplido con ${type === 'photo' ? 'la foto adjunta' : 'tu declaración'}.`
          : `Todavía falta evidencia para dar "${def.title}" por cumplido — ${def.regulatoryCriteria}. ¿Puedes contarme o adjuntar lo que falta?`

        const aiMsg: ChatMessage = { id: nextId('im'), role: 'ai', text: aiText, time }

        const nextItem: ItemState = {
          ...prevItem,
          status: prevItem.status === 'na' ? prevItem.status : sufficient ? 'ok' : 'warn',
          source: 'chat',
          evidence,
          chat: [...prevItem.chat, inspectorMsg, aiMsg],
        }

        return {
          ...base,
          [projectId]: {
            ...projectState,
            itemsState: { ...projectState.itemsState, [itemId]: nextItem },
          },
        }
      })
    },
    [],
  )

  const value = useMemo(
    () => ({ getProjectState, markManually, addEvidence, sendGeneralMessage, sendItemMessage }),
    [getProjectState, markManually, addEvidence, sendGeneralMessage, sendItemMessage],
  )

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export function useProjectChecklist(projectId: string) {
  const { getProjectState, markManually, addEvidence, sendGeneralMessage, sendItemMessage } = useChecklist()
  const { itemsState, generalChat } = getProjectState(projectId)
  return {
    itemsState,
    generalChat,
    markManually: (itemId: string, status: ChecklistStatus, reason?: string) =>
      markManually(projectId, itemId, status, reason),
    addEvidence: (itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) =>
      addEvidence(projectId, itemId, requirementIndex, type, text, previewUrl),
    sendGeneralMessage: (text: string, type?: EvidenceType) => sendGeneralMessage(projectId, text, type),
    sendItemMessage: (itemId: string, text: string, type?: EvidenceType) => sendItemMessage(projectId, itemId, text, type),
  }
}

export const currentInspector = inspector

export function ChecklistLayout() {
  return (
    <ChecklistProvider>
      <Outlet />
    </ChecklistProvider>
  )
}
