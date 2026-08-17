import type { SchoolType } from '../lib/types'
import type { SportsInstructorFormRow } from '../lib/sportsInstructors'

export type { SportsInstructorMember } from '../lib/types'

export interface SchoolFormState {
  name: string
  code: string
  logoUrl: string
  logoFile: File | null
  type: SchoolType
  yearEstablished: string
  managingOrganization: string
  principalName: string
  chairmanName: string
  tagline: string
  website: string
  contactNumber: string
  email: string
  state: string
  district: string
  city: string
  landmark: string
  fullAddress: string
  pincode: string
  googleMapsUrl: string
  latitude: string
  longitude: string
  campusArea: string
  playground: string
  sportsFacilities: string
  hasSwimmingPool: boolean
  hasIndoorSportsArena: boolean
  sportsInstructors: SportsInstructorFormRow[]
  totalStudents: string
  boysCount: string
  girlsCount: string
  boysEnrolled: string
  girlsEnrolled: string
  campusPhotos: string
  eventPhotos: string
  sportsEventPhotos: string
  videos: string
  virtualTourUrl: string
  bestSchoolAwards: string
  governmentRecognitions: string
  accreditationDetails: string
  rankings: string
  certifications: string
}

export const SCHOOL_TYPES: SchoolType[] = [
  'PUBLIC',
  'PRIVATE',
  'INTERNATIONAL',
  'RESIDENTIAL',
  'GOVERNMENT_AIDED',
]
