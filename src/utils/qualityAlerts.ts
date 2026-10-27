import type { ChecklistItemDef, ItemState } from '../data/checklistMatrizInterior'
import { requiredEvidenceState } from '../data/checklistMatrizInterior'

export type QualityAlert = { itemId: string; title: string; text: string }

const HERMETICITY_MATRIX_ID = 'prueba-hermeticidad-matriz'

// Wording that signals the inspector did not cover 100% of what the criterion demands.
const PARTIAL_DECLARATION = /alcanc[ée] a ver|algun[oa]s|la mayor[ií]a|parcial|no todos|no pude (revisar|ver)|los que vi|a simple vista/i

export type ProjectPressureData = { servicePressureKpa?: number; matrixVolumeM3?: number }

// Automatic consistency checks run on the visit's checklist state. The project record does
// not store service pressure / matrix volume yet, so that rule fires until they are provided.
export function detectQualityAlerts(
  defs: ChecklistItemDef[],
  itemsState: Record<string, ItemState>,
  pressureData: ProjectPressureData = {},
): QualityAlert[] {
  const alerts: QualityAlert[] = []
  for (const d of defs) {
    const st = itemsState[d.id]
    if (!st || st.status === 'na') continue
    const reqs = requiredEvidenceState(d, st.evidence)
    const missing = reqs.filter((r) => !r.fulfilled)
    const declarations = st.evidence.filter((e) => e.source !== 'manual-mark' && e.type !== 'photo')
    const add = (text: string) => alerts.push({ itemId: d.id, title: d.title, text })

    if (st.status === 'warn' && missing.length && declarations.length === 0) {
      add(
        `Está en "No cumple" solo por evidencia faltante (${missing.map((r) => r.label.toLowerCase()).join(', ')}), no por un defecto constatado en terreno: la brecha es documental.`,
      )
    }
    if (st.status === 'ok') {
      const partial = declarations.find((e) => PARTIAL_DECLARATION.test(e.text))
      if (partial) {
        add(
          `Está en "Cumple" pero la declaración es parcial ("${partial.text}") y no cubre el 100% que exige el criterio. Se sugiere bajarlo a "No cumple" hasta confirmar el 100%.`,
        )
      }
      const missingPhotos = missing.filter((r) => r.type === 'photo')
      if (missingPhotos.length && st.evidence.some((e) => e.source === 'item-chat' || e.source === 'general-chat')) {
        add(
          `Confirmado solo por chat sin ${missingPhotos.map((r) => r.label.toLowerCase()).join(', ')}: la foto es obligatoria y no se da por cumplido sin evidencia fotográfica.`,
        )
      }
    }
    if (d.id === HERMETICITY_MATRIX_ID && (!pressureData.servicePressureKpa || !pressureData.matrixVolumeM3)) {
      add(
        'No se puede contrastar la presión de la prueba contra 1,5× la presión de servicio: la ficha del proyecto no registra presión de servicio ni volumen de la matriz.',
      )
    }
  }
  return alerts
}
