import { useRef, useState } from 'react'
import type { RequirementState } from '../data/checklistMatrizInterior'

const evidenceSourceLabel = {
  'general-chat': 'chat general',
  'item-chat': 'chat del ítem',
  manual: 'manual',
  'manual-mark': 'conclusión',
} as const

type Props = {
  requirement: RequirementState
  onAdd: (text: string, previewUrl?: string) => void
}

export default function EvidenceField({ requirement, onAdd }: Props) {
  const [text, setText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  function submitText() {
    if (!text.trim()) return
    onAdd(text.trim())
    setText('')
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onAdd(file.name, URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className={`border-l-2 ${requirement.fulfilled ? 'border-ok' : 'border-hairline'} pl-3`}>
      <p className={`text-[12.5px] font-medium ${requirement.fulfilled ? 'text-ink' : 'text-muted'}`}>
        {requirement.type === 'photo' ? '📷 ' : ''}
        {requirement.label}
      </p>

      {requirement.fulfilled && requirement.evidence ? (
        <div className="mt-1 flex items-start gap-2">
          {requirement.evidence.previewUrl && (
            <img
              src={requirement.evidence.previewUrl}
              alt={requirement.evidence.text}
              className="h-12 w-12 rounded-md object-cover border border-hairline shrink-0"
            />
          )}
          <p className="text-[12.5px] text-muted leading-snug">
            <span className="font-mono text-[10.5px]">{requirement.evidence.time}</span>{' '}
            <span className="text-[10px] uppercase tracking-wide text-brand/70 font-semibold">
              {evidenceSourceLabel[requirement.evidence.source]}
            </span>{' '}
            — {requirement.evidence.text}
          </p>
        </div>
      ) : requirement.type === 'photo' ? (
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
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitText()
            }}
            placeholder="Describe la evidencia..."
            className="flex-1 min-w-0 text-[12px] px-2.5 py-1.5 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={submitText}
            disabled={!text.trim()}
            className={`shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap ${
              text.trim() ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
            }`}
          >
            Agregar
          </button>
        </div>
      )}
    </div>
  )
}
