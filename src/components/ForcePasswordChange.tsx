import { useState, type FormEvent } from 'react'
import PhoneFrame from './PhoneFrame'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'

const MIN_LENGTH = 10

// Blocking screen shown instead of any route while the account carries a
// provisional password. The only way out is changing it or logging out.
export default function ForcePasswordChange() {
  const { auth, changePassword, logout } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next.length < MIN_LENGTH) return setError(`La nueva contraseña debe tener al menos ${MIN_LENGTH} caracteres.`)
    if (next === current) return setError('La nueva contraseña debe ser distinta de la provisoria.')
    if (next !== confirm) return setError('La confirmación no coincide.')
    setSubmitting(true)
    try {
      await changePassword(current, next)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 400 ? err.message : 'No se pudo cambiar la contraseña. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const input = 'rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand'

  return (
    <PhoneFrame>
      <div className="px-6 pt-10 pb-8 flex flex-col gap-8">
        <div>
          <p className="text-brand font-bold text-2xl leading-none">Cambia tu contraseña</p>
          <p className="text-muted text-[13px] mt-1.5">
            {auth?.user.email} ingresó con una contraseña provisoria. Define una propia para continuar.
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Contraseña provisoria</span>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Nueva contraseña (mínimo {MIN_LENGTH} caracteres)</span>
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={input} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Repite la nueva contraseña</span>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
          </label>

          {error && <p className="text-[12.5px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
          <button type="button" onClick={logout} className="text-[12.5px] text-brand/80 hover:underline">
            Cerrar sesión
          </button>
        </form>
      </div>
    </PhoneFrame>
  )
}
