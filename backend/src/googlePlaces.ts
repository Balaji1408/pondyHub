/** Optional live Google Places (New) enrichment when GOOGLE_MAPS_API_KEY is set. */
import { PLACE_GOOGLE_META, ROOM_GOOGLE_META, ROOM_PHOTO_QUERY } from './placeReviews.js'

export type GoogleMeta = {
  rating: number
  reviewCount: number
  snippet: string
  /** Photo resource names: places/{id}/photos/{ref} — serve via /api/google-photo */
  photoNames: string[]
}

type CacheEntry = { value: GoogleMeta; at: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

function cacheKey(kind: string, name: string, location: string | null) {
  return `${kind}|${name}|${location ?? ''}`
}

function curatedMeta(
  name: string,
  fallbackRating: number,
  kind: 'place' | 'room',
): GoogleMeta {
  const curated = (kind === 'room' ? ROOM_GOOGLE_META : PLACE_GOOGLE_META)[name]
  return {
    rating: curated?.rating ?? fallbackRating,
    reviewCount: curated?.reviewCount ?? Math.max(40, Math.round(fallbackRating * 180)),
    snippet: curated?.snippet ?? '',
    photoNames: [],
  }
}

function searchQuery(name: string, location: string | null, kind: 'place' | 'room') {
  if (kind === 'room') {
    return ROOM_PHOTO_QUERY[name] ?? [name, location, 'hotel Puducherry India'].filter(Boolean).join(', ')
  }
  return [name, location, 'Puducherry India'].filter(Boolean).join(', ')
}

/** Build a same-origin proxy URL for an HD Place photo (keeps API key server-side). */
export function googlePhotoProxyUrl(photoName: string, maxPx = 1600) {
  const w = Math.min(4800, Math.max(200, maxPx))
  return `/api/google-photo?name=${encodeURIComponent(photoName)}&w=${w}`
}

export async function resolveGoogleMeta(
  name: string,
  location: string | null,
  fallbackRating: number,
  kind: 'place' | 'room' = 'place',
): Promise<GoogleMeta> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim()
  const fallback = curatedMeta(name, fallbackRating, kind)

  if (!key) return fallback

  const ck = cacheKey(kind, name, location)
  const hit = cache.get(ck)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'places.displayName,places.rating,places.userRatingCount,places.reviews,places.photos',
      },
      body: JSON.stringify({
        textQuery: searchQuery(name, location, kind),
        maxResultCount: 1,
        locationBias: {
          circle: {
            center: { latitude: 11.9416, longitude: 79.8083 },
            radius: 20000,
          },
        },
      }),
    })

    if (!res.ok) {
      console.warn('Google Places search failed', res.status, await res.text().catch(() => ''))
      return fallback
    }

    const data = (await res.json()) as {
      places?: Array<{
        rating?: number
        userRatingCount?: number
        reviews?: Array<{ text?: { text?: string } }>
        photos?: Array<{ name?: string }>
      }>
    }
    const place = data.places?.[0]
    if (!place) return fallback

    const curated = (kind === 'room' ? ROOM_GOOGLE_META : PLACE_GOOGLE_META)[name]
    const value: GoogleMeta = {
      rating: place.rating ?? curated?.rating ?? fallbackRating,
      reviewCount: place.userRatingCount ?? curated?.reviewCount ?? 0,
      snippet: place.reviews?.[0]?.text?.text?.slice(0, 140) || curated?.snippet || '',
      photoNames: (place.photos ?? [])
        .map((p) => p.name)
        .filter((n): n is string => Boolean(n))
        .slice(0, 4),
    }

    cache.set(ck, { value, at: Date.now() })
    return value
  } catch (err) {
    console.warn('Google Places error', err)
    return fallback
  }
}
