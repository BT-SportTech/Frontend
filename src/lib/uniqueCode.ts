/** Display form of a player 8-digit numeric unique code. */
export function formatUniqueCode(code: string | null | undefined): string {
  const trimmed = code?.trim() ?? ''
  return trimmed ? trimmed.toUpperCase() : '—'
}
