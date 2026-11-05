import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearImpersonationToken, clearToken, setImpersonationToken, setPasswordChangeRequiredHandler, setToken, setUnauthorizedHandler } from './api'

export type AuthUser = { id: string; email: string; name: string; role: string; isAdmin: boolean; companyId: string; companyName?: string; companyLogoUrl?: string; mustChangePassword?: boolean; canImpersonate?: boolean }
type AuthState = { token: string; user: AuthUser } | null

// Read-only "view as" session: `auth` below is then the viewed user, and the admin's own session stays stored apart.
export type Impersonation = { token: string; expiresAt: string; user: AuthUser }

type AuthContextValue = {
  auth: AuthState
  impersonation: Impersonation | null
  startImpersonation: (userId: string, reason?: string) => Promise<void>
  exitImpersonation: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  redeemMagicLink: (email: string, token: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'ig_auth'
const IMP_STORAGE_KEY = 'ig_imp'
// Set when a view-as session ended because its token expired, so the admin is told after the reload.
export const IMP_EXPIRED_KEY = 'ig_imp_expired'

function readImpersonation(): Impersonation | null {
  try {
    const imp = JSON.parse(localStorage.getItem(IMP_STORAGE_KEY) ?? 'null') as Impersonation | null
    if (imp && Date.parse(imp.expiresAt) > Date.now()) return imp
  } catch { /* fall through */ }
  localStorage.removeItem(IMP_STORAGE_KEY)
  clearImpersonationToken()
  return null
}

function readStoredAuth(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [realAuth, setAuth] = useState<AuthState>(readStoredAuth)
  const [impersonation, setImpersonation] = useState<Impersonation | null>(readImpersonation)
  const auth: AuthState = impersonation ? { token: impersonation.token, user: impersonation.user } : realAuth

  // Back to the admin's own session without logging in again. A reload resets every in-memory cache from the viewed user.
  const endImpersonation = (expired: boolean) => {
    localStorage.removeItem(IMP_STORAGE_KEY)
    clearImpersonationToken()
    if (expired) localStorage.setItem(IMP_EXPIRED_KEY, '1')
    window.location.assign(import.meta.env.BASE_URL)
  }

  const startImpersonation = async (userId: string, reason?: string) => {
    const res = await api.post<{ token: string; expiresAt: string; user: AuthUser }>('/admin/impersonate', { userId, ...(reason ? { reason } : {}) })
    const imp = { token: res.token, expiresAt: res.expiresAt, user: res.user }
    localStorage.setItem(IMP_STORAGE_KEY, JSON.stringify(imp))
    setImpersonationToken(res.token)
    window.location.assign(import.meta.env.BASE_URL)
  }

  const exitImpersonation = async () => {
    await api.post('/admin/impersonate/exit').catch(() => {})
    endImpersonation(false)
  }

  const logout = () => {
    // A 401 during a view-as session means its token expired: warn and fall back to the real session, don't log the admin out.
    if (impersonation) {
      endImpersonation(true)
      return
    }
    setAuth(null)
    localStorage.removeItem(STORAGE_KEY)
    clearToken()
  }

  const store = (result: NonNullable<AuthState>) => {
    // A fresh login replaces any view-as session left over.
    localStorage.removeItem(IMP_STORAGE_KEY)
    clearImpersonationToken()
    setImpersonation(null)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setToken(result.token)
    setAuth(result)
  }

  useEffect(() => {
    setUnauthorizedHandler(logout)
    setPasswordChangeRequiredHandler(() => {
      if (impersonation) return
      setAuth((current) => {
        if (!current || current.user.mustChangePassword) return current
        const next = { ...current, user: { ...current.user, mustChangePassword: true } }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    })
  }, [])

  const login = async (email: string, password: string) => {
    store(await api.post<NonNullable<AuthState>>('/auth/login', { email, password }))
  }

  const redeemMagicLink = async (email: string, token: string) => {
    store(await api.post<NonNullable<AuthState>>('/auth/magic-link/redeem', { email, token }))
  }

  const changePassword = async (currentPassword: string, newPassword: string) => {
    store(await api.post<NonNullable<AuthState>>('/auth/change-password', { currentPassword, newPassword }))
  }

  return <AuthContext.Provider value={{ auth, impersonation, startImpersonation, exitImpersonation, login, redeemMagicLink, changePassword, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

// Líder de Supervisores sees their company's projects but cannot edit anything
// (the API also 403s every mutation for this role). Admins are never read-only.
export function useRoleReadOnly(): boolean {
  const { auth } = useAuth()
  return (auth?.user.role === 'lider-supervisores' && !auth.user.isAdmin) || useIsImpersonating()
}

// While viewing as another user nothing can be modified (the API 403s every write), so controls turn read-only.
export function useIsImpersonating(): boolean {
  return useAuth().impersonation !== null
}

// A closed visit accepts no changes unless it is reopened on purpose: screens that show a
// visit wrap their tree in <VisitClosedProvider> so every control below turns read-only.
const VisitClosedContext = createContext(false)
export const VisitClosedProvider = VisitClosedContext.Provider
export const useVisitClosed = () => useContext(VisitClosedContext)

export function useReadOnly(): boolean {
  const roleReadOnly = useRoleReadOnly()
  return roleReadOnly || useVisitClosed()
}

// Admin-convenio manages the admin panel for their own company only; it is
// never read-only (useReadOnly above only restricts lider-supervisores).
export function useIsConvenioAdmin(): boolean {
  const { auth } = useAuth()
  return auth?.user.role === 'admin-convenio'
}

// Global admins (isAdmin, not scoped to one company) are the only ones who
// see companies, AI config and imports.
export function useIsGlobalAdmin(): boolean {
  const { auth } = useAuth()
  return !!auth?.user.isAdmin && auth.user.role !== 'admin-convenio'
}

export function useCanAccessAdmin(): boolean {
  const { auth } = useAuth()
  return !!auth && (auth.user.isAdmin || auth.user.role === 'admin-convenio')
}
