import { useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import { useAuth } from '../lib/auth'
import { api, ApiError } from '../lib/api'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('r.martinez@metrogas.cl')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

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

  const sendMagicLink = async () => {
    setError(null)
    if (!email.trim()) {
      setError('Ingresa tu email para recibir el enlace.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/magic-link', { email })
      setLinkSent(true)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? 'Demasiados intentos. Espera un momento e intenta de nuevo.' : 'No se pudo enviar el enlace. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const forgotPassword = async () => {
    setError(null)
    setForgotSent(false)
    if (!email.trim()) {
      setError('Ingresa tu email para solicitar ayuda con tu clave.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setForgotSent(true)
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? 'Demasiados intentos. Espera un momento e intenta de nuevo.' : 'No se pudo enviar la solicitud. Intenta de nuevo.')
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

          {linkSent && <p className="text-[12.5px] text-ink">Si el email está registrado, te enviamos un enlace de acceso (vale 15 minutos).</p>}

          {forgotSent && <p className="text-[12.5px] text-ink">Tu solicitud fue enviada al administrador.</p>}

          <button type="button" onClick={forgotPassword} disabled={submitting} className="text-[12.5px] text-brand/80 hover:underline disabled:opacity-60">
            Olvidé mi clave
          </button>

          <button type="button" onClick={sendMagicLink} disabled={submitting} className="text-[12.5px] text-brand/80 hover:underline disabled:opacity-60">
            Enviar enlace de acceso por correo
          </button>
        </form>
      </div>
    </PhoneFrame>
  )
}
