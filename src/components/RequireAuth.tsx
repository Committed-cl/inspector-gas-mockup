import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ForcePasswordChange from './ForcePasswordChange'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />
  if (auth.user.mustChangePassword) return <ForcePasswordChange />
  return <>{children}</>
}
