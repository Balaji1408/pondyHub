/** Curated Google-style ratings for Pondy Hub places (used when live Places API is unavailable). */
export const PLACE_GOOGLE_META: Record<
  string,
  { rating: number; reviewCount: number; snippet: string }
> = {
  'Café des Arts': {
    rating: 4.6,
    reviewCount: 2847,
    snippet: 'Charming courtyard, excellent croissants — a White Town essential.',
  },
  'Bread & Breakfast': {
    rating: 4.5,
    reviewCount: 1623,
    snippet: 'Great brunch spot near the promenade with friendly service.',
  },
  'Le Café Seaside': {
    rating: 4.3,
    reviewCount: 5120,
    snippet: 'Classic beachfront café — go for the views and filter coffee.',
  },
  'Villa Shanti Dining': {
    rating: 4.7,
    reviewCount: 981,
    snippet: 'Elegant heritage setting with refined French–Indian plates.',
  },
  'ECR Roadside Dosa Hut': {
    rating: 4.4,
    reviewCount: 734,
    snippet: 'Crispy dosas late into the night — locals love it.',
  },
  'Fisherman Catch Stall': {
    rating: 4.5,
    reviewCount: 412,
    snippet: 'Fresh catch fried to order near Serenity Beach.',
  },
}

/** Curated Google-style ratings for Pondy stays. */
export const ROOM_GOOGLE_META: Record<
  string,
  { rating: number; reviewCount: number; snippet: string }
> = {
  'Maison Blanche Suite': {
    rating: 4.8,
    reviewCount: 312,
    snippet: 'Beautiful heritage suite — quiet courtyard and thoughtful breakfast.',
  },
  'Promenade Sea View': {
    rating: 4.9,
    reviewCount: 528,
    snippet: 'Waking up to Bay of Bengal views is unforgettable.',
  },
  'Family Villa Auroville Edge': {
    rating: 4.7,
    reviewCount: 186,
    snippet: 'Spacious villa perfect for families near Auroville.',
  },
  'Palm Court Family Stay': {
    rating: 4.6,
    reviewCount: 241,
    snippet: 'Kid-friendly stay with easy access to Serenity Beach.',
  },
  'Friends Loft Beach House': {
    rating: 4.5,
    reviewCount: 167,
    snippet: 'Fun loft for groups — bikes on site are a bonus.',
  },
  'Backpacker Pods Pondy': {
    rating: 4.4,
    reviewCount: 894,
    snippet: 'Clean pods, great location near Mission Street cafés.',
  },
}

/**
 * Hub rooms are branded names — map each to a real Pondy lodging query
 * so Places Text returns genuine Google photos for that area/style.
 */
export const ROOM_PHOTO_QUERY: Record<string, string> = {
  'Maison Blanche Suite': 'Villa Shanti hotel White Town Puducherry',
  'Promenade Sea View': 'The Promenade Pondicherry Goubert Avenue',
  'Family Villa Auroville Edge': 'Auroville Guest House Auroville Road Puducherry',
  'Palm Court Family Stay': 'Le Pondy resort Serenity Beach Puducherry',
  'Friends Loft Beach House': 'Paradise Beach Pondicherry guesthouse',
  'Backpacker Pods Pondy': 'Zostel Pondicherry Mission Street',
}

export function googleReviewsUrl(name: string, location?: string | null) {
  const q = [name, location, 'Puducherry'].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}
