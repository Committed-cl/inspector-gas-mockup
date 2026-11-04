import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { enqueueOp, isNetworkError, listOps, processQueue, removeOp, retryOp, subscribeQueue, type QueuedOp } from '../lib/offlineQueue'
import { useOnline } from '../lib/useOnline'
import SyncStatus from '../components/SyncStatus'
import type { ChatMessage, ChecklistStatus, EvidenceType, ItemState } from '../data/checklistMatrizInterior'

export type VisitStatus = 'en_curso' | 'aprobada' | 'rechazada'
export type VisitType = 'gas_prueba' | 'gas_final' | 'visita_estandar'
export type Visit = { id: string; projectId: string; visitType: VisitType; date: string; status: VisitStatus; reportSentAt?: string; reopenedAt?: string; reopenedBy?: { userId: string; name: string } }

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
  projectCode?: string
  servicePressureKpa?: number
  matrixVolumeM3?: number
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
  projectCode?: string
  servicePressureKpa?: number
  matrixVolumeM3?: number
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

export type SyncInfo = {
  online: boolean
  pendingCount: number
  failed: QueuedOp[]
  phase: 'idle' | 'syncing' | 'done'
  retry: (seq: number) => void
  discard: (seq: number) => void
}

// Shows a queued change on top of server state so it stays visible locally
// until it is synced (or decided on, if it failed).
function applyOp(state: ChecklistState, op: QueuedOp): ChecklistState {
  if (op.kind === 'observations') return { ...state, observations: String(op.body.observations ?? '') }
  const item = op.itemId ? state.itemsState[op.itemId] : undefined
  if (!item) return state
  if (op.kind === 'mark') {
    const status = op.body.status as ChecklistStatus
    return { ...state, itemsState: { ...state.itemsState, [op.itemId!]: { ...item, status, source: 'manual', notApplicableReason: op.body.reason as string | undefined } } }
  }
  const clientId = String(op.body.clientId)
  if (item.evidence.some((e) => (e as { clientId?: string }).clientId === clientId)) return state
  const entry = {
    id: `local-${clientId}`,
    clientId,
    type: op.body.type as EvidenceType,
    source: 'manual' as const,
    text: String(op.body.text),
    time: new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
    requirementIndex: op.body.requirementIndex as number,
    previewUrl: op.body.previewUrl as string | undefined,
  }
  const status = item.status === 'pending' ? 'warn' : item.status
  return { ...state, itemsState: { ...state.itemsState, [op.itemId!]: { ...item, status, evidence: [...item.evidence, entry] } } }
}

type Ctx = {
  sync: SyncInfo
  projects: Async<ProjectSummary[]>
  fetchProjectsIfNeeded: () => void
  getProject: (projectId: string) => Async<ProjectSummary>
  fetchProjectIfNeeded: (projectId: string) => void
  getVisits: (projectId: string) => Async<Visit[]>
  fetchVisitsIfNeeded: (projectId: string) => void
  getChecklist: (projectId: string, visitId: string) => Async<ChecklistState>
  fetchChecklistIfNeeded: (projectId: string, visitId: string) => void
  createProject: (input: CreateProjectInput) => Promise<string>
  createVisit: (projectId: string, visitType: VisitType) => Promise<string>
  closeVisit: (projectId: string, visitId: string) => Promise<void>
  reopenVisit: (projectId: string, visitId: string) => Promise<void>
  sendReport: (projectId: string, visitId: string, pdfBase64?: string) => Promise<void>
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
  removeEvidence: (projectId: string, visitId: string, itemId: string, evidenceId: string) => Promise<void>
  sendGeneralMessage: (projectId: string, visitId: string, text: string, type?: EvidenceType, previewUrl?: string) => Promise<void>
  sendItemMessage: (projectId: string, visitId: string, itemId: string, text: string, type?: EvidenceType, previewUrl?: string) => Promise<void>
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

  const online = useOnline()
  const { auth } = useAuth()
  const userId = auth?.user.id ?? null
  const [queued, setQueued] = useState<QueuedOp[]>([])
  const [phase, setPhase] = useState<SyncInfo['phase']>('idle')
  const queuedRef = useRef<QueuedOp[]>([])
  const syncing = useRef(false)
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const withQueued = (projectId: string, visitId: string, data: ChecklistState, ops: QueuedOp[] = queuedRef.current) =>
    // A rejected mark is not shown: the item goes back to its real state (the op stays in sync.failed).
    ops.filter((o) => o.projectId === projectId && o.visitId === visitId && !(o.kind === 'mark' && o.state === 'failed')).reduce(applyOp, data)

  const refreshQueue = useCallback(async () => {
    const ops = userId ? await listOps(userId).catch(() => []) : []
    queuedRef.current = ops
    setQueued(ops)
    return ops
  }, [userId])

  const syncNow = useCallback(async () => {
    if (syncing.current || !navigator.onLine || !userId) return
    const pendingBefore = (await refreshQueue()).some((o) => o.state === 'pending')
    if (!pendingBefore) return
    syncing.current = true
    if (retryTimer.current) clearTimeout(retryTimer.current)
    if (doneTimer.current) clearTimeout(doneTimer.current)
    setPhase('syncing')
    let stopped = false
    try {
      const result = await processQueue(userId, (req) =>
        req.method === 'PUT' ? api.put<ChecklistState>(req.path, req.body) : api.post<ChecklistState>(req.path, req.body),
      )
      const remaining = await refreshQueue()
      // The last server response per visit is authoritative; still-queued or
      // failed ops are re-applied on top so nothing local disappears.
      for (const [key, data] of Object.entries(result.lastByVisit)) {
        const [pid, vid] = key.split('::')
        setChecklistByVisit((prev) => ({ ...prev, [key]: { data: withQueued(pid, vid, data as ChecklistState, remaining), loading: false, error: null } }))
      }
      // A rejected mark leaves optimistic state behind: reload visits that failed without a fresh server response.
      const failedVisits = new Set(remaining.filter((o) => o.kind === 'mark' && o.state === 'failed').map((o) => visitKey(o.projectId, o.visitId)))
      for (const key of failedVisits) {
        if (key in result.lastByVisit) continue
        const [pid, vid] = key.split('::')
        try {
          const data = await api.get<ChecklistState>(`/projects/${pid}/visits/${vid}/checklist`)
          setChecklistByVisit((prev) => ({ ...prev, [key]: { data: withQueued(pid, vid, data), loading: false, error: null } }))
        } catch { /* keep what is shown; the next sync retries */ }
      }
      stopped = result.stopped
      if (result.stopped) {
        setPhase('idle')
        retryTimer.current = setTimeout(() => void syncNow(), 5000)
      } else if (result.sent > 0) {
        setPhase('done')
        doneTimer.current = setTimeout(() => setPhase('idle'), 4000)
      } else setPhase('idle')
    } finally {
      syncing.current = false
    }
    // Ops queued while this run was in flight are not in its snapshot: send them now.
    if (queuedRef.current.some((o) => o.state === 'pending') && !stopped) void syncNow()
  }, [refreshQueue, userId])

  useEffect(() => {
    void refreshQueue().then(() => syncNow())
    const unsub = subscribeQueue(() => void refreshQueue())
    return () => {
      unsub()
      if (retryTimer.current) clearTimeout(retryTimer.current)
      if (doneTimer.current) clearTimeout(doneTimer.current)
    }
  }, [refreshQueue, syncNow])

  useEffect(() => {
    if (online) void syncNow()
  }, [online, syncNow])

  // Queued-aware write: send now when connected and nothing is waiting ahead
  // of it for this visit (order matters); otherwise — or if the request never
  // reached the server — store it locally and let the sync loop send it.
  const mutate = async (op: Omit<QueuedOp, 'seq' | 'state' | 'userId'>, send: () => Promise<ChecklistState>) => {
    const blocked = queuedRef.current.some((o) => o.visitId === op.visitId && o.state === 'pending')
    if (navigator.onLine && !blocked) {
      try {
        adoptChecklist(op.projectId, op.visitId, await send())
        return
      } catch (err) {
        if (!isNetworkError(err)) throw err
      }
    }
    if (!userId) throw new Error('Sesión no iniciada')
    await enqueueOp({ ...op, userId })
    const ops = await refreshQueue()
    setChecklistByVisit((prev) => {
      const key = visitKey(op.projectId, op.visitId)
      const cur = prev[key]?.data
      return cur ? { ...prev, [key]: { data: withQueued(op.projectId, op.visitId, cur, ops.slice(-1)), loading: false, error: null } } : prev
    })
    void syncNow()
  }

  const sync: SyncInfo = {
    online,
    pendingCount: queued.filter((o) => o.state === 'pending').length,
    failed: queued.filter((o) => o.state === 'failed'),
    phase,
    retry: (seq) => { if (userId) void retryOp(seq, userId).then(() => syncNow()) },
    discard: (seq) => { if (userId) void removeOp(seq, userId) },
  }

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
        (data) => setChecklistByVisit((c) => ({ ...c, [key]: { data: withQueued(projectId, visitId, data), loading: false, error: null } })),
        (err) => setChecklistByVisit((c) => ({ ...c, [key]: { data: null, loading: false, error: String(err) } })),
      )
      return { ...prev, [key]: { data: null, loading: true, error: null } }
    })
  }, [])

  const adoptChecklist = (projectId: string, visitId: string, data: ChecklistState) => {
    setChecklistByVisit((prev) => ({ ...prev, [visitKey(projectId, visitId)]: { data: withQueued(projectId, visitId, data), loading: false, error: null } }))
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

  const createVisit = useCallback(async (projectId: string, visitType: VisitType) => {
    const visit = await api.post<Visit>(`/projects/${projectId}/visits`, { visitType })
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

  const reopenVisit = useCallback(async (projectId: string, visitId: string) => {
    adoptVisit(projectId, await api.post<Visit>(`/projects/${projectId}/visits/${visitId}/reopen`))
  }, [])

  const sendReport = useCallback(async (projectId: string, visitId: string, pdfBase64?: string) => {
    adoptVisit(projectId, await api.post<Visit>(`/projects/${projectId}/visits/${visitId}/send-report`, { pdfBase64 }))
  }, [])

  const setObservations = useCallback(async (projectId: string, visitId: string, html: string) => {
    const key = visitKey(projectId, visitId)
    if (observationsDebounce.current[key]) clearTimeout(observationsDebounce.current[key])
    observationsDebounce.current[key] = setTimeout(async () => {
      delete observationsDebounce.current[key]
      await mutate(
        { kind: 'observations', projectId, visitId, body: { observations: html }, label: 'Observaciones generales' },
        () => api.put<ChecklistState>(`/projects/${projectId}/visits/${visitId}/observations`, { observations: html }),
      )
    }, 400)
  }, [])

  // Marks never wait for the network: they are queued (replacing a pending mark
  // of the same item), shown at once, and sent in the background by syncNow.
  const markManually = useCallback(async (projectId: string, visitId: string, itemId: string, status: ChecklistStatus, reason?: string) => {
    if (!userId) throw new Error('Sesión no iniciada')
    await enqueueOp({ kind: 'mark', projectId, visitId, itemId, body: { status, reason }, label: `Estado «${status}» del ítem ${itemId}`, userId })
    const ops = await refreshQueue()
    setChecklistByVisit((prev) => {
      const key = visitKey(projectId, visitId)
      const cur = prev[key]?.data
      return cur ? { ...prev, [key]: { data: withQueued(projectId, visitId, cur, ops.filter((o) => o.kind === 'mark' && o.itemId === itemId).slice(-1)), loading: false, error: null } } : prev
    })
    void syncNow()
  }, [userId, refreshQueue, syncNow])

  const addEvidence = useCallback(
    async (projectId: string, visitId: string, itemId: string, requirementIndex: number, type: EvidenceType, text: string, previewUrl?: string) => {
      if (!text.trim()) return
      // clientId makes retries idempotent: the API ignores one it already stored.
      const body = { requirementIndex, type, text, previewUrl, clientId: crypto.randomUUID() }
      await mutate(
        { kind: 'evidence', projectId, visitId, itemId, body, label: `${type === 'photo' ? 'Foto' : 'Declaración'} «${text}» en el ítem ${itemId}` },
        () => api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/evidence`, body),
      )
    },
    [],
  )

  const removeEvidence = useCallback(async (projectId: string, visitId: string, itemId: string, evidenceId: string) => {
    adoptChecklist(
      projectId,
      visitId,
      await api.delete<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/evidence/${evidenceId}`),
    )
  }, [])

  const sendGeneralMessage = useCallback(
    async (projectId: string, visitId: string, text: string, type: EvidenceType = 'text', previewUrl?: string) => {
      if (!text.trim()) return
      adoptChecklist(
        projectId,
        visitId,
        await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/messages`, { text, type, previewUrl }),
      )
    },
    [],
  )

  const sendItemMessage = useCallback(
    async (projectId: string, visitId: string, itemId: string, text: string, type: EvidenceType = 'text', previewUrl?: string) => {
      if (!text.trim()) return
      adoptChecklist(
        projectId,
        visitId,
        await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/items/${itemId}/messages`, { text, type, previewUrl }),
      )
    },
    [],
  )

  const resolveGeneralMessage = useCallback(async (projectId: string, visitId: string, messageId: string, itemId: string) => {
    adoptChecklist(
      projectId,
      visitId,
      await api.post<ChecklistState>(`/projects/${projectId}/visits/${visitId}/messages/${messageId}/resolve`, { itemId }),
    )
  }, [])

  const value: Ctx = {
    sync,
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
    reopenVisit,
    sendReport,
    setObservations,
    markManually,
    addEvidence,
    removeEvidence,
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
  const { getVisits, fetchVisitsIfNeeded, createVisit, closeVisit, reopenVisit, sendReport } = useChecklist()
  useEffect(() => {
    fetchVisitsIfNeeded(projectId)
  }, [projectId, fetchVisitsIfNeeded])
  const state = getVisits(projectId)
  return {
    visits: state.data ?? [],
    loading: isPending(state),
    error: state.error,
    createVisit: (visitType: VisitType) => createVisit(projectId, visitType),
    closeVisit: (visitId: string) => closeVisit(projectId, visitId),
    reopenVisit: (visitId: string) => reopenVisit(projectId, visitId),
    sendReport: (visitId: string, pdfBase64?: string) => sendReport(projectId, visitId, pdfBase64),
  }
}

export function useProjectChecklist(projectId: string, visitId: string) {
  const {
    getChecklist,
    fetchChecklistIfNeeded,
    setObservations,
    markManually,
    addEvidence,
    removeEvidence,
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
    removeEvidence: (itemId: string, evidenceId: string) => removeEvidence(projectId, visitId, itemId, evidenceId),
    sendGeneralMessage: (text: string, type?: EvidenceType, previewUrl?: string) => sendGeneralMessage(projectId, visitId, text, type, previewUrl),
    sendItemMessage: (itemId: string, text: string, type?: EvidenceType, previewUrl?: string) =>
      sendItemMessage(projectId, visitId, itemId, text, type, previewUrl),
    resolveGeneralMessage: (messageId: string, itemId: string) => resolveGeneralMessage(projectId, visitId, messageId, itemId),
  }
}

export function ChecklistLayout() {
  return (
    <ChecklistProvider>
      <Outlet />
      <SyncStatus />
    </ChecklistProvider>
  )
}
