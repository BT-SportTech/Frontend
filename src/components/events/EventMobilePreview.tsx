import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { resolveAssetUrl } from '../../lib/api'
import type { EventFormState } from '../../lib/eventForm'

const MOBILE_PRIMARY = '#1E67E3'
const MOBILE_BG = '#F7F9FC'
const MOBILE_INK = '#111827'
const MOBILE_INK_SOFT = '#1F2937'
const MOBILE_MUTED = '#6B7280'
const MOBILE_LINE = '#E5E7EB'

type EventMobilePreviewProps = {
  form: EventFormState
  gameName?: string
  gameImageUrl?: string | null
}

function formatDetailDate(localValue: string, prefix: string) {
  if (!localValue.trim()) return null
  const d = new Date(localValue)
  if (Number.isNaN(d.getTime())) return null
  const date = d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${prefix} ${date} · ${time}`
}

function locationLabel(state: string, district: string) {
  const s = state.trim()
  const d = district.trim()
  if (!s && !d) return 'Nationwide'
  if (s && d) return `${d} · ${s}`
  return s || d
}

function useCountdown(closesAt: string) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!closesAt.trim()) return
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [closesAt])

  return useMemo(() => {
    if (!closesAt.trim()) return null
    const closes = new Date(closesAt).getTime()
    if (Number.isNaN(closes)) return null
    const remaining = Math.max(0, closes - now)
    const closed = remaining === 0 && closes <= now
    const totalMinutes = Math.floor(remaining / 60_000)
    return {
      closed,
      days: Math.floor(totalMinutes / (60 * 24)),
      hours: Math.floor(totalMinutes / 60) % 24,
      minutes: totalMinutes % 60,
    }
  }, [closesAt, now])
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-0.5 h-4 w-4 shrink-0"
      style={{ color: MOBILE_PRIMARY }}
      aria-hidden
    >
      {children}
    </svg>
  )
}

function InfoRow({
  icon,
  label,
  last = false,
}: {
  icon: ReactNode
  label: string
  last?: boolean
}) {
  return (
    <div
      className={`flex gap-3 py-3 ${last ? '' : 'border-b border-[#E5E7EB]'}`}
    >
      {icon}
      <p
        className="whitespace-pre-line text-[13px] font-medium leading-snug"
        style={{ color: MOBILE_INK_SOFT }}
      >
        {label}
      </p>
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div
      className="flex-1 rounded-xl py-3 text-center"
      style={{ backgroundColor: MOBILE_PRIMARY }}
    >
      <p className="text-xl font-extrabold tracking-wide text-white">
        {String(value).padStart(2, '0')}
      </p>
      <p className="mt-0.5 text-[11px] font-semibold text-white/70">{label}</p>
    </div>
  )
}

export function EventMobilePreview({
  form,
  gameName,
  gameImageUrl,
}: EventMobilePreviewProps) {
  const [imageSrc, setImageSrc] = useState('')
  const countdown = useCountdown(form.registrationClosesAt)

  useEffect(() => {
    if (form.imageFile) {
      const objectUrl = URL.createObjectURL(form.imageFile)
      setImageSrc(objectUrl)
      return () => URL.revokeObjectURL(objectUrl)
    }
    if (form.imageUrl.trim()) {
      setImageSrc(resolveAssetUrl(form.imageUrl))
      return
    }
    if (gameImageUrl?.trim()) {
      setImageSrc(resolveAssetUrl(gameImageUrl))
      return
    }
    setImageSrc('')
  }, [form.imageFile, form.imageUrl, gameImageUrl])

  const title = form.name.trim() || 'Event name'
  const category = (gameName || 'Sport').toUpperCase()
  const venue = form.venue.trim() || 'Venue'
  const zone = locationLabel(form.state, form.district)
  const feeNum = Math.max(0, parseFloat(form.fee) || 0)
  const feeLabel =
    feeNum <= 0
      ? 'Entry fee ₹0'
      : `Entry fee ₹${Number.isInteger(feeNum) ? feeNum : feeNum.toFixed(2)}`
  const ctaLabel =
    feeNum <= 0 ? 'Register for free' : `Register · ₹${feeNum.toFixed(0)}`
  const startLabel = formatDetailDate(form.startsAt, 'Starts')
  const endLabel = formatDetailDate(form.endsAt, 'Ends')
  const registerBy = formatDetailDate(form.registrationClosesAt, 'Register by')
  const description =
    form.description.trim() ||
    'Add a description to show players what this event is about.'

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/45">
        Mobile app preview
      </p>
      <div
        className="relative w-[300px] shrink-0 overflow-hidden rounded-[2rem] border-[10px] border-ink shadow-2xl shadow-ink/20"
        style={{
          fontFamily: '"DM Sans", Inter, ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-ink" />
        <div
          className="relative flex h-[620px] flex-col overflow-hidden"
          style={{ backgroundColor: MOBILE_BG }}
        >
          <div className="relative h-[220px] shrink-0 overflow-hidden bg-[#1557C0]">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-[#1E67E3] to-[#1557C0]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-16">
              <span className="inline-flex rounded-lg border border-white/35 bg-white/20 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
                {category}
              </span>
              <h2 className="mt-2.5 line-clamp-2 text-[22px] font-extrabold leading-tight tracking-tight text-white">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex-1 space-y-3.5 overflow-y-auto px-4 py-4 pb-24">
            {countdown ? (
              <div
                className="rounded-2xl border bg-white p-3.5 shadow-sm"
                style={{
                  borderColor: countdown.closed
                    ? MOBILE_LINE
                    : 'rgba(30, 103, 227, 0.25)',
                }}
              >
                <p className="text-sm font-bold" style={{ color: MOBILE_INK }}>
                  {countdown.closed
                    ? 'Registration closed'
                    : 'Registration closes in'}
                </p>
                {!countdown.closed ? (
                  <div className="mt-3 flex gap-2.5">
                    <CountdownUnit value={countdown.days} label="Days" />
                    <CountdownUnit value={countdown.hours} label="Hours" />
                    <CountdownUnit value={countdown.minutes} label="Minutes" />
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border border-[#E5E7EB] bg-white px-3.5 shadow-sm">
              {registerBy ? (
                <InfoRow
                  icon={
                    <Icon>
                      <rect width="18" height="18" x="3" y="4" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </Icon>
                  }
                  label={registerBy}
                />
              ) : null}
              {startLabel ? (
                <InfoRow
                  icon={
                    <Icon>
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </Icon>
                  }
                  label={startLabel}
                />
              ) : null}
              {endLabel ? (
                <InfoRow
                  icon={
                    <Icon>
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </Icon>
                  }
                  label={endLabel}
                />
              ) : null}
              <InfoRow
                icon={
                  <Icon>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </Icon>
                }
                label={`${venue}\n${zone}`}
              />
              <InfoRow
                icon={
                  <Icon>
                    <rect width="20" height="14" x="2" y="5" rx="2" />
                    <path d="M2 10h20" />
                  </Icon>
                }
                label={feeLabel}
              />
              <InfoRow
                icon={
                  <Icon>
                    <polygon points="12 2 15 8.5 22 9.3 17 14.1 18.5 21 12 17.8 5.5 21 7 14.1 2 9.3 9 8.5 12 2" />
                  </Icon>
                }
                label={`+ ranking points on finish · ${form.ageCategory}`}
                last
              />
            </div>

            <div>
              <p
                className="text-[17px] font-extrabold"
                style={{ color: MOBILE_INK }}
              >
                About
              </p>
              <p
                className="mt-2 text-[14px] leading-relaxed"
                style={{
                  color: form.description.trim()
                    ? MOBILE_INK_SOFT
                    : MOBILE_MUTED,
                }}
              >
                {description}
              </p>
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 border-t px-4 pb-4 pt-2"
            style={{ backgroundColor: MOBILE_BG, borderColor: MOBILE_LINE }}
          >
            <div
              className="flex h-[48px] items-center justify-center rounded-xl text-[15px] font-bold text-white"
              style={{ backgroundColor: MOBILE_PRIMARY }}
            >
              {ctaLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
