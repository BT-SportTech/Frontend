export type RankTier =
  | 'Rookie'
  | 'Intermediate'
  | 'Pro'
  | 'Elite'
  | 'Legend'

export const RANK_TIERS: RankTier[] = [
  'Rookie',
  'Intermediate',
  'Pro',
  'Elite',
  'Legend',
]

export function rankTierFromPoints(points: number): RankTier {
  if (points >= 1000) return 'Legend'
  if (points >= 600) return 'Elite'
  if (points >= 300) return 'Pro'
  if (points >= 100) return 'Intermediate'
  return 'Rookie'
}
