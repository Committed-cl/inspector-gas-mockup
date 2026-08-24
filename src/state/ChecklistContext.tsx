import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import {
  checklistDef,
  initialGeneralChatForVisit,
  initialStateForVisit,
  initialVisitsForProject,
  completedForState,
  matchItemsByKeyword,
  suggestItemsForText,
  nextPendingRequirement,
  hasSufficientEvidence,
  inspector,
  type ChatMessage,
  type ChecklistStatus,
  type Evidence,
  type EvidenceType,
  type ItemState,
  type Visit,
} from '../data/checklistMatrizInterior'

let seq = 0
function nextId(prefix: string) {
  seq += 1
  return `${prefix}-${seq}`
}

function currentTime() {
  return new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

type ProjectChecklistState = {
  itemsState: Record<string, ItemState>
  generalChat: ChatMessage[]
}

// A visit's checklist state is independent of every other visit for the same
// project — the key combines both so obra → visita → checklist stays 1:1:1.
function visitKey(projectId: string, visitId: string) {
  return `${projectId}::${visitId}`
}

function initialProjectState(projectId: string, visitId: string): ProjectChecklistState {
  return {
    itemsState: initialStateForVisit(projectId, visitId),
    generalChat: initialGeneralChatForVisit(projectId, visitId),
  }
}

function ensureVisitState(
  projectId: string,
  visitId: string,
  byVisit: Record<string, ProjectChecklistState>,
): Record<string, ProjectChecklistState> {
  const key = visitKey(projectId, visitId)
  if (byVisit[key]) return byVisit
  return { ...byVisit, [key]: initialProjectState(projectId, visitId) }
}

function ensureVisits(projectId: string, byProject: Record<string, Visit[]>): Record<string, Visit[]> {
  if (byProject[projectId]) return byProject
  return { ...byProject, [projectId]: initialVisitsForProject(projectId) }
}

type ChecklistContextValue = {
  getProjectState: (projectId: string, visitId: string) => ProjectChecklistState
  getVisits: (projectId: string) => Visit[]
  createVisit: (projectId: string) => string
  closeVisit: (projectId: string, visitId: string) => void
  markManually: (projectId: string, visitId: string, itemId: string, status: ChecklistStatus, reason?: string) => void
  addEvidence: (
    projectId: string,
    visitId: string,
    itemId: string,
    requirementIndex: number,
    type: EvidenceType,
    text: string,
    previewUrl?: string,
  ) => void
  sendGeneralMessage: (projectId: string, visitId: string, text: string, type?: EvidenceType) => void
  sendItemMessage: (projectId: string, visitId: string, itemId: string, text: string, type?: EvidenceType) => void
  resolveGeneralMessage: (projectId: string, visitId: string, messageId: string, itemId: string) => void
}

const ChecklistContext = createContext<ChecklistContextValue | null>(null)

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [byVisit, setByVisit] = useState<Record<string, ProjectChecklistState>>({})
  const [visitsByProject, setVisitsByProject] = useState<Record<string, Visit[]>>({})

  const getProjectState = useCallback(
    (projectId: string, visitId: string) => byVisit[visitKey(projectId, visitId)] ?? initialProjectState(projectId, visitId),
    [byVisit],
  )

  const getVisits = useCallback(
    (projectId: string) => visitsByProject[projectId] ?? initialVisitsForProject(projectId),
    [visitsByProject],
  )

  const createVisit = useCallback((projectId: string) => {
    let newId = ''
    setVisitsByProject((prev) => {
      const base = ensureVisits(projectId, prev)
      const visits = base[projectId]
      const open = visits.find((v) => v.status === 'en_curso')
      if (open) {
        newId = open.id
        return base
      }
      newId = nextId(`visita-${projectId}`)
      const visit: Visit = { id: newId, date: today(), status: 'en_curso' }
      return { ...base, [projectId]: [...visits, visit] }
    })
    return newId
  }, [])

  const closeVisit = useCallback(
    (projectId: string, visitId: string) => {
      setVisitsByProject((prevVisits) => {
        const base = ensureVisits(projectId, prevVisits)
        const visits = base[projectId]
        const visit = visits.find((v) => v.id === visitId)
        if (!visit || visit.status !== 'en_curso') return base

        const state = byVisit[visitKey(projectId, visitId)] ?? initialProjectState(projectId, visitId)
        const { completed, total } = completedForState(state.itemsState)
        const status: Visit['status'] = completed === total ? 'aprobada' : 'rechazada'

        return {
          ...base,
          [projectId]: visits.map((v) => (v.id === visitId ? { ...v, status } : v)),
        }
      })
    },
    [byVisit],
  )

  const markManually = useCallback(
    (projectId: string, visitId: string, itemId: string, status: ChecklistStatus, reason?: string) => {
      const time = currentTime()
      setByVisit((prev) => {
        const base = ensureVisitState(projectId, visitId, prev)
        const key = visitKey(projectId, visitId)
        const projectState = base[key]
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
          [key]: {
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
    (
      projectId: string,
      visitId: string,
      itemId: string,
      requirementIndex: number,
      type: EvidenceType,
      text: string,
      previewUrl?: string,
    ) => {
      if (!text.trim()) return
      const time = currentTime()
      setByVisit((prev) => {
        const base = ensureVisitState(projectId, visitId, prev)
        const key = visitKey(projectId, visitId)
        const projectState = base[key]
        const prevItem = projectState.itemsState[itemId]
        const newEvidence: Evidence = { id: nextId('ev'), type, source: 'manual', text, time, requirementIndex, previewUrl }
        // With at least one piece of evidence loaded, the item can no longer stay
        // red — it moves to amber even if more fields are still missing. It
        // still needs Cumple to reach green, and is left alone if it was already
        // green, amber, or not-applicable.
        const finalStatus = prevItem.status === 'pending' ? 'warn' : prevItem.status
        return {
          ...base,
          [key]: {
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

  const sendGeneralMessage = useCallback((projectId: string, visitId: string, text: string, type: EvidenceType = 'text') => {
    if (!text.trim()) return
    const time = currentTime()
    const inspectorMsg: ChatMessage = { id: nextId('gm'), role: 'inspector', text, type, time }
    const matched = matchItemsByKeyword(text)

    setByVisit((prev) => {
      const base = ensureVisitState(projectId, visitId, prev)
      const key = visitKey(projectId, visitId)
      const projectState = base[key]

      if (matched.length === 0) {
        const suggestions = suggestItemsForText(text, projectState.itemsState)
        const aiMsg: ChatMessage = {
          id: nextId('gm'),
          role: 'ai',
          text:
            suggestions.length > 0
              ? 'No estoy seguro a qué ítem corresponde esto. ¿Es alguno de estos?'
              : 'No logro identificar a qué ítem del checklist corresponde esto. ¿Me puedes decir a cuál te refieres, o contármelo dentro del chat de ese ítem?',
          time,
          options: suggestions.length > 0 ? suggestions.map((d) => ({ itemId: d.id, title: d.title })) : undefined,
          pendingEvidence: suggestions.length > 0 ? { text, type } : undefined,
        }
        return {
          ...base,
          [key]: { ...projectState, generalChat: [...projectState.generalChat, inspectorMsg, aiMsg] },
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
        [key]: {
          itemsState: nextItemsState,
          generalChat: [...projectState.generalChat, inspectorMsg, aiMsg],
        },
      }
    })
  }, [])

  const sendItemMessage = useCallback(
    (projectId: string, visitId: string, itemId: string, text: string, type: EvidenceType = 'text') => {
      if (!text.trim()) return
      const def = checklistDef.find((d) => d.id === itemId)
      if (!def) return
      const time = currentTime()
      const inspectorMsg: ChatMessage = { id: nextId('im'), role: 'inspector', text, type, time }

      setByVisit((prev) => {
        const base = ensureVisitState(projectId, visitId, prev)
        const key = visitKey(projectId, visitId)
        const projectState = base[key]
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
          [key]: {
            ...projectState,
            itemsState: { ...projectState.itemsState, [itemId]: nextItem },
          },
        }
      })
    },
    [],
  )

  const resolveGeneralMessage = useCallback((projectId: string, visitId: string, messageId: string, itemId: string) => {
    const time = currentTime()
    setByVisit((prev) => {
      const base = ensureVisitState(projectId, visitId, prev)
      const key = visitKey(projectId, visitId)
      const projectState = base[key]
      const target = projectState.generalChat.find((m) => m.id === messageId)
      const def = checklistDef.find((d) => d.id === itemId)
      if (!target || !target.pendingEvidence || !def) return base

      const { text, type } = target.pendingEvidence
      const prevItem = projectState.itemsState[itemId]
      const requirementIndex = nextPendingRequirement(def, prevItem.evidence, type)
      const newEvidence: Evidence = { id: nextId('ev'), type, source: 'general-chat', text, time, requirementIndex }
      const evidence = [...prevItem.evidence, newEvidence]
      const sufficient = hasSufficientEvidence(def, evidence)
      const nextItem: ItemState = {
        ...prevItem,
        status: prevItem.status === 'na' ? prevItem.status : sufficient ? 'ok' : 'warn',
        source: 'chat',
        evidence,
      }

      const confirmMsg: ChatMessage = {
        id: nextId('gm'),
        role: 'ai',
        text: sufficient
          ? `Marqué "${def.title}" como cumplido con tu mensaje.`
          : `Anoté esto en "${def.title}", pero todavía falta evidencia para darlo por cumplido.`,
        time,
      }

      return {
        ...base,
        [key]: {
          itemsState: { ...projectState.itemsState, [itemId]: nextItem },
          generalChat: [
            ...projectState.generalChat.map((m) =>
              m.id === messageId ? { ...m, options: undefined, pendingEvidence: undefined } : m,
            ),
            confirmMsg,
          ],
        },
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      getProjectState,
      getVisits,
      createVisit,
      closeVisit,
      markManually,
      addEvidence,
      sendGeneralMessage,
      sendItemMessage,
      resolveGeneralMessage,
    }),
    [
      getProjectState,
      getVisits,
      createVisit,
      closeVisit,
      markManually,
      addEvidence,
      sendGeneralMessage,
      sendItemMessage,
      resolveGeneralMessage,
    ],
  )

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export function useProjectVisits(projectId: string) {
  const { getVisits, createVisit, closeVisit } = useChecklist()
  return {
    visits: getVisits(projectId),
    createVisit: () => createVisit(projectId),
    closeVisit: (visitId: string) => closeVisit(projectId, visitId),
  }
}

export function useProjectChecklist(projectId: string, visitId: string) {
  const { getProjectState, markManually, addEvidence, sendGeneralMessage, sendItemMessage, resolveGeneralMessage } =
    useChecklist()
  const { itemsState, generalChat } = getProjectState(projectId, visitId)
  return {
    itemsState,
    generalChat,
    markManually: (itemId: string, status: ChecklistStatus, reason?: string) =>
      markManually(projectId, visitId, itemId, status, reason),
    addEvidence: (itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) =>
      addEvidence(projectId, visitId, itemId, requirementIndex, type, text, previewUrl),
    sendGeneralMessage: (text: string, type?: EvidenceType) => sendGeneralMessage(projectId, visitId, text, type),
    sendItemMessage: (itemId: string, text: string, type?: EvidenceType) =>
      sendItemMessage(projectId, visitId, itemId, text, type),
    resolveGeneralMessage: (messageId: string, itemId: string) => resolveGeneralMessage(projectId, visitId, messageId, itemId),
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
