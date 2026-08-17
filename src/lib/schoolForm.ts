import type { School } from '../lib/types'
import type { SchoolFormState } from '../interfaces/school.interface'
import {
  emptySportsInstructorRow,
  normalizeSportsInstructorsForForm,
  serializeSportsInstructors,
} from './sportsInstructors'

export function emptySchoolForm(): SchoolFormState {
  return {
    name: '',
    code: '',
    logoUrl: '',
    logoFile: null,
    type: 'PRIVATE',
    yearEstablished: '',
    managingOrganization: '',
    principalName: '',
    chairmanName: '',
    tagline: '',
    website: '',
    contactNumber: '',
    email: '',
    state: '',
    district: '',
    city: '',
    landmark: '',
    fullAddress: '',
    pincode: '',
    googleMapsUrl: '',
    latitude: '',
    longitude: '',
    campusArea: '',
    playground: '',
    sportsFacilities: '',
    hasSwimmingPool: false,
    hasIndoorSportsArena: false,
    sportsInstructors: [emptySportsInstructorRow()],
    totalStudents: '',
    boysCount: '',
    girlsCount: '',
    boysEnrolled: '',
    girlsEnrolled: '',
    campusPhotos: '',
    eventPhotos: '',
    sportsEventPhotos: '',
    videos: '',
    virtualTourUrl: '',
    bestSchoolAwards: '',
    governmentRecognitions: '',
    accreditationDetails: '',
    rankings: '',
    certifications: '',
  }
}

function joinList(items?: string[] | null): string {
  return items?.join(', ') ?? ''
}

function parseList(value: string): string[] | undefined {
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return items.length ? items : undefined
}

function parseOptionalInt(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseOptionalFloat(value: string): number | undefined {
  if (!value.trim()) return undefined
  const parsed = Number.parseFloat(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function optionalString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed || undefined
}

export function schoolToForm(school: School): SchoolFormState {
  return {
    name: school.name ?? '',
    code: school.code ?? '',
    logoUrl: school.logoUrl ?? '',
    logoFile: null,
    type: school.type ?? 'PRIVATE',
    yearEstablished: school.yearEstablished?.toString() ?? '',
    managingOrganization: school.managingOrganization ?? '',
    principalName: school.principalName ?? '',
    chairmanName: school.chairmanName ?? '',
    tagline: school.tagline ?? '',
    website: school.website ?? '',
    contactNumber: school.contactNumber ?? '',
    email: school.email ?? '',
    state: school.state ?? '',
    district: school.district ?? '',
    city: school.city ?? '',
    landmark: school.landmark ?? '',
    fullAddress: school.fullAddress ?? '',
    pincode: school.pincode ?? '',
    googleMapsUrl: school.googleMapsUrl ?? '',
    latitude: school.latitude?.toString() ?? '',
    longitude: school.longitude?.toString() ?? '',
    campusArea: school.campusArea ?? '',
    playground: school.playground ?? '',
    sportsFacilities: joinList(school.sportsFacilities),
    hasSwimmingPool: school.hasSwimmingPool ?? false,
    hasIndoorSportsArena: school.hasIndoorSportsArena ?? false,
    sportsInstructors: normalizeSportsInstructorsForForm(
      school.sportsInstructors,
    ),
    totalStudents: school.totalStudents?.toString() ?? '',
    boysCount: school.boysCount?.toString() ?? '',
    girlsCount: school.girlsCount?.toString() ?? '',
    boysEnrolled: school.boysEnrolled?.toString() ?? '',
    girlsEnrolled: school.girlsEnrolled?.toString() ?? '',
    campusPhotos: joinList(school.campusPhotos),
    eventPhotos: joinList(school.eventPhotos),
    sportsEventPhotos: joinList(school.sportsEventPhotos),
    videos: joinList(school.videos),
    virtualTourUrl: school.virtualTourUrl ?? '',
    bestSchoolAwards: joinList(school.bestSchoolAwards),
    governmentRecognitions: joinList(school.governmentRecognitions),
    accreditationDetails: joinList(school.accreditationDetails),
    rankings: joinList(school.rankings),
    certifications: joinList(school.certifications),
  }
}

export function formToSchoolPayload(form: SchoolFormState) {
  return {
    name: form.name.trim(),
    code: form.code.trim(),
    type: form.type,
    logoUrl: optionalString(form.logoUrl),
    yearEstablished: parseOptionalInt(form.yearEstablished),
    managingOrganization: optionalString(form.managingOrganization),
    principalName: optionalString(form.principalName),
    chairmanName: optionalString(form.chairmanName),
    tagline: optionalString(form.tagline),
    website: optionalString(form.website),
    contactNumber: optionalString(form.contactNumber),
    email: optionalString(form.email),
    state: optionalString(form.state),
    district: optionalString(form.district),
    city: optionalString(form.city),
    landmark: optionalString(form.landmark),
    fullAddress: optionalString(form.fullAddress),
    pincode: optionalString(form.pincode),
    googleMapsUrl: optionalString(form.googleMapsUrl),
    latitude: parseOptionalFloat(form.latitude),
    longitude: parseOptionalFloat(form.longitude),
    campusArea: optionalString(form.campusArea),
    playground: optionalString(form.playground),
    sportsFacilities: parseList(form.sportsFacilities),
    hasSwimmingPool: form.hasSwimmingPool,
    hasIndoorSportsArena: form.hasIndoorSportsArena,
    sportsInstructors: serializeSportsInstructors(form.sportsInstructors),
    totalStudents: parseOptionalInt(form.totalStudents),
    boysCount: parseOptionalInt(form.boysCount),
    girlsCount: parseOptionalInt(form.girlsCount),
    boysEnrolled: parseOptionalInt(form.boysEnrolled),
    girlsEnrolled: parseOptionalInt(form.girlsEnrolled),
    campusPhotos: parseList(form.campusPhotos),
    eventPhotos: parseList(form.eventPhotos),
    sportsEventPhotos: parseList(form.sportsEventPhotos),
    videos: parseList(form.videos),
    virtualTourUrl: optionalString(form.virtualTourUrl),
    bestSchoolAwards: parseList(form.bestSchoolAwards),
    governmentRecognitions: parseList(form.governmentRecognitions),
    accreditationDetails: parseList(form.accreditationDetails),
    rankings: parseList(form.rankings),
    certifications: parseList(form.certifications),
  }
}
