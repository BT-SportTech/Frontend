import { displayName } from '../lib/displayName'
import { rankTierFromPoints } from '../lib/rankTier'

type PlayerIdentityProps = {
  username: string
  firstName: string
  lastName: string
  totalPoints?: number
  rankTier?: string
  /** When true, show name as heading with labeled sub-lines. */
  compact?: boolean
  className?: string
}

export function PlayerIdentity({
  username,
  firstName,
  lastName,
  totalPoints = 0,
  rankTier,
  compact = true,
  className = '',
}: PlayerIdentityProps) {
  const name =
    displayName(firstName, lastName).trim() || username || 'Unknown player'
  const rank = rankTier ?? rankTierFromPoints(totalPoints)
  const code = username.trim().toUpperCase()

  if (!compact) {
    return (
      <div className={className}>
        <p className="font-semibold text-ink">{name}</p>
        <p className="text-sm text-ink/70">
          <span className="text-ink/50">Unique Code:</span> {code || '—'}
        </p>
        <p className="text-sm text-ink/70">
          <span className="text-ink/50">Rank:</span> {rank}
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="font-semibold leading-tight text-ink">{name}</p>
      <p className="mt-0.5 text-xs text-ink/55">
        <span className="text-ink/45">Unique Code:</span> {code || '—'}
      </p>
      <p className="mt-0.5 text-xs text-ink/55">
        <span className="text-ink/45">Rank:</span> {rank}
      </p>
    </div>
  )
}
