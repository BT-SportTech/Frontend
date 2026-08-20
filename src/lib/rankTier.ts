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

export function rankTierAccent(tier: RankTier) {
  switch (tier) {
    case 'Legend':
      return {
        avatar:
          'from-amber-100 via-orange-50 to-amber-200/80 text-amber-900',
        badge: 'bg-amber-100 text-amber-900 border-amber-200/80',
        ring: 'ring-amber-300/40',
        glow: 'shadow-amber-200/50',
      }
    case 'Elite':
      return {
        avatar:
          'from-violet-100 via-purple-50 to-violet-200/70 text-violet-900',
        badge: 'bg-violet-100 text-violet-900 border-violet-200/80',
        ring: 'ring-violet-300/40',
        glow: 'shadow-violet-200/50',
      }
    case 'Pro':
      return {
        avatar:
          'from-sky-100 via-blue-50 to-primary/20 text-primary',
        badge: 'bg-sky-100 text-sky-900 border-sky-200/80',
        ring: 'ring-primary/30',
        glow: 'shadow-primary/20',
      }
    case 'Intermediate':
      return {
        avatar:
          'from-emerald-50 via-teal-50 to-secondary/20 text-secondary',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        ring: 'ring-secondary/30',
        glow: 'shadow-secondary/20',
      }
    default:
      return {
        avatar:
          'from-slate-100 via-blue-50 to-primary/10 text-primary',
        badge: 'bg-slate-100 text-slate-700 border-slate-200/80',
        ring: 'ring-primary/20',
        glow: 'shadow-primary/15',
      }
  }
}
