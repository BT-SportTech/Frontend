import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { resolveAssetUrl } from '@/lib/api'
import { fetchSchool, schoolsKeys } from '@/lib/queries/schools'

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
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-medium text-ink">{value}</dd>
    </div>
  )
}

function ListField({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="sm:col-span-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5">
        {items.length === 0 ? (
          <span className="font-medium text-ink">—</span>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {items.map((item) => (
              <li key={item}>
                <Badge variant="outline">{item}</Badge>
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
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>
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
              <img src={src} alt="" className="aspect-video w-full object-cover" />
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

function DetailGrid({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <dl className={`grid gap-4 text-sm sm:grid-cols-2 ${className}`}>{children}</dl>
  )
}

export function SchoolDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()

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

  if (isPending) {
    return <SchoolDetailSkeleton />
  }

  if (isError || !school) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {error instanceof Error ? error.message : 'School not found'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={school.name}
        description={`${school.code} · ${school.type.replaceAll('_', ' ')}${school.tagline ? ` · ${school.tagline}` : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={school.isActive ? 'success' : 'destructive'}>
              {school.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/schools/${school.id}/edit`)}
            >
              Edit school
            </Button>
          </div>
        }
      />

      <div className="flex items-start gap-4">
        {school.logoUrl ? (
          <img
            src={resolveAssetUrl(school.logoUrl)}
            alt=""
            className="h-16 w-16 shrink-0 rounded-xl border border-line object-cover bg-white"
          />
        ) : (
          <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-line bg-muted text-primary">
            <SchoolGlyph />
          </span>
        )}
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="sports">Sports & faculty</TabsTrigger>
          <TabsTrigger value="recognition">Recognition & media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-ink">Basic info</h2>
                <DetailGrid className="mt-4">
                  <DetailField label="Name" value={school.name} />
                  <DetailField label="Code" value={school.code} />
                  <DetailField label="Type" value={school.type.replaceAll('_', ' ')} />
                  <DetailField label="Year established" value={display(school.yearEstablished)} />
                  <DetailField label="Managing organization" value={display(school.managingOrganization)} />
                  <DetailField label="Principal" value={display(school.principalName)} />
                  <DetailField label="Chairman" value={display(school.chairmanName)} />
                  <DetailField label="Tagline" value={display(school.tagline)} />
                  <DetailField label="Contact" value={display(school.contactNumber)} />
                  <DetailField label="Email" value={display(school.email)} />
                  <DetailField
                    label="Website"
                    value={
                      school.website ? <ExternalLink href={school.website} /> : '—'
                    }
                  />
                </DetailGrid>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Students</h2>
                <DetailGrid className="mt-4">
                  <DetailField label="Total students" value={display(school.totalStudents)} />
                  <DetailField label="Boys count" value={display(school.boysCount)} />
                  <DetailField label="Girls count" value={display(school.girlsCount)} />
                  <DetailField label="Boys enrolled" value={display(school.boysEnrolled)} />
                  <DetailField label="Girls enrolled" value={display(school.girlsEnrolled)} />
                </DetailGrid>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card>
            <CardContent className="p-6">
              <DetailGrid>
                <DetailField label="City" value={display(school.city)} />
                <DetailField label="District" value={display(school.district)} />
                <DetailField label="State" value={display(school.state)} />
                <DetailField label="Pincode" value={display(school.pincode)} />
                <DetailField label="Landmark" value={display(school.landmark)} />
                <DetailField label="Full address" value={display(school.fullAddress)} />
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
              </DetailGrid>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sports">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-ink">Infrastructure</h2>
                <DetailGrid className="mt-4">
                  <DetailField label="Campus area" value={display(school.campusArea)} />
                  <DetailField label="Playground" value={display(school.playground)} />
                  <DetailField label="Swimming pool" value={school.hasSwimmingPool ? 'Yes' : 'No'} />
                  <DetailField label="Indoor sports arena" value={school.hasIndoorSportsArena ? 'Yes' : 'No'} />
                  <ListField label="Sports facilities" items={school.sportsFacilities} />
                </DetailGrid>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Faculty</h2>
                {school.sportsInstructors && school.sportsInstructors.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {school.sportsInstructors.map((instructor, index) => (
                      <div
                        key={`${instructor.name ?? 'member'}-${instructor.phone ?? index}`}
                        className="rounded-lg border border-line bg-muted/50 px-3 py-2.5 text-sm"
                      >
                        <p className="font-semibold text-ink">
                          {instructor.name?.trim() || '—'}
                        </p>
                        {instructor.phone?.trim() ? (
                          <p className="mt-0.5 text-muted-foreground">{instructor.phone}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">No sports instructors listed.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recognition">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-ink">Recognition</h2>
                <DetailGrid className="mt-4">
                  <ListField label="Best school awards" items={school.bestSchoolAwards} />
                  <ListField label="Government recognitions" items={school.governmentRecognitions} />
                  <ListField label="Accreditation details" items={school.accreditationDetails} />
                  <ListField label="Rankings" items={school.rankings} />
                  <ListField label="Certifications" items={school.certifications} />
                </DetailGrid>
              </div>
              <div className="space-y-4">
                <h2 className="text-base font-semibold text-ink">Media</h2>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Campus photos
                  </p>
                  <div className="mt-2">
                    <MediaGrid urls={school.campusPhotos} emptyLabel="No campus photos" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Event photos
                  </p>
                  <div className="mt-2">
                    <MediaGrid urls={school.eventPhotos} emptyLabel="No event photos" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sports event photos
                  </p>
                  <div className="mt-2">
                    <MediaGrid urls={school.sportsEventPhotos} emptyLabel="No sports event photos" />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Videos
                  </p>
                  <div className="mt-2">
                    <MediaGrid urls={school.videos} emptyLabel="No videos" />
                  </div>
                </div>
                <DetailGrid>
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
                </DetailGrid>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SchoolDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading school">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-16 w-16 rounded-xl" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

function SchoolGlyph() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-8 w-8"
      aria-hidden
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
