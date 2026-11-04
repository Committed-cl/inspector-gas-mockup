import { useState } from 'react'
import CompanyLogo from '../components/CompanyLogo'
import LogoUploader from '../components/LogoUploader'
import { useAuth } from '../lib/auth'

// The Administrador del convenio manages their own company here (today: its logo).
export default function AdminMiEmpresa() {
  const { auth } = useAuth()
  const [version, setVersion] = useState(0)
  if (!auth) return null
  const { companyId, companyName } = auth.user

  return (
    <div className="flex bg-base">
      <main className="flex-1 min-w-0 p-5 md:p-8 max-w-4xl">
        <header>
          <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
          <h1 className="text-2xl font-bold text-ink mt-1">Mi empresa</h1>
          <p className="text-[13px] text-muted mt-1 max-w-xl">{companyName ?? 'Tu empresa'}: el logo aparece en la cabecera y en el PDF de los informes.</p>
        </header>
        <section className="mt-8 bg-white border border-hairline rounded-xl p-5 flex flex-col gap-4 max-w-md">
          <h2 className="text-[13px] font-semibold text-ink">Logo</h2>
          <CompanyLogo companyId={companyId} alt={companyName ?? 'Empresa'} version={version} className="h-16 max-w-[240px] object-contain" />
          <LogoUploader companyId={companyId} onUploaded={() => setVersion((v) => v + 1)} />
        </section>
      </main>
    </div>
  )
}
