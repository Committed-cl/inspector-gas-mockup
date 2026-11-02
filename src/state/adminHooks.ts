import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ProjectSummary } from './ChecklistContext'

export type UserRole = 'admin-general' | 'admin-convenio' | 'lider-supervisores' | 'supervisor-proyecto'

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin-general', label: 'Administrador General' },
  { value: 'admin-convenio', label: 'Administrador del convenio' },
  { value: 'lider-supervisores', label: 'Líder de Supervisores' },
  { value: 'supervisor-proyecto', label: 'Supervisor de Proyecto' },
]

export type Company = { id: string; name: string; logoUrl: string; additionalRecipients: string[]; builderName: string; installerName: string }
export type Client = { id: string; companyId: string; name: string }
export type AdminUser = {
  id: string
  email: string
  name: string
  role: UserRole
  isAdmin: boolean
  companyId: string
  projectIds?: string[]
}
export type CreateUserResult = { user: AdminUser; provisionalPassword: string }
export type UpdateUserInput = Partial<{ name: string; role: UserRole; isAdmin: boolean; companyId: string; projectIds: string[]; replaceSupervisor: boolean }>
export type ResetPasswordResult = { provisionalPassword: string }

type Async<T> = { data: T | null; loading: boolean; error: string | null }

function useAsyncList<T>(path: string, enabled = true) {
  const [state, setState] = useState<Async<T[]>>({ data: null, loading: enabled, error: null })

  const refetch = useCallback(() => {
    if (!enabled) return
    setState({ data: null, loading: true, error: null })
    api.get<T[]>(path).then(
      (data) => setState({ data, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: String(err) }),
    )
  }, [path, enabled])

  useEffect(refetch, [refetch])

  // Patches the cached list from a mutation's own response instead of
  // re-fetching — Datastore list queries (findAll) are only eventually
  // consistent, so a refetch() issued right after a write can still race
  // behind it and momentarily show stale data (observed live: a just-deleted
  // user stayed in the list until a manual reload).
  const mutate = useCallback((updater: (list: T[]) => T[]) => {
    setState((s) => (s.data ? { ...s, data: updater(s.data) } : s))
  }, [])

  return { ...state, refetch, mutate }
}

// GET /companies is admin-global only; pass enabled=false to skip it (403 otherwise).
export function useCompanies(enabled = true) {
  const { data, loading, error, refetch, mutate } = useAsyncList<Company>('/companies', enabled)

  const createCompany = async (name: string, logoUrl: string, additionalRecipients: string[], builderName: string, installerName: string) => {
    const company = await api.post<Company>('/companies', { name, logoUrl, additionalRecipients, builderName, installerName })
    refetch()
    return company
  }

  const updateRecipients = async (id: string, additionalRecipients: string[]) => {
    const company = await api.patch<Company>(`/companies/${encodeURIComponent(id)}`, { additionalRecipients })
    mutate((list) => list.map((c) => (c.id === id ? company : c)))
    return company
  }

  const updateCompanyNames = async (id: string, builderName: string, installerName: string) => {
    const company = await api.patch<Company>(`/companies/${encodeURIComponent(id)}`, { builderName, installerName })
    mutate((list) => list.map((c) => (c.id === id ? company : c)))
    return company
  }

  return { companies: data ?? [], loading, error, createCompany, updateRecipients, updateCompanyNames }
}

export function useClients(companyId?: string) {
  const path = companyId ? `/clients?companyId=${encodeURIComponent(companyId)}` : '/clients'
  const { data, loading, error, refetch } = useAsyncList<Client>(path)

  const createClient = async (targetCompanyId: string, name: string) => {
    const client = await api.post<Client>('/clients', { companyId: targetCompanyId, name })
    refetch()
    return client
  }

  return { clients: data ?? [], loading, error, createClient }
}

// After a confirmed reassignment the API strips the projects from the previous
// supervisors; mirror that locally instead of refetching (see useAsyncList.mutate).
function withoutProjects(list: AdminUser[], keepUserId: string, projectIds: string[]): AdminUser[] {
  if (!projectIds.length) return list
  return list.map((u) =>
    u.id !== keepUserId && u.role === 'supervisor-proyecto' && u.projectIds?.some((p) => projectIds.includes(p))
      ? { ...u, projectIds: u.projectIds.filter((p) => !projectIds.includes(p)) }
      : u,
  )
}

export function useUsers() {
  const { data, loading, error, mutate } = useAsyncList<AdminUser>('/users')

  const createUser = async (email: string, name: string, role: UserRole, isAdmin: boolean, companyId: string, projectIds: string[] = [], replaceSupervisor = false) => {
    const result = await api.post<CreateUserResult>('/users', { email, name, role, isAdmin, companyId, projectIds, ...(replaceSupervisor && { replaceSupervisor }) })
    mutate((list) => [...withoutProjects(list, result.user.id, replaceSupervisor ? projectIds : []), result.user])
    return result
  }

  const updateUser = async (id: string, input: UpdateUserInput) => {
    const user = await api.patch<AdminUser>(`/users/${encodeURIComponent(id)}`, input)
    mutate((list) => withoutProjects(list, id, input.replaceSupervisor ? (user.projectIds ?? []) : []).map((u) => (u.id === id ? user : u)))
    return user
  }

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${encodeURIComponent(id)}`)
    mutate((list) => list.filter((u) => u.id !== id))
  }

  const resetPassword = (id: string) => api.post<ResetPasswordResult>(`/users/${encodeURIComponent(id)}/password`)

  return { users: data ?? [], loading, error, createUser, updateUser, deleteUser, resetPassword }
}

export function useObrasCount() {
  const { data, loading } = useAsyncList<{ id: string }>('/projects')
  return { count: data?.length ?? null, loading }
}

export function useProjects() {
  const { data, loading, error } = useAsyncList<ProjectSummary>('/projects')
  return { projects: data ?? [], loading, error }
}

export type AiVendor = 'gemini' | 'anthropic' | 'openai' | 'claude-cli'
export type AiConfigView = { vendor: AiVendor; model: string | null; apiKeySet: boolean; apiKeyPreview: string | null }

// Single-object GET (not a list, so it doesn't fit useAsyncList's shape) —
// the value is null when the company hasn't configured a vendor yet.
export function useAiConfig(companyId: string) {
  const [state, setState] = useState<Async<AiConfigView | null>>({ data: null, loading: true, error: null })

  const refetch = useCallback(() => {
    setState({ data: null, loading: true, error: null })
    api.get<AiConfigView | null>(`/companies/${encodeURIComponent(companyId)}/ai-config`).then(
      (data) => setState({ data, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: String(err) }),
    )
  }, [companyId])

  useEffect(refetch, [refetch])

  const saveConfig = async (vendor: AiVendor, apiKey: string | undefined, model: string | undefined) => {
    const view = await api.put<AiConfigView>(`/companies/${encodeURIComponent(companyId)}/ai-config`, { vendor, apiKey, model })
    setState({ data: view, loading: false, error: null })
    return view
  }

  return { config: state.data, loading: state.loading, error: state.error, saveConfig }
}
