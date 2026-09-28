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

export interface Boat {
  id: number
  name: string
  type: BoatType
  seats: number
  price: number
  description: string
  slots: string[]
  routes: BoatRoute[]
  images: string[]
  rating: number
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
  totalAmount: number | null
  createdAt: string
  extras: Record<string, unknown> | null
  item: { name: string; detail: string; image: string | null } | null
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
}

export type AdminCatalog = Record<PriceKind, AdminPriceItem[]>

export type PriceFields = { price?: number; extraGuestPrice?: number }

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
