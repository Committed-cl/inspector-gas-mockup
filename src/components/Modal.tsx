import { useEffect, useRef, type ReactNode } from 'react'

// Centered overlay dialog. Closes on Escape and on a click on the backdrop.
// On phones the panel is full width and scrolls internally when it overflows.
export default function Modal({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string
  onClose: () => void
  children: ReactNode
}) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4"
      // mousedown (not click) so a drag that starts inside the panel and ends on the backdrop doesn't close it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="w-full sm:max-w-2xl max-h-full overflow-y-auto bg-white sm:rounded-xl shadow-xl"
      >
        {children}
      </div>
    </div>
  )
}
