export type RoomCategory = 'couples' | 'family' | 'friends'
export type VehicleType = 'bike' | 'scooter' | 'car'
export type BoatType = 'yacht' | 'paddle' | 'kayak' | 'ferry' | 'catamaran'
export type PlaceKind =
  | 'cafe'
  | 'restaurant'
  | 'roadside'
  | 'beach'
  | 'bar'
  | 'foodstreet'
  | 'whitetown'
export type BookingType = 'room' | 'vehicle' | 'boat'
export type GallerySlot = 'exterior' | 'bedroom' | 'bathroom' | 'living'

export interface Room {
  id: number
  name: string
  slug: string
  category: RoomCategory
  roomType: string
  minMembers: number
  maxMembers: number
  pricePerNight: number
  /** Guests covered by `pricePerNight`. */
  baseGuests: number
  /** Added per night for each guest beyond `baseGuests`. */
  extraGuestPrice: number
  description: string
  location: string
  images: string[]
  /** Photos uploaded by an admin; each one overrides that slot's default image. */
  gallery?: Partial<Record<GallerySlot, string>>
  amenities: string[]
  rating: number
  reviewCount?: number
  reviewSnippet?: string | null
  googleReviewsUrl?: string
  /** True when `images` are live Google Place Photos (HD via /api/google-photo). */
  photosFromGoogle?: boolean
  nearby?: unknown[]
}

export interface Vehicle {
  id: number
  name: string
  type: VehicleType
  withDriver: boolean
  pricePerDay: number
  description: string
  seats: number
  images: string[]
  rating: number
  available: boolean
}

export interface BoatRoute {
  name: string
  duration: string
  stops: string[]
}

export interface BoatTimeSlot {
  id: number
  name: string | null
  /** HH:MM */
  startTime: string
  endTime: string
  reportingTime: string | null
  isSeasonal: boolean
  isDisabled: boolean
  isDeparted: boolean
  capacity: number
  priceAdult: number
  priceChild: number
  bookedSeats: number
  blockedSeatNumbers: string[]
  availableSeats: number
}

export interface Boat {
  id: number
  name: string
  type: BoatType
  coachType: string | null
  departurePoint: string | null
  /** Passenger capacity. */
  seats: number
  /** Per adult seat. */
  price: number
  /** Per child seat (below 12 yrs). */
  priceChild: number
  description: string
  /** Start times of `timeSlots`, HH:MM. */
  slots: string[]
  routes: BoatRoute[]
  images: string[]
  rating: number
  /** Date (YYYY-MM-DD) the availability below was computed for. */
  date: string
  isDisabled: boolean
  timeSlots: BoatTimeSlot[]
}

export interface BoatSeats {
  capacity: number
  takenSeats: string[]
}

export interface BoatBookingPayload {
  type: 'boat'
  itemId: number
  slotId: number
  date: string
  adultSeats: number
  childSeats: number
  selectedSeats: string[]
  guestName: string
  guestPhone: string
  guestEmail?: string
}

export interface BoatBookingResult {
  confirmationId: string
  pnr: string
  status: string
  type: 'boat'
  itemId: number
  date: string
  slot: string
  guests: number
  totalAmount: number
  message: string
  boat: { name: string; coachType: string | null; departurePoint: string | null }
  timeSlot: Pick<BoatTimeSlot, 'id' | 'name' | 'startTime' | 'endTime' | 'reportingTime'>
  adultSeats: number
  childSeats: number
  seats: string[]
  autoAssignedSeats: string[]
  guestName: string
}

export interface Place {
  id: number
  name: string
  kind: PlaceKind
  description: string
  location: string | null
  opensAt: string | null
  closesAt: string | null
  bestVisitTime: string | null
  isSeafoodSpot: boolean
  nearRoomId: number | null
  nearBeachId: number | null
  images: string[]
  rating: number
  reviewCount?: number
  reviewSnippet?: string | null
  googleReviewsUrl?: string
  openNow: boolean
  seafoodSpots?: Place[]
}

export interface BookingPayload {
  type: BookingType
  itemId: number
  date: string
  slot?: string
  guests?: number
  extras?: Record<string, unknown>
  guestName?: string
  guestPhone?: string
  totalAmount?: number
}

export interface BookingResult {
  confirmationId: string
  status: string
  type: BookingType
  itemId: number
  date: string
  slot: string | null
  guests: number
  message: string
}

export interface AdminBooking {
  id: number
  confirmationId: string
  type: BookingType
  itemId: number
  date: string
  slot: string | null
  guests: number
  status: string
  guestName: string | null
  guestPhone: string | null
  guestEmail: string | null
  totalAmount: number | null
  createdAt: string
  extras: Record<string, unknown> | null
  item: { name: string; detail: string; image: string | null } | null
  boat: AdminBoatBookingDetails | null
}

export interface AdminBoatBookingDetails {
  pnr: string | null
  slotName: string | null
  startTime: string | null
  endTime: string | null
  reportingTime: string | null
  adultSeats: number
  childSeats: number
  seats: number[]
  departurePoint: string | null
}

export interface AdminStats {
  total: number
  rooms: number
  vehicles: number
  boats: number
  confirmed: number
  revenue: number
}

export type PriceKind = 'rooms' | 'vehicles' | 'boats'

export interface AdminPriceItem {
  id: number
  name: string
  detail: string
  price: number
  extraGuestPrice?: number
  childPrice?: number
}

export type AdminCatalog = Record<PriceKind, AdminPriceItem[]>

export type PriceFields = { price?: number; extraGuestPrice?: number; childPrice?: number }

export interface StartingPrices {
  room: number | null
  vehicle: number | null
  boat: number | null
}

export interface AdminLoginResult {
  token: string
  username: string
  expiresIn: string
}
