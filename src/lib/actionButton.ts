// Shared look for action buttons (open item, close visit, download / send report).
// Accent orange keeps them distinct from the dark-blue brand header and "Volver".
// 44px touch target on mobile, compact from md up.
const base =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-4 min-h-[44px] md:min-h-[36px] text-[12.5px] font-semibold ' +
  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'

export const actionButtonPrimary = `${base} bg-accent text-white hover:bg-accent-dark disabled:hover:bg-accent`
export const actionButtonSecondary = `${base} bg-white text-accent border border-accent hover:bg-accent hover:text-white`
