/** Display form of a player unique code (stored lowercase). */
export function formatUniqueCode(code: string | null | undefined): string {
  const trimmed = code?.trim() ?? ''
  return trimmed ? trimmed.toUpperCase() : '—'
}
