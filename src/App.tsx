import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Proyectos from './pages/Proyectos'
import ProyectoDetalle from './pages/ProyectoDetalle'
import VisitaNueva from './pages/VisitaNueva'
import VisitaEnCurso from './pages/VisitaEnCurso'
import VisitaRevisar from './pages/VisitaRevisar'
import VisitaEnviado from './pages/VisitaEnviado'
import AdminEtapas from './pages/AdminEtapas'
import AdminItemDetalle from './pages/AdminItemDetalle'
import AdminDashboard from './pages/AdminDashboard'
import AdminEmpresas from './pages/AdminEmpresas'
import AdminClientes from './pages/AdminClientes'
import AdminUsuarios from './pages/AdminUsuarios'
import ChecklistProjects from './pages/ChecklistProjects'
import ChecklistNuevaObra from './pages/ChecklistNuevaObra'
import ObraVisitas from './pages/ObraVisitas'
import ChecklistProject from './pages/ChecklistProject'
import ChecklistItemPage from './pages/ChecklistItemPage'
import { ChecklistLayout } from './state/ChecklistContext'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />
      <Route path="/proyectos" element={<Proyectos />} />
      <Route path="/proyectos/:id" element={<ProyectoDetalle />} />
      <Route path="/visita/nueva" element={<VisitaNueva />} />
      <Route path="/visita/en-curso" element={<VisitaEnCurso />} />
      <Route path="/visita/revisar" element={<VisitaRevisar />} />
      <Route path="/visita/enviado" element={<VisitaEnviado />} />
      <Route path="/admin/etapas" element={<AdminEtapas />} />
      <Route path="/admin/items/:id" element={<AdminItemDetalle />} />
      <Route
        element={
          <RequireAdmin>
            <Outlet />
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/empresas" element={<AdminEmpresas />} />
        <Route path="/admin/clientes" element={<AdminClientes />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
      </Route>
      <Route
        element={
          <RequireAuth>
            <ChecklistLayout />
          </RequireAuth>
        }
      >
        <Route path="/checklist" element={<ChecklistProjects />} />
        <Route
          path="/checklist/nueva-obra"
          element={
            <RequireAdmin>
              <ChecklistNuevaObra />
            </RequireAdmin>
          }
        />
        <Route path="/checklist/:projectId" element={<ObraVisitas />} />
        <Route path="/checklist/:projectId/:visitId" element={<ChecklistProject />} />
        <Route path="/checklist/:projectId/:visitId/:itemId" element={<ChecklistItemPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
