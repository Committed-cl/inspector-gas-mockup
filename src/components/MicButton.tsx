type Props = {
  active?: boolean
  onClick?: () => void
  label?: string
}

export default function MicButton({ active = false, onClick, label = 'Mantén presionado para hablar' }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className={`relative grid place-items-center h-24 w-24 rounded-full text-white shadow-lg transition-transform active:scale-95 ${
          active ? 'bg-accent animate-mic-pulse' : 'bg-accent hover:bg-accent-dark'
        }`}
        aria-label="Activar micrófono"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-10 w-10">
          <path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15Z" />
          <path d="M19 11.5a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-1.57A7 7 0 0 0 19 11.5Z" />
        </svg>
      </button>
      <p className="text-[11.5px] text-muted">{label}</p>
    </div>
  )
}
