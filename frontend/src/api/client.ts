import type {
  AdminBooking,
  AdminCatalog,
  AdminLoginResult,
  AdminStats,
  BookingPayload,
  BookingResult,
  Boat,
  Place,
  PriceFields,
  PriceKind,
  Room,
  StartingPrices,
  Vehicle,
} from '../types'
import { getAdminToken } from '../auth/session'

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
  boat: (id: number) => getJson<Boat>(`/api/boats/${id}`),
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
    getJson<{ username: string }>('/api/admin/me', {
      headers: adminHeaders(),
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
}
