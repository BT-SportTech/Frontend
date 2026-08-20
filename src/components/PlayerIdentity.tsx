import { displayName } from '../lib/displayName'
import { rankTierFromPoints } from '../lib/rankTier'

type PlayerIdentityProps = {
  username?: string | null
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
  const safeUsername = username?.trim() ?? ''
  const name =
    displayName(firstName, lastName).trim() || safeUsername || 'Unknown player'
  const rank = rankTier ?? rankTierFromPoints(totalPoints)
  const code = safeUsername.toUpperCase()
  const showMeta = Boolean(code || totalPoints > 0 || rankTier)

  if (!compact) {
    return (
      <div className={className}>
        <p className="font-semibold text-ink">{name}</p>
        {showMeta ? (
          <>
            {code ? (
              <p className="text-sm text-ink/70">
                <span className="text-ink/50">Unique Code:</span> {code}
              </p>
            ) : null}
            <p className="text-sm text-ink/70">
              <span className="text-ink/50">Rank:</span> {rank}
            </p>
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className={className}>
      <p className="font-semibold leading-tight text-ink">{name}</p>
      {showMeta ? (
        <>
          {code ? (
            <p className="mt-0.5 text-xs text-ink/55">
              <span className="text-ink/45">Unique Code:</span> {code}
            </p>
          ) : null}
          <p className="mt-0.5 text-xs text-ink/55">
            <span className="text-ink/45">Rank:</span> {rank}
          </p>
        </>
      ) : null}
    </div>
  )
}
