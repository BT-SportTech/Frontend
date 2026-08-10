import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { GlassPanel, Skeleton } from '../../components/ui'
import { resolveAssetUrl } from '../../lib/api'
import { fetchSchool, schoolsKeys } from '../../lib/queries/schools'
import type { School } from '../../lib/types'

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-medium text-ink">{value}</dd>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <GlassPanel strong className="p-6">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">{children}</dl>
    </GlassPanel>
  )
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45">
        {label}
      </dt>
      <dd className="mt-1.5">
        {items.length === 0 ? (
          <span className="font-medium text-ink">—</span>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-md border border-line bg-accent/40 px-2.5 py-1 text-sm font-medium text-ink"
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  )
}

function MediaGrid({ urls, emptyLabel }: { urls: string[]; emptyLabel: string }) {
  if (urls.length === 0) {
    return <p className="text-sm text-ink/50">{emptyLabel}</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {urls.map((url) => {
        const src = resolveAssetUrl(url)
        const isVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(url)
        return (
          <a
            key={url}
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-line bg-white"
          >
            {isVideo ? (
              <video
                src={src}
                className="aspect-video w-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <img
                src={src}
                alt=""
                className="aspect-video w-full object-cover"
              />
            )}
          </a>
        )
      })}
    </div>
  )
}

function ExternalLink({ href, label }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary hover:text-primary-hover"
    >
      {label ?? href}
    </a>
  )
}

export function SchoolDetailPage() {
  const { id = '' } = useParams<{ id: string }>()

  const {
    data: school,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: schoolsKeys.detail(id),
    queryFn: () => fetchSchool(id),
    enabled: Boolean(id),
  })

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/schools"
          className="text-sm font-semibold text-primary transition hover:text-primary-hover"
        >
          ← Back to schools
        </Link>
      </div>

      {isPending ? (
        <SchoolDetailSkeleton />
      ) : isError || !school ? (
        <p className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : 'School not found'}
        </p>
      ) : (
        <SchoolDetailContent school={school} />
      )}
    </div>
  )
}

function SchoolDetailContent({ school }: { school: School }) {
  return (
    <>
      <div className="flex flex-wrap items-start gap-5">
        {school.logoUrl ? (
          <img
            src={resolveAssetUrl(school.logoUrl)}
            alt=""
            className="h-20 w-20 shrink-0 rounded-xl border border-line object-cover bg-white"
          />
        ) : (
          <span className="inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-line bg-accent/50 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-9 w-9"
              aria-hidden
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
              {school.name}
            </h1>
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                school.isActive
                  ? 'bg-secondary/10 text-secondary'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {school.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink/55">
            {school.code} · {school.type.replaceAll('_', ' ')}
            {school.tagline ? ` · ${school.tagline}` : ''}
          </p>
        </div>
      </div>

      <DetailSection title="Basic info">
        <DetailField label="Name" value={school.name} />
        <DetailField label="Code" value={school.code} />
        <DetailField label="Type" value={school.type.replaceAll('_', ' ')} />
        <DetailField
          label="Year established"
          value={display(school.yearEstablished)}
        />
        <DetailField
          label="Managing organization"
          value={display(school.managingOrganization)}
        />
        <DetailField
          label="Principal"
          value={display(school.principalName)}
        />
        <DetailField label="Chairman" value={display(school.chairmanName)} />
        <DetailField label="Tagline" value={display(school.tagline)} />
        <DetailField label="Contact" value={display(school.contactNumber)} />
        <DetailField label="Email" value={display(school.email)} />
        <DetailField
          label="Website"
          value={
            school.website ? (
              <ExternalLink href={school.website} />
            ) : (
              '—'
            )
          }
        />
      </DetailSection>

      <DetailSection title="Location">
        <DetailField label="City" value={display(school.city)} />
        <DetailField label="District" value={display(school.district)} />
        <DetailField label="State" value={display(school.state)} />
        <DetailField label="Pincode" value={display(school.pincode)} />
        <DetailField label="Landmark" value={display(school.landmark)} />
        <DetailField
          label="Full address"
          value={display(school.fullAddress)}
        />
        <DetailField
          label="Google Maps"
          value={
            school.googleMapsUrl ? (
              <ExternalLink href={school.googleMapsUrl} label="Open map" />
            ) : (
              '—'
            )
          }
        />
        <DetailField
          label="Coordinates"
          value={
            school.latitude != null && school.longitude != null
              ? `${school.latitude}, ${school.longitude}`
              : '—'
          }
        />
      </DetailSection>

      <DetailSection title="Infrastructure">
        <DetailField label="Campus area" value={display(school.campusArea)} />
        <DetailField label="Playground" value={display(school.playground)} />
        <DetailField
          label="Swimming pool"
          value={school.hasSwimmingPool ? 'Yes' : 'No'}
        />
        <DetailField
          label="Indoor sports arena"
          value={school.hasIndoorSportsArena ? 'Yes' : 'No'}
        />
        <ListField label="Sports facilities" items={school.sportsFacilities} />
      </DetailSection>

      <DetailSection title="Faculty">
        <DetailField
          label="Sports instructor"
          value={display(school.sportsInstructor)}
        />
      </DetailSection>

      <DetailSection title="Students">
        <DetailField
          label="Total students"
          value={display(school.totalStudents)}
        />
        <DetailField label="Boys count" value={display(school.boysCount)} />
        <DetailField label="Girls count" value={display(school.girlsCount)} />
        <DetailField
          label="Boys enrolled"
          value={display(school.boysEnrolled)}
        />
        <DetailField
          label="Girls enrolled"
          value={display(school.girlsEnrolled)}
        />
      </DetailSection>

      <DetailSection title="Recognition">
        <ListField label="Best school awards" items={school.bestSchoolAwards} />
        <ListField
          label="Government recognitions"
          items={school.governmentRecognitions}
        />
        <ListField
          label="Accreditation details"
          items={school.accreditationDetails}
        />
        <ListField label="Rankings" items={school.rankings} />
        <ListField label="Certifications" items={school.certifications} />
      </DetailSection>

      <GlassPanel strong className="space-y-6 p-6">
        <h2 className="font-display text-lg font-bold text-ink">Media</h2>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
            Campus photos
          </p>
          <div className="mt-2">
            <MediaGrid urls={school.campusPhotos} emptyLabel="No campus photos" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
            Event photos
          </p>
          <div className="mt-2">
            <MediaGrid urls={school.eventPhotos} emptyLabel="No event photos" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
            Sports event photos
          </p>
          <div className="mt-2">
            <MediaGrid
              urls={school.sportsEventPhotos}
              emptyLabel="No sports event photos"
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
            Videos
          </p>
          <div className="mt-2">
            <MediaGrid urls={school.videos} emptyLabel="No videos" />
          </div>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <DetailField
            label="Virtual tour"
            value={
              school.virtualTourUrl ? (
                <ExternalLink href={school.virtualTourUrl} label="Open tour" />
              ) : (
                '—'
              )
            }
          />
        </dl>
      </GlassPanel>
    </>
  )
}

function SchoolDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading school">
      <div className="flex items-start gap-5">
        <Skeleton className="h-20 w-20 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <GlassPanel key={i} strong className="p-6">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </GlassPanel>
      ))}
    </div>
  )
}
