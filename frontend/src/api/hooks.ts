import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type {
  BoatBookingPayload,
  BookingPayload,
  CreateOwnerRoomPayload,
  CustomerRegisterPayload,
  GallerySlot,
  GuideContent,
  PriceFields,
  PriceKind,
} from '../types'
import { isAdminLoggedIn, isCustomerLoggedIn } from '../auth/session'

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

export function useDeleteRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteRoom(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-catalog'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
      void qc.invalidateQueries({ queryKey: ['admin-pending-rooms'] })
      void qc.invalidateQueries({ queryKey: ['owner-rooms'] })
      void qc.invalidateQueries({ queryKey: ['starting-prices'] })
    },
  })
}

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.adminUsers(),
    enabled: isAdminLoggedIn(),
  })
}

export function useCreateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      api.createAdminUser(username, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useUpdateAdminUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      fields,
    }: {
      id: number
      fields: { isActive?: boolean; password?: string }
    }) => api.updateAdminUser(id, fields),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useAdminCustomers(search = '') {
  const q = search.trim()
  return useQuery({
    queryKey: ['admin-customers', q],
    queryFn: () => api.adminCustomers(q || undefined),
    enabled: isAdminLoggedIn(),
    placeholderData: (prev) => prev,
    refetchOnMount: 'always',
  })
}

export function useUpdateCustomerStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: number
      status: 'approved' | 'rejected'
      adminNote?: string
    }) => api.updateCustomerStatus(id, status, adminNote),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-customers'] })
    },
  })
}

export function useResetCustomerPassword() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.resetCustomerPassword(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-customers'] })
    },
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.deleteCustomer(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-customers'] })
      void qc.invalidateQueries({ queryKey: ['admin-pending-rooms'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useAdminPendingRooms() {
  return useQuery({
    queryKey: ['admin-pending-rooms'],
    queryFn: () => api.adminPendingRooms(),
    enabled: isAdminLoggedIn(),
  })
}

export function useUpdateRoomListingStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'published' | 'rejected' | 'pending' }) =>
      api.updateRoomListingStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-pending-rooms'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
      void qc.invalidateQueries({ queryKey: ['admin-catalog'] })
    },
  })
}

export function useCustomerRegister() {
  return useMutation({
    mutationFn: (payload: CustomerRegisterPayload) => api.customerRegister(payload),
  })
}

export function useCustomerLogin() {
  return useMutation({
    mutationFn: ({ mobile, password }: { mobile: string; password: string }) =>
      api.customerLogin(mobile, password),
  })
}

export function useCustomerMe() {
  return useQuery({
    queryKey: ['customer-me'],
    queryFn: () => api.customerMe(),
    enabled: isCustomerLoggedIn(),
  })
}

export function useCustomerChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string
      newPassword: string
    }) => api.customerChangePassword(currentPassword, newPassword),
  })
}

export function useOwnerRooms() {
  return useQuery({
    queryKey: ['owner-rooms'],
    queryFn: () => api.ownerRooms(),
    enabled: isCustomerLoggedIn(),
  })
}

export function useClaimOwnerRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (roomId: number) => api.claimOwnerRoom(roomId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner-rooms'] })
      void qc.invalidateQueries({ queryKey: ['customer-me'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useCreateOwnerRoom() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOwnerRoomPayload) => api.createOwnerRoom(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner-rooms'] })
      void qc.invalidateQueries({ queryKey: ['customer-me'] })
    },
  })
}

export function useUpdateOwnerRoomPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, slot, image }: { id: number; slot: GallerySlot; image: string | null }) =>
      image ? api.uploadOwnerRoomPhoto(id, slot, image) : api.resetOwnerRoomPhoto(id, slot),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['owner-rooms'] })
      void qc.invalidateQueries({ queryKey: ['customer-me'] })
      void qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useGuide() {
  return useQuery({
    queryKey: ['guide'],
    queryFn: () => api.guide(),
  })
}

export function useAdminGuide() {
  return useQuery({
    queryKey: ['admin-guide'],
    queryFn: () => api.adminGuide(),
    enabled: isAdminLoggedIn(),
  })
}

export function useSaveGuide() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: GuideContent) => api.saveGuide(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['guide'] })
      void qc.invalidateQueries({ queryKey: ['admin-guide'] })
    },
  })
}
