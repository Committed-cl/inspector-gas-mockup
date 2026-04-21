import { useNavigate } from 'react-router-dom'
import { useState, FormEvent } from 'react'
import PhoneFrame from '../components/PhoneFrame'
import { inspector } from '../data/mock'

export default function Login() {
  const nav = useNavigate()
  const [remember, setRemember] = useState(true)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    nav('/proyectos')
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
              defaultValue={inspector.email}
              className="rounded-lg border border-hairline px-3 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink">Contraseña</span>
            <input
              type="password"
              defaultValue="demo-password"
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

          <button
            type="submit"
            className="mt-2 bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Ingresar
          </button>

          <button type="button" className="text-[12.5px] text-brand/80 hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </form>

        <div className="mt-auto pt-6 border-t border-hairline">
          <p className="text-[11px] text-muted text-center">
            Demo navegable — cualquier click en "Ingresar" entra al prototipo.
          </p>
        </div>
      </div>
    </PhoneFrame>
  )
}
