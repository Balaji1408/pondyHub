import type { GallerySlot, Room } from '../types'

export const GALLERY_SLOTS: GallerySlot[] = ['exterior', 'bedroom', 'bathroom', 'living']

/** Fallback HD shots when Google Place Photos are unavailable (no API key). */
const ROOM_GALLERIES: Record<
  string,
  { exterior?: string; bedroom: string; bathroom: string; living: string }
> = {
  'maison-blanche-suite': {
    bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&q=85',
  },
  'promenade-sea-view': {
    bedroom: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85',
  },
  'family-villa-auroville': {
    bedroom: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&q=85',
  },
  'palm-court-family': {
    bedroom: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1600&q=85',
  },
  'friends-loft-beach': {
    bedroom: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1600&q=85',
  },
  'backpacker-pods': {
    bedroom: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85',
    bathroom: 'https://images.unsplash.com/photo-1584622781867-64310d961839?w=1600&q=85',
    living: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=85',
  },
}

const DEFAULT_GALLERY = {
  bedroom: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&q=85',
  bathroom: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=85',
  living: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1600&q=85',
}

/** The image shown for each slot: admin upload, then Google Place Photos, then the built-in shots. */
export function roomGallerySources(room: Room): Record<GallerySlot, string> {
  const custom = room.gallery ?? {}
  const google = room.photosFromGoogle ? room.images.filter(Boolean) : []
  let defaults: Record<GallerySlot, string>
  if (google.length > 0) {
    const pick = (i: number) => google[Math.min(i, google.length - 1)]!
    defaults = { exterior: pick(0), bedroom: pick(1), bathroom: pick(2), living: pick(3) }
  } else {
    const shots = ROOM_GALLERIES[room.slug] ?? DEFAULT_GALLERY
    defaults = {
      exterior: ROOM_GALLERIES[room.slug]?.exterior ?? room.images[0] ?? DEFAULT_GALLERY.living,
      bedroom: shots.bedroom,
      bathroom: shots.bathroom,
      living: shots.living,
    }
  }
  return {
    exterior: custom.exterior || defaults.exterior,
    bedroom: custom.bedroom || defaults.bedroom,
    bathroom: custom.bathroom || defaults.bathroom,
    living: custom.living || defaults.living,
  }
}
