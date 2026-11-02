import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminEmpresas from './pages/AdminEmpresas'
import AdminMiEmpresa from './pages/AdminMiEmpresa'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminInformes from './pages/AdminInformes'
import AdminIaConfig from './pages/AdminIaConfig'
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
      <Route path="/" element={<Navigate to="/checklist" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAdmin>
            <Outlet />
          </RequireAdmin>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route
          path="/admin/empresas"
          element={
            <RequireAdmin globalOnly>
              <AdminEmpresas />
            </RequireAdmin>
          }
        />
        <Route path="/admin/mi-empresa" element={<AdminMiEmpresa />} />
        <Route path="/admin/usuarios" element={<AdminUsuarios />} />
        <Route path="/admin/informes" element={<AdminInformes />} />
        <Route
          path="/admin/ia"
          element={
            <RequireAdmin globalOnly>
              <AdminIaConfig />
            </RequireAdmin>
          }
        />
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
      <Route path="*" element={<Navigate to="/checklist" replace />} />
    </Routes>
  )
}
