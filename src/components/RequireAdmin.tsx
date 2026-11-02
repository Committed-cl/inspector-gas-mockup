import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ForcePasswordChange from './ForcePasswordChange'

// `globalOnly` excludes the company-scoped Administrador del convenio.
export default function RequireAdmin({ children, globalOnly = false }: { children: ReactNode; globalOnly?: boolean }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />
  if (auth.user.mustChangePassword) return <ForcePasswordChange />
  const isConvenio = auth.user.role === 'admin-convenio'
  if (!auth.user.isAdmin && !isConvenio) return <Navigate to="/checklist" replace />
  if (globalOnly && isConvenio) return <Navigate to="/admin" replace />
  return <>{children}</>
}
