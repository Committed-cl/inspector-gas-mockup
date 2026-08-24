import { Link } from 'react-router-dom'

export default function Splash() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-dark to-[#071a29]" />
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-soft/20 blur-3xl" />

      <div className="relative z-10 max-w-md text-center text-white">
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <p className="text-white font-bold text-xl tracking-wide uppercase">Gaspex</p>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">Inspector de obra</h1>
        <p className="mt-5 text-[15px] text-white/80 leading-relaxed">Inspección con IA</p>

        <Link
          to="/checklist"
          className="mt-10 inline-flex items-center gap-2 bg-accent hover:bg-accent-dark transition-colors text-white font-semibold px-6 py-3 rounded-full shadow-lg"
        >
          Iniciar demo · versión desktop
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M5 12a1 1 0 0 1 1-1h10.586L13.3 7.71a1 1 0 1 1 1.4-1.42l5 5a1 1 0 0 1 0 1.42l-5 5a1 1 0 1 1-1.4-1.42L16.586 13H6a1 1 0 0 1-1-1Z" />
          </svg>
        </Link>

        <div>
          <Link
            to="/login"
            className="mt-4 inline-flex items-center gap-2 text-white/70 hover:text-white text-[13px] underline underline-offset-4 decoration-white/30"
          >
            Ver flujo mobile original (voz, 2026-04-17) →
          </Link>
        </div>

        <p className="mt-12 text-[11px] text-white/50 font-mono">2026 · Rodrigo Martínez</p>
      </div>
    </div>
  )
}
