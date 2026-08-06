// Checklist real de Metrogas — Puesta en Servicio Matriz Interior.
// Transcrito de docs/checklist-matriz-interior.md (fuente: meet-2026-07-24/Check List V2.xlsx).
// Excluye "Prueba Hermeticidad redes PE" (fuera de alcance) y los ítems marcados
// como repetidos / "no considerar" en la reunión del 2026-07-24.

export type ChecklistStatus = 'ok' | 'warn' | 'pending' | 'na'

export type ChatRole = 'inspector' | 'ia'
export type EvidenciaTipo = 'texto' | 'foto' | 'audio'

export type ChatMessage = {
  id: string
  role: ChatRole
  texto: string
  tipo?: EvidenciaTipo
  hora: string
}

export type Evidencia = {
  id: string
  tipo: EvidenciaTipo
  origen: 'chat-item' | 'chat-general' | 'manual'
  texto: string
  hora: string
}

export type ItemState = {
  status: ChecklistStatus
  origen: 'manual' | 'chat' | null
  justificacionNoAplica?: string
  evidencia: Evidencia[]
  chat: ChatMessage[]
}

export type ChecklistItemDef = {
  id: string
  seccion: string
  titulo: string
  queValidaApp: string
  criterioNormativo: string
  requiereFoto?: boolean
  permiteNoAplica?: boolean
  keywords: string[]
}

export const SECCIONES = [
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
  nombre: 'Rodrigo Martínez',
  rol: 'Gestor Interior Obra',
}

export const nombreFormulario = 'Formulario Puesta en Servicio Matriz Interior'

// Único proyecto con avance de demo pre-cargado (declaraciones, evidencia, chat).
// El resto de los proyectos parte con el checklist en blanco.
export const proyectoConDemoId = 'los-tres-antonios'

export const checklistDef: ChecklistItemDef[] = [
  // Pruebas
  {
    id: 'prueba-hermeticidad-matriz',
    seccion: 'Pruebas',
    titulo: 'Prueba Hermeticidad Matriz',
    queValidaApp:
      'Que se haya hecho la prueba de hermeticidad. Requiere foto del formulario firmado y validar tiempo y presión — no puede quedar pendiente, es previo a la dada de gas definitivo.',
    criterioNormativo:
      'DS N°66/2007, Art. 78.3.5 — presión mínima 1,5× la de servicio, caída de presión ≤1 kPa, duración = volumen (m³) × 214 (mín. 15 min).',
    requiereFoto: true,
    keywords: ['hermeticidad matriz', 'prueba de hermeticidad'],
  },
  {
    id: 'prueba-hermeticidad-interior',
    seccion: 'Pruebas',
    titulo: 'Prueba Hermeticidad Interior',
    queValidaApp: 'El supervisor declara si la red interior quedó hermética tras la prueba realizada.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.5 — mismo procedimiento que la matriz, aplicado a la red interior.',
    keywords: ['hermeticidad interior', 'red interior hermética'],
  },
  {
    id: 'prueba-limpieza',
    seccion: 'Pruebas',
    titulo: 'Prueba de Limpieza',
    queValidaApp: 'Validar que se realizó y que existe formulario firmado por quien la hizo. Requiere foto del formulario.',
    criterioNormativo: 'DS N°66/2007, Art. 103.1.1 — barridos con aire comprimido hasta comprobar ausencia de óxidos y partículas.',
    requiereFoto: true,
    keywords: ['prueba de limpieza', 'limpieza interior', 'barrido'],
  },
  {
    id: 'prueba-resistencia-matriz',
    seccion: 'Pruebas',
    titulo: 'Prueba Resistencia Matriz',
    queValidaApp: 'Prueba de resistencia mecánica: tiempo aplicado, presión usada, cumple/no cumple. Foto del documento firmado.',
    criterioNormativo:
      'Sin norma específica de ensayo de campo — DS N°66/2007 Art. 102.2.3 solo exige certificación de fábrica de la tubería.',
    requiereFoto: true,
    keywords: ['resistencia matriz', 'prueba de resistencia'],
  },
  {
    id: 'atravieso-muro-sello',
    seccion: 'Pruebas',
    titulo: 'Atravieso muro externo: sello anular entre tubería de gas y camisa de protección',
    queValidaApp: 'Revisar todos los puntos donde la matriz atraviesa la línea de edificación desde el exterior.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.5 y 46.2.6 — espacio anular sellado contra ingreso de gas/agua y corrosión.',
    keywords: ['sello anular', 'atravieso muro', 'camisa de protección'],
  },

  // Matriz Soterrada
  {
    id: 'profundidad-61cm',
    seccion: 'Matriz Soterrada',
    titulo: 'Profundidad a la clave de la tubería de 61 cm',
    queValidaApp:
      'Aplica a tránsito peatonal o sin tránsito. Requiere foto obligatoria — el ítem no se da por cumplido sin foto cargada.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.2.c — cubierta mínima 60 cm sobre la tubería enterrada.',
    requiereFoto: true,
    keywords: ['profundidad', '61 cm', 'clave de la tubería'],
  },
  {
    id: 'profundidad-80cm-jardines',
    seccion: 'Matriz Soterrada',
    titulo: 'En jardines y tránsito vehicular, profundidad a la clave de la tubería de 80 cm',
    queValidaApp: 'Aplica a jardines o tránsito vehicular. Misma exigencia de foto obligatoria.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.2.c — bajo calles con circulación vehicular, cubierta mínima 80 cm.',
    requiereFoto: true,
    permiteNoAplica: true,
    keywords: ['80 cm', 'jardines', 'tránsito vehicular'],
  },
  {
    id: 'distancia-edificaciones-1m',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia a edificaciones: 1 m',
    queValidaApp: 'Si la matriz va a menos de 1 m del muro/perímetro del edificio, declarar qué medidas de mitigación se aplicaron.',
    criterioNormativo: 'Sin norma específica encontrada para esta distancia en el trazado de la matriz.',
    keywords: ['distancia a edificaciones', '1 metro'],
  },
  {
    id: 'distancia-agua-potable-50cm',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia a redes de agua potable 50 cm',
    queValidaApp: 'Solo registrar cumple / no cumple / no sabe.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.1.c.1 — separación mínima 50 cm en cruces con tuberías de otros servicios.',
    keywords: ['agua potable', '50 cm'],
  },
  {
    id: 'distancia-15cm-otras-estructuras',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia de 15 cm a cualquier otra estructura o servicio subterráneo (telecomunicaciones, cámaras, postes, etc.)',
    queValidaApp: 'Solo registrar cumple / no cumple / no sabe.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.1.a — exige "espacio libre suficiente" sin cuantificar 15 cm.',
    keywords: ['15 cm', 'telecomunicaciones', 'cámaras subterráneas', 'postes'],
  },
  {
    id: 'distancia-50cm-electricas-soterradas',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia de 50 cm con cruces de líneas eléctricas soterradas',
    queValidaApp: 'Solo registrar cumple / no cumple / no sabe.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.2.a.2 — ≥50 cm de conductores aislados enterrados >400 V.',
    keywords: ['líneas eléctricas soterradas', 'cruces eléctricos'],
  },
  {
    id: 'distancia-50cm-cruce-conductores',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia de 50 cm a cruce de conductores eléctricos',
    queValidaApp: 'Solo registrar cumple / no cumple / no sabe.',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.1.c.1 y Art. 78.3.2.a — 30 a 60 cm según aislación y voltaje.',
    keywords: ['cruce de conductores', 'conductores eléctricos'],
  },
  {
    id: 'distancia-30cm-conductores-paralelos',
    seccion: 'Matriz Soterrada',
    titulo: 'Distancia de 30 cm a conductores eléctricos paralelos',
    queValidaApp: 'Solo registrar cumple / no cumple / no sabe.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.2.a.2 — ≥30 cm de conductores aislados enterrados entre 25–400 V.',
    keywords: ['conductores paralelos', '30 cm'],
  },

  // Matriz a la Vista
  {
    id: 'matriz-vista-registrable',
    seccion: 'Matriz a la Vista',
    titulo: 'Matriz a la vista y/o registrable en toda su longitud',
    queValidaApp: 'Cumple o no cumple. Las partes que no van a la vista deben ser registrables.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.3.b — tuberías exteriores visibles y accesibles en toda su extensión.',
    keywords: ['a la vista', 'registrable en toda'],
  },
  {
    id: 'matriz-pintada',
    seccion: 'Matriz a la Vista',
    titulo: 'Matriz Pintada',
    queValidaApp: 'Cumple o no cumple estar pintada de amarillo.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.3.e.1.ii — dos capas de pintura (primer epóxico + esmalte epóxico), color amarillo.',
    keywords: ['pintada', 'pintura amarilla'],
  },
  {
    id: 'proteccion-dano-mecanico',
    seccion: 'Matriz a la Vista',
    titulo: 'Instalación Protección contra Daño Mecánico',
    queValidaApp: 'En zonas de tránsito, la matriz a la vista debe tener protección hasta 1,8 m de altura.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.3.b.1 — defensas/barandas/barreras si hay riesgo de golpe de vehículos o maquinaria.',
    keywords: ['daño mecánico', 'protección mecánica'],
  },
  {
    id: 'soportes-aislacion',
    seccion: 'Matriz a la Vista',
    titulo: 'Soportes Matriz con aislación',
    queValidaApp:
      'La matriz de cobre sobre soporte metálico debe llevar aislación (PVC o similar). Preguntar explícitamente si se revisaron TODOS los soportes.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.3.b.2.vii y Art. 47 — aislación de soportes/estructuras metálicas.',
    keywords: ['soportes', 'aislación'],
  },
  {
    id: 'llave-corte-general',
    seccion: 'Matriz a la Vista',
    titulo: 'Llave de Corte General h:1,8 m',
    queValidaApp: 'Cumple o no cumple. Admite "No aplica" cuando el proyecto no la requiere o está en el módulo.',
    criterioNormativo: 'DS N°66/2007, Art. 52.4 — válvula de corte con accesibilidad Grado 1 (Art. 10.2.1).',
    permiteNoAplica: true,
    keywords: ['llave de corte', 'corte general'],
  },
  {
    id: 'distancia-lineas-conductores',
    seccion: 'Matriz a la Vista',
    titulo: 'Distancia a líneas y conductores eléctricos',
    queValidaApp: 'Validar medidas de mitigación cuando no se cumple la distancia, en cruces o en tramos paralelos.',
    criterioNormativo: 'DS N°66/2007, Art. 78.3.2.b — 15 cm a 5 m según aislación y voltaje del conductor.',
    keywords: ['líneas eléctricas', 'conductores eléctricos'],
  },

  // Señalética
  {
    id: 'cinta-advertencia',
    seccion: 'Señalética',
    titulo: 'Cinta de advertencia en matriz enterrada',
    queValidaApp: 'Cumple/no cumple + foto. Si no hay tramo soterrado, declarar "no aplica".',
    criterioNormativo: 'DS N°66/2007, Art. 46.2.2.d — cinta amarilla con leyenda "GAS", a ≥25 cm sobre la tubería enterrada.',
    requiereFoto: true,
    permiteNoAplica: true,
    keywords: ['cinta de advertencia', 'cinta amarilla'],
  },
  {
    id: 'llaves-sectorizacion',
    seccion: 'Señalética',
    titulo: 'Llaves de Sectorización con Señalética',
    queValidaApp: 'Declarar explícitamente si están todas, si falta alguna, o si no existen llaves de sectorización.',
    criterioNormativo: 'DS N°66/2007, Art. 52.3.1 — válvulas de sistemas múltiples identificadas con placa permanente.',
    keywords: ['llaves de sectorización', 'sectorización'],
  },
  {
    id: 'leyenda-gas-flecha',
    seccion: 'Señalética',
    titulo: 'Leyenda Gas Natural y Flecha Flujo (1 por recinto subterráneo)',
    queValidaApp: 'Cumple/no cumple. Al menos una señalética en toda la matriz.',
    criterioNormativo: 'DS N°66/2007, Art. 60.2.b — señalizar el tipo de gas en gabinetes/nichos/conductos técnicos.',
    keywords: ['leyenda gas natural', 'flecha de flujo'],
  },

  // Vigón o Zócalo Falso
  {
    id: 'vigon-zocalo-falso',
    seccion: 'Vigón o Zócalo Falso',
    titulo: 'Exclusivo, Incombustible, Registrable en toda su extensión, señalética en puerta del recinto',
    queValidaApp: 'Si existe vigón o zócalo falso, confirmar que cumple estas características. Admite "No aplica".',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.1.a, 59.2.3.a y 59.2.4.a — uso exclusivo, no combustible, resistencia al fuego F60/F90/F120.',
    permiteNoAplica: true,
    keywords: ['vigón', 'zócalo falso'],
  },

  // Shaft / Nicho Medidores
  {
    id: 'manifold-pintado',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Manifold Pintado',
    queValidaApp: 'Cumple o no cumple.',
    criterioNormativo: 'Sin norma específica encontrada para el pintado del manifold.',
    keywords: ['manifold'],
  },
  {
    id: 'ventilacion-inf-sup',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Ventilación Inferior y superior (según proyecto)',
    queValidaApp: 'Cumple o no cumple — debe tener instalado el sistema de ventilación definido en el proyecto.',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.2 y Tablas XIV/XV — ventilación directa superior e inferior.',
    keywords: ['ventilación inferior', 'ventilación superior'],
  },
  {
    id: 'medidor-marcado',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Medidor Marcado',
    queValidaApp: 'Cumple o no cumple — debe indicar el número de depto./local al que abastece.',
    criterioNormativo: 'DS N°66/2007, Art. 60.1 — medidores identificados con el número municipal correspondiente.',
    keywords: ['medidor marcado'],
  },
  {
    id: 'proteccion-rejilla',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Protección Rejilla caída medidor (solo si aplica)',
    queValidaApp: 'Cumple / no cumple / no aplica. Requerida si la apertura en la losa supera el tamaño que exige rejilla.',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.4.b — reja desmontable que soporte ≥200 kgf si la superficie libre supera 400 cm².',
    permiteNoAplica: true,
    keywords: ['rejilla', 'caída medidor'],
  },
  {
    id: 'baston-marcado',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Bastón Red Interior marcado con número de cada departamento',
    queValidaApp: 'El bastón (salida del medidor a la red interior) debe estar marcado con el número de local/depto.',
    criterioNormativo: 'DS N°66/2007, Art. 60.1 — misma exigencia de rotulación que el medidor.',
    keywords: ['bastón'],
  },
  {
    id: 'burlete-brazo-hidraulico',
    seccion: 'Shaft / Nicho Medidores',
    titulo: 'Burlete goma y brazo Hidráulico (cierre forzado)',
    queValidaApp: 'Cumple o no cumple.',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.1.b — puerta batiente con burlete y cierre forzado (brazo mecánico o hidráulico) + cerradura.',
    keywords: ['burlete', 'brazo hidráulico', 'cierre forzado'],
  },

  // Certificados
  {
    id: 'certificado-tc3',
    seccion: 'Certificados',
    titulo: 'Certificado TC3',
    queValidaApp: 'Lo tiene o no lo tiene (otorgado por la SEC). Cubre además Certificado de Materiales, calificación de soldadores y plano as-built.',
    criterioNormativo: 'Certificado SEC — no se solicitan como ítems individuales aparte del TC3.',
    keywords: ['tc3', 'certificado tc3'],
  },

  // Conducto Técnico
  {
    id: 'conducto-vertical-continuo',
    seccion: 'Conducto Técnico',
    titulo: 'Vertical, continuo y sin quiebres',
    queValidaApp: 'Cumple o no cumple.',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.4.a — vertical, rectilíneo, resistencia al fuego F60/F90/F120 según NCh935/1.',
    permiteNoAplica: true,
    keywords: ['conducto técnico', 'sin quiebres'],
  },
  {
    id: 'conducto-ventilacion-100cm2',
    seccion: 'Conducto Técnico',
    titulo: 'Ventilación (tiro) 100 cm² mínimo',
    queValidaApp: 'Cumple / no cumple / no aplica (si no hay conducto técnico). Ventilación inferior por donde se toma el aire.',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.4.b — superficie libre mínima 100 cm² al atravesar la losa de cada piso.',
    permiteNoAplica: true,
    keywords: ['tiro', '100 cm2', 'ventilación inferior conducto'],
  },
  {
    id: 'conducto-sombrerete',
    seccion: 'Conducto Técnico',
    titulo: 'Ventilación Sombrerete Aspirador Estacionario',
    queValidaApp: 'Cumple / no cumple / no aplica (si no hay conducto técnico). Debe salir "a los cuatro vientos".',
    criterioNormativo: 'DS N°66/2007, Art. 59.2.4.c — sombrerete tipo aspirador estacionario, protegido de lluvia/insectos/pájaros.',
    permiteNoAplica: true,
    keywords: ['sombrerete', 'aspirador estacionario'],
  },
]

function ev(id: string, tipo: EvidenciaTipo, origen: Evidencia['origen'], texto: string, hora: string): Evidencia {
  return { id, tipo, origen, texto, hora }
}

function msg(id: string, role: ChatRole, texto: string, hora: string, tipo?: EvidenciaTipo): ChatMessage {
  return { id, role, texto, hora, tipo }
}

const chatGeneralInicialLosTresAntonios: ChatMessage[] = [
  msg(
    'g1',
    'inspector',
    'La matriz está pintada de amarillo y a la vista en todo su trayecto.',
    '14:12',
  ),
  msg(
    'g2',
    'ia',
    'Marqué "Matriz Pintada" y "Matriz a la vista y/o registrable en toda su longitud" como cumplidos con tu declaración.',
    '14:12',
  ),
]

export function estadoVacioChecklist(): Record<string, ItemState> {
  return Object.fromEntries(
    checklistDef.map((def) => [def.id, { status: 'pending' as ChecklistStatus, origen: null, evidencia: [], chat: [] }]),
  )
}

const estadoInicialLosTresAntonios: Record<string, ItemState> = estadoVacioChecklist()

function setEstado(id: string, patch: Partial<ItemState>) {
  estadoInicialLosTresAntonios[id] = { ...estadoInicialLosTresAntonios[id], ...patch }
}

// Estado de partida para la demo — mezcla realista de verde/amarillo/rojo/no aplica.
setEstado('atravieso-muro-sello', { status: 'ok', origen: 'chat' })
setEstado('distancia-edificaciones-1m', { status: 'ok', origen: 'manual' })
setEstado('distancia-agua-potable-50cm', { status: 'ok', origen: 'manual' })
setEstado('leyenda-gas-flecha', { status: 'ok', origen: 'manual' })
setEstado('ventilacion-inf-sup', { status: 'ok', origen: 'manual' })
setEstado('medidor-marcado', { status: 'ok', origen: 'manual' })

setEstado('matriz-vista-registrable', {
  status: 'ok',
  origen: 'chat',
  evidencia: [ev('e-mvr-1', 'texto', 'chat-general', 'La matriz está pintada de amarillo y a la vista en todo su trayecto.', '14:12')],
})
setEstado('matriz-pintada', {
  status: 'ok',
  origen: 'chat',
  evidencia: [ev('e-mp-1', 'texto', 'chat-general', 'La matriz está pintada de amarillo y a la vista en todo su trayecto.', '14:12')],
})

setEstado('prueba-hermeticidad-matriz', {
  status: 'warn',
  origen: 'chat',
  evidencia: [ev('e-phm-1', 'texto', 'chat-item', 'Se hizo la prueba de hermeticidad, quedó conforme.', '13:40')],
  chat: [
    msg('phm-1', 'inspector', 'Se hizo la prueba de hermeticidad, quedó conforme.', '13:40'),
    msg(
      'phm-2',
      'ia',
      'Para dar este ítem por cumplido necesito la foto del formulario firmado con tiempo y presión de la prueba — la norma exige caída de presión ≤1 kPa. ¿Puedes subir la foto?',
      '13:40',
    ),
  ],
})

setEstado('profundidad-61cm', {
  status: 'warn',
  origen: 'chat',
  evidencia: [ev('e-p61-1', 'texto', 'chat-item', 'La matriz va enterrada, calculo que está como a 50 centímetros.', '13:55')],
  chat: [
    msg('p61-1', 'inspector', 'La matriz va enterrada, calculo que está como a 50 centímetros.', '13:55'),
    msg(
      'p61-2',
      'ia',
      'Para dar este ítem por cumplido necesito una foto que muestre la profundidad medida — la norma exige mínimo 60 cm y tu declaración no lo confirma. ¿Puedes subir una foto de la cinta métrica junto a la tubería?',
      '13:55',
    ),
  ],
})

setEstado('soportes-aislacion', {
  status: 'warn',
  origen: 'chat',
  evidencia: [ev('e-sa-1', 'texto', 'chat-item', 'Los soportes que alcancé a ver tenían aislación de PVC.', '14:20')],
  chat: [
    msg('sa-1', 'inspector', 'Los soportes que alcancé a ver tenían aislación de PVC.', '14:20'),
    msg(
      'sa-2',
      'ia',
      '¿Revisaste todos los soportes de la matriz o solo algunos? Este ítem requiere confirmar el 100%, porque suele faltar aislación en uno o dos puntos.',
      '14:20',
    ),
  ],
})

setEstado('profundidad-80cm-jardines', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'No hay tramo bajo jardines ni con tránsito vehicular en este proyecto.',
})
setEstado('llave-corte-general', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'La llave de corte general está en el módulo, no aplica instalación independiente.',
})
setEstado('vigon-zocalo-falso', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'El proyecto no tiene vigón ni zócalo falso.',
})
setEstado('proteccion-rejilla', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'La apertura en la losa del nicho de medidores no supera el tamaño que exige rejilla.',
})
setEstado('conducto-vertical-continuo', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'El proyecto no tiene conducto técnico — los medidores están en primer piso.',
})
setEstado('conducto-ventilacion-100cm2', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'No aplica — no hay conducto técnico en este proyecto.',
})
setEstado('conducto-sombrerete', {
  status: 'na',
  origen: 'manual',
  justificacionNoAplica: 'No aplica — no hay conducto técnico en este proyecto.',
})

export function matchItemsByKeyword(texto: string): ChecklistItemDef[] {
  const lower = texto.toLowerCase()
  return checklistDef.filter((def) => def.keywords.some((k) => lower.includes(k)))
}

export function estadoInicialParaProyecto(proyectoId: string): Record<string, ItemState> {
  return proyectoId === proyectoConDemoId ? estadoInicialLosTresAntonios : estadoVacioChecklist()
}

export function chatGeneralInicialParaProyecto(proyectoId: string): ChatMessage[] {
  return proyectoId === proyectoConDemoId ? chatGeneralInicialLosTresAntonios : []
}

export function completadosParaProyecto(proyectoId: string): { completados: number; total: number } {
  const estado = estadoInicialParaProyecto(proyectoId)
  const completados = checklistDef.filter((d) => ['ok', 'na'].includes(estado[d.id].status)).length
  return { completados, total: checklistDef.length }
}
