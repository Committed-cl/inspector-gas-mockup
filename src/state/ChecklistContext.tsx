import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { api } from '../lib/api'
import type { ChatMessage, ChecklistStatus, EvidenceType, ItemState } from '../data/checklistMatrizInterior'

export type VisitStatus = 'en_curso' | 'aprobada' | 'rechazada'
export type Visit = { id: string; projectId: string; date: string; status: VisitStatus; reportSentAt?: string }

export type ProjectSummary = {
  id: string
  clientId: string
  name: string
  address: string
  builder: string
  installer: string
  floors: number
  stageNumber: number
  stageName: string
  openVisit: { id: string; date: string } | null
}

export type CreateProjectInput = {
  clientId: string
  name: string
  address: string
  builder: string
  installer: string
  floors: number
  stageNumber: number
  stageName: string
}

type ChecklistState = { itemsState: Record<string, ItemState>; generalChat: ChatMessage[]; observations: string }

type Async<T> = { data: T | null; loading: boolean; error: string | null }
function idle<T>(): Async<T> {
  return { data: null, loading: false, error: null }
}
// On the render before a fetch-on-mount effect has run, an untouched slot
// reads as idle() — loading: false, data: null — which would let pages
// render as if data resolved to "nothing" instead of "not fetched yet".
// Treat "no data and no error yet" as still loading too.
function isPending<T>(a: Async<T>): boolean {
  return a.loading || (!a.data && !a.error)
}

const visitKey = (projectId: string, visitId: string) => `${projectId}::${visitId}`

type Ctx = {
  projects: Async<ProjectSummary[]>
  fetchProjectsIfNeeded: () => void
  getProject: (projectId: string) => Async<ProjectSummary>
  fetchProjectIfNeeded: (projectId: string) => void
  getVisits: (projectId: string) => Async<Visit[]>
  fetchVisitsIfNeeded: (projectId: string) => void
  getChecklist: (projectId: string, visitId: string) => Async<ChecklistState>
  fetchChecklistIfNeeded: (projectId: string, visitId: string) => void
  createProject: (input: CreateProjectInput) => Promise<string>
  createVisit: (projectId: string) => Promise<string>
  closeVisit: (projectId: string, visitId: string) => Promise<void>
  sendReport: (projectId: string, visitId: string) => Promise<void>
  setObservations: (projectId: string, visitId: string, html: string) => Promise<void>
  markManually: (projectId: string, visitId: string, itemId: string, status: ChecklistStatus, reason?: string) => Promise<void>
  addEvidence: (
    projectId: string,
    visitId: string,
    itemId: string,
    requirementIndex: number,
    type: EvidenceType,
    text: string,
    previewUrl?: string,
  ) => Promise<void>
  sendGeneralMessage: (projectId: string, visitId: string, text: string, type?: EvidenceType) => Promise<void>
  sendItemMessage: (projectId: string, visitId: string, itemId: string, text: string, type?: EvidenceType) => Promise<void>
  resolveGeneralMessage: (projectId: string, visitId: string, messageId: string, itemId: string) => Promise<void>
}

const ChecklistContext = createContext<Ctx | null>(null)

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Async<ProjectSummary[]>>(idle())
  const [projectById, setProjectById] = useState<Record<string, Async<ProjectSummary>>>({})
  const [visitsByProject, setVisitsByProject] = useState<Record<string, Async<Visit[]>>>({})
  const [checklistByVisit, setChecklistByVisit] = useState<Record<string, Async<ChecklistState>>>({})
  // The rich text editor fires onChange on every keystroke — debounce the
  // save so it doesn't send one PUT per character (and so out-of-order
  // responses to overlapping requests can't clobber a newer local edit).
  const observationsDebounce = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const fetchProjectsIfNeeded = useCallback(() => {
    setProjects((prev) => {
      if (prev.data || prev.loading) return prev
      api.get<ProjectSummary[]>('/projects').then(
        (data) => setProjects({ data, loading: false, error: null }),
        (err) => setProjects({ data: null, loading: false, error: String(err) }),
      )
      return { data: null, loading: true, error: null }
    })
  }, [])

  const getProject = useCallback((projectId: string) => projectById[projectId] ?? idle<ProjectSummary>(), [projectById])
  const fetchProjectIfNeeded = useCallback((projectId: string) => {
    setProjectById((prev) => {
      if (prev[projectId]?.data || prev[projectId]?.loading) return prev
      api.get<ProjectSummary>(`/projects/${projectId}`).then(
        (data) => setProjectById((p) => ({ ...p, [projectId]: { data, loading: false, error: null } })),
        (err) => setProjectById((p) => ({ ...p, [projectId]: { data: null, loading: false, error: String(err) } })),
      )
      return { ...prev, [projectId]: { data: null, loading: true, error: null } }
    })
  }, [])

  const getVisits = useCallback((projectId: string) => visitsByProject[projectId] ?? idle<Visit[]>(), [visitsByProject])
  const fetchVisitsIfNeeded = useCallback((projectId: string) => {
    setVisitsByProject((prev) => {
      if (prev[projectId]?.data || prev[projectId]?.loading) return prev
      api.get<Visit[]>(`/projects/${projectId}/visits`).then(
        (data) => setVisitsByProject((v) => ({ ...v, [projectId]: { data, loading: false, error: null } })),
        (err) => setVisitsByProject((v) => ({ ...v, [projectId]: { data: null, loading: false, error: String(err) } })),
      )
      return { ...prev, [projectId]: { data: null, loading: true, error: null } }
    })
  }, [])

  const getChecklist = useCallback(
    (projectId: string, visitId: string) => checklistByVisit[visitKey(projectId, visitId)] ?? idle<ChecklistState>(),
    [checklistByVisit],
  )
  const fetchChecklistIfNeeded = useCallback((projectId: string, visitId: string) => {
    const key = visitKey(projectId, visitId)
    setChecklistByVisit((prev) => {
      if (prev[key]?.data || prev[key]?.loading) return prev
      api.get<ChecklistState>(`/projects/${projectId}/visits/${visitId}/checklist`).then(
        (data) => setChecklistByVisit((c) => ({ ...c, [key]: { data, loading: false, error: null } })),
        (err) => setChecklistByVisit((c) => ({ ...c, [key]: { data: null, loading: false, error: String(err) } })),
      )
      return { ...prev, [key]: { data: null, loading: true, error: null } }
    })
  }, [])

  const adoptChecklist = (projectId: string, visitId: string, data: ChecklistState) => {
    setChecklistByVisit((prev) => ({ ...prev, [visitKey(projectId, visitId)]: { data, loading: false, error: null } }))
  }

  const adoptVisit = (projectId: string, visit: Visit) => {
    setVisitsByProject((prev) => ({
      ...prev,
      [projectId]: { data: (prev[projectId]?.data ?? []).map((v) => (v.id === visit.id ? visit : v)), loading: false, error: null },
    }))
  }

  const createProject = useCallback(async (input: CreateProjectInput) => {
    // POST /projects returns the bare Project (no openVisit) — a brand-new
    // project never has one, so that's known statically rather than trusted
    // blindly from the response shape.
    const project = await api.post<Omit<ProjectSummary, 'openVisit'>>('/projects', input)
    const summary: ProjectSummary = { ...project, openVisit: null }
    setProjects((prev) => ({ data: [...(prev.data ?? []), summary], loading: false, error: null }))
    return summary.id
  }, [])

  const createVisit = useCallback(async (projectId: string) => {
    const visit = await api.post<Visit>(`/projects/${projectId}/visits`)
    setVisitsByProject((prev) => ({
      ...prev,
      [projectId]: {
        data: (prev[projectId]?.data ?? []).some((v) => v.id === visit.id)
          ? prev[projectId]!.data!
          : [...(prev[projectId]?.data ?? []), visit],
        loading: false,
        error: null,
      },
    }))
    return visit.id
  }, [])

  const closeVisit = useCallback(async (projectId: string, visitId: string) => {
    adoptVisit(projectId, await api.post<Visit>(`/projects/${projectId}/visits/${visitId}/close`))
  }, [])

  const sendReport = useCallback(async (projectId: string, visitId: string) => {
    adoptVisit(projectId, await api.post<Visit>(`/projects/${projectId}/visits/${visitId}/send-report`))
  }, [])

  const setObservations = useCallback(async (projectId: string, visitId: string, html: string) => {
    const key = visitKey(projectId, visitId)
    if (observationsDebounce.current[key]) clearTimeout(observationsDebounce.current[key])
    observationsDebounce.current[key] = setTimeout(async () => {
      delete observationsDebounce.current[key]
      adoptChecklist(projectId, visitId, await api.put<ChecklistState>(`/projects/${projectId}/visits/${visitId}/observations`, { observations: html }))
    }, 400)
  }, [])

  const markManually = useCallback(async (projectId: string, visitId: string, itemId: string, status: ChecklistStatus, reason?: string) => {
    adoptChecklist(
      projectId,
      visitId,
      await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/mark`, { status, reason }),
    )
  }, [])

  const addEvidence = useCallback(
    async (projectId: string, visitId: string, itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) => {
      if (!text.trim()) return
      adoptChecklist(
        projectId,
        visitId,
        await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/evidence`, {
          requirementIndex,
          type,
          text,
          previewUrl,
        }),
      )
    },
    [],
  )

  const sendGeneralMessage = useCallback(async (projectId: string, visitId: string, text: string, type: EvidenceType = 'text') => {
    if (!text.trim()) return
    adoptChecklist(
      projectId,
      visitId,
      await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/messages`, { text, type }),
    )
  }, [])

  const sendItemMessage = useCallback(async (projectId: string, visitId: string, itemId: string, text: string, type: EvidenceType = 'text') => {
    if (!text.trim()) return
    adoptChecklist(
      projectId,
      visitId,
      await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/messages`, { text, type }),
    )
  }, [])

  const resolveGeneralMessage = useCallback(async (projectId: string, visitId: string, messageId: string, itemId: string) => {
    adoptChecklist(
      projectId,
      visitId,
      await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/messages/${messageId}/resolve`, { itemId }),
    )
  }, [])

  const value: Ctx = {
    projects,
    fetchProjectsIfNeeded,
    getProject,
    fetchProjectIfNeeded,
    getVisits,
    fetchVisitsIfNeeded,
    getChecklist,
    fetchChecklistIfNeeded,
    createProject,
    createVisit,
    closeVisit,
    sendReport,
    setObservations,
    markManually,
    addEvidence,
    sendGeneralMessage,
    sendItemMessage,
    resolveGeneralMessage,
  }

  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>
}

export function useChecklist() {
  const ctx = useContext(ChecklistContext)
  if (!ctx) throw new Error('useChecklist debe usarse dentro de ChecklistProvider')
  return ctx
}

export function useProjects() {
  const { projects, fetchProjectsIfNeeded } = useChecklist()
  useEffect(() => {
    fetchProjectsIfNeeded()
  }, [fetchProjectsIfNeeded])
  return { ...projects, loading: isPending(projects) }
}

export function useProject(projectId: string) {
  const { getProject, fetchProjectIfNeeded } = useChecklist()
  useEffect(() => {
    fetchProjectIfNeeded(projectId)
  }, [projectId, fetchProjectIfNeeded])
  const state = getProject(projectId)
  return { ...state, loading: isPending(state) }
}

export function useCreateProject() {
  const { createProject } = useChecklist()
  return createProject
}

export function useProjectVisits(projectId: string) {
  const { getVisits, fetchVisitsIfNeeded, createVisit, closeVisit, sendReport } = useChecklist()
  useEffect(() => {
    fetchVisitsIfNeeded(projectId)
  }, [projectId, fetchVisitsIfNeeded])
  const state = getVisits(projectId)
  return {
    visits: state.data ?? [],
    loading: isPending(state),
    error: state.error,
    createVisit: () => createVisit(projectId),
    closeVisit: (visitId: string) => closeVisit(projectId, visitId),
    sendReport: (visitId: string) => sendReport(projectId, visitId),
  }
}

export function useProjectChecklist(projectId: string, visitId: string) {
  const {
    getChecklist,
    fetchChecklistIfNeeded,
    setObservations,
    markManually,
    addEvidence,
    sendGeneralMessage,
    sendItemMessage,
    resolveGeneralMessage,
  } = useChecklist()
  useEffect(() => {
    fetchChecklistIfNeeded(projectId, visitId)
  }, [projectId, visitId, fetchChecklistIfNeeded])
  const state = getChecklist(projectId, visitId)
  const { data, error } = state
  return {
    itemsState: data?.itemsState ?? {},
    generalChat: data?.generalChat ?? [],
    observations: data?.observations ?? '',
    loading: isPending(state),
    error,
    setObservations: (html: string) => setObservations(projectId, visitId, html),
    markManually: (itemId: string, status: ChecklistStatus, reason?: string) => markManually(projectId, visitId, itemId, status, reason),
    addEvidence: (itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) =>
      addEvidence(projectId, visitId, itemId, requirementIndex, type, text, previewUrl),
    sendGeneralMessage: (text: string, type?: EvidenceType) => sendGeneralMessage(projectId, visitId, text, type),
    sendItemMessage: (itemId: string, text: string, type?: EvidenceType) => sendItemMessage(projectId, visitId, itemId, text, type),
    resolveGeneralMessage: (messageId: string, itemId: string) => resolveGeneralMessage(projectId, visitId, messageId, itemId),
  }
}

export function ChecklistLayout() {
  return (
    <ChecklistProvider>
      <Outlet />
    </ChecklistProvider>
  )
}
