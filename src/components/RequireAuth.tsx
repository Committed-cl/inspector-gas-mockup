import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { auth } = useAuth()
  const location = useLocation()
  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />
  return <>{children}</>
}
