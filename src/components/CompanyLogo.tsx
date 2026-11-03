import { useEffect, useState } from 'react'
import { ApiError, fetchBlob } from '../lib/api'

type Props = { companyId: string; alt: string; className?: string; fallbackUrl?: string; version?: number; hideWhenEmpty?: boolean }

// Shows the company's uploaded logo (private, fetched with the bearer token
// and shown through an object URL); falls back to the legacy `logoUrl`, or to a
// "Sin logo" label when there is neither. `version` forces a refetch after an upload.
export default function CompanyLogo({ companyId, alt, className, fallbackUrl, version = 0, hideWhenEmpty = false }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    setDone(false)
    fetchBlob(`/companies/${encodeURIComponent(companyId)}/logo`)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch((err) => {
        if (cancelled) return
        if (!(err instanceof ApiError && err.status === 404)) console.warn('No se pudo cargar el logo', err)
        setSrc(null)
      })
      .finally(() => !cancelled && setDone(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [companyId, version])

  const shown = src ?? (done ? fallbackUrl : undefined)
  if (!shown) return done && !hideWhenEmpty ? <span className="text-[12px] text-muted italic">Sin logo</span> : <span className={done ? undefined : className} />
  return <img src={shown} alt={alt} className={className} />
}
