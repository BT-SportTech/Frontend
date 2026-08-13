export function displayName(firstName: string, lastName: string): string {
  const first = firstName.trim()
  const last = lastName.trim()
  if (!first) return last
  if (!last) return first
  if (first.toLowerCase() === last.toLowerCase()) return first
  return `${first} ${last}`
}
