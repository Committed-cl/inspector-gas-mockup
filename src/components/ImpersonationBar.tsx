import { useState } from 'react'
import { IMP_EXPIRED_KEY, useAuth } from '../lib/auth'
import { ROLES } from '../state/adminHooks'

export const IMPERSONATION_BAR_HEIGHT = '2.5rem'

// Fixed red bar on every screen while viewing as another user (read-only), with the way back.
// Also shows, once, that a previous view-as session ended because its token expired.
export default function ImpersonationBar() {
  const { impersonation, exitImpersonation } = useAuth()
  const [expired, setExpired] = useState(() => localStorage.getItem(IMP_EXPIRED_KEY) === '1')
  const [busy, setBusy] = useState(false)

  if (!impersonation) {
    if (!expired) return null
    return (
      <div role="alert" className="bg-amber-100 text-amber-900 text-[13px] px-4 py-2 flex items-center justify-between gap-3">
        <span>La sesión «ver como» caducó (30 min). Volviste a tu sesión.</span>
        <button type="button" className="font-semibold underline" onClick={() => { localStorage.removeItem(IMP_EXPIRED_KEY); setExpired(false) }}>
          Cerrar
        </button>
      </div>
    )
  }
  const { user } = impersonation
  const role = ROLES.find((r) => r.value === user.role)?.label ?? user.role
  return (
    <div
      role="status"
      data-testid="impersonation-bar"
      style={{ height: IMPERSONATION_BAR_HEIGHT }}
      className="fixed top-0 inset-x-0 z-[70] bg-red-600 text-white text-[13px] px-3 flex items-center justify-between gap-3 print:hidden"
    >
      <span className="truncate">
        Viendo como <strong>{user.name}</strong> · {role}{user.companyName ? ` · ${user.companyName}` : ''} · solo lectura
      </span>
      <button
        type="button"
        disabled={busy}
        onClick={() => { setBusy(true); void exitImpersonation() }}
        className="shrink-0 bg-white text-red-700 font-semibold rounded px-3 py-1 text-[12.5px] hover:bg-red-50 disabled:opacity-60"
      >
        Salir
      </button>
    </div>
  )
}
