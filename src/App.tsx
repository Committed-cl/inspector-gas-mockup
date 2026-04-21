import { Navigate, Route, Routes } from 'react-router-dom'
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
