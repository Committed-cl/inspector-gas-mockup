export type MobilePanel = 'primary' | 'chat'

// Below md the checklist/chat side-by-side layout has no room to breathe, so
// pages that pair a primary panel with a ChatPanel aside switch to showing
// one at a time here; md+ ignores this and shows both side by side.
export default function MobilePanelTabs({
  active,
  onChange,
  primaryLabel,
}: {
  active: MobilePanel
  onChange: (panel: MobilePanel) => void
  primaryLabel: string
}) {
  const tabs: { key: MobilePanel; label: string }[] = [
    { key: 'primary', label: primaryLabel },
    { key: 'chat', label: 'Chat' },
  ]

  return (
    <div className="md:hidden flex border-b border-hairline bg-white px-3">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex-1 text-center text-[12.5px] font-semibold px-3 py-2.5 border-b-2 transition-colors ${
            active === tab.key ? 'border-brand text-brand' : 'border-transparent text-muted'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
