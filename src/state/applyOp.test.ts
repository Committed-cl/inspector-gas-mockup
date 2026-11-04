// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { applyOp } from './ChecklistContext'
import { checklistDef, missingEvidenceHint, type ChecklistStatus } from '../data/checklistMatrizInterior'

const def = checklistDef.find((d) => d.id === 'prueba-hermeticidad-matriz')!
const photo = (i: number) => ({ id: `e${i}`, type: def.requiredEvidence[i].type, source: 'manual', text: 'x', time: '10:00', requirementIndex: i })
const mk = (evidence: unknown[]) =>
  ({ observations: '', itemsState: { [def.id]: { status: 'pending', source: 'manual', evidence } } }) as never
const mark = (state: never, status: ChecklistStatus) =>
  (applyOp(state, { kind: 'mark', itemId: def.id, projectId: 'p', visitId: 'v', body: { status } } as never) as any).itemsState[def.id].status

describe('optimistic manual mark', () => {
  it('shows "No cumple" at once when Cumple is marked with incomplete evidence', () => {
    expect(mark(mk([]), 'ok')).toBe('warn')
    expect(missingEvidenceHint(def, [])).toMatch(/^Falta evidencia: /)
  })
  it('keeps Cumple when evidence is complete', () => {
    expect(mark(mk(def.requiredEvidence.map((_, i) => photo(i))), 'ok')).toBe('ok')
  })
  it('does not touch No aplica', () => {
    expect(mark(mk([]), 'na')).toBe('na')
  })
})
