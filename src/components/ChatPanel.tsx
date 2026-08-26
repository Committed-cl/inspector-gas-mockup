import { useRef, useState } from 'react'
import TranscriptBubble from './TranscriptBubble'
import { compressImageFile } from '../lib/compressImage'
import type { ChatMessage, EvidenceType } from '../data/checklistMatrizInterior'

type Props = {
  title: string
  subtitle?: string
  messages: ChatMessage[]
  placeholder: string
  onSend: (text: string, type?: EvidenceType, previewUrl?: string) => void
  micHint: string
  onSelectOption?: (messageId: string, itemId: string) => void
}

export default function ChatPanel({ title, subtitle, messages, placeholder, onSend, micHint, onSelectOption }: Props) {
  const [draft, setDraft] = useState('')
  const [pendingType, setPendingType] = useState<EvidenceType>('text')
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function submit() {
    if (pendingPhoto) {
      onSend(draft.trim() || 'Foto adjunta', 'photo', pendingPhoto)
      setPendingPhoto(null)
      setDraft('')
      setPendingType('text')
      return
    }
    if (!draft.trim()) return
    onSend(draft, pendingType)
    setDraft('')
    setPendingType('text')
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    setCompressing(true)
    try {
      setPendingPhoto(await compressImageFile(file))
      setPendingType('photo')
    } catch {
      setPhotoError('No se pudo procesar la foto.')
    } finally {
      setCompressing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-hairline">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        {subtitle && <p className="text-[11.5px] text-muted mt-0.5 leading-snug">{subtitle}</p>}
      </div>
      <div className="flex-1 overflow-y-auto thin-scroll px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-[12px] text-muted italic text-center mt-6">Aún no hay mensajes en este chat.</p>
        )}
        {messages.map((m) => (
          <TranscriptBubble
            key={m.id}
            role={m.role}
            text={m.type === 'audio' ? `🎙 ${m.text}` : m.text}
            previewUrl={m.previewUrl}
            options={m.options}
            onSelectOption={onSelectOption ? (itemId) => onSelectOption(m.id, itemId) : undefined}
          />
        ))}
      </div>
      <div className="border-t border-hairline p-3">
        {pendingPhoto && (
          <div className="mb-2 flex items-center gap-2 bg-brand-soft/60 rounded-lg p-2">
            <img src={pendingPhoto} alt="Foto a enviar" className="h-12 w-12 rounded-md object-cover border border-hairline shrink-0" />
            <p className="text-[11.5px] text-muted flex-1">Foto lista para enviar. Agregá una descripción si querés.</p>
            <button
              onClick={() => {
                setPendingPhoto(null)
                setPendingType('text')
              }}
              className="shrink-0 h-6 w-6 grid place-items-center rounded-full text-muted hover:bg-white hover:text-danger transition-colors"
              aria-label="Quitar foto"
            >
              ✕
            </button>
          </div>
        )}
        {photoError && <p className="text-[11.5px] text-danger mb-2">{photoError}</p>}
        <div className="flex items-center gap-1.5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing}
            className="shrink-0 h-9 w-9 grid place-items-center rounded-lg border border-hairline text-muted hover:bg-brand-soft hover:text-brand transition-colors disabled:opacity-50"
            title="Adjuntar foto"
            aria-label="Adjuntar foto"
          >
            {compressing ? '⏳' : '📎'}
          </button>
          <button
            onClick={() => {
              setDraft(micHint)
              setPendingType('audio')
            }}
            className="shrink-0 h-9 w-9 grid place-items-center rounded-lg border border-hairline text-muted hover:bg-brand-soft hover:text-brand transition-colors"
            title="Dictar por voz"
            aria-label="Dictar por voz"
          >
            🎙
          </button>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (!pendingPhoto && pendingType !== 'text') setPendingType('text')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            placeholder={pendingPhoto ? 'Descripción (opcional)...' : placeholder}
            className="flex-1 min-w-0 text-[13px] px-3 py-2 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          <button
            onClick={submit}
            disabled={!pendingPhoto && !draft.trim()}
            className={`shrink-0 h-9 w-9 grid place-items-center rounded-lg font-semibold transition-colors ${
              pendingPhoto || draft.trim() ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
            }`}
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M5 12a1 1 0 0 1 1-1h10.586L13.3 7.71a1 1 0 1 1 1.4-1.42l5 5a1 1 0 0 1 0 1.42l-5 5a1 1 0 1 1-1.4-1.42L16.586 13H6a1 1 0 0 1-1-1Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
