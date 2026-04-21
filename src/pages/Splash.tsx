import { Link } from 'react-router-dom'

export default function Splash() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand-dark to-[#071a29]" />
      <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-accent/30 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-soft/20 blur-3xl" />

      <div className="relative z-10 max-w-md text-center text-white">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-wider mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Demo · Propuesta Metrogas
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
          Inspector <span className="text-accent">Gas</span>
        </h1>
        <p className="mt-5 text-[15px] text-white/80 leading-relaxed">
          Inspecciones de obra con voz e IA. Sin papeles, sin improvisaciones. El inspector habla, el sistema
          interpreta y bloquea el envío mientras queden ítems sin cubrir.
        </p>

        <Link
          to="/login"
          className="mt-10 inline-flex items-center gap-2 bg-accent hover:bg-accent-dark transition-colors text-white font-semibold px-6 py-3 rounded-full shadow-lg"
        >
          Iniciar demo
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M5 12a1 1 0 0 1 1-1h10.586L13.3 7.71a1 1 0 1 1 1.4-1.42l5 5a1 1 0 0 1 0 1.42l-5 5a1 1 0 1 1-1.4-1.42L16.586 13H6a1 1 0 0 1-1-1Z" />
          </svg>
        </Link>

        <p className="mt-12 text-[11px] text-white/50 font-mono">
          Committed · 2026 · Coordinación Ricardo Silva — Rodrigo Martínez
        </p>
      </div>
    </div>
  )
}
