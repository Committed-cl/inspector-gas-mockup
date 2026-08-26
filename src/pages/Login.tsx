import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('r.martinez@metrogas.cl')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      nav('/checklist')
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? 'Email o contraseña incorrectos.' : 'No se pudo iniciar sesión. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PhoneFrame>
      <div className="px-6 pt-10 pb-8 flex flex-col gap-8">
        <div>
          <p className="text-brand font-bold text-2xl leading-none">Inspector Gas</p>
          <p className="text-muted text-[13px] mt-1.5">Ingresa a tus proyectos asignados</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <label className="flex items-center gap-2 text-[12.5px] text-ink">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded accent-brand"
            />
            Recordar este dispositivo
          </label>

          {error && <p className="text-[12.5px] text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
          >
            {submitting ? 'Ingresando...' : 'Ingresar'}
          </button>

          <button type="button" className="text-[12.5px] text-brand/80 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </PhoneFrame>
  )
}
