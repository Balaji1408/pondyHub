/** Parse JSON columns that may arrive as string or already-parsed. */
export function parseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

/** IST "open now" from TIME columns (HH:MM:SS). Handles overnight ranges. */
export function isOpenNow(opensAt: string | null, closesAt: string | null, now = new Date()): boolean {
  if (!opensAt || !closesAt) return false;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  const s = Number(parts.find((p) => p.type === 'second')?.value ?? 0);
  const nowSec = h * 3600 + m * 60 + s;

  const toSec = (t: string) => {
    const [hh, mm, ss = '0'] = t.split(':');
    return Number(hh) * 3600 + Number(mm) * 60 + Number(ss);
  };
  const open = toSec(opensAt.slice(0, 8));
  const close = toSec(closesAt.slice(0, 8));
  if (open === close) return true;
  if (close < open) return nowSec >= open || nowSec < close;
  return nowSec >= open && nowSec < close;
}

export function mapRoom(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    roomType: row.room_type,
    minMembers: row.min_members,
    maxMembers: row.max_members,
    pricePerNight: Number(row.price_per_night),
    baseGuests: Number(row.base_guests ?? row.min_members ?? 1),
    extraGuestPrice: Number(row.extra_guest_price ?? 0),
    description: row.description,
    location: row.location,
    images: parseJson(row.images, [] as string[]),
    amenities: parseJson(row.amenities, [] as string[]),
    rating: Number(row.rating),
  };
}

/** Nightly room price: the base rate covers `baseGuests`; each guest beyond that adds `extraGuestPrice`. */
export function roomPriceForGuests(
  room: { pricePerNight: number; baseGuests: number; extraGuestPrice: number },
  guests: number
) {
  return room.pricePerNight + Math.max(0, guests - room.baseGuests) * room.extraGuestPrice;
}

export function mapVehicle(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    withDriver: Boolean(row.with_driver),
    pricePerDay: Number(row.price_per_day),
    description: row.description,
    seats: row.seats,
    images: parseJson(row.images, [] as string[]),
    rating: Number(row.rating),
    available: Boolean(row.available),
  };
}

export function mapBoat(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    seats: row.seats,
    price: Number(row.price),
    description: row.description,
    slots: parseJson(row.slots, [] as string[]),
    routes: parseJson(row.routes, [] as unknown[]),
    images: parseJson(row.images, [] as string[]),
    rating: Number(row.rating),
  };
}

export function mapPlace(row: Record<string, unknown>) {
  const opensAt = row.opens_at as string | null;
  const closesAt = row.closes_at as string | null;
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    description: row.description,
    location: row.location,
    opensAt,
    closesAt,
    bestVisitTime: row.best_visit_time,
    isSeafoodSpot: Boolean(row.is_seafood_spot),
    nearRoomId: row.near_room_id,
    nearBeachId: row.near_beach_id,
    images: parseJson(row.images, [] as string[]),
    rating: Number(row.rating),
    openNow: isOpenNow(opensAt, closesAt),
  };
}
