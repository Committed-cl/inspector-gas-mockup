export type ItemStatus = 'ok' | 'warn' | 'pending'

export type ChecklistItem = {
  id: string
  title: string
  descriptor: string
  status: ItemStatus
  declared?: string
}

export type Proyecto = {
  id: string
  nombre: string
  direccion: string
  constructora: string
  instaladora: string
  pisos: number
  etapaNumero: number
  etapaNombre: string
  ultimaVisita: string
  visitasPrevias: { fecha: string; numero: number; descripcion: string; itemsOk: number; itemsTotal: number }[]
}

export const inspector = {
  nombre: 'Rodrigo Martínez',
  email: 'r.martinez@metrogas.cl',
  rol: 'Inspector Metrogas',
}

export const proyectos: Proyecto[] = [
  {
    id: 'los-tres-antonios',
    nombre: 'Los Tres Antonios',
    direccion: 'Av. Las Condes 5432, Puente Alto',
    constructora: 'Constructora Andes',
    instaladora: 'GasTec Chile',
    pisos: 12,
    etapaNumero: 1,
    etapaNombre: 'Tercera losa del piso 3',
    ultimaVisita: 'hace 2 días',
    visitasPrevias: [
      { fecha: '2026-04-10', numero: 3, descripcion: 'Piso 2 — Red de media presión parcial', itemsOk: 6, itemsTotal: 6 },
      { fecha: '2026-03-28', numero: 2, descripcion: 'Primera losa — Fundaciones completas', itemsOk: 5, itemsTotal: 5 },
      { fecha: '2026-03-12', numero: 1, descripcion: 'Fundaciones — Apertura de obra', itemsOk: 4, itemsTotal: 4 },
    ],
  },
  {
    id: 'altos-nunoa',
    nombre: 'Condominio Altos de Ñuñoa',
    direccion: 'José Domingo Cañas 2210, Ñuñoa',
    constructora: 'Inmobiliaria Norte',
    instaladora: 'Instaladora Centro',
    pisos: 8,
    etapaNumero: 2,
    etapaNombre: 'Red de media presión',
    ultimaVisita: 'hace 1 semana',
    visitasPrevias: [],
  },
  {
    id: 'nueva-providencia',
    nombre: 'Edificio Nueva Providencia',
    direccion: 'Av. Providencia 1845, Providencia',
    constructora: 'Armas',
    instaladora: 'GasTec Chile',
    pisos: 18,
    etapaNumero: 4,
    etapaNombre: 'Pruebas de hermeticidad',
    ultimaVisita: 'hace 3 semanas',
    visitasPrevias: [],
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
