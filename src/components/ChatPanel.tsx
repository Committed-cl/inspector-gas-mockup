import { useEffect, useRef, useState } from 'react'
import TranscriptBubble from './TranscriptBubble'
import { ApiError } from '../lib/api'
import { compressImageFile } from '../lib/compressImage'
import { startRecording, type AudioRecorder } from '../lib/recordAudio'
import type { ChatMessage, EvidenceType } from '../data/checklistMatrizInterior'

type Props = {
  title: string
  subtitle?: string
  // Shown small under the title so it can be read off and reported when
  // something goes wrong — matches what the admin ai-logs endpoint expects.
  chatId?: string
  messages: ChatMessage[]
  placeholder: string
  onSend: (text: string, type?: EvidenceType, previewUrl?: string) => Promise<void>
  onSelectOption?: (messageId: string, itemId: string) => void
}

export default function ChatPanel({ title, subtitle, chatId, messages, placeholder, onSend, onSelectOption }: Props) {
  const [draft, setDraft] = useState('')
  const [pendingType, setPendingType] = useState<EvidenceType>('text')
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [pendingAudio, setPendingAudio] = useState<string | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  // Shown the instant "Enviar" is clicked, before the round trip (which now
  // includes a real AI call, ~1-2s) resolves and the real message lands via
  // `messages` — otherwise the input just goes quiet for that whole time.
  const [outgoing, setOutgoing] = useState<{ text: string; type: EvidenceType; previewUrl?: string } | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, outgoing])

  // A recording left running when the inspector navigates away must stop the
  // mic stream — otherwise the browser keeps it open in the background.
  useEffect(() => {
    return () => {
      recorderRef.current?.cancel()
    }
  }, [])

  async function submit() {
    if (!pendingPhoto && !pendingAudio && !draft.trim()) return
    const text = pendingPhoto ? draft.trim() || 'Foto adjunta' : pendingAudio ? draft.trim() || 'Audio adjunto' : draft
    const type = pendingPhoto ? 'photo' : pendingAudio ? 'audio' : pendingType
    const previewUrl = pendingPhoto ?? pendingAudio ?? undefined

    setOutgoing({ text, type, previewUrl })
    setSendError(null)
    setPendingPhoto(null)
    setPendingAudio(null)
    setDraft('')
    setPendingType('text')

    try {
      await onSend(text, type, previewUrl)
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'No se pudo enviar. Intentá de nuevo.')
    } finally {
      setOutgoing(null)
    }
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

  async function toggleRecording() {
    setMicError(null)
    if (recording) {
      const recorder = recorderRef.current
      recorderRef.current = null
      setRecording(false)
      if (!recorder) return
      try {
        setPendingAudio(await recorder.stop())
        setPendingType('audio')
      } catch {
        setMicError('No se pudo procesar el audio.')
      }
      return
    }
    try {
      recorderRef.current = await startRecording()
      setRecording(true)
    } catch {
      setMicError('No se pudo acceder al micrófono. Revisá los permisos del navegador.')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-hairline">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-ink">{title}</p>
          {chatId && <p className="font-mono text-[10px] text-muted shrink-0" title="Id de este chat — reportalo si algo falla">{chatId}</p>}
        </div>
        {subtitle && <p className="text-[11.5px] text-muted mt-0.5 leading-snug">{subtitle}</p>}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && !outgoing && (
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
        {outgoing && (
          <>
            <TranscriptBubble role="inspector" text={outgoing.type === 'audio' ? `🎙 ${outgoing.text}` : outgoing.text} previewUrl={outgoing.previewUrl} />
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm px-3 py-2 bg-brand-soft text-ink">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand/70 mb-1">Asistente IA</p>
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-brand/50 animate-bounce" />
                </span>
              </div>
            </div>
          </>
        )}
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
        {pendingAudio && (
          <div className="mb-2 flex items-center gap-2 bg-brand-soft/60 rounded-lg p-2">
            <audio controls src={pendingAudio} className="h-8 flex-1 min-w-0" />
            <p className="text-[11.5px] text-muted shrink-0">Agregá una descripción si querés.</p>
            <button
              onClick={() => {
                setPendingAudio(null)
                setPendingType('text')
              }}
              className="shrink-0 h-6 w-6 grid place-items-center rounded-full text-muted hover:bg-white hover:text-danger transition-colors"
              aria-label="Quitar audio"
            >
              ✕
            </button>
          </div>
        )}
        {photoError && <p className="text-[11.5px] text-danger mb-2">{photoError}</p>}
        {micError && <p className="text-[11.5px] text-danger mb-2">{micError}</p>}
        {sendError && <p className="text-[11.5px] text-danger mb-2">{sendError}</p>}
        <div className="flex items-center gap-1.5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={compressing || !!outgoing || recording || !!pendingAudio}
            className="shrink-0 h-9 w-9 grid place-items-center rounded-lg border border-hairline text-muted hover:bg-brand-soft hover:text-brand transition-colors disabled:opacity-50"
            title="Adjuntar foto"
            aria-label="Adjuntar foto"
          >
            {compressing ? '⏳' : '📎'}
          </button>
          <button
            onClick={toggleRecording}
            disabled={!!outgoing || !!pendingPhoto || compressing || (!recording && !!pendingAudio)}
            className={`shrink-0 h-9 w-9 grid place-items-center rounded-lg border transition-colors disabled:opacity-50 ${
              recording ? 'border-danger bg-danger/10 text-danger animate-pulse' : 'border-hairline text-muted hover:bg-brand-soft hover:text-brand'
            }`}
            title={recording ? 'Detener grabación' : 'Dictar por voz'}
            aria-label={recording ? 'Detener grabación' : 'Dictar por voz'}
          >
            {recording ? '⏹' : '🎙'}
          </button>
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value)
              if (!pendingPhoto && !pendingAudio && pendingType !== 'text') setPendingType('text')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
            disabled={!!outgoing}
            placeholder={pendingPhoto || pendingAudio ? 'Descripción (opcional)...' : recording ? 'Grabando...' : placeholder}
            className="flex-1 min-w-0 text-[13px] px-3 py-2 rounded-lg border border-hairline focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-base disabled:text-muted"
          />
          <button
            onClick={submit}
            disabled={!!outgoing || recording || (!pendingPhoto && !pendingAudio && !draft.trim())}
            className={`shrink-0 h-9 w-9 grid place-items-center rounded-lg font-semibold transition-colors ${
              !outgoing && !recording && (pendingPhoto || pendingAudio || draft.trim()) ? 'bg-brand text-white hover:bg-brand-dark' : 'bg-hairline text-muted cursor-not-allowed'
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
