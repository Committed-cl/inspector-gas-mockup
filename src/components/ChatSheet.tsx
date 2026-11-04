import { useEffect, type ReactNode } from 'react'

// Chat container shared by the checklist and item pages. md+: the usual
// right-hand column. Below md: a bottom sheet toggled by the parent (a floating
// button), so the chat no longer competes with the checklist for the screen.
export default function ChatSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      {open && <div className="md:hidden fixed inset-0 z-40 bg-ink/40" onClick={onClose} aria-hidden />}
      <aside
        className={`${open ? 'flex' : 'hidden'} md:flex flex-col fixed md:static inset-x-0 bottom-0 z-50 h-[80dvh] md:h-auto w-full md:w-[380px] md:shrink-0 min-h-0 rounded-t-2xl md:rounded-none shadow-2xl md:shadow-none md:border-l border-hairline bg-white`}
        aria-label="Chat"
      >
        <div className="md:hidden flex items-center justify-between pl-4 pr-1 pt-1 border-b border-hairline">
          <span className="mx-auto absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-hairline" aria-hidden />
          <span className="text-[13px] font-semibold text-ink pt-2">Chat con IA</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chat"
            className="h-11 w-11 grid place-items-center text-muted rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 min-h-0">{children}</div>
      </aside>
    </>
  )
}
