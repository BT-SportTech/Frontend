import { api } from '../api'

export type PlaceSuggestion = {
  placeId: string
  primaryText: string
  secondaryText?: string
  fullText: string
}

export type PlaceDetails = {
  placeId: string
  formattedAddress?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
  latitude?: number
  longitude?: number
}

export async function fetchPlaceSuggestions(
  query: string,
): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const data = await api<{ suggestions: PlaceSuggestion[] }>(
    `/places/autocomplete?q=${encodeURIComponent(q)}`,
  )
  return data.suggestions ?? []
}

export async function fetchPlaceDetails(
  placeId: string,
): Promise<PlaceDetails> {
  return api<PlaceDetails>(
    `/places/details?placeId=${encodeURIComponent(placeId)}`,
  )
}
