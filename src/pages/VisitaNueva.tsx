import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import MicButton from '../components/MicButton'
import TranscriptBubble from '../components/TranscriptBubble'

export default function VisitaNueva() {
  const nav = useNavigate()
  const [step, setStep] = useState<0 | 1 | 2>(0)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1800)
    const t2 = setTimeout(() => setStep(2), 3800)
    const t3 = setTimeout(() => nav('/visita/en-curso'), 6200)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [nav])

  return (
    <PhoneFrame
      header={
        <div className="px-5 pt-5 pb-4 border-b border-hairline bg-white">
          <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[12.5px] text-brand mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
            </svg>
            Cancelar
          </button>
          <p className="font-semibold text-ink text-[15px]">Nueva visita</p>
          <p className="text-[11.5px] text-muted mt-0.5 font-mono">
            17 abr 2026 · 14:32 · Iniciando…
          </p>
        </div>
      }
    >
      <div className="px-5 py-8 flex flex-col gap-5 items-center">
        <div className="mt-4 grid place-items-center">
          <SoundWave active={step === 0} />
        </div>

        <p className="text-center text-[13px] text-muted max-w-[280px]">
          Cuéntame qué proyecto vas a inspeccionar hoy y en qué etapa se encuentra.
        </p>

        <div className="w-full mt-4 flex flex-col gap-2">
          {step >= 1 && (
            <div className="animate-pop">
              <TranscriptBubble
                role="inspector"
                text="Estoy visitando Los Tres Antonios en Puente Alto, piso 3, tercera losa del tercer piso, etapa 1."
              />
            </div>
          )}
          {step >= 2 && (
            <div className="animate-pop">
              <TranscriptBubble
                role="ai"
                text="Perfecto, Rodrigo. Cargo el checklist de Etapa 1 para Los Tres Antonios."
              />
            </div>
          )}
        </div>

        <div className="mt-6">
          <MicButton active={step === 0} label={step === 0 ? 'Escuchando…' : 'Procesando…'} />
        </div>
      </div>
    </PhoneFrame>
  )
}

function SoundWave({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-1 h-16">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full bg-accent transition-all duration-500 ${active ? 'animate-mic-pulse' : ''}`}
          style={{
            height: `${20 + ((i * 7 + 9) % 32)}%`,
            animationDelay: `${i * 0.08}s`,
            maxHeight: '100%',
          }}
        />
      ))}
    </div>
  )
}
