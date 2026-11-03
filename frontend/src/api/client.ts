import type {
  AdminBooking,
  AdminCatalog,
  AdminCustomer,
  AdminLoginResult,
  AdminStaffUser,
  AdminStats,
  BookingPayload,
  BookingResult,
  Boat,
  BoatBookingPayload,
  BoatBookingResult,
  BoatSeats,
  CreateOwnerRoomPayload,
  CustomerLoginResult,
  CustomerProfile,
  CustomerRegisterPayload,
  GallerySlot,
  GuideContent,
  OwnerRoomsResult,
  Place,
  PriceFields,
  PriceKind,
  Room,
  StartingPrices,
  Vehicle,
} from '../types'
import { getAdminToken, getCustomerToken } from '../auth/session'

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

function adminHeaders(): HeadersInit {
  const token = getAdminToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function customerHeaders(): HeadersInit {
  const token = getCustomerToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const api = {
  rooms: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params)
    const s = q.toString()
    return getJson<Room[]>(`/api/rooms${s ? `?${s}` : ''}`)
  },
  room: (id: number) => getJson<Room>(`/api/rooms/${id}`),
  vehicles: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params)
    const s = q.toString()
    return getJson<Vehicle[]>(`/api/vehicles${s ? `?${s}` : ''}`)
  },
  boats: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params)
    const s = q.toString()
    return getJson<Boat[]>(`/api/boats${s ? `?${s}` : ''}`)
  },
  boat: (id: number, date?: string) =>
    getJson<Boat>(`/api/boats/${id}${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  boatSeats: (id: number, date: string, slotId: number) =>
    getJson<BoatSeats>(
      `/api/boats/${id}/seats?${new URLSearchParams({ date, slotId: String(slotId) })}`
    ),
  createBoatBooking: (payload: BoatBookingPayload) =>
    getJson<BoatBookingResult>('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  places: (params?: Record<string, string>) => {
    const q = new URLSearchParams(params)
    const s = q.toString()
    return getJson<Place[]>(`/api/places${s ? `?${s}` : ''}`)
  },
  place: (id: number) => getJson<Place>(`/api/places/${id}`),
  startingPrices: () => getJson<StartingPrices>('/api/prices/from'),
  createBooking: async (payload: BookingPayload) => {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error((body as { error?: string }).error || 'Booking failed')
    }
    return res.json() as Promise<BookingResult>
  },
  adminLogin: (username: string, password: string) =>
    getJson<AdminLoginResult>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  adminMe: () =>
    getJson<{ id: number; username: string; role: string }>('/api/admin/me', {
      headers: adminHeaders(),
    }),
  adminUsers: () =>
    getJson<AdminStaffUser[]>('/api/admin/users', { headers: adminHeaders() }),
  createAdminUser: (username: string, password: string) =>
    getJson<AdminStaffUser>('/api/admin/users', {
      method: 'POST',
      headers: adminHeaders(),
      body: JSON.stringify({ username, password }),
    }),
  updateAdminUser: (
    id: number,
    fields: { isActive?: boolean; password?: string }
  ) =>
    getJson<AdminStaffUser>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify(fields),
    }),
  adminBookings: () =>
    getJson<AdminBooking[]>('/api/admin/bookings', {
      headers: adminHeaders(),
    }),
  adminStats: () =>
    getJson<AdminStats>('/api/admin/stats', {
      headers: adminHeaders(),
    }),
  updateBookingStatus: (confirmationId: string, status: string) =>
    getJson<{ confirmationId: string; status: string }>(
      `/api/admin/bookings/${encodeURIComponent(confirmationId)}/status`,
      {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({ status }),
      }
    ),
  adminCatalog: () =>
    getJson<AdminCatalog>('/api/admin/catalog', {
      headers: adminHeaders(),
    }),
  updateItemPrice: (kind: PriceKind, id: number, fields: PriceFields) =>
    getJson<{ kind: PriceKind; id: number } & PriceFields>(
      `/api/admin/catalog/${kind}/${id}/price`,
      {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify(fields),
      }
    ),
  uploadRoomPhoto: (id: number, slot: GallerySlot, image: string) =>
    getJson<{ id: number; slot: GallerySlot; url: string }>(
      `/api/admin/rooms/${id}/gallery/${slot}`,
      {
        method: 'PUT',
        headers: adminHeaders(),
        body: JSON.stringify({ image }),
      }
    ),
  resetRoomPhoto: (id: number, slot: GallerySlot) =>
    getJson<{ id: number; slot: GallerySlot }>(`/api/admin/rooms/${id}/gallery/${slot}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),
  deleteRoom: (id: number) =>
    getJson<{ id: number; deleted: boolean; message: string }>(`/api/admin/rooms/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),
  guide: () => getJson<GuideContent>('/api/guide'),
  adminGuide: () => getJson<GuideContent>('/api/admin/guide', { headers: adminHeaders() }),
  saveGuide: (payload: GuideContent) =>
    getJson<GuideContent>('/api/admin/guide', {
      method: 'PUT',
      headers: adminHeaders(),
      body: JSON.stringify(payload),
    }),
  adminCustomers: (q?: string) => {
    const params = new URLSearchParams()
    const trimmed = q?.trim()
    if (trimmed) params.set('q', trimmed)
    const qs = params.toString()
    return getJson<{
      items: AdminCustomer[]
      counts: { pending: number; approved: number; rejected: number; total: number }
    }>(`/api/admin/customers${qs ? `?${qs}` : ''}`, { headers: adminHeaders() })
  },
  updateCustomerStatus: (id: number, status: 'approved' | 'rejected', adminNote?: string) =>
    getJson<{ id: number; status: string }>(`/api/admin/customers/${id}/status`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ status, adminNote }),
    }),
  resetCustomerPassword: (id: number) =>
    getJson<{ id: number; mustChangePassword: boolean; message: string }>(
      `/api/admin/customers/${id}/reset-password`,
      { method: 'POST', headers: adminHeaders() }
    ),
  deleteCustomer: (id: number) =>
    getJson<{ id: number; deleted: boolean; message: string }>(`/api/admin/customers/${id}`, {
      method: 'DELETE',
      headers: adminHeaders(),
    }),
  adminPendingRooms: () =>
    getJson<Room[]>('/api/admin/rooms/pending', { headers: adminHeaders() }),
  updateRoomListingStatus: (id: number, status: 'published' | 'rejected' | 'pending') =>
    getJson<Room>(`/api/admin/rooms/${id}/listing-status`, {
      method: 'PATCH',
      headers: adminHeaders(),
      body: JSON.stringify({ status }),
    }),
  customerRegister: (payload: CustomerRegisterPayload) =>
    getJson<{ id: number; status: string; message: string }>('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  customerLogin: (mobile: string, password: string) =>
    getJson<CustomerLoginResult>('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password }),
    }),
  customerMe: () =>
    getJson<CustomerProfile>('/api/customers/me', { headers: customerHeaders() }),
  customerChangePassword: (currentPassword: string, newPassword: string) =>
    getJson<{ ok: boolean; mustChangePassword: boolean }>('/api/customers/change-password', {
      method: 'POST',
      headers: customerHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  ownerRooms: () =>
    getJson<OwnerRoomsResult>('/api/customers/rooms', { headers: customerHeaders() }),
  claimOwnerRoom: (roomId: number) =>
    getJson<Room>('/api/customers/rooms/claim', {
      method: 'POST',
      headers: customerHeaders(),
      body: JSON.stringify({ roomId }),
    }),
  createOwnerRoom: (payload: CreateOwnerRoomPayload) =>
    getJson<Room>('/api/customers/rooms', {
      method: 'POST',
      headers: customerHeaders(),
      body: JSON.stringify(payload),
    }),
  uploadOwnerRoomPhoto: (id: number, slot: GallerySlot, image: string) =>
    getJson<{ id: number; slot: GallerySlot; url: string }>(
      `/api/customers/rooms/${id}/gallery/${slot}`,
      {
        method: 'PUT',
        headers: customerHeaders(),
        body: JSON.stringify({ image }),
      }
    ),
  resetOwnerRoomPhoto: (id: number, slot: GallerySlot) =>
    getJson<{ id: number; slot: GallerySlot }>(`/api/customers/rooms/${id}/gallery/${slot}`, {
      method: 'DELETE',
      headers: customerHeaders(),
    }),
}
