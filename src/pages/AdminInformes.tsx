import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../components/Sidebar'
import { api, ApiError, fetchBlob } from '../lib/api'
import { formatDateCl } from '../utils/date'
import { visitTypeLabel } from './ObraVisitas'
import type { VisitType } from '../state/ChecklistContext'

type Report = {
  projectId: string
  projectName: string
  visitId: string
  sentAt: string
  supervisor: string | null
  visitType: VisitType
  reportUrl: string | null
}

type SortKey = 'projectName' | 'sentAt' | 'supervisor' | 'visitType'
const columns: { key: SortKey; label: string }[] = [
  { key: 'projectName', label: 'Proyecto' },
  { key: 'sentAt', label: 'Fecha de envío' },
  { key: 'supervisor', label: 'Supervisor' },
  { key: 'visitType', label: 'Tipo de visita' },
]

export default function AdminInformes() {
  const [reports, setReports] = useState<Report[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'sentAt', dir: -1 })
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    api.get<Report[]>('/reports').then(setReports, (err) => setError(err instanceof ApiError ? err.message : 'No se pudieron cargar los informes.'))
  }, [])

  const sorted = useMemo(
    () => [...(reports ?? [])].sort((a, b) => (a[sort.key] ?? '').localeCompare(b[sort.key] ?? '', 'es') * sort.dir),
    [reports, sort],
  )

  const toggleSort = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }))

  // The PDF is behind auth, so fetch it with the token and open the blob.
  const open = async (report: Report) => {
    if (!report.reportUrl) return
    setOpening(report.visitId)
    setError(null)
    try {
      const url = URL.createObjectURL(await fetchBlob(report.reportUrl))
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo descargar el informe.')
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="min-h-screen flex bg-base">
      <Sidebar demoMode={false} />
      <main className="flex-1 min-w-0 p-5 pt-16 md:p-8 max-w-5xl">
        <p className="text-[12px] uppercase tracking-wide text-muted font-semibold">Administración</p>
        <h1 className="text-2xl font-bold text-ink mt-1">Informes</h1>
        <p className="text-[13px] text-muted mt-1 max-w-xl">Informes de visita enviados. La descarga requiere sesión iniciada.</p>
        {error && <p className="text-[13px] text-danger mt-4">{error}</p>}

        <div className="mt-8 bg-white rounded-xl border border-hairline overflow-x-auto">
          <table className="w-full min-w-[640px] text-[13.5px]">
            <thead className="bg-brand-soft/60 text-brand text-[11.5px] uppercase tracking-wide">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3" aria-sort={sort.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                    <button type="button" onClick={() => toggleSort(c.key)} className="uppercase tracking-wide font-semibold">
                      {c.label} {sort.key === c.key ? (sort.dir === 1 ? '▲' : '▼') : ''}
                    </button>
                  </th>
                ))}
                <th className="text-left px-4 py-3">Informe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {reports === null && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted italic">Cargando...</td>
                </tr>
              )}
              {reports?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-muted italic">Aún no hay informes enviados.</td>
                </tr>
              )}
              {sorted.map((r) => (
                <tr key={r.visitId}>
                  <td className="px-4 py-3 text-ink font-medium">{r.projectName}</td>
                  <td className="px-4 py-3 text-ink">{formatDateCl(r.sentAt)}</td>
                  <td className="px-4 py-3">{r.supervisor ?? <span className="text-muted italic">—</span>}</td>
                  <td className="px-4 py-3">{visitTypeLabel[r.visitType]}</td>
                  <td className="px-4 py-3">
                    {r.reportUrl ? (
                      <button type="button" onClick={() => open(r)} disabled={opening === r.visitId} className="text-brand font-semibold text-[12.5px] hover:underline disabled:opacity-60">
                        {opening === r.visitId ? 'Abriendo...' : 'Descargar PDF'}
                      </button>
                    ) : (
                      <span className="text-muted italic">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
