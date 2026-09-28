import { Router } from 'express';
import { timingSafeEqual } from 'crypto';
import { createAdminToken, getAdminCredentials, requireAdmin } from '../auth.js';
import { pool } from '../db.js';
import { parseJson } from '../mappers.js';

const router = Router();

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const creds = getAdminCredentials();

  if (
    typeof username !== 'string' ||
    typeof password !== 'string' ||
    !safeEqual(username, creds.username) ||
    !safeEqual(password, creds.password)
  ) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = createAdminToken(creds.username);
  res.json({
    token,
    username: creds.username,
    expiresIn: '12h',
  });
});

router.get('/me', requireAdmin, (req, res) => {
  const admin = (req as typeof req & { admin?: { username: string } }).admin;
  res.json({ username: admin?.username ?? 'admin' });
});

function capitalize(value: unknown) {
  const s = String(value ?? '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function bookedItemDetail(b: Record<string, unknown>) {
  switch (b.booking_type) {
    case 'room':
      return [capitalize(b.room_category), b.room_type, b.room_location];
    case 'vehicle':
      return [
        capitalize(b.vehicle_type),
        Number(b.vehicle_with_driver) ? 'With driver' : 'Self drive',
        b.vehicle_seats != null ? `${b.vehicle_seats} seats` : null,
      ];
    case 'boat':
      return [capitalize(b.boat_type), b.boat_seats != null ? `${b.boat_seats} seats` : null];
    default:
      return [];
  }
}

function mapBooking(b: Record<string, unknown>) {
  return {
    id: b.id,
    confirmationId: b.confirmation_id,
    type: b.booking_type,
    itemId: b.item_id,
    date: b.booking_date,
    slot: b.slot,
    guests: b.guests,
    status: b.status,
    guestName: b.guest_name,
    guestPhone: b.guest_phone,
    totalAmount: b.total_amount != null ? Number(b.total_amount) : null,
    createdAt: b.created_at,
    extras: parseJson(b.extras, null as Record<string, unknown> | null),
    item:
      b.item_name != null
        ? {
            name: b.item_name,
            detail: bookedItemDetail(b).filter(Boolean).join(' · '),
            image: parseJson(b.item_images, [] as string[])[0] ?? null,
          }
        : null,
  };
}

router.get('/bookings', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*,
              COALESCE(r.name, v.name, bt.name) AS item_name,
              COALESCE(r.images, v.images, bt.images) AS item_images,
              r.category AS room_category, r.room_type, r.location AS room_location,
              v.type AS vehicle_type, v.with_driver AS vehicle_with_driver, v.seats AS vehicle_seats,
              bt.type AS boat_type, bt.seats AS boat_seats
         FROM bookings b
         LEFT JOIN rooms r ON b.booking_type = 'room' AND r.id = b.item_id
         LEFT JOIN vehicles v ON b.booking_type = 'vehicle' AND v.id = b.item_id
         LEFT JOIN boats bt ON b.booking_type = 'boat' AND bt.id = b.item_id
        ORDER BY b.created_at DESC
        LIMIT 500`
    );
    const list = (rows as Record<string, unknown>[]).map(mapBooking);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.get('/stats', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN booking_type = 'room' THEN 1 ELSE 0 END) AS rooms,
         SUM(CASE WHEN booking_type = 'vehicle' THEN 1 ELSE 0 END) AS vehicles,
         SUM(CASE WHEN booking_type = 'boat' THEN 1 ELSE 0 END) AS boats,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
         COALESCE(SUM(total_amount), 0) AS revenue
       FROM bookings`
    );
    const s = (rows as Record<string, unknown>[])[0] ?? {};
    res.json({
      total: Number(s.total ?? 0),
      rooms: Number(s.rooms ?? 0),
      vehicles: Number(s.vehicles ?? 0),
      boats: Number(s.boats ?? 0),
      confirmed: Number(s.confirmed ?? 0),
      revenue: Number(s.revenue ?? 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.patch('/bookings/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body ?? {};
    const allowed = ['confirmed', 'cancelled', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const [result] = await pool.query(
      `UPDATE bookings SET status = :status WHERE confirmation_id = :id`,
      { status, id: req.params.id }
    );
    const info = result as { affectedRows?: number };
    if (!info.affectedRows) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ confirmationId: req.params.id, status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

const PRICE_TABLES = {
  rooms: { table: 'rooms', column: 'price_per_night' },
  vehicles: { table: 'vehicles', column: 'price_per_day' },
  boats: { table: 'boats', column: 'price' },
} as const;

type PriceKind = keyof typeof PRICE_TABLES;

function isPriceKind(value: string): value is PriceKind {
  return Object.prototype.hasOwnProperty.call(PRICE_TABLES, value);
}

router.get('/catalog', requireAdmin, async (_req, res) => {
  try {
    const [[rooms], [vehicles], [boats]] = await Promise.all([
      pool.query(
        `SELECT id, name, category, room_type, min_members, max_members,
                price_per_night, base_guests, extra_guest_price
         FROM rooms ORDER BY rating DESC, id`
      ),
      pool.query(
        `SELECT id, name, type, with_driver, available, price_per_day FROM vehicles
         ORDER BY available DESC, rating DESC, id`
      ),
      pool.query(`SELECT id, name, type, seats, price FROM boats ORDER BY rating DESC, id`),
    ]);
    res.json({
      rooms: (rooms as Record<string, unknown>[]).map((r) => ({
        id: r.id,
        name: r.name,
        detail: `${r.category} · ${r.room_type} · ${r.min_members}–${r.max_members} guests · base covers ${r.base_guests}`,
        price: Number(r.price_per_night),
        extraGuestPrice: Number(r.extra_guest_price),
      })),
      vehicles: (vehicles as Record<string, unknown>[]).map((v) => ({
        id: v.id,
        name: v.name,
        detail: `${v.type} · ${v.with_driver ? 'with driver' : 'self drive'}${
          v.available ? '' : ' · unavailable'
        }`,
        price: Number(v.price_per_day),
      })),
      boats: (boats as Record<string, unknown>[]).map((b) => ({
        id: b.id,
        name: b.name,
        detail: `${b.type} · ${b.seats} seats`,
        price: Number(b.price),
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

router.patch('/catalog/:kind/:id/price', requireAdmin, async (req, res) => {
  try {
    const kind = String(req.params.kind);
    if (!isPriceKind(kind)) {
      return res.status(400).json({ error: 'Invalid item type' });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid item id' });
    }
    const body = req.body ?? {};
    const round = (n: number) => Math.round(n * 100) / 100;
    const sets: string[] = [];
    const params: Record<string, number> = { id };

    if (body.price != null) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
        return res.status(400).json({ error: 'Price must be between ₹1 and ₹1,00,00,000' });
      }
      sets.push(`${PRICE_TABLES[kind].column} = :price`);
      params.price = round(price);
    }
    if (body.extraGuestPrice != null) {
      if (kind !== 'rooms') {
        return res.status(400).json({ error: 'Extra guest price applies to rooms only' });
      }
      const extra = Number(body.extraGuestPrice);
      if (!Number.isFinite(extra) || extra < 0 || extra > 10_000_000) {
        return res.status(400).json({ error: 'Extra guest price must be ₹0 or more' });
      }
      sets.push('extra_guest_price = :extra');
      params.extra = round(extra);
    }
    if (!sets.length) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const [result] = await pool.query(
      `UPDATE ${PRICE_TABLES[kind].table} SET ${sets.join(', ')} WHERE id = :id`,
      params
    );
    const info = result as { affectedRows?: number };
    if (!info.affectedRows) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ kind, id, price: params.price, extraGuestPrice: params.extra });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

export default router;
