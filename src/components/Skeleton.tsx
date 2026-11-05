// Single reusable loading placeholder. `Skeleton` is a bar; `SkeletonLine` is a bar
// centred in a box with the same height as the text line it stands in for, so the
// placeholder layout matches the loaded content (no jump).
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`skeleton rounded ${className}`} />
}

export function SkeletonLine({ width, lineClass, barClass = 'h-3' }: { width: string; lineClass: string; barClass?: string }) {
  return (
    <div aria-hidden className={`flex items-center ${lineClass}`}>
      <Skeleton className={`${barClass} ${width}`} />
    </div>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="bg-white border border-hairline rounded-xl px-4 py-4 md:px-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
        <div className="min-w-0 flex-1">
          <SkeletonLine width="w-2/3" lineClass="h-6 md:h-[22.5px]" barClass="h-4" />
          <SkeletonLine width="w-full max-w-sm" lineClass="h-[21px] md:h-[19px] mt-0.5" />
          <SkeletonLine width="w-1/2 md:hidden" lineClass="h-[21px] mt-1.5 md:hidden" />
          <SkeletonLine width="w-3/4 max-w-xs" lineClass="h-[19.5px] md:h-[18px] mt-1 md:mt-1.5" />
        </div>
        <div className="md:text-right shrink-0 mt-1 md:mt-0 flex items-center justify-between md:block">
          <Skeleton className="h-4 w-36 md:h-3 md:w-32 md:ml-auto" />
          <Skeleton className="h-5 w-5 md:hidden rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function TableRowsSkeleton({ cols, rows = 3 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <tr key={r} aria-hidden>
          {Array.from({ length: cols }, (_, c) => (
            <td key={c} className="px-4 py-4">
              <Skeleton className={`h-3 ${c === 0 ? 'w-3/4' : 'w-1/2'}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function CardListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Cargando" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white border border-hairline rounded-xl px-4 py-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-full mt-3" />
          <Skeleton className="h-3 w-1/2 mt-2" />
        </div>
      ))}
    </div>
  )
}
