// Real microphone capture for the chat's voice-dictation button. The
// recorded clip is kept inline as a data: URL — mirrors compressImage.ts's
// approach for photos — and sent to the backend, which transcribes it and
// runs the transcript through the same AI pipeline as a typed message.
export type AudioRecorder = {
  stop: () => Promise<string>
  cancel: () => void
}

function pickMimeType(): string {
  const candidates = ['audio/webm', 'audio/mp4', 'audio/ogg']
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export async function startRecording(): Promise<AudioRecorder> {
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Este navegador no soporta grabación de audio.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = pickMimeType()
  const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  const stopStream = () => stream.getTracks().forEach((t) => t.stop())

  recorder.start()

  return {
    stop: () =>
      new Promise<string>((resolve, reject) => {
        recorder.onstop = () => {
          stopStream()
          if (chunks.length === 0) {
            reject(new Error('No se grabó audio.'))
            return
          }
          const blob = new Blob(chunks, { type: recorder.mimeType.split(';')[0] || 'audio/webm' })
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('No se pudo procesar el audio.'))
          reader.readAsDataURL(blob)
        }
        recorder.stop()
      }),
    cancel: () => {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      stopStream()
    },
  }
}
