import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'

export type UserRole = 'inspector-metrogas' | 'inspector-instaladora' | 'jefe-obra' | 'supervisor-metrogas' | 'admin'

export type Company = { id: string; name: string; logoUrl: string }
export type Client = { id: string; companyId: string; name: string }
export type AdminUser = { id: string; email: string; name: string; role: UserRole; isAdmin: boolean; companyId: string }
export type CreateUserResult = { user: AdminUser; provisionalPassword: string }

type Async<T> = { data: T | null; loading: boolean; error: string | null }

function useAsyncList<T>(path: string) {
  const [state, setState] = useState<Async<T[]>>({ data: null, loading: true, error: null })

  const refetch = useCallback(() => {
    setState({ data: null, loading: true, error: null })
    api.get<T[]>(path).then(
      (data) => setState({ data, loading: false, error: null }),
      (err) => setState({ data: null, loading: false, error: String(err) }),
    )
  }, [path])

  useEffect(refetch, [refetch])

  return { ...state, refetch }
}

export function useCompanies() {
  const { data, loading, error, refetch } = useAsyncList<Company>('/companies')

  const createCompany = async (name: string, logoUrl: string) => {
    const company = await api.post<Company>('/companies', { name, logoUrl })
    refetch()
    return company
  }

  return { companies: data ?? [], loading, error, createCompany }
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

export function useUsers() {
  const { data, loading, error, refetch } = useAsyncList<AdminUser>('/users')

  const createUser = async (email: string, name: string, role: UserRole, isAdmin: boolean, companyId: string) => {
    const result = await api.post<CreateUserResult>('/users', { email, name, role, isAdmin, companyId })
    refetch()
    return result
  }

  return { users: data ?? [], loading, error, createUser }
}

export function useObrasCount() {
  const { data, loading } = useAsyncList<{ id: string }>('/projects')
  return { count: data?.length ?? null, loading }
}
