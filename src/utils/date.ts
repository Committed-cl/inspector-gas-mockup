// Converts an ISO date (yyyy-mm-dd) to the Chilean display format (dd-mm-yyyy).
// Storage/sorting keeps using the ISO string — this is display-only.
export function formatDateCl(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}-${month}-${year}`
}
