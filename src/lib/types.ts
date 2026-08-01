export type UserRole = 'STUDENT' | 'PROFESSIONAL' | 'ADMIN'

export type SchoolType =
  | 'PUBLIC'
  | 'PRIVATE'
  | 'INTERNATIONAL'
  | 'RESIDENTIAL'
  | 'GOVERNMENT_AIDED'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: UserRole
  gender?: Gender | null
  state?: string | null
  district?: string | null
  city?: string | null
  pincode?: string | null
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PaginatedMeta
}

export interface SchoolListItem {
  id: string
  name: string
  code: string
  type: SchoolType
  city?: string | null
  district?: string | null
  state?: string | null
  pincode?: string | null
  logoUrl?: string | null
  isActive: boolean
  contactNumber?: string | null
  email?: string | null
}

export interface School extends SchoolListItem {
  yearEstablished?: number | null
  managingOrganization?: string | null
  principalName?: string | null
  chairmanName?: string | null
  tagline?: string | null
  website?: string | null
  landmark?: string | null
  fullAddress?: string | null
  googleMapsUrl?: string | null
  latitude?: number | null
  longitude?: number | null
  campusArea?: string | null
  playground?: string | null
  sportsFacilities: string[]
  hasSwimmingPool: boolean
  hasIndoorSportsArena: boolean
  sportsInstructor?: string | null
  totalStudents?: number | null
  boysCount?: number | null
  girlsCount?: number | null
  boysEnrolled?: number | null
  girlsEnrolled?: number | null
  campusPhotos: string[]
  eventPhotos: string[]
  sportsEventPhotos: string[]
  videos: string[]
  virtualTourUrl?: string | null
  bestSchoolAwards: string[]
  governmentRecognitions: string[]
  accreditationDetails: string[]
  rankings: string[]
  certifications: string[]
}

export interface UserListItem {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: UserRole
  gender?: Gender | null
  city?: string | null
  district?: string | null
  state?: string | null
  pincode?: string | null
  schoolId?: string | null
  presentClass?: number | null
  company?: string | null
  createdAt: string
  school?: { id: string; name: string } | null
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'

export type AgeCategory = 'U12' | 'U14' | 'U16' | 'U18' | 'OPEN'

export interface EventSchoolRef {
  id: string
  name: string
  code: string
}

export interface SportEvent {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  sport: string
  description?: string | null
  venue: string
  startsAt: string
  endsAt?: string | null
  registrationOpensAt: string
  registrationClosesAt: string
  maxParticipants: number
  registeredCount: number
  seatsLeft: number
  status: EventStatus
  state: string
  district: string
  ageCategory: AgeCategory
  genders: Gender[]
  fee: number
  pointsReward: number
  schoolIds: string[]
  schools: EventSchoolRef[]
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  isRegistered?: boolean
}

export interface EventPayload {
  name: string
  sport: string
  description?: string
  venue: string
  startsAt: string
  endsAt?: string
  registrationOpensAt: string
  registrationClosesAt: string
  maxParticipants: number
  state: string
  district: string
  ageCategory: AgeCategory
  genders: Gender[]
  schoolIds: string[]
  fee: number
  pointsReward: number
}
