import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import MicButton from '../components/MicButton'
import ChecklistItemRow from '../components/ChecklistItemRow'
import TranscriptBubble from '../components/TranscriptBubble'
import { checklistLosTresAntoniosEtapa1 } from '../data/mock'

export default function VisitaEnCurso() {
  const nav = useNavigate()
  const [items] = useState(checklistLosTresAntoniosEtapa1)

  const { okCount, total, canSend } = useMemo(() => {
    const ok = items.filter((i) => i.status === 'ok').length
    return {
      okCount: ok,
      total: items.length,
      canSend: items.every((i) => i.status === 'ok'),
    }
  }, [items])

  return (
    <PhoneFrame
      header={
        <div className="px-5 pt-5 pb-4 border-b border-hairline bg-white">
          <button onClick={() => nav('/proyectos/los-tres-antonios')} className="flex items-center gap-1 text-[12.5px] text-brand mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
            </svg>
            Pausar visita
          </button>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-ink text-[15px] leading-tight">Los Tres Antonios</p>
              <p className="text-[11.5px] text-muted mt-0.5">Etapa 1 · Tercera losa del piso 3</p>
            </div>
            <span className="text-[10.5px] text-muted font-mono mt-1">14:32</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-brand font-semibold">
              {okCount}/{total} completados
            </span>
            <div className="flex-1 h-1.5 bg-hairline rounded-full overflow-hidden">
              <div
                className="h-full bg-ok transition-all"
                style={{ width: `${(okCount / total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      }
      footer={
        <div className="bg-white border-t border-hairline">
          <div className="px-5 py-3 border-b border-hairline flex flex-col gap-2 max-h-44 overflow-y-auto thin-scroll">
            <TranscriptBubble
              role="inspector"
              text="Hablé con el jefe de obra. El capataz andaba sin gorro de seguridad. Le pedí al instalador las llaves de la camioneta y se negó — la miré por la ventana y estaba desordenada."
            />
            <TranscriptBubble
              role="ia"
              text="Marqué 'Orden camioneta' en amarillo — necesito que confirmes si es riesgo. Aún quedan 3 ítems pendientes: extintor, matriz de riesgo y capacitación de maestros."
            />
          </div>
          <div className="px-5 py-4 flex flex-col items-center gap-4">
            <MicButton active label="Mantén presionado para declarar" />
            <div className="w-full">
              <button
                disabled={!canSend}
                onClick={() => canSend && nav('/visita/revisar')}
                className={`w-full font-semibold py-3 rounded-xl transition-all ${
                  canSend
                    ? 'bg-ok text-white hover:brightness-95'
                    : 'bg-hairline text-muted cursor-not-allowed'
                }`}
              >
                {canSend ? 'Enviar reporte' : 'Enviar reporte · bloqueado'}
              </button>
              {!canSend && (
                <p className="text-[11px] text-muted text-center mt-1.5">
                  Completa o justifica los ítems en rojo y amarillo antes de enviar.
                </p>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 py-4 flex flex-col gap-2">
        {items.map((item) => (
          <ChecklistItemRow key={item.id} item={item} />
        ))}
        <button
          onClick={() => nav('/visita/revisar')}
          className="mt-3 text-[11.5px] text-brand/70 underline-offset-2 hover:underline text-center"
        >
          [demo] Saltar a estado "todo en verde"
        </button>
      </div>
    </PhoneFrame>
  )
}
