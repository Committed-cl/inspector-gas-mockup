import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  header?: ReactNode
  footer?: ReactNode
}

export default function PhoneFrame({ children, header, footer }: Props) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-6 px-3 sm:py-12">
      <div className="w-full max-w-[420px] bg-white rounded-[32px] shadow-phone border border-hairline overflow-hidden flex flex-col min-h-[720px]">
        {header}
        <div className="flex-1 overflow-y-auto thin-scroll">{children}</div>
        {footer}
      </div>
      <p className="mt-4 text-xs text-muted font-mono">Maqueta · Inspector Gas</p>
    </div>
  )
}
