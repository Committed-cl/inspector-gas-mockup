// Real Metrogas checklist — matriz interior commissioning ("Puesta en Servicio").
// Transcribed from docs/checklist-matriz-interior.md (source: meet-2026-07-24/Check List V2.xlsx).
// Excludes "Prueba Hermeticidad redes PE" (out of scope) and the items flagged as
// duplicates / "do not consider" in the 2026-07-24 meeting.

export type ChecklistStatus = 'ok' | 'warn' | 'pending' | 'na'

export type ChatRole = 'inspector' | 'ai'
export type EvidenceType = 'text' | 'photo' | 'audio'

export type ChatMessage = {
  id: string
  role: ChatRole
  text: string
  type?: EvidenceType
  time: string
  // Present on an "ai" message that couldn't confidently match an item —
  // clickable suggestions so the inspector doesn't have to type the item
  // name. Cleared once one of them is picked.
  options?: { itemId: string; title: string }[]
  // The evidence (text + type) waiting to be filed once an option is picked.
  pendingEvidence?: { text: string; type: EvidenceType }
}

export type Evidence = {
  id: string
  type: EvidenceType
  source: 'item-chat' | 'general-chat' | 'manual' | 'manual-mark'
  text: string
  time: string
  // Only present on the manual-mark entry — records what that action produced,
  // so its dot in the evidence list is colored accordingly (green/amber/red/
  // gray) instead of always green. This entry is replaced on every click, it
  // never accumulates as history.
  result?: ChecklistStatus
  // Which requiredEvidence field (by index) this entry belongs to. Absent on
  // manual-mark entries, which never fulfill a field.
  requirementIndex?: number
  // Thumbnail of the attached file (object URL), only for "photo" evidence
  // uploaded through a real file picker.
  previewUrl?: string
}

export type ItemState = {
  status: ChecklistStatus
  source: 'manual' | 'chat' | null
  notApplicableReason?: string
  evidence: Evidence[]
  chat: ChatMessage[]
}

// Each item demands one or more concrete evidence fields, not a single generic
// checkbox — "photo" specifically requires a photo; "declaration" is satisfied
// by any evidence (text, audio, or photo).
export type RequiredEvidence = { label: string; type: 'photo' | 'declaration' }

export type ChecklistItemDef = {
  id: string
  section: string
  title: string
  appValidates: string[]
  regulatoryCriteria: string
  requiredEvidence: RequiredEvidence[]
  allowsNotApplicable?: boolean
  keywords: string[]
}

export const SECTIONS = [
  'Pruebas',
  'Matriz Soterrada',
  'Matriz a la Vista',
  'Señalética',
  'Vigón o Zócalo Falso',
  'Shaft / Nicho Medidores',
  'Certificados',
  'Conducto Técnico',
] as const

export const inspector = {
  name: 'Rodrigo Martínez',
  role: 'Gestor Interior Obra',
}

export const formName = 'Formulario Puesta en Servicio Matriz Interior'

// The only project shipped with pre-loaded demo progress (declarations, evidence,
// chat). Every other project starts with a blank checklist.
export const demoProjectId = 'los-tres-antonios'

// A project ("obra") can have several visits over time; each visit has its own
// checklist. Only one visit per project should be "en_curso" at a time — past
// visits are closed with a final verdict (aprobada / rechazada).
export type VisitStatus = 'en_curso' | 'aprobada' | 'rechazada'

export type Visit = {
  id: string
  date: string
  status: VisitStatus
  reportSentAt?: string
}

// The demo project's pre-loaded checklist progress lives on this visit — the
// one currently "en_curso" for that project.
export const demoVisitId = 'visita-3'

const seedVisitsByProject: Record<string, Visit[]> = {
  [demoProjectId]: [
    { id: 'visita-1', date: '2026-03-12', status: 'aprobada' },
    { id: 'visita-2', date: '2026-03-28', status: 'rechazada' },
    { id: demoVisitId, date: '2026-08-24', status: 'en_curso' },
  ],
}

export function initialVisitsForProject(projectId: string): Visit[] {
  return seedVisitsByProject[projectId] ? [...seedVisitsByProject[projectId]] : []
}

export const checklistDef: ChecklistItemDef[] = [
  // Pruebas
  {
    id: 'prueba-hermeticidad-matriz',
    section: 'Pruebas',
    title: 'Prueba Hermeticidad Matriz',
    appValidates: [
      'Que se haya hecho la prueba de hermeticidad.',
      'Foto del formulario firmado.',
      'Validar tiempo y presión de la prueba.',
      'No puede quedar pendiente — es previo a la dada de gas definitivo.',
    ],
    regulatoryCriteria:
      'DS N°66/2007, Art. 78.3.5 — presión mínima 1,5× la de servicio, caída de presión ≤1 kPa, duración = volumen (m³) × 214 (mín. 15 min).',
    requiredEvidence: [
      { label: 'Foto del formulario firmado', type: 'photo' },
      { label: 'Tiempo de la prueba', type: 'declaration' },
      { label: 'Presión registrada', type: 'declaration' },
    ],
    keywords: ['hermeticidad matriz', 'prueba de hermeticidad'],
  },
  {
    id: 'prueba-hermeticidad-interior',
    section: 'Pruebas',
    title: 'Prueba Hermeticidad Interior',
    appValidates: ['El supervisor declara si la red interior quedó hermética tras la prueba realizada.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.5 — mismo procedimiento que la matriz, aplicado a la red interior.',
    requiredEvidence: [{ label: 'Declaración de hermeticidad de la red interior', type: 'declaration' }],
    keywords: ['hermeticidad interior', 'red interior hermética'],
  },
  {
    id: 'prueba-limpieza',
    section: 'Pruebas',
    title: 'Prueba de Limpieza',
    appValidates: [
      'Validar que se realizó la limpieza.',
      'Que exista formulario firmado por quien la hizo.',
      'Foto del formulario.',
    ],
    regulatoryCriteria: 'DS N°66/2007, Art. 103.1.1 — barridos con aire comprimido hasta comprobar ausencia de óxidos y partículas.',
    requiredEvidence: [{ label: 'Foto del formulario firmado', type: 'photo' }],
    keywords: ['prueba de limpieza', 'limpieza interior', 'barrido'],
  },
  {
    id: 'prueba-resistencia-matriz',
    section: 'Pruebas',
    title: 'Prueba Resistencia Matriz',
    appValidates: [
      'Prueba de resistencia mecánica: tiempo aplicado.',
      'Presión usada.',
      'Cumple / no cumple.',
      'Foto del documento firmado.',
    ],
    regulatoryCriteria:
      'Sin norma específica de ensayo de campo — DS N°66/2007 Art. 102.2.3 solo exige certificación de fábrica de la tubería.',
    requiredEvidence: [
      { label: 'Foto del documento firmado', type: 'photo' },
      { label: 'Tiempo aplicado', type: 'declaration' },
      { label: 'Presión usada', type: 'declaration' },
    ],
    keywords: ['resistencia matriz', 'prueba de resistencia'],
  },
  {
    id: 'atravieso-muro-sello',
    section: 'Pruebas',
    title: 'Atravieso muro externo: sello anular entre tubería de gas y camisa de protección',
    appValidates: ['Revisar todos los puntos donde la matriz atraviesa la línea de edificación desde el exterior.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.5 y 46.2.6 — espacio anular sellado contra ingreso de gas/agua y corrosión.',
    requiredEvidence: [{ label: 'Confirmación de revisión en todos los puntos de atravieso', type: 'declaration' }],
    keywords: ['sello anular', 'atravieso muro', 'camisa de protección'],
  },

  // Matriz Soterrada
  {
    id: 'profundidad-61cm',
    section: 'Matriz Soterrada',
    title: 'Profundidad a la clave de la tubería de 61 cm',
    appValidates: [
      'Aplica a tránsito peatonal o sin tránsito.',
      'Requiere foto obligatoria — no se da por cumplido sin foto cargada.',
    ],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.2.c — cubierta mínima 60 cm sobre la tubería enterrada.',
    requiredEvidence: [{ label: 'Foto de la profundidad medida', type: 'photo' }],
    keywords: ['profundidad', '61 cm', 'clave de la tubería'],
  },
  {
    id: 'profundidad-80cm-jardines',
    section: 'Matriz Soterrada',
    title: 'En jardines y tránsito vehicular, profundidad a la clave de la tubería de 80 cm',
    appValidates: ['Aplica a jardines o tránsito vehicular.', 'Misma exigencia de foto obligatoria.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.2.c — bajo calles con circulación vehicular, cubierta mínima 80 cm.',
    requiredEvidence: [{ label: 'Foto de la profundidad medida', type: 'photo' }],
    allowsNotApplicable: true,
    keywords: ['80 cm', 'jardines', 'tránsito vehicular'],
  },
  {
    id: 'distancia-edificaciones-1m',
    section: 'Matriz Soterrada',
    title: 'Distancia a edificaciones: 1 m',
    appValidates: ['Si la matriz va a menos de 1 m del muro/perímetro del edificio, declarar qué medidas de mitigación se aplicaron.'],
    regulatoryCriteria: 'Sin norma específica encontrada para esta distancia en el trazado de la matriz.',
    requiredEvidence: [{ label: 'Declaración de distancia o medidas de mitigación', type: 'declaration' }],
    keywords: ['distancia a edificaciones', '1 metro'],
  },
  {
    id: 'distancia-agua-potable-50cm',
    section: 'Matriz Soterrada',
    title: 'Distancia a redes de agua potable 50 cm',
    appValidates: ['Solo registrar cumple / no cumple / no sabe.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.1.c.1 — separación mínima 50 cm en cruces con tuberías de otros servicios.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['agua potable', '50 cm'],
  },
  {
    id: 'distancia-15cm-otras-estructuras',
    section: 'Matriz Soterrada',
    title: 'Distancia de 15 cm a cualquier otra estructura o servicio subterráneo (telecomunicaciones, cámaras, postes, etc.)',
    appValidates: ['Solo registrar cumple / no cumple / no sabe.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.1.a — exige "espacio libre suficiente" sin cuantificar 15 cm.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['15 cm', 'telecomunicaciones', 'cámaras subterráneas', 'postes'],
  },
  {
    id: 'distancia-50cm-electricas-soterradas',
    section: 'Matriz Soterrada',
    title: 'Distancia de 50 cm con cruces de líneas eléctricas soterradas',
    appValidates: ['Solo registrar cumple / no cumple / no sabe.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.2.a.2 — ≥50 cm de conductores aislados enterrados >400 V.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['líneas eléctricas soterradas', 'cruces eléctricos'],
  },
  {
    id: 'distancia-50cm-cruce-conductores',
    section: 'Matriz Soterrada',
    title: 'Distancia de 50 cm a cruce de conductores eléctricos',
    appValidates: ['Solo registrar cumple / no cumple / no sabe.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.1.c.1 y Art. 78.3.2.a — 30 a 60 cm según aislación y voltaje.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['cruce de conductores', 'conductores eléctricos'],
  },
  {
    id: 'distancia-30cm-conductores-paralelos',
    section: 'Matriz Soterrada',
    title: 'Distancia de 30 cm a conductores eléctricos paralelos',
    appValidates: ['Solo registrar cumple / no cumple / no sabe.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.2.a.2 — ≥30 cm de conductores aislados enterrados entre 25–400 V.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['conductores paralelos', '30 cm'],
  },

  // Matriz a la Vista
  {
    id: 'matriz-vista-registrable',
    section: 'Matriz a la Vista',
    title: 'Matriz a la vista y/o registrable en toda su longitud',
    appValidates: ['Cumple o no cumple.', 'Las partes que no van a la vista deben ser registrables.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.3.b — tuberías exteriores visibles y accesibles en toda su extensión.',
    requiredEvidence: [{ label: 'Declaración de que la matriz está a la vista o es registrable', type: 'declaration' }],
    keywords: ['a la vista', 'registrable en toda'],
  },
  {
    id: 'matriz-pintada',
    section: 'Matriz a la Vista',
    title: 'Matriz Pintada',
    appValidates: ['Cumple o no cumple estar pintada de amarillo.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.3.e.1.ii — dos capas de pintura (primer epóxico + esmalte epóxico), color amarillo.',
    requiredEvidence: [{ label: 'Declaración o foto de la pintura amarilla', type: 'declaration' }],
    keywords: ['pintada', 'pintura amarilla'],
  },
  {
    id: 'proteccion-dano-mecanico',
    section: 'Matriz a la Vista',
    title: 'Instalación Protección contra Daño Mecánico',
    appValidates: ['En zonas de tránsito, la matriz a la vista debe tener protección hasta 1,8 m de altura.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.3.b.1 — defensas/barandas/barreras si hay riesgo de golpe de vehículos o maquinaria.',
    requiredEvidence: [{ label: 'Declaración de protección instalada donde corresponde', type: 'declaration' }],
    keywords: ['daño mecánico', 'protección mecánica'],
  },
  {
    id: 'soportes-aislacion',
    section: 'Matriz a la Vista',
    title: 'Soportes Matriz con aislación',
    appValidates: [
      'La matriz de cobre sobre soporte metálico debe llevar aislación (PVC o similar).',
      'Preguntar explícitamente si se revisaron TODOS los soportes.',
    ],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.3.b.2.vii y Art. 47 — aislación de soportes/estructuras metálicas.',
    requiredEvidence: [{ label: 'Confirmación de que se revisaron todos los soportes', type: 'declaration' }],
    keywords: ['soportes', 'aislación'],
  },
  {
    id: 'llave-corte-general',
    section: 'Matriz a la Vista',
    title: 'Llave de Corte General h:1,8 m',
    appValidates: ['Cumple o no cumple.', 'Admite "No aplica" cuando el proyecto no la requiere o está en el módulo.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 52.4 — válvula de corte con accesibilidad Grado 1 (Art. 10.2.1).',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['llave de corte', 'corte general'],
  },
  {
    id: 'distancia-lineas-conductores',
    section: 'Matriz a la Vista',
    title: 'Distancia a líneas y conductores eléctricos',
    appValidates: ['Validar medidas de mitigación cuando no se cumple la distancia, en cruces o en tramos paralelos.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 78.3.2.b — 15 cm a 5 m según aislación y voltaje del conductor.',
    requiredEvidence: [{ label: 'Declaración de distancia o medidas de mitigación', type: 'declaration' }],
    keywords: ['líneas eléctricas', 'conductores eléctricos'],
  },

  // Señalética
  {
    id: 'cinta-advertencia',
    section: 'Señalética',
    title: 'Cinta de advertencia en matriz enterrada',
    appValidates: ['Cumple / no cumple + foto.', 'Si no hay tramo soterrado, declarar "no aplica".'],
    regulatoryCriteria: 'DS N°66/2007, Art. 46.2.2.d — cinta amarilla con leyenda "GAS", a ≥25 cm sobre la tubería enterrada.',
    requiredEvidence: [{ label: 'Foto de la cinta instalada', type: 'photo' }],
    allowsNotApplicable: true,
    keywords: ['cinta de advertencia', 'cinta amarilla'],
  },
  {
    id: 'llaves-sectorizacion',
    section: 'Señalética',
    title: 'Llaves de Sectorización con Señalética',
    appValidates: ['Declarar explícitamente si están todas, si falta alguna, o si no existen llaves de sectorización.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 52.3.1 — válvulas de sistemas múltiples identificadas con placa permanente.',
    requiredEvidence: [{ label: 'Declaración de estado de las llaves de sectorización', type: 'declaration' }],
    keywords: ['llaves de sectorización', 'sectorización'],
  },
  {
    id: 'leyenda-gas-flecha',
    section: 'Señalética',
    title: 'Leyenda Gas Natural y Flecha Flujo (1 por recinto subterráneo)',
    appValidates: ['Cumple / no cumple.', 'Al menos una señalética en toda la matriz.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 60.2.b — señalizar el tipo de gas en gabinetes/nichos/conductos técnicos.',
    requiredEvidence: [{ label: 'Declaración o foto de la señalética', type: 'declaration' }],
    keywords: ['leyenda gas natural', 'flecha de flujo'],
  },

  // Vigón o Zócalo Falso
  {
    id: 'vigon-zocalo-falso',
    section: 'Vigón o Zócalo Falso',
    title: 'Exclusivo, Incombustible, Registrable en toda su extensión, señalética en puerta del recinto',
    appValidates: ['Si existe vigón o zócalo falso, confirmar que cumple estas características.', 'Admite "No aplica".'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.1.a, 59.2.3.a y 59.2.4.a — uso exclusivo, no combustible, resistencia al fuego F60/F90/F120.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento de las características exigidas', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['vigón', 'zócalo falso'],
  },

  // Shaft / Nicho Medidores
  {
    id: 'manifold-pintado',
    section: 'Shaft / Nicho Medidores',
    title: 'Manifold Pintado',
    appValidates: ['Cumple o no cumple.'],
    regulatoryCriteria: 'Sin norma específica encontrada para el pintado del manifold.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['manifold'],
  },
  {
    id: 'ventilacion-inf-sup',
    section: 'Shaft / Nicho Medidores',
    title: 'Ventilación Inferior y superior (según proyecto)',
    appValidates: ['Cumple o no cumple.', 'Debe tener instalado el sistema de ventilación definido en el proyecto.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.2 y Tablas XIV/XV — ventilación directa superior e inferior.',
    requiredEvidence: [{ label: 'Declaración de ventilación instalada', type: 'declaration' }],
    keywords: ['ventilación inferior', 'ventilación superior'],
  },
  {
    id: 'medidor-marcado',
    section: 'Shaft / Nicho Medidores',
    title: 'Medidor Marcado',
    appValidates: ['Cumple o no cumple.', 'Debe indicar el número de depto./local al que abastece.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 60.1 — medidores identificados con el número municipal correspondiente.',
    requiredEvidence: [{ label: 'Declaración o foto de la marcación del medidor', type: 'declaration' }],
    keywords: ['medidor marcado'],
  },
  {
    id: 'proteccion-rejilla',
    section: 'Shaft / Nicho Medidores',
    title: 'Protección Rejilla caída medidor (solo si aplica)',
    appValidates: ['Cumple / no cumple / no aplica.', 'Requerida si la apertura en la losa supera el tamaño que exige rejilla.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.4.b — reja desmontable que soporte ≥200 kgf si la superficie libre supera 400 cm².',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['rejilla', 'caída medidor'],
  },
  {
    id: 'baston-marcado',
    section: 'Shaft / Nicho Medidores',
    title: 'Bastón Red Interior marcado con número de cada departamento',
    appValidates: ['El bastón (salida del medidor a la red interior) debe estar marcado con el número de local/depto.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 60.1 — misma exigencia de rotulación que el medidor.',
    requiredEvidence: [{ label: 'Declaración o foto de la marcación del bastón', type: 'declaration' }],
    keywords: ['bastón'],
  },
  {
    id: 'burlete-brazo-hidraulico',
    section: 'Shaft / Nicho Medidores',
    title: 'Burlete goma y brazo Hidráulico (cierre forzado)',
    appValidates: ['Cumple o no cumple.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.1.b — puerta batiente con burlete y cierre forzado (brazo mecánico o hidráulico) + cerradura.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    keywords: ['burlete', 'brazo hidráulico', 'cierre forzado'],
  },

  // Certificados
  {
    id: 'certificado-tc3',
    section: 'Certificados',
    title: 'Certificado TC3',
    appValidates: [
      'Lo tiene o no lo tiene (otorgado por la SEC).',
      'Cubre además Certificado de Materiales, calificación de soldadores y plano as-built.',
    ],
    regulatoryCriteria: 'Certificado SEC — no se solicitan como ítems individuales aparte del TC3.',
    requiredEvidence: [{ label: 'Certificado TC3', type: 'declaration' }],
    keywords: ['tc3', 'certificado tc3'],
  },

  // Conducto Técnico
  {
    id: 'conducto-vertical-continuo',
    section: 'Conducto Técnico',
    title: 'Vertical, continuo y sin quiebres',
    appValidates: ['Cumple o no cumple.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.4.a — vertical, rectilíneo, resistencia al fuego F60/F90/F120 según NCh935/1.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['conducto técnico', 'sin quiebres'],
  },
  {
    id: 'conducto-ventilacion-100cm2',
    section: 'Conducto Técnico',
    title: 'Ventilación (tiro) 100 cm² mínimo',
    appValidates: ['Cumple / no cumple / no aplica (si no hay conducto técnico).', 'Ventilación inferior por donde se toma el aire.'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.4.b — superficie libre mínima 100 cm² al atravesar la losa de cada piso.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['tiro', '100 cm2', 'ventilación inferior conducto'],
  },
  {
    id: 'conducto-sombrerete',
    section: 'Conducto Técnico',
    title: 'Ventilación Sombrerete Aspirador Estacionario',
    appValidates: ['Cumple / no cumple / no aplica (si no hay conducto técnico).', 'Debe salir "a los cuatro vientos".'],
    regulatoryCriteria: 'DS N°66/2007, Art. 59.2.4.c — sombrerete tipo aspirador estacionario, protegido de lluvia/insectos/pájaros.',
    requiredEvidence: [{ label: 'Declaración de cumplimiento', type: 'declaration' }],
    allowsNotApplicable: true,
    keywords: ['sombrerete', 'aspirador estacionario'],
  },
]

function makeEvidence(
  id: string,
  type: EvidenceType,
  source: Evidence['source'],
  text: string,
  time: string,
  requirementIndex = 0,
): Evidence {
  return { id, type, source, text, time, requirementIndex }
}

function makeMessage(id: string, role: ChatRole, text: string, time: string, type?: EvidenceType): ChatMessage {
  return { id, role, text, time, type }
}

const initialGeneralChatLosTresAntonios: ChatMessage[] = [
  makeMessage('g1', 'inspector', 'La matriz está pintada de amarillo y a la vista en todo su trayecto.', '14:12'),
  makeMessage(
    'g2',
    'ai',
    'Marqué "Matriz Pintada" y "Matriz a la vista y/o registrable en toda su longitud" como cumplidos con tu declaración.',
    '14:12',
  ),
]

export function emptyChecklistState(): Record<string, ItemState> {
  return Object.fromEntries(
    checklistDef.map((def) => [def.id, { status: 'pending' as ChecklistStatus, source: null, evidence: [], chat: [] }]),
  )
}

const initialStateLosTresAntonios: Record<string, ItemState> = emptyChecklistState()

function setState(id: string, patch: Partial<ItemState>) {
  initialStateLosTresAntonios[id] = { ...initialStateLosTresAntonios[id], ...patch }
}

// Starting state for the demo — a realistic mix of green/amber/red/not-applicable.
// Every green item carries at least one piece of evidence — an item can't be
// marked done without it.
setState('atravieso-muro-sello', {
  status: 'ok',
  source: 'chat',
  evidence: [makeEvidence('e-ams-1', 'text', 'item-chat', 'Revisé todos los puntos de atravieso, todos con sello anular correcto.', '13:35')],
})
setState('distancia-edificaciones-1m', {
  status: 'ok',
  source: 'manual',
  evidence: [makeEvidence('e-de1m-1', 'text', 'manual', 'La matriz pasa a más de 1 m de la edificación en todo su trazado.', '13:20')],
})
setState('distancia-agua-potable-50cm', {
  status: 'ok',
  source: 'manual',
  evidence: [makeEvidence('e-dap-1', 'text', 'manual', 'Cumple la separación de 50 cm respecto de la red de agua potable.', '13:21')],
})
setState('leyenda-gas-flecha', {
  status: 'ok',
  source: 'manual',
  evidence: [makeEvidence('e-lgf-1', 'text', 'manual', 'Señalética de gas natural con flecha de flujo presente en el recinto.', '13:58')],
})
setState('ventilacion-inf-sup', {
  status: 'ok',
  source: 'manual',
  evidence: [makeEvidence('e-vis-1', 'text', 'manual', 'Ventilación inferior y superior instalada según lo definido en el proyecto.', '14:02')],
})
setState('medidor-marcado', {
  status: 'ok',
  source: 'manual',
  evidence: [makeEvidence('e-mm-1', 'text', 'manual', 'Cada medidor tiene el número de departamento correspondiente marcado.', '14:03')],
})

setState('matriz-vista-registrable', {
  status: 'ok',
  source: 'chat',
  evidence: [makeEvidence('e-mvr-1', 'text', 'general-chat', 'La matriz está pintada de amarillo y a la vista en todo su trayecto.', '14:12')],
})
setState('matriz-pintada', {
  status: 'ok',
  source: 'chat',
  evidence: [makeEvidence('e-mp-1', 'text', 'general-chat', 'La matriz está pintada de amarillo y a la vista en todo su trayecto.', '14:12')],
})

setState('prueba-hermeticidad-matriz', {
  status: 'warn',
  source: 'chat',
  evidence: [
    makeEvidence('e-phm-1', 'text', 'item-chat', 'La prueba duró 25 minutos.', '13:40', 1),
    makeEvidence('e-phm-2', 'text', 'item-chat', 'Se probó a 180 kPa, dentro del rango exigido.', '13:40', 2),
  ],
  chat: [
    makeMessage('phm-1', 'inspector', 'Se hizo la prueba de hermeticidad, quedó conforme.', '13:40'),
    makeMessage(
      'phm-2',
      'ai',
      'Para dar este ítem por cumplido necesito la foto del formulario firmado con tiempo y presión de la prueba — la norma exige caída de presión ≤1 kPa. ¿Puedes subir la foto?',
      '13:40',
    ),
  ],
})

setState('profundidad-61cm', {
  status: 'warn',
  source: 'chat',
  evidence: [makeEvidence('e-p61-1', 'text', 'item-chat', 'La matriz va enterrada, calculo que está como a 50 centímetros.', '13:55')],
  chat: [
    makeMessage('p61-1', 'inspector', 'La matriz va enterrada, calculo que está como a 50 centímetros.', '13:55'),
    makeMessage(
      'p61-2',
      'ai',
      'Para dar este ítem por cumplido necesito una foto que muestre la profundidad medida — la norma exige mínimo 60 cm y tu declaración no lo confirma. ¿Puedes subir una foto de la cinta métrica junto a la tubería?',
      '13:55',
    ),
  ],
})

setState('soportes-aislacion', {
  status: 'warn',
  source: 'chat',
  evidence: [makeEvidence('e-sa-1', 'text', 'item-chat', 'Los soportes que alcancé a ver tenían aislación de PVC.', '14:20')],
  chat: [
    makeMessage('sa-1', 'inspector', 'Los soportes que alcancé a ver tenían aislación de PVC.', '14:20'),
    makeMessage(
      'sa-2',
      'ai',
      '¿Revisaste todos los soportes de la matriz o solo algunos? Este ítem requiere confirmar el 100%, porque suele faltar aislación en uno o dos puntos.',
      '14:20',
    ),
  ],
})

setState('profundidad-80cm-jardines', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'No hay tramo bajo jardines ni con tránsito vehicular en este proyecto.',
})
setState('llave-corte-general', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'La llave de corte general está en el módulo, no aplica instalación independiente.',
})
setState('vigon-zocalo-falso', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'El proyecto no tiene vigón ni zócalo falso.',
})
setState('proteccion-rejilla', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'La apertura en la losa del nicho de medidores no supera el tamaño que exige rejilla.',
})
setState('conducto-vertical-continuo', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'El proyecto no tiene conducto técnico — los medidores están en primer piso.',
})
setState('conducto-ventilacion-100cm2', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'No aplica — no hay conducto técnico en este proyecto.',
})
setState('conducto-sombrerete', {
  status: 'na',
  source: 'manual',
  notApplicableReason: 'No aplica — no hay conducto técnico en este proyecto.',
})

export function matchItemsByKeyword(text: string): ChecklistItemDef[] {
  const lower = text.toLowerCase()
  return checklistDef.filter((def) => def.keywords.some((k) => lower.includes(k)))
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'a', 'que', 'se', 'con', 'por', 'un', 'una',
  'al', 'lo', 'su', 'sus', 'esta', 'esta', 'fue', 'ya', 'no', 'si', 'muy', 'mas', 'para', 'foto',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

// Used when a keyword match fails outright. First tries a loose lexical
// overlap against each item's title/section/keywords; if that also comes up
// empty, falls back to the items still open — the ones with partial evidence
// already logged (amber) are more likely candidates than untouched ones.
export function suggestItemsForText(
  text: string,
  itemsState: Record<string, ItemState>,
  limit = 4,
): ChecklistItemDef[] {
  const tokens = tokenize(text)
  const scored = checklistDef
    .map((def) => {
      const haystack = tokenize([def.title, def.section, ...def.keywords].join(' '))
      const score = tokens.filter((t) => haystack.some((h) => h.includes(t) || t.includes(h))).length
      return { def, score }
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  if (scored.length > 0) return scored.slice(0, limit).map((s) => s.def)

  const open = checklistDef.filter((def) => !['ok', 'na'].includes(itemsState[def.id].status))
  const byRelevance = [...open].sort((a, b) => {
    const rank = (id: string) => (itemsState[id].status === 'warn' ? 0 : 1)
    return rank(a.id) - rank(b.id)
  })
  return byRelevance.slice(0, limit)
}

export function itemRequiresPhoto(def: ChecklistItemDef): boolean {
  return def.requiredEvidence.some((r) => r.type === 'photo')
}

export type RequirementState = RequiredEvidence & { fulfilled: boolean; evidence?: Evidence }

// Each required field has its own slot for evidence — identified by its
// position in requiredEvidence (requirementIndex). A "photo" field is only
// considered fulfilled if the matched evidence is actually a photo — text at
// that index doesn't satisfy it. The manual-mark entry itself (source
// "manual-mark") never fulfills a field, or a single click would justify itself.
export function requiredEvidenceState(def: ChecklistItemDef, evidence: Evidence[]): RequirementState[] {
  return def.requiredEvidence.map((req, i) => {
    const matched = evidence.find(
      (e) => e.source !== 'manual-mark' && e.requirementIndex === i && (req.type !== 'photo' || e.type === 'photo'),
    )
    return { ...req, fulfilled: !!matched, evidence: matched }
  })
}

// For evidence arriving via chat (without the inspector picking which field it
// belongs to): a photo can fulfill a photo field or, failing that, any pending
// declaration field. Text or audio can only fulfill a declaration field —
// never one that specifically requires a photo.
export function nextPendingRequirement(
  def: ChecklistItemDef,
  existingEvidence: Evidence[],
  preferredType: EvidenceType,
): number | undefined {
  const states = requiredEvidenceState(def, existingEvidence)
  if (preferredType === 'photo') {
    const pendingPhoto = states.findIndex((r) => !r.fulfilled && r.type === 'photo')
    if (pendingPhoto !== -1) return pendingPhoto
    const anyPending = states.findIndex((r) => !r.fulfilled)
    return anyPending !== -1 ? anyPending : undefined
  }
  const pendingDeclaration = states.findIndex((r) => !r.fulfilled && r.type === 'declaration')
  return pendingDeclaration !== -1 ? pendingDeclaration : undefined
}

// An item can only go green if ALL of its required evidence fields are
// fulfilled. The "Cumple" button by itself is never enough.
export function hasSufficientEvidence(def: ChecklistItemDef, evidence: Evidence[]): boolean {
  return requiredEvidenceState(def, evidence).every((r) => r.fulfilled)
}

export function missingEvidenceHint(def: ChecklistItemDef, evidence: Evidence[]): string | undefined {
  const missing = requiredEvidenceState(def, evidence).filter((r) => !r.fulfilled)
  if (missing.length === 0) return undefined
  return `Falta ${missing.map((r) => r.label.toLowerCase()).join(', ')} para quedar en verde.`
}

export function initialStateForVisit(projectId: string, visitId: string): Record<string, ItemState> {
  return projectId === demoProjectId && visitId === demoVisitId ? initialStateLosTresAntonios : emptyChecklistState()
}

export function initialGeneralChatForVisit(projectId: string, visitId: string): ChatMessage[] {
  return projectId === demoProjectId && visitId === demoVisitId ? initialGeneralChatLosTresAntonios : []
}

// Free-form notes the inspector adds at the end of the visit — appended to the
// end of the report, separate from the per-item evidence trail.
export function initialObservationsForVisit(projectId: string, visitId: string): string {
  return projectId === demoProjectId && visitId === demoVisitId
    ? '<p>Visita en buen estado general. <b>Pendiente</b>: confirmar aislación en todos los soportes y cargar foto de la profundidad de la matriz soterrada.</p>'
    : ''
}

export function completedForState(state: Record<string, ItemState>): { completed: number; total: number } {
  const completed = checklistDef.filter((d) => ['ok', 'na'].includes(state[d.id].status)).length
  return { completed, total: checklistDef.length }
}
