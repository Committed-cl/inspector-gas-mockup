import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, setToken, setUnauthorizedHandler } from './api'

export type AuthUser = { id: string; email: string; name: string; role: string; isAdmin: boolean; companyId: string }
type AuthState = { token: string; user: AuthUser } | null

type AuthContextValue = {
  auth: AuthState
  login: (email: string, password: string) => Promise<void>
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

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result))
    setToken(result.token)
    setAuth(result)
  }

  return <AuthContext.Provider value={{ auth, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
