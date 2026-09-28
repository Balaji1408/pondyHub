import type { Room } from '../types'

export function roomGuestRange(room: Room) {
  const min = room.category === 'couples' ? 2 : Math.max(1, room.minMembers)
  return { min, max: Math.max(min, room.maxMembers) }
}

export function roomPriceForGuests(room: Room, guests: number) {
  return room.pricePerNight + Math.max(0, guests - room.baseGuests) * room.extraGuestPrice
}

export function extraGuests(room: Room, guests: number) {
  return Math.max(0, guests - room.baseGuests)
}

export function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`
}
