import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db.js';
import { createCustomerToken, requireCustomer, type CustomerRequest } from '../auth.js';
import { mapRoom, parseJson } from '../mappers.js';
import { hashPassword, normalizeMobile, verifyPassword } from '../password.js';
import { deleteUpload, saveDataUrlImage, UploadError } from '../uploads.js';

const router = Router();

const GALLERY_SLOTS = ['exterior', 'bedroom', 'bathroom', 'living'] as const;
type GallerySlot = (typeof GALLERY_SLOTS)[number];

function isGallerySlot(value: string): value is GallerySlot {
  return (GALLERY_SLOTS as readonly string[]).includes(value);
}

async function loadOwnedRoomGallery(roomId: number, customerId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT room_gallery FROM rooms WHERE id = :roomId AND owner_customer_id = :customerId LIMIT 1`,
    { roomId, customerId }
  );
  if (!rows.length) return null;
  return parseJson(rows[0].room_gallery, {} as Partial<Record<GallerySlot, string>>) ?? {};
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return `${base || 'room'}-${Date.now().toString(36)}`;
}

router.post('/register', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const mobile = normalizeMobile(req.body?.mobile);
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : null;
    const claimType = req.body?.claimType === 'new_map' ? 'new_map' : 'existing';

    if (!name || name.length < 2) return res.status(400).json({ error: 'Enter your full name' });
    if (!mobile) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id, status FROM customers WHERE mobile = :mobile LIMIT 1`,
      { mobile }
    );
    if (existing.length) {
      const st = existing[0].status;
      if (st === 'pending') {
        return res.status(409).json({ error: 'Your registration is already waiting for admin approval' });
      }
      if (st === 'approved') {
        return res.status(409).json({ error: 'This mobile is already registered. Please sign in.' });
      }
      return res.status(409).json({ error: 'This mobile was rejected. Contact the admin.' });
    }

    let roomId: number | null = null;
    let proposedName: string | null = null;
    let proposedAddress: string | null = null;
    let lat: number | null = null;
    let lng: number | null = null;
    let placeId: string | null = null;
    let mapUrl: string | null = null;

    if (claimType === 'existing') {
      roomId = Number(req.body?.roomId);
      if (!Number.isInteger(roomId) || roomId <= 0) {
        return res.status(400).json({ error: 'Select a room from the list' });
      }
      const [rooms] = await pool.query<RowDataPacket[]>(
        `SELECT id, name FROM rooms WHERE id = :id AND (listing_status = 'published' OR listing_status IS NULL)`,
        { id: roomId }
      );
      if (!rooms.length) return res.status(400).json({ error: 'Selected room was not found' });
    } else {
      proposedName =
        typeof req.body?.proposedName === 'string' ? req.body.proposedName.trim().slice(0, 150) : '';
      proposedAddress =
        typeof req.body?.proposedAddress === 'string'
          ? req.body.proposedAddress.trim().slice(0, 300)
          : '';
      lat = Number(req.body?.lat);
      lng = Number(req.body?.lng);
      placeId =
        typeof req.body?.placeId === 'string' ? req.body.placeId.trim().slice(0, 200) : null;
      mapUrl = typeof req.body?.mapUrl === 'string' ? req.body.mapUrl.trim().slice(0, 500) : null;
      if (!proposedName) return res.status(400).json({ error: 'Enter the room / stay name' });
      if (!proposedAddress) return res.status(400).json({ error: 'Select or enter the location' });
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return res.status(400).json({ error: 'Pick the room location on the map' });
      }
      if (!mapUrl) {
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [custResult] = await conn.query<ResultSetHeader>(
        `INSERT INTO customers (name, mobile, status, must_change_password)
         VALUES (:name, :mobile, 'pending', 1)`,
        { name, mobile }
      );
      const customerId = custResult.insertId;
      await conn.query(
        `INSERT INTO customer_applications
          (customer_id, claim_type, room_id, proposed_name, proposed_address, lat, lng, place_id, map_url, note, status)
         VALUES
          (:customerId, :claimType, :roomId, :proposedName, :proposedAddress, :lat, :lng, :placeId, :mapUrl, :note, 'pending')`,
        {
          customerId,
          claimType,
          roomId,
          proposedName,
          proposedAddress,
          lat,
          lng,
          placeId,
          mapUrl,
          note,
        }
      );
      await conn.commit();
      res.status(201).json({
        id: customerId,
        status: 'pending',
        message: 'Registration submitted. An admin will review your request.',
      });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const mobile = normalizeMobile(req.body?.mobile);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, mobile, password_hash, status, must_change_password
       FROM customers WHERE mobile = :mobile LIMIT 1`,
      { mobile }
    );
    const row = rows[0];
    if (!row) return res.status(401).json({ error: 'Invalid mobile or password' });
    if (row.status === 'pending') {
      return res.status(403).json({ error: 'Your account is waiting for admin approval' });
    }
    if (row.status === 'rejected') {
      return res.status(403).json({ error: 'Your registration was rejected' });
    }
    if (!row.password_hash) {
      return res.status(403).json({ error: 'Account not ready. Ask admin to approve again.' });
    }
    const ok = await verifyPassword(password, String(row.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid mobile or password' });

    const token = createCustomerToken({ id: Number(row.id), mobile: String(row.mobile) });
    res.json({
      token,
      customer: {
        id: Number(row.id),
        name: String(row.name),
        mobile: String(row.mobile),
        mustChangePassword: Boolean(row.must_change_password),
      },
      expiresIn: '12h',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireCustomer, async (req, res) => {
  try {
    const { id } = (req as CustomerRequest).customer!;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, name, mobile, status, must_change_password, created_at
       FROM customers WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    const c = rows[0];
    if (c.status !== 'approved') {
      return res.status(403).json({ error: 'Account is not approved' });
    }
    const [rooms] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM rooms WHERE owner_customer_id = :id ORDER BY id DESC`,
      { id }
    );
    res.json({
      id: Number(c.id),
      name: String(c.name),
      mobile: String(c.mobile),
      status: c.status,
      mustChangePassword: Boolean(c.must_change_password),
      rooms: (rooms as Record<string, unknown>[]).map(mapRoom),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.post('/change-password', requireCustomer, async (req, res) => {
  try {
    const { id } = (req as CustomerRequest).customer!;
    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT password_hash, must_change_password FROM customers WHERE id = :id LIMIT 1`,
      { id }
    );
    if (!rows.length) return res.status(404).json({ error: 'Account not found' });
    const row = rows[0];
    const mustChange = Boolean(row.must_change_password);
    if (!mustChange) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });
      const ok = await verifyPassword(currentPassword, String(row.password_hash || ''));
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    } else if (currentPassword) {
      const ok = await verifyPassword(currentPassword, String(row.password_hash || ''));
      if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await hashPassword(newPassword);
    await pool.query(
      `UPDATE customers SET password_hash = :passwordHash, must_change_password = 0 WHERE id = :id`,
      { passwordHash, id }
    );
    res.json({ ok: true, mustChangePassword: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/rooms', requireCustomer, async (req, res) => {
  try {
    const { id } = (req as CustomerRequest).customer!;
    const [mine] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM rooms WHERE owner_customer_id = :id ORDER BY id DESC`,
      { id }
    );
    const [catalog] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM rooms
       WHERE (listing_status = 'published' OR listing_status IS NULL)
         AND (owner_customer_id IS NULL OR owner_customer_id = :id)
       ORDER BY name`,
      { id }
    );
    res.json({
      mine: (mine as Record<string, unknown>[]).map(mapRoom),
      catalog: (catalog as Record<string, unknown>[]).map(mapRoom),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

router.post('/rooms/claim', requireCustomer, async (req, res) => {
  try {
    const { id } = (req as CustomerRequest).customer!;
    const roomId = Number(req.body?.roomId);
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({ error: 'Select a room' });
    }
    const [rooms] = await pool.query<RowDataPacket[]>(
      `SELECT id, owner_customer_id, listing_status FROM rooms WHERE id = :roomId LIMIT 1`,
      { roomId }
    );
    if (!rooms.length) return res.status(404).json({ error: 'Room not found' });
    const room = rooms[0];
    if (room.owner_customer_id && Number(room.owner_customer_id) !== id) {
      return res.status(409).json({ error: 'This room already has an owner' });
    }
    await pool.query(
      `UPDATE rooms SET owner_customer_id = :id, listing_status = 'pending' WHERE id = :roomId`,
      { id, roomId }
    );
    const [updated] = await pool.query<RowDataPacket[]>(`SELECT * FROM rooms WHERE id = :roomId`, {
      roomId,
    });
    res.json(mapRoom(updated[0] as Record<string, unknown>));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim room' });
  }
});

router.post('/rooms', requireCustomer, async (req, res) => {
  try {
    const { id } = (req as CustomerRequest).customer!;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const category = req.body?.category;
    const roomType = typeof req.body?.roomType === 'string' ? req.body.roomType.trim() : '';
    const location = typeof req.body?.location === 'string' ? req.body.location.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    const minMembers = Math.max(1, Number(req.body?.minMembers) || 1);
    const maxMembers = Math.max(minMembers, Number(req.body?.maxMembers) || minMembers);
    const pricePerNight = Number(req.body?.pricePerNight);
    const baseGuests = Math.max(1, Number(req.body?.baseGuests) || 2);
    const extraGuestPrice = Math.max(0, Number(req.body?.extraGuestPrice) || 0);
    const amenities = Array.isArray(req.body?.amenities)
      ? req.body.amenities.filter((a: unknown) => typeof a === 'string').slice(0, 20)
      : [];
    const imagesIn = Array.isArray(req.body?.images) ? req.body.images : [];

    if (!name) return res.status(400).json({ error: 'Room name is required' });
    if (!['couples', 'family', 'friends'].includes(category)) {
      return res.status(400).json({ error: 'Pick a category: couples, family or friends' });
    }
    if (!roomType) return res.status(400).json({ error: 'Room type is required' });
    if (!location) return res.status(400).json({ error: 'Location is required' });
    if (!Number.isFinite(pricePerNight) || pricePerNight <= 0) {
      return res.status(400).json({ error: 'Enter a valid price per night' });
    }

    const imageUrls: string[] = [];
    for (const [i, img] of imagesIn.slice(0, 6).entries()) {
      if (typeof img !== 'string') continue;
      if (img.startsWith('data:image/')) {
        imageUrls.push(await saveDataUrlImage(img, 'rooms', `owner-${id}-${i}`));
      } else if (img.startsWith('http') || img.startsWith('/api/uploads/')) {
        imageUrls.push(img);
      }
    }
    if (!imageUrls.length) {
      return res.status(400).json({ error: 'Upload at least one room photo' });
    }

    const slug = slugify(name);
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO rooms
        (name, slug, category, room_type, min_members, max_members, price_per_night,
         base_guests, extra_guest_price, description, location, images, amenities,
         listing_status, owner_customer_id)
       VALUES
        (:name, :slug, :category, :roomType, :minMembers, :maxMembers, :pricePerNight,
         :baseGuests, :extraGuestPrice, :description, :location, :images, :amenities,
         'pending', :ownerId)`,
      {
        name,
        slug,
        category,
        roomType,
        minMembers,
        maxMembers,
        pricePerNight,
        baseGuests,
        extraGuestPrice,
        description: description || null,
        location,
        images: JSON.stringify(imageUrls),
        amenities: JSON.stringify(amenities),
        ownerId: id,
      }
    );

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM rooms WHERE id = :id`, {
      id: result.insertId,
    });
    res.status(201).json(mapRoom(rows[0] as Record<string, unknown>));
  } catch (err) {
    if (err instanceof UploadError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

router.patch('/rooms/:id', requireCustomer, async (req, res) => {
  try {
    const { id: customerId } = (req as CustomerRequest).customer!;
    const roomId = Number(req.params.id);
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM rooms WHERE id = :roomId AND owner_customer_id = :customerId LIMIT 1`,
      { roomId, customerId }
    );
    if (!rows.length) return res.status(404).json({ error: 'Room not found' });

    const fields: string[] = [];
    const params: Record<string, string | number> = { roomId, customerId };
    const set = (col: string, key: string, value: string | number) => {
      fields.push(`${col} = :${key}`);
      params[key] = value;
    };

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      set('name', 'name', req.body.name.trim());
    }
    if (typeof req.body?.roomType === 'string' && req.body.roomType.trim()) {
      set('room_type', 'roomType', req.body.roomType.trim());
    }
    if (typeof req.body?.location === 'string' && req.body.location.trim()) {
      set('location', 'location', req.body.location.trim());
    }
    if (typeof req.body?.description === 'string') {
      set('description', 'description', req.body.description.trim());
    }
    if (['couples', 'family', 'friends'].includes(req.body?.category)) {
      set('category', 'category', req.body.category);
    }
    if (req.body?.pricePerNight != null && Number(req.body.pricePerNight) > 0) {
      set('price_per_night', 'pricePerNight', Number(req.body.pricePerNight));
    }
    if (req.body?.extraGuestPrice != null && Number(req.body.extraGuestPrice) >= 0) {
      set('extra_guest_price', 'extraGuestPrice', Number(req.body.extraGuestPrice));
    }
    if (req.body?.baseGuests != null && Number(req.body.baseGuests) >= 1) {
      set('base_guests', 'baseGuests', Number(req.body.baseGuests));
    }
    if (req.body?.minMembers != null) set('min_members', 'minMembers', Math.max(1, Number(req.body.minMembers)));
    if (req.body?.maxMembers != null) set('max_members', 'maxMembers', Math.max(1, Number(req.body.maxMembers)));

    if (Array.isArray(req.body?.images) && req.body.images.length) {
      const imageUrls: string[] = [];
      for (const [i, img] of req.body.images.slice(0, 6).entries()) {
        if (typeof img !== 'string') continue;
        if (img.startsWith('data:image/')) {
          imageUrls.push(await saveDataUrlImage(img, 'rooms', `owner-${customerId}-${i}`));
        } else if (img.startsWith('http') || img.startsWith('/api/uploads/')) {
          imageUrls.push(img);
        }
      }
      if (imageUrls.length) {
        fields.push('images = :images');
        params.images = JSON.stringify(imageUrls);
      }
    }

    if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

    // Edits to a published room go back to pending for re-review.
    if (rows[0].listing_status === 'published') {
      fields.push(`listing_status = 'pending'`);
    }

    await pool.query(
      `UPDATE rooms SET ${fields.join(', ')} WHERE id = :roomId AND owner_customer_id = :customerId`,
      params
    );
    const [updated] = await pool.query<RowDataPacket[]>(`SELECT * FROM rooms WHERE id = :roomId`, {
      roomId,
    });
    res.json(mapRoom(updated[0] as Record<string, unknown>));
  } catch (err) {
    if (err instanceof UploadError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to update room' });
  }
});

router.put('/rooms/:id/gallery/:slot', requireCustomer, async (req, res) => {
  try {
    const { id: customerId } = (req as CustomerRequest).customer!;
    const roomId = Number(req.params.id);
    const slot = String(req.params.slot);
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({ error: 'Invalid room id' });
    }
    if (!isGallerySlot(slot)) return res.status(400).json({ error: 'Invalid photo type' });

    const gallery = await loadOwnedRoomGallery(roomId, customerId);
    if (!gallery) return res.status(404).json({ error: 'Room not found' });

    const url = await saveDataUrlImage(req.body?.image, 'rooms', `owner-${customerId}-${slot}`);
    const previous = gallery[slot];
    gallery[slot] = url;
    await pool.query(
      `UPDATE rooms SET room_gallery = :gallery WHERE id = :roomId AND owner_customer_id = :customerId`,
      { roomId, customerId, gallery: JSON.stringify(gallery) }
    );
    await deleteUpload(previous);
    res.json({ id: roomId, slot, url, gallery });
  } catch (err) {
    if (err instanceof UploadError) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Failed to save photo' });
  }
});

router.delete('/rooms/:id/gallery/:slot', requireCustomer, async (req, res) => {
  try {
    const { id: customerId } = (req as CustomerRequest).customer!;
    const roomId = Number(req.params.id);
    const slot = String(req.params.slot);
    if (!Number.isInteger(roomId) || roomId <= 0) {
      return res.status(400).json({ error: 'Invalid room id' });
    }
    if (!isGallerySlot(slot)) return res.status(400).json({ error: 'Invalid photo type' });

    const gallery = await loadOwnedRoomGallery(roomId, customerId);
    if (!gallery) return res.status(404).json({ error: 'Room not found' });

    const previous = gallery[slot];
    delete gallery[slot];
    await pool.query(
      `UPDATE rooms SET room_gallery = :gallery WHERE id = :roomId AND owner_customer_id = :customerId`,
      {
        roomId,
        customerId,
        gallery: Object.keys(gallery).length ? JSON.stringify(gallery) : null,
      }
    );
    await deleteUpload(previous);
    res.json({ id: roomId, slot, gallery });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset photo' });
  }
});

export default router;
