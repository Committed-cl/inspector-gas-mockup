import { useRef, useState } from 'react'
import type { EstadoRequisito } from '../data/checklistMatrizInterior'

const origenEvidencia = {
  'chat-general': 'chat general',
  'chat-item': 'chat del ítem',
  manual: 'manual',
  'marcado-manual': 'conclusión',
} as const

type Props = {
  requisito: EstadoRequisito
  onAgregar: (texto: string, previewUrl?: string) => void
}

export default function CampoEvidencia({ requisito, onAgregar }: Props) {
  const [texto, setTexto] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function submitTexto() {
    if (!texto.trim()) return
    onAgregar(texto.trim())
    setTexto('')
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onAgregar(file.name, URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className={`border-l-2 ${requisito.cumplido ? 'border-ok' : 'border-hairline'} pl-3`}>
      <p className={`text-[12.5px] font-medium ${requisito.cumplido ? 'text-ink' : 'text-muted'}`}>
        {requisito.tipo === 'foto' ? '📷 ' : ''}
        {requisito.label}
      </p>

      {requisito.cumplido && requisito.evidencia ? (
        <div className="mt-1 flex items-start gap-2">
          {requisito.evidencia.previewUrl && (
            <img
              src={requisito.evidencia.previewUrl}
              alt={requisito.evidencia.texto}
              className="h-12 w-12 rounded-md object-cover border border-hairline shrink-0"
            />
          )}
          <p className="text-[12.5px] text-muted leading-snug">
            <span className="font-mono text-[10.5px]">{requisito.evidencia.hora}</span>{' '}
            <span className="text-[10px] uppercase tracking-wide text-brand/70 font-semibold">
              {origenEvidencia[requisito.evidencia.origen]}
            </span>{' '}
            — {requisito.evidencia.texto}
          </p>
        </div>
      ) : requisito.tipo === 'foto' ? (
        <div className="mt-1.5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-hairline text-brand hover:bg-brand-soft"
          >
            📷 Subir foto
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitTexto()
            }}
            placeholder="Describe la evidencia..."
            className="flex-1 min-w-0 text-[12px] px-2.5 py-1.5 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={submitTexto}
            disabled={!texto.trim()}
            className={`shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${
              texto.trim() ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
            }`}
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  )
}
