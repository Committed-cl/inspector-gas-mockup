import { useState } from 'react'
import type { EvidenciaTipo } from '../data/checklistMatrizInterior'

type Props = {
  tiposPermitidos: EvidenciaTipo[]
  onAgregar: (tipo: EvidenciaTipo, texto: string) => void
}

const opcionesTodas: { tipo: EvidenciaTipo; label: string }[] = [
  { tipo: 'foto', label: '📷 Foto' },
  { tipo: 'audio', label: '🎙 Audio' },
  { tipo: 'texto', label: '📝 Nota' },
]

export default function AgregarEvidenciaForm({ tiposPermitidos, onAgregar }: Props) {
  const opciones = opcionesTodas.filter((o) => tiposPermitidos.includes(o.tipo))
  const [open, setOpen] = useState(false)
  const [tipo, setTipo] = useState<EvidenciaTipo>(opciones[0]?.tipo ?? 'foto')
  const [texto, setTexto] = useState('')

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-[12px] text-brand font-medium hover:underline">
        + Adjuntar evidencia sin pasar por el chat
      </button>
    )
  }

  function submit() {
    if (!texto.trim()) return
    onAgregar(tipo, texto.trim())
    setTexto('')
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      {opciones.length > 1 ? (
        <div className="inline-flex rounded-lg border border-hairline overflow-hidden self-start">
          {opciones.map((o, i) => (
            <button
              key={o.tipo}
              onClick={() => setTipo(o.tipo)}
              className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${i > 0 ? 'border-l border-hairline' : ''} ${
                tipo === o.tipo ? 'bg-brand text-white' : 'text-ink hover:bg-brand/5'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-muted">
          Este ítem solo acepta {opciones[0]?.label.toLowerCase() ?? 'evidencia'} como evidencia.
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="Describe brevemente la evidencia (ej. foto del formulario firmado)"
          className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30"
          autoFocus
        />
        <button
          onClick={submit}
          disabled={!texto.trim()}
          className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${
            texto.trim() ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
          }`}
        >
          Agregar
        </button>
        <button onClick={() => setOpen(false)} className="text-[12px] text-muted hover:text-ink px-1">
          Cancelar
        </button>
      </div>
    </div>
  )
}
