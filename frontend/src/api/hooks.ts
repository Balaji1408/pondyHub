import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  BoatBookingPayload,
  BookingPayload,
  GallerySlot,
  PriceFields,
  PriceKind,
} from '../types'
import { isAdminLoggedIn } from '../auth/session'

export function useRooms(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: () => api.rooms(params),
  })
}

export function useVehicles(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => api.vehicles(params),
  })
}

export function useBoats(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['boats', params],
    queryFn: () => api.boats(params),
  })
}

export function useBoat(id: number, date?: string) {
  return useQuery({
    queryKey: ['boat', id, date],
    queryFn: () => api.boat(id, date),
    enabled: Number.isInteger(id) && id > 0,
    placeholderData: keepPreviousData,
  })
}

export function useBoatSeats(id: number, date: string | null, slotId: number | null) {
  return useQuery({
    queryKey: ['boat-seats', id, date, slotId],
    queryFn: () => api.boatSeats(id, date!, slotId!),
    enabled: Boolean(date && slotId),
    staleTime: 15_000,
  })
}

export function useCreateBoatBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BoatBookingPayload) => api.createBoatBooking(payload),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['boat'] })
      void qc.invalidateQueries({ queryKey: ['boats'] })
      void qc.invalidateQueries({ queryKey: ['boat-seats'] })
      void qc.invalidateQueries({ queryKey: ['admin-bookings'] })
      void qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function usePlaces(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['places', params],
    queryFn: () => api.places(params),
  })
}

export function useStartingPrices() {
  return useQuery({
    queryKey: ['starting-prices'],
    queryFn: () => api.startingPrices(),
  })
}

export function useCreateBooking() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: BookingPayload) => api.createBooking(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-bookings'] })
      void qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useAdminBookings() {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => api.adminBookings(),
    enabled: isAdminLoggedIn(),
  })
}

export function useAdminStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.adminStats(),
    enabled: isAdminLoggedIn(),
  })
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ confirmationId, status }: { confirmationId: string; status: string }) =>
      api.updateBookingStatus(confirmationId, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-bookings'] })
      void qc.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })
}

export function useAdminCatalog() {
  return useQuery({
    queryKey: ['admin-catalog'],
    queryFn: () => api.adminCatalog(),
    enabled: isAdminLoggedIn(),
  })
}

export function useUpdateItemPrice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, id, fields }: { kind: PriceKind; id: number; fields: PriceFields }) =>
      api.updateItemPrice(kind, id, fields),
    onSuccess: (_data, { kind }) => {
      void qc.invalidateQueries({ queryKey: ['admin-catalog'] })
      void qc.invalidateQueries({ queryKey: [kind] })
      void qc.invalidateQueries({ queryKey: ['starting-prices'] })
    },
  })
}

export function useUpdateRoomPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, slot, image }: { id: number; slot: GallerySlot; image: string | null }) =>
      image ? api.uploadRoomPhoto(id, slot, image) : api.resetRoomPhoto(id, slot),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}
