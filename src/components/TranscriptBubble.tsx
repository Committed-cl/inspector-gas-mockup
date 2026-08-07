type Props = {
  role: 'inspector' | 'ai'
  text: string
}

export default function TranscriptBubble({ role, text }: Props) {
  const isInspector = role === 'inspector'
  return (
    <div className={`flex ${isInspector ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug ${
          isInspector ? 'bg-brand text-white rounded-br-sm' : 'bg-brand-soft text-ink rounded-bl-sm'
        }`}
      >
        {!isInspector && (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand/70 mb-0.5">Asistente IA</p>
        )}
        <p>{text}</p>
      </div>
    </div>
  )
}
