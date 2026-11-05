import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import ImpersonationBar, { IMPERSONATION_BAR_HEIGHT } from './ImpersonationBar'
import Sidebar from './Sidebar'

// Shell shared by every authenticated screen (admin and checklist), so moving
// between the panel and the project list keeps the same structure and menu.
// Below md the container is a plain block: the Sidebar's slim top bar sits in
// the flow above the page and its drawer is off-canvas, so nothing is covered.
export default function AppLayout() {
  const { impersonation } = useAuth()
  const { pathname } = useLocation()
  return (
    <>
      <ImpersonationBar />
      {/* The red bar is fixed; --imp-bar offsets the layout (and the sticky sidebar / top bar) below it. */}
      <div
        className="min-h-screen md:flex bg-base"
        // Admin forms/actions (no per-control read-only flag there) are greyed out as a whole; the API refuses the writes anyway.
        data-view-as-admin={impersonation && pathname.includes('/admin') ? '' : undefined}
        style={{ '--imp-bar': impersonation ? IMPERSONATION_BAR_HEIGHT : '0px', paddingTop: 'var(--imp-bar)' } as React.CSSProperties}
      >
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
