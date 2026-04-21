import { useNavigate } from 'react-router-dom'
import PhoneFrame from '../components/PhoneFrame'
import ChecklistItemRow from '../components/ChecklistItemRow'
import TranscriptBubble from '../components/TranscriptBubble'
import { checklistLosTresAntoniosEtapa1 } from '../data/mock'

export default function VisitaRevisar() {
  const nav = useNavigate()
  const allGreen = checklistLosTresAntoniosEtapa1.map((i) => ({
    ...i,
    status: 'ok' as const,
    declared: i.declared ?? 'Verificado en terreno y declarado por voz.',
  }))

  return (
    <PhoneFrame
      header={
        <div className="px-5 pt-5 pb-4 border-b border-hairline bg-white">
          <button onClick={() => nav('/visita/en-curso')} className="flex items-center gap-1 text-[12.5px] text-brand mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M14.7 6.3a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l5 5a1 1 0 1 0 1.4-1.4L10.42 12l4.28-4.3a1 1 0 0 0 0-1.4Z" />
            </svg>
            Volver a inspección
          </button>
          <div>
            <p className="font-semibold text-ink text-[15px] leading-tight">Listo para enviar</p>
            <p className="text-[11.5px] text-muted mt-0.5">Los Tres Antonios · Etapa 1 · 14:48</p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wide text-ok font-semibold">
              7/7 completados
            </span>
            <div className="flex-1 h-1.5 bg-hairline rounded-full overflow-hidden">
              <div className="h-full bg-ok w-full" />
            </div>
          </div>
        </div>
      }
      footer={
        <div className="bg-white border-t border-hairline p-4 flex flex-col gap-2">
          <TranscriptBubble
            role="ia"
            text="Reporte listo. ¿Lo envío a Metrogas, Constructora Andes y GasTec Chile?"
          />
          <button
            onClick={() => nav('/visita/enviado')}
            className="w-full bg-ok text-white font-semibold py-3 rounded-xl hover:brightness-95 transition"
          >
            Enviar reporte
          </button>
        </div>
      }
    >
      <div className="px-4 py-4 flex flex-col gap-2">
        <div className="bg-ok/10 border border-ok/30 rounded-lg p-3 text-[12.5px] text-ok">
          Todos los ítems están en verde. La IA ha validado la cobertura completa para esta etapa.
        </div>
        {allGreen.map((item) => (
          <ChecklistItemRow key={item.id} item={item} compact />
        ))}
        <div className="mt-3 rounded-lg bg-brand-soft p-3">
          <p className="text-[11px] font-semibold uppercase text-brand/70 tracking-wide">Destinatarios</p>
          <ul className="mt-1.5 text-[12.5px] text-ink space-y-0.5">
            <li>supervisor@metrogas.cl</li>
            <li>jefeobra@andes.cl</li>
            <li>operaciones@gastec.cl</li>
          </ul>
        </div>
      </div>
    </PhoneFrame>
  )
}
