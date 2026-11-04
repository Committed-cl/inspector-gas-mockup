import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChecklist } from '../state/ChecklistContext'

// Mount point inside each screen header: on mobile the sync notice renders here
// (in flow) so it never covers titles, badges or fixed bars.
export function SyncSlot() {
  return <div id="sync-slot" className="md:hidden empty:hidden flex flex-col items-start gap-2 mt-2" />
}

// Offline queue indicator: offline + pending count → syncing → all synced, plus
// the changes the server definitively rejected. Desktop: fixed corner. Mobile:
// inside the header slot (fixed top fallback when the screen has no slot).
export default function SyncStatus() {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const el = document.getElementById('sync-slot')
    if (el !== slot) setSlot(el)
  })
  const { sync } = useChecklist()
  const [open, setOpen] = useState(false)
  const { online, pendingCount, failed, phase } = sync

  let text: string | null = null
  let tone = 'bg-brand text-white'
  if (!online) {
    text = `Sin conexión · ${pendingCount} ${pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}`
    tone = 'bg-warn text-white'
  } else if (phase === 'syncing') text = 'Sincronizando…'
  else if (pendingCount > 0) text = `${pendingCount} ${pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'} · reintentando`
  else if (phase === 'done') {
    text = 'Todo sincronizado'
    tone = 'bg-ok text-white'
  }
  if (!text && failed.length === 0) return null

  const content = (inSlot: boolean) => (
    <>
      {open && failed.length > 0 && (
        <div className={`bg-white border border-danger/40 rounded-xl shadow-lg p-3 max-h-72 ${inSlot ? 'w-full' : 'w-80'} overflow-y-auto text-[12px]`}>
          <p className="font-semibold text-danger mb-2">Cambios que no se pudieron enviar</p>
          <ul className="space-y-2">
            {failed.map((op) => (
              <li key={op.seq} className="border-b border-hairline pb-2 last:border-0">
                <p className="font-medium">{op.label}</p>
                <p className="text-muted">{op.error}</p>
                <div className="mt-1 flex gap-3">
                  <button type="button" className="text-brand font-medium" onClick={() => sync.retry(op.seq!)}>
                    Reintentar
                  </button>
                  <button type="button" className="text-danger font-medium" onClick={() => sync.discard(op.seq!)}>
                    Descartar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {failed.length > 0 && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-full bg-danger text-white text-[12px] font-medium px-3 py-1.5 min-h-[44px] md:min-h-0 shadow">
          {failed.length} {failed.length === 1 ? 'cambio no enviado' : 'cambios no enviados'}
        </button>
      )}
      {text && (
        <div role="status" className={`rounded-full text-[12px] font-medium px-3 py-1.5 shadow ${tone}`}>
          {text}
        </div>
      )}
    </>
  )

  return (
    <>
      <div className="hidden md:flex fixed bottom-3 right-3 z-50 flex-col items-end gap-2 max-w-[90vw]" data-testid="sync-status">
        {content(false)}
      </div>
      {slot ? (
        createPortal(<div className="contents" data-testid="sync-status-mobile">{content(true)}</div>, slot)
      ) : (
        <div className="md:hidden fixed top-[calc(3.5rem+env(safe-area-inset-top)+0.25rem)] right-2 z-50 flex flex-col items-end gap-2 max-w-[90vw]">
          {content(false)}
        </div>
      )}
    </>
  )
}
