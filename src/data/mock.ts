export type ItemStatus = 'ok' | 'warn' | 'pending'

export type ChecklistItem = {
  id: string
  title: string
  descriptor: string
  status: ItemStatus
  declared?: string
}

export type Project = {
  id: string
  name: string
  address: string
  builder: string
  installer: string
  floors: number
  stageNumber: number
  stageName: string
  lastVisit: string
  previousVisits: { date: string; number: number; description: string; itemsDone: number; totalItems: number }[]
}

export const inspector = {
  nombre: 'Rodrigo Martínez',
  email: 'r.martinez@metrogas.cl',
  rol: 'Inspector Metrogas',
}

export const projects: Project[] = [
  {
    id: 'los-tres-antonios',
    name: 'Los Tres Antonios',
    address: 'Av. Las Condes 5432, Puente Alto',
    builder: 'Constructora Andes',
    installer: 'GasTec Chile',
    floors: 12,
    stageNumber: 1,
    stageName: 'Tercera losa del piso 3',
    lastVisit: 'hace 2 días',
    previousVisits: [
      { date: '2026-04-10', number: 3, description: 'Piso 2 — Red de media presión parcial', itemsDone: 6, totalItems: 6 },
      { date: '2026-03-28', number: 2, description: 'Primera losa — Fundaciones completas', itemsDone: 5, totalItems: 5 },
      { date: '2026-03-12', number: 1, description: 'Fundaciones — Apertura de obra', itemsDone: 4, totalItems: 4 },
    ],
  },
  {
    id: 'altos-nunoa',
    name: 'Condominio Altos de Ñuñoa',
    address: 'José Domingo Cañas 2210, Ñuñoa',
    builder: 'Inmobiliaria Norte',
    installer: 'Instaladora Centro',
    floors: 8,
    stageNumber: 2,
    stageName: 'Red de media presión',
    lastVisit: 'hace 1 semana',
    previousVisits: [],
  },
  {
    id: 'nueva-providencia',
    name: 'Edificio Nueva Providencia',
    address: 'Av. Providencia 1845, Providencia',
    builder: 'Armas',
    installer: 'GasTec Chile',
    floors: 18,
    stageNumber: 4,
    stageName: 'Pruebas de hermeticidad',
    lastVisit: 'hace 3 semanas',
    previousVisits: [],
  },
]

export const checklistLosTresAntoniosEtapa1: ChecklistItem[] = [
  {
    id: 'epp',
    title: 'EPP del personal',
    descriptor: 'Casco, guantes, zapato de seguridad, gorro',
    status: 'ok',
    declared: 'Todos con EPP salvo observación sobre el capataz sin gorro.',
  },
  {
    id: 'extintor',
    title: 'Extintor visible en camioneta del instalador',
    descriptor: 'DS N°66 art. 14',
    status: 'pending',
  },
  {
    id: 'andamios',
    title: 'Andamios amarrados a la estructura',
    descriptor: 'Anclaje correcto y sin puntos sueltos',
    status: 'ok',
    declared: 'Andamios correctamente anclados, verificados en terreno.',
  },
  {
    id: 'accesos',
    title: 'Accesos de obra señalizados',
    descriptor: 'Letreros y delimitación visibles',
    status: 'ok',
    declared: 'Señalización a la entrada y en escaleras conforme.',
  },
  {
    id: 'orden-camioneta',
    title: 'Orden en camioneta del instalador',
    descriptor: 'Riesgo de caída y manipulación',
    status: 'warn',
    declared: 'Vista desde la ventana, no pude abrirla — parece desordenada.',
  },
  {
    id: 'matriz-riesgo',
    title: 'Matriz de riesgo actualizada a esta etapa',
    descriptor: 'Norma interna Metrogas',
    status: 'pending',
  },
  {
    id: 'capacitacion',
    title: 'Capacitación de maestros al día',
    descriptor: 'Registro de cursos vigentes',
    status: 'pending',
  },
]

export const etapas = [
  { id: 'e1', numero: 1, nombre: 'Fundaciones y primera losa', items: 5, activa: true },
  { id: 'e2', numero: 2, nombre: 'Red de media presión', items: 8, activa: true },
  { id: 'e3', numero: 3, nombre: 'Red de baja presión', items: 7, activa: true },
  { id: 'e4', numero: 4, nombre: 'Pruebas de hermeticidad', items: 9, activa: true },
  { id: 'e5', numero: 5, nombre: 'Cierre y certificación', items: 6, activa: true },
]

export const itemDetalleExtintor = {
  id: 'extintor',
  titulo: 'Extintor visible en camioneta del instalador',
  descripcionNormativa:
    'La camioneta del instalador debe portar extintor de polvo químico seco de al menos 6 kg, visible, accesible y con carga vigente. Esta exigencia aplica a todas las etapas en que el instalador se encuentra en obra.',
  referencia: 'DS N°66 art. 14 · Reglamento interno Metrogas sección 3.2',
  ejemplosVerdes: [
    'El instalador tiene el extintor visible detrás del asiento del copiloto.',
    'Pasaron con la camioneta abierta, vi el extintor a la vista con carga al día.',
    'Revisé la camioneta y el extintor estaba en su soporte, con manómetro en verde.',
  ],
  ejemplosAmarillos: [
    'Creo que tenía extintor pero no lo pude ver directamente.',
    'El instalador dijo que tiene extintor pero no me mostró.',
  ],
  ejemplosRojos: [
    'No pude revisar la camioneta del instalador.',
    'El instalador no me pasó las llaves y no alcancé a ver si tenía extintor.',
  ],
}
