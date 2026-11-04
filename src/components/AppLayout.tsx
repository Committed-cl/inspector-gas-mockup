import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

// Shell shared by every authenticated screen (admin and checklist), so moving
// between the panel and the project list keeps the same structure and menu.
// Below md the container is a plain block: the Sidebar's slim top bar sits in
// the flow above the page and its drawer is off-canvas, so nothing is covered.
export default function AppLayout() {
  return (
    <div className="min-h-screen md:flex bg-base">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
