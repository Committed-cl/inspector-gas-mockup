import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, setPasswordChangeRequiredHandler, setToken, setUnauthorizedHandler } from './api'

export type AuthUser = { id: string; email: string; name: string; role: string; isAdmin: boolean; companyId: string; companyName?: string; mustChangePassword?: boolean }
type AuthState = { token: string; user: AuthUser } | null

type AuthContextValue = {
  auth: AuthState
  login: (email: string, password: string) => Promise<void>
  redeemMagicLink: (email: string, token: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'ig_auth'

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
  const [auth, setAuth] = useState<AuthState>(readStoredAuth)

  const logout = () => {
    setAuth(null)
    localStorage.removeItem(STORAGE_KEY)
    clearToken()
  }

  const store = (result: NonNullable<AuthState>) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setToken(result.token)
    setAuth(result)
  }

  useEffect(() => {
    setUnauthorizedHandler(logout)
    setPasswordChangeRequiredHandler(() =>
      setAuth((current) => {
        if (!current || current.user.mustChangePassword) return current
        const next = { ...current, user: { ...current.user, mustChangePassword: true } }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      }),
    )
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

  return <AuthContext.Provider value={{ auth, login, redeemMagicLink, changePassword, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

// Líder de Supervisores sees their company's projects but cannot edit anything
// (the API also 403s every mutation for this role). Admins are never read-only.
export function useReadOnly(): boolean {
  const { auth } = useAuth()
  return auth?.user.role === 'lider-supervisores' && !auth.user.isAdmin
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
