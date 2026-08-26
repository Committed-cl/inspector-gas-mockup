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
  // Tracks what the DOM was last set to (by us, or mirrored from typing) so
  // the sync effect below can tell "value changed because I just typed it"
  // (skip — would fight the cursor) apart from "value changed from outside,
  // e.g. the chat appending an observation" (must re-render).
  const lastValueRef = useRef<string | null>(null)

  useEffect(() => {
    if (!ref.current) return
    // Every keystroke here triggers a save round-trip (onChange -> API ->
    // the response flows back into `value`) — while the field is focused,
    // a stale in-flight response landing after a later keystroke must not
    // stomp what's already on screen.
    if (document.activeElement === ref.current) return
    if (value !== lastValueRef.current) {
      ref.current.innerHTML = value
      lastValueRef.current = value
    }
  }, [value])

  function handleInput() {
    const html = ref.current?.innerHTML ?? ''
    lastValueRef.current = html
    onChange(html)
  }

  function exec(command: string) {
    ref.current?.focus()
    document.execCommand(command)
    handleInput()
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
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[110px] px-3 py-2.5 text-[13px] text-ink leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  )
}
