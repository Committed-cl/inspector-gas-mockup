import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import { useAuth } from '../lib/auth'

// Landing page of the emailed link. Reads email+token, strips them from the
// address bar right away (history/Referer), then POSTs them to the API.
export default function MagicLogin() {
  const nav = useNavigate()
  const { redeemMagicLink } = useAuth()
  const [failed, setFailed] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    const token = params.get('token')
    window.history.replaceState(null, '', window.location.pathname)
    if (!email || !token) {
      setFailed(true)
      return
    }
    redeemMagicLink(email, token)
      .then(() => nav('/checklist', { replace: true }))
      .catch(() => setFailed(true))
  }, [redeemMagicLink, nav])

  return (
    <PhoneFrame>
      <div className="px-6 pt-10 pb-8 flex flex-col gap-4">
        <p className="text-brand font-bold text-2xl leading-none">Inspector Proyectos de Gas</p>
        {failed ? (
          <>
            <p className="text-[13px] text-danger">El enlace es inválido, ya fue usado o expiró.</p>
            <Link to="/login" className="text-[13px] text-brand hover:underline">Volver a ingresar</Link>
          </>
        ) : (
          <p className="text-muted text-[13px]">Ingresando...</p>
        )}
      </div>
    </PhoneFrame>
  )
}
