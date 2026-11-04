import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  createAdminToken,
  requireAdmin,
  requireSuperAdmin,
  type AdminRequest,
} from '../auth.js';
import { pool } from '../db.js';
import { mapRoom, parseJson } from '../mappers.js';
import { deleteUpload, saveDataUrlImage, UploadError } from '../uploads.js';
import { getCustomerDefaultPassword, hashPassword, verifyPassword } from '../password.js';
import { DEFAULT_GUIDE, type GuideContent } from '../guideDefault.js';
import { loadGuide } from './guide.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, password_hash, role, is_active
       FROM users WHERE username = :username LIMIT 1`,
      { username }
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    const ok = await verifyPassword(password, String(user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid username or password' });

    const role = user.role === 'super_admin' ? 'super_admin' : 'admin';
    const token = createAdminToken({
      id: Number(user.id),
      username: String(user.username),
      role,
    });
    res.json({
      token,
      username: String(user.username),
      role,
      expiresIn: '12h',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAdmin, (req, res) => {
  const admin = (req as AdminRequest).admin!;
  res.json({
    id: admin.id,
    username: admin.username,
    role: admin.role,
  });
});

router.get('/users', requireSuperAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT u.id, u.username, u.role, u.is_active, u.created_at,
             c.username AS created_by_username
      FROM users u
      LEFT JOIN users c ON c.id = u.created_by
      ORDER BY FIELD(u.role, 'super_admin', 'admin'), u.username
    `);
    res.json(
      rows.map((r) => ({
        id: Number(r.id),
        username: String(r.username),
        role: r.role,
        isActive: Boolean(r.is_active),
        createdAt: r.created_at,
        createdByUsername: r.created_by_username ?? null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.post('/users', requireSuperAdmin, async (req, res) => {
  try {
    const admin = (req as AdminRequest).admin!;
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username may only use letters, numbers, . _ -' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM users WHERE username = :username LIMIT 1`,
      { username }
    );
    if (existing.length) {
      return res.status(409).json({ error: 'That username is already taken' });
    }

    const passwordHash = await hashPassword(password);
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (username, password_hash, role, is_active, created_by)
       VALUES (:username, :passwordHash, 'admin', 1, :createdBy)`,
      { username, passwordHash, createdBy: admin.id || null }
    );
    res.status(201).json({
      id: result.insertId,
      username,
      role: 'admin',
      isActive: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

router.patch('/users/:id', requireSuperAdmin, async (req, res) => {
  try {
    const admin = (req as AdminRequest).admin!;
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid user id' });

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, role, is_active FROM users WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const target = rows[0];

    if (Number(target.id) === admin.id) {
      return res.status(400).json({ error: 'You cannot change your own account here' });
    }
    if (target.role === 'super_admin') {
      return res.status(400).json({ error: 'Super admin accounts cannot be modified here' });
    }

    const fields: string[] = [];
    const params: Record<string, string | number> = { id };

    if (typeof req.body?.isActive === 'boolean') {
      fields.push('is_active = :isActive');
      params.isActive = req.body.isActive ? 1 : 0;
    }
    if (typeof req.body?.password === 'string' && req.body.password.length >= 6) {
      fields.push('password_hash = :passwordHash');
      params.passwordHash = await hashPassword(req.body.password);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Provide isActive and/or a new password' });
    }

    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = :id`, params);
    const [updated] = await pool.query<RowDataPacket[]>(
      `SELECT id, username, role, is_active FROM users WHERE id = :id`,
      { id }
    );
    res.json({
      id: Number(updated[0].id),
      username: String(updated[0].username),
      role: updated[0].role,
      isActive: Boolean(updated[0].is_active),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
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

function seatList(value: unknown): number[] {
  const parsed = Array.isArray(value) ? value : parseJson(value, [] as unknown[]);
  return Array.isArray(parsed) ? parsed.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
}

function hhmm(value: unknown) {
  return value != null ? String(value).slice(0, 5) : null;
}

function boatDetails(b: Record<string, unknown>, extras: Record<string, unknown> | null) {
  if (b.booking_type !== 'boat') return null;
  const adultSeats = b.adult_seats != null ? Number(b.adult_seats) : Number(extras?.adultSeats ?? b.guests ?? 0);
  const childSeats = b.child_seats != null ? Number(b.child_seats) : Number(extras?.childSeats ?? 0);
  const seats = seatList(b.selected_seats);
  return {
    pnr: (b.pnr_id as string | null) ?? (extras?.pnr as string | undefined) ?? null,
    slotName: (b.slot_name as string | null) ?? (extras?.slotName as string | undefined) ?? null,
    startTime: hhmm(b.slot_start_time) ?? hhmm(b.slot),
    endTime: hhmm(b.slot_end_time),
    reportingTime: hhmm(b.slot_reporting_time),
    adultSeats,
    childSeats,
    seats: seats.length ? seats : seatList(extras?.seats),
    departurePoint: (b.boat_departure_point as string | null) ?? null,
  };
}

function mapBooking(b: Record<string, unknown>) {
  const extras = parseJson(b.extras, null as Record<string, unknown> | null);
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
    guestEmail: b.guest_email ?? null,
    totalAmount: b.total_amount != null ? Number(b.total_amount) : null,
    createdAt: b.created_at,
    extras,
    boat: boatDetails(b, extras),
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
              bt.type AS boat_type, bt.seats AS boat_seats, bt.departure_point AS boat_departure_point,
              ts.name AS slot_name, ts.start_time AS slot_start_time, ts.end_time AS slot_end_time,
              ts.reporting_time AS slot_reporting_time
         FROM bookings b
         LEFT JOIN rooms r ON b.booking_type = 'room' AND r.id = b.item_id
         LEFT JOIN vehicles v ON b.booking_type = 'vehicle' AND v.id = b.item_id
         LEFT JOIN boats bt ON b.booking_type = 'boat' AND bt.id = b.item_id
         LEFT JOIN boat_time_slots ts ON b.booking_type = 'boat' AND ts.id = b.time_slot_id
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
      pool.query(
        `SELECT id, name, type, coach_type, seats, price, price_child FROM boats ORDER BY rating DESC, id`
      ),
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
        detail: `${b.coach_type ?? b.type} · ${b.seats} seats`,
        price: Number(b.price),
        childPrice: Number(b.price_child),
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
    if (body.childPrice != null) {
      if (kind !== 'boats') {
        return res.status(400).json({ error: 'Child price applies to boats only' });
      }
      const child = Number(body.childPrice);
      if (!Number.isFinite(child) || child < 0 || child > 10_000_000) {
        return res.status(400).json({ error: 'Child price must be ₹0 or more' });
      }
      sets.push('price_child = :child');
      params.child = round(child);
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
    res.json({
      kind,
      id,
      price: params.price,
      extraGuestPrice: params.extra,
      childPrice: params.child,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

const GALLERY_SLOTS = ['exterior', 'bedroom', 'bathroom', 'living'] as const;
type GallerySlot = (typeof GALLERY_SLOTS)[number];

function isGallerySlot(value: string): value is GallerySlot {
  return (GALLERY_SLOTS as readonly string[]).includes(value);
}

async function loadRoomGallery(id: number) {
  const [rows] = await pool.query('SELECT room_gallery FROM rooms WHERE id = :id', { id });
  const row = (rows as Record<string, unknown>[])[0];
  if (!row) return null;
  return parseJson(row.room_gallery, {} as Partial<Record<GallerySlot, string>>) ?? {};
}

function parseGalleryParams(params: Record<string, unknown>) {
  const id = Number(params.id);
  const slot = String(params.slot);
  if (!Number.isInteger(id) || id <= 0) return { error: 'Invalid room id' } as const;
  if (!isGallerySlot(slot)) return { error: 'Invalid photo type' } as const;
  return { id, slot } as const;
}

router.put('/rooms/:id/gallery/:slot', requireAdmin, async (req, res) => {
  const parsed = parseGalleryParams(req.params);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const { id, slot } = parsed;
  try {
    const gallery = await loadRoomGallery(id);
    if (!gallery) return res.status(404).json({ error: 'Room not found' });

    const url = await saveDataUrlImage(req.body?.image, 'rooms', `room-${id}-${slot}`);
    const previous = gallery[slot];
    gallery[slot] = url;
    await pool.query('UPDATE rooms SET room_gallery = :gallery WHERE id = :id', {
      id,
      gallery: JSON.stringify(gallery),
    });
    await deleteUpload(previous);
    res.json({ id, slot, url, gallery });
  } catch (err) {
    if (err instanceof UploadError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

router.delete('/rooms/:id/gallery/:slot', requireAdmin, async (req, res) => {
  const parsed = parseGalleryParams(req.params);
  if ('error' in parsed) return res.status(400).json({ error: parsed.error });
  const { id, slot } = parsed;
  try {
    const gallery = await loadRoomGallery(id);
    if (!gallery) return res.status(404).json({ error: 'Room not found' });

    const previous = gallery[slot];
    delete gallery[slot];
    await pool.query('UPDATE rooms SET room_gallery = :gallery WHERE id = :id', {
      id,
      gallery: Object.keys(gallery).length ? JSON.stringify(gallery) : null,
    });
    await deleteUpload(previous);
    res.json({ id, slot, gallery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset photo' });
  }
});

router.delete('/rooms/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid room id' });

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, images, room_gallery FROM rooms WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });

    const room = rows[0];
    await pool.query(`DELETE FROM rooms WHERE id = :id`, { id });

    const gallery =
      parseJson(room.room_gallery, {} as Partial<Record<GallerySlot, string>>) ?? {};
    const images = parseJson(room.images, [] as string[]) ?? [];
    await Promise.all([
      ...Object.values(gallery).map((url) => deleteUpload(url)),
      ...images.map((url) => deleteUpload(url)),
    ]);

    res.json({
      id,
      deleted: true,
      message: `${room.name} was deleted`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete room' });
  }
});

router.get('/customers', requireAdmin, async (req, res) => {
  try {
    const rawQ = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    // Cap length and strip LIKE wildcards — keep the filter parameterized and cheap.
    const q = rawQ.slice(0, 80).replace(/[%_\\]/g, '')
    const like = q ? `%${q}%` : null

    const [countRows] = await pool.query<RowDataPacket[]>(`
      SELECT status, COUNT(*) AS n
      FROM customers
      GROUP BY status
    `)
    const counts = { pending: 0, approved: 0, rejected: 0, total: 0 }
    for (const row of countRows) {
      const status = String(row.status) as keyof typeof counts
      const n = Number(row.n) || 0
      if (status in counts && status !== 'total') counts[status] = n
      counts.total += n
    }

    // TiDB-friendly: avoid FIELD() and correlated ORDER BY … LIMIT joins.
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        c.id, c.name, c.mobile, c.status, c.must_change_password, c.created_at,
        a.id AS application_id, a.claim_type, a.room_id, a.proposed_name, a.proposed_address,
        a.lat, a.lng, a.place_id, a.map_url, a.note, a.status AS application_status,
        a.admin_note, a.reviewed_at, a.created_at AS application_created_at,
        r.name AS room_name
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, MAX(id) AS max_id
        FROM customer_applications
        GROUP BY customer_id
      ) latest ON latest.customer_id = c.id
      LEFT JOIN customer_applications a ON a.id = latest.max_id
      LEFT JOIN rooms r ON r.id = a.room_id
      WHERE (
        :hasQ = 0
        OR c.name LIKE :like
        OR c.mobile LIKE :like
        OR c.status LIKE :like
        OR IFNULL(a.proposed_name, '') LIKE :like
        OR IFNULL(a.proposed_address, '') LIKE :like
        OR IFNULL(r.name, '') LIKE :like
      )
      ORDER BY
        CASE c.status
          WHEN 'pending' THEN 0
          WHEN 'approved' THEN 1
          WHEN 'rejected' THEN 2
          ELSE 3
        END,
        c.created_at DESC
      LIMIT 200
    `,
      { hasQ: like ? 1 : 0, like: like ?? '%' }
    )

    res.json({
      counts,
      items: rows.map((row) => ({
        id: Number(row.id),
        name: String(row.name),
        mobile: String(row.mobile),
        status: row.status,
        mustChangePassword: Boolean(row.must_change_password),
        createdAt: row.created_at,
        application: row.application_id
          ? {
              id: Number(row.application_id),
              claimType: row.claim_type,
              roomId: row.room_id == null ? null : Number(row.room_id),
              roomName: row.room_name ?? null,
              proposedName: row.proposed_name,
              proposedAddress: row.proposed_address,
              lat: row.lat == null ? null : Number(row.lat),
              lng: row.lng == null ? null : Number(row.lng),
              placeId: row.place_id,
              mapUrl: row.map_url,
              note: row.note,
              status: row.application_status,
              adminNote: row.admin_note,
              reviewedAt: row.reviewed_at,
              createdAt: row.application_created_at,
            }
          : null,
      })),
    })
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load owners' });
  }
});

router.patch('/customers/:id/status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;
    const adminNote =
      typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim().slice(0, 500) : null;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid owner id' });
    if (status !== 'approved' && status !== 'rejected') {
      return res.status(400).json({ error: 'Status must be approved or rejected' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, status FROM customers WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Owner not found' });

    if (status === 'approved') {
      const passwordHash = await hashPassword(getCustomerDefaultPassword());
      await pool.query(
        `UPDATE customers
         SET status = 'approved', password_hash = :passwordHash, must_change_password = 1
         WHERE id = :id`,
        { id, passwordHash }
      );

      // If they claimed an existing room, link ownership and hold for room re-approval.
      const [apps] = await pool.query<RowDataPacket[]>(
        `SELECT room_id, claim_type FROM customer_applications
         WHERE customer_id = :id ORDER BY id DESC LIMIT 1`,
        { id }
      );
      if (apps[0]?.claim_type === 'existing' && apps[0].room_id) {
        await pool.query(
          `UPDATE rooms SET owner_customer_id = :id WHERE id = :roomId AND owner_customer_id IS NULL`,
          { id, roomId: Number(apps[0].room_id) }
        );
      }
    } else {
      await pool.query(`UPDATE customers SET status = 'rejected' WHERE id = :id`, { id });
    }

    await pool.query(
      `UPDATE customer_applications
       SET status = :status, admin_note = :adminNote, reviewed_at = CURRENT_TIMESTAMP
       WHERE customer_id = :id AND status = 'pending'`,
      { id, status, adminNote }
    );

    res.json({
      id,
      status,
      defaultPasswordHint: status === 'approved' ? 'Owner can sign in with the default password' : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update owner status' });
  }
});

router.post('/customers/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid owner id' });
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, status FROM customers WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Owner not found' });
    if (rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Only approved owners can have a password reset' });
    }

    const passwordHash = await hashPassword(getCustomerDefaultPassword());
    await pool.query(
      `UPDATE customers
       SET password_hash = :passwordHash, must_change_password = 1
       WHERE id = :id`,
      { id, passwordHash }
    );
    res.json({
      id,
      mustChangePassword: true,
      message: 'Password reset to the default. The owner must set a new password on next login.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.delete('/customers/:id', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid owner id' });

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, status FROM customers WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Owner not found' });
    if (rows[0].status !== 'approved') {
      return res.status(400).json({ error: 'Only approved owners can be deleted from this action' });
    }

    // Unlink rooms first (keeps listings; removes ownership).
    await pool.query(`UPDATE rooms SET owner_customer_id = NULL WHERE owner_customer_id = :id`, {
      id,
    });
    await pool.query(`DELETE FROM customers WHERE id = :id`, { id });

    res.json({
      id,
      deleted: true,
      message: `${rows[0].name} was deleted`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

router.get('/rooms/pending', requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(`
      SELECT r.*, c.name AS owner_name, c.mobile AS owner_mobile
      FROM rooms r
      LEFT JOIN customers c ON c.id = r.owner_customer_id
      WHERE r.listing_status = 'pending'
      ORDER BY r.id DESC
    `);
    res.json(
      (rows as Record<string, unknown>[]).map((row) => ({
        ...mapRoom(row),
        ownerName: row.owner_name ?? null,
        ownerMobile: row.owner_mobile ?? null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load pending rooms' });
  }
});

router.patch('/rooms/:id/listing-status', requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const status = req.body?.status;
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid room id' });
    if (status !== 'published' && status !== 'rejected' && status !== 'pending') {
      return res.status(400).json({ error: 'Invalid listing status' });
    }
    const [rows] = await pool.query<RowDataPacket[]>(`SELECT id FROM rooms WHERE id = :id`, { id });
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });
    await pool.query(`UPDATE rooms SET listing_status = :status WHERE id = :id`, { id, status });
    const [updated] = await pool.query<RowDataPacket[]>(`SELECT * FROM rooms WHERE id = :id`, { id });
    res.json(mapRoom(updated[0] as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update listing status' });
  }
});

router.get('/guide', requireAdmin, async (_req, res) => {
  try {
    res.json(await loadGuide());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load guide' });
  }
});

router.put('/guide', requireSuperAdmin, async (req, res) => {
  try {
    const body = req.body as Partial<GuideContent> | null;
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const subtitle = typeof body?.subtitle === 'string' ? body.subtitle.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });
    if (!Array.isArray(body?.sections)) {
      return res.status(400).json({ error: 'Sections are required' });
    }

    const content: GuideContent = {
      title,
      subtitle,
      sections: body.sections,
      footer: {
        thanks:
          typeof body.footer?.thanks === 'string' && body.footer.thanks.trim()
            ? body.footer.thanks.trim()
            : DEFAULT_GUIDE.footer.thanks,
        phones: Array.isArray(body.footer?.phones) ? body.footer.phones : DEFAULT_GUIDE.footer.phones,
        address:
          typeof body.footer?.address === 'string' ? body.footer.address.trim() : DEFAULT_GUIDE.footer.address,
      },
    };

    await pool.query(
      `INSERT INTO guide (id, title, subtitle, content)
       VALUES (1, :title, :subtitle, :content)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         subtitle = VALUES(subtitle),
         content = VALUES(content)`,
      {
        title: content.title,
        subtitle: content.subtitle,
        content: JSON.stringify(content),
      }
    );

    res.json(await loadGuide());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save guide' });
  }
});

export default router;
