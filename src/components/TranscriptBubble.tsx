type Props = {
  role: 'inspector' | 'ai'
  text: string
  options?: { itemId: string; title: string }[]
  onSelectOption?: (itemId: string) => void
}

export default function TranscriptBubble({ role, text, options, onSelectOption }: Props) {
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
        {options && options.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5">
            {options.map((opt) => (
              <button
                key={opt.itemId}
                onClick={() => onSelectOption?.(opt.itemId)}
                className="text-left text-[12px] px-2.5 py-1.5 rounded-lg border border-brand/30 bg-white text-brand hover:bg-brand hover:text-white transition-colors"
              >
                {opt.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
