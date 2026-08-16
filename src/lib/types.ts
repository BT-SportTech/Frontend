export type UserRole = 'PLAYER' | 'PROFESSIONAL' | 'ADMIN' | 'ORGANIZER'

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
  username: string
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
  totalPoints?: number
  school?: { id: string; name: string } | null
}

export interface PlayerChessRating {
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
}

export interface PlayerDetail {
  id: string
  firstName: string
  lastName: string
  username: string
  email: string | null
  phone?: string | null
  role: UserRole
  gender?: Gender | null
  dateOfBirth?: string | null
  state?: string | null
  district?: string | null
  city?: string | null
  pincode?: string | null
  sportsInterested: string[]
  schoolId?: string | null
  presentClass?: number | null
  company?: string | null
  createdAt: string
  totalPoints: number
  chessRating: PlayerChessRating | null
  school?: { id: string; name: string; city?: string | null } | null
}

export interface PlayerStatsBucket {
  sport: string
  played: number
  won: number
  lost: number
  draw: number
  points: number
}

export interface PlayerStats {
  totals: {
    played: number
    won: number
    lost: number
    draw: number
    points: number
  }
  bySport: PlayerStatsBucket[]
}

export type MatchOutcome = 'WIN' | 'LOSS' | 'DRAW'

export interface PlayerRegistrationRow {
  id: string
  eventId: string
  userId: string
  status: string
  registeredAt: string
  outcome: MatchOutcome | null
  pointsEarned: number
  eventWins: number
  eventLosses: number
  eventDraws: number
  gamesCompleted: number
  event: {
    id: string
    name: string
    sport: string
    venue: string
    startsAt: string
    status: EventStatus
  }
}

export interface PlayerMatchRow {
  id: string
  boardNumber: number
  batchNumber: number | null
  roundNumber: number | null
  result: 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | null
  status: string
  completedAt: string | null
  event: { id: string; name: string; sport: string } | null
  white: {
    registrationId: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      username: string
    }
    ratingBefore?: number | null
    ratingAfter?: number | null
    ratingDelta?: number | null
  }
  black: {
    registrationId: string
    userId: string
    user: {
      id: string
      firstName: string
      lastName: string
      username: string
    }
    ratingBefore?: number | null
    ratingAfter?: number | null
    ratingDelta?: number | null
  }
}

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'COMPLETED' | 'CANCELLED'

export type MatchmakingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export type AgeCategory = 'U12' | 'U14' | 'U16' | 'U18' | 'OPEN'

export interface EventSchoolRef {
  id: string
  name: string
  code: string
}

export interface GameRef {
  id: string
  name: string
  imageUrl?: string | null
  sidesPerMatch: number
  playersPerSide: number
  playersPerMatch: number
  winPoints: number
  lossPoints: number
}

export interface Game extends GameRef {
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface GamePayload {
  name: string
  sidesPerMatch: number
  playersPerSide: number
  winPoints: number
  lossPoints: number
  imageUrl?: string | null
}

export interface SportEvent {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  sport: string
  gameId?: string | null
  game?: GameRef | null
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
  state?: string | null
  district?: string | null
  ageCategory: AgeCategory
  genders: Gender[]
  fee: number
  pointsReward: number
  lossPoints: number
  boardCount?: number | null
  gamesPerPlayer?: number
  matchmakingStatus?: MatchmakingStatus
  matchmakingStartedAt?: string | null
  imageUrl?: string | null
  schoolIds: string[]
  schools: EventSchoolRef[]
  organizerIds?: string[]
  organizers?: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    username: string
  }[]
  attendanceWindowOpen?: boolean
  attendanceOpensAt?: string
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
  gameId: string
  description?: string
  venue: string
  startsAt: string
  endsAt?: string
  registrationOpensAt: string
  registrationClosesAt: string
  maxParticipants: number
  state?: string
  district?: string
  ageCategory: AgeCategory
  genders: Gender[]
  schoolIds: string[]
  organizerIds: string[]
  fee: number
  pointsReward?: number
  lossPoints?: number
  boardCount?: number
  gamesPerPlayer?: number
  imageUrl?: string | null
}
