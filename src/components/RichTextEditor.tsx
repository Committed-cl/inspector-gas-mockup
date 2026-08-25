import { useEffect, useRef } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

const COMMANDS: { command: string; label: string; icon: string }[] = [
  { command: 'bold', label: 'Negrita', icon: 'N' },
  { command: 'italic', label: 'Cursiva', icon: 'I' },
  { command: 'insertUnorderedList', label: 'Lista', icon: '•' },
]

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Set once on mount only — re-applying `value` on every keystroke via
  // dangerouslySetInnerHTML would fight the browser's own cursor position.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value
  }, [])

  function exec(command: string) {
    ref.current?.focus()
    document.execCommand(command)
    onChange(ref.current?.innerHTML ?? '')
  }

  return (
    <div className="border border-hairline rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 border-b border-hairline bg-brand-soft/40 px-2 py-1.5">
        {COMMANDS.map((c) => (
          <button
            key={c.command}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(c.command)}
            title={c.label}
            className="h-7 w-7 grid place-items-center rounded-md text-[13px] font-semibold text-ink hover:bg-white transition-colors"
          >
            {c.icon}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? '')}
        data-placeholder={placeholder}
        className="min-h-[110px] px-3 py-2.5 text-[13px] text-ink leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  )
}
