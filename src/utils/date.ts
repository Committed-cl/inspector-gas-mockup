// Converts an ISO date (yyyy-mm-dd) or a full ISO timestamp (as the API
// returns for visit dates — see api/src/application/ports/clock.ts) to the
// Chilean display format (dd-mm-yyyy). Storage/sorting keeps using the ISO
// string — this is display-only.
export function formatDateCl(isoDate: string): string {
  const [year, month, day] = isoDate.split('T')[0].split('-')
  return `${day}-${month}-${year}`
}
