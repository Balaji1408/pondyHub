import { Router } from 'express';
import { randomBytes } from 'crypto';
import { pool } from '../db.js';
import { mapRoom, roomPriceForGuests } from '../mappers.js';

const router = Router();

function confirmationId() {
  return `PH-${randomBytes(4).toString('hex').toUpperCase()}`;
}

router.post('/', async (req, res) => {
  try {
    const {
      type,
      itemId,
      date,
      slot,
      guests = 1,
      extras,
      guestName,
      guestPhone,
      totalAmount,
    } = req.body ?? {};

    if (!type || !itemId || !date) {
      return res.status(400).json({ error: 'type, itemId, and date are required' });
    }
    if (!['room', 'vehicle', 'boat'].includes(type)) {
      return res.status(400).json({ error: 'Invalid booking type' });
    }

    let guestCount = Number(guests) || 1;
    let amount = totalAmount != null ? Number(totalAmount) : null;

    if (type === 'room') {
      const [rows] = await pool.query('SELECT * FROM rooms WHERE id = :id', { id: Number(itemId) });
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return res.status(404).json({ error: 'Room not found' });
      const room = mapRoom(row);
      const min = room.category === 'couples' ? 2 : Number(room.minMembers) || 1;
      const max = Number(room.maxMembers) || min;
      if (guestCount < min || guestCount > max) {
        const range = min === max ? `${min}` : `${min}–${max}`;
        return res.status(400).json({ error: `This room takes ${range} guests` });
      }
      amount = roomPriceForGuests(room, guestCount);
    }

    const conf = confirmationId();
    await pool.query(
      `INSERT INTO bookings
        (confirmation_id, booking_type, item_id, booking_date, slot, guests, extras, guest_name, guest_phone, status, total_amount)
       VALUES
        (:conf, :type, :itemId, :date, :slot, :guests, :extras, :guestName, :guestPhone, 'confirmed', :totalAmount)`,
      {
        conf,
        type,
        itemId: Number(itemId),
        date,
        slot: slot ?? null,
        guests: guestCount,
        extras: extras ? JSON.stringify(extras) : null,
        guestName: guestName ?? null,
        guestPhone: guestPhone ?? null,
        totalAmount: amount,
      }
    );

    res.status(201).json({
      confirmationId: conf,
      status: 'confirmed',
      type,
      itemId: Number(itemId),
      date,
      slot: slot ?? null,
      guests: guestCount,
      totalAmount: amount,
      message: 'Booking confirmed (demo — no payment collected).',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM bookings WHERE confirmation_id = :id LIMIT 1',
      { id: req.params.id }
    );
    const list = rows as Record<string, unknown>[];
    if (!list.length) return res.status(404).json({ error: 'Booking not found' });
    const b = list[0];
    res.json({
      confirmationId: b.confirmation_id,
      type: b.booking_type,
      itemId: b.item_id,
      date: b.booking_date,
      slot: b.slot,
      guests: b.guests,
      status: b.status,
      guestName: b.guest_name,
      totalAmount: b.total_amount != null ? Number(b.total_amount) : null,
      createdAt: b.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

export default router;
