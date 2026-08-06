import { useState } from 'react'
import type { ChecklistStatus } from '../data/checklistMatrizInterior'

type Props = {
  status: ChecklistStatus
  permiteNoAplica?: boolean
  onMarcar: (status: ChecklistStatus, justificacion?: string) => void
  size?: 'sm' | 'md'
  hint?: string
}

export default function ManualEstadoControl({ status, permiteNoAplica, onMarcar, size = 'sm', hint }: Props) {
  const [showNaInput, setShowNaInput] = useState(false)
  const [justificacion, setJustificacion] = useState('')
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3.5 py-1.5 text-[12.5px]'

  return (
    <div>
      <div className="inline-flex rounded-lg border border-hairline overflow-hidden">
        <button
          onClick={() => onMarcar('ok')}
          className={`${pad} font-medium transition-colors ${status === 'ok' ? 'bg-ok text-white' : 'text-ink hover:bg-ok/10'}`}
        >
          Cumple
        </button>
        <button
          onClick={() => onMarcar('pending')}
          className={`${pad} font-medium border-l border-hairline transition-colors ${
            status === 'pending' ? 'bg-danger text-white' : 'text-ink hover:bg-danger/10'
          }`}
        >
          No cumple
        </button>
        {permiteNoAplica && (
          <button
            onClick={() => setShowNaInput((v) => !v)}
            className={`${pad} font-medium border-l border-hairline transition-colors ${
              status === 'na' ? 'bg-muted text-white' : 'text-ink hover:bg-muted/10'
            }`}
          >
            No aplica
          </button>
        )}
      </div>
      {hint && status !== 'ok' && status !== 'na' && <p className="text-[11px] text-warn mt-1.5">{hint}</p>}
      {showNaInput && (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            placeholder="Justificación breve (ej. no hay tramo soterrado en este proyecto)"
            className="flex-1 text-[12px] px-2.5 py-1.5 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={() => {
              onMarcar('na', justificacion)
              setShowNaInput(false)
            }}
            disabled={!justificacion.trim()}
            className={`text-[12px] font-semibold px-3 py-1.5 rounded-lg ${
              justificacion.trim() ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
            }`}
          >
            Confirmar
          </button>
        </div>
      )}
    </div>
  )
}
