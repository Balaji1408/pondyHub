import { randomBytes } from 'crypto';
import { pool } from './db.js';
import { isValidDate, takenSeats, todayIst } from './boatSchedule.js';

export class BookingError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export function confirmationId() {
  return `PH-${randomBytes(4).toString('hex').toUpperCase()}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function seatCount(value: unknown, fallback: number) {
  const n = value == null || value === '' ? fallback : Number(value);
  return Number.isInteger(n) ? n : NaN;
}

/** YYMMDD of the journey + HHMM of departure + last four digits of the phone. */
function pnrFor(date: string, startTime: string, phoneDigits: string) {
  return `${date.slice(2).replaceAll('-', '')}${startTime.replace(':', '')}${phoneDigits.slice(-4)}`;
}

export async function createBoatBooking(body: Record<string, unknown>) {
  const itemId = Number(body.itemId);
  const slotId = Number(body.slotId);
  const date = body.date;
  const adultSeats = seatCount(body.adultSeats, Number(body.guests) || 1);
  const childSeats = seatCount(body.childSeats, 0);
  const guestName = String(body.guestName ?? '').trim();
  const phoneDigits = String(body.guestPhone ?? '').replace(/\D/g, '');
  const guestEmail = String(body.guestEmail ?? '').trim() || null;
  const selectedSeats = Array.isArray(body.selectedSeats)
    ? [...new Set(body.selectedSeats.map((s) => String(s).trim()))]
    : [];

  if (!Number.isInteger(itemId) || itemId <= 0) throw new BookingError('Invalid boat');
  if (!Number.isInteger(slotId) || slotId <= 0) throw new BookingError('Please select a time slot');
  if (!isValidDate(date)) throw new BookingError('Please select a journey date');
  if (date < todayIst()) throw new BookingError('Journey date cannot be in the past');
  if (!Number.isInteger(adultSeats) || adultSeats < 1) {
    throw new BookingError('At least one adult is required');
  }
  if (!Number.isInteger(childSeats) || childSeats < 0) throw new BookingError('Invalid child count');
  if (!guestName || guestName.length > 120) throw new BookingError('Please enter your full name');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    throw new BookingError('Please enter a valid phone number');
  }
  if (guestEmail && (guestEmail.length > 160 || !EMAIL_RE.test(guestEmail))) {
    throw new BookingError('Please enter a valid email address');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Serialises bookings per boat so two guests can't take the same seat.
    const [locked] = await conn.query('SELECT id FROM boats WHERE id = :id FOR UPDATE', {
      id: itemId,
    });
    if (!(locked as unknown[]).length) throw new BookingError('Boat not found', 404);

    const state = await takenSeats(conn, itemId, slotId, date);
    if (!state) throw new BookingError('This time slot does not run on the selected date');
    const { boat, slot, taken } = state;
    if (slot.isDisabled) throw new BookingError('This slot is not available on the selected date');
    if (slot.isDeparted) {
      throw new BookingError('This slot has already departed. Please pick a later one');
    }

    const requested = adultSeats + childSeats;
    if (requested > slot.availableSeats) {
      throw new BookingError(
        slot.availableSeats > 0
          ? `Only ${slot.availableSeats} seat(s) left on this slot`
          : 'This slot is sold out'
      );
    }
    if (selectedSeats.length > requested) {
      throw new BookingError(`Please select exactly ${requested} seat(s)`, 422);
    }
    const invalid = selectedSeats.filter((s) => {
      const n = Number(s);
      return !/^\d+$/.test(s) || n < 1 || n > slot.capacity;
    });
    if (invalid.length) throw new BookingError(`Invalid seat number(s): ${invalid.join(', ')}`, 422);
    const conflicts = selectedSeats.filter((s) => taken.includes(s));
    if (conflicts.length) {
      throw new BookingError(`Some selected seats are already booked: ${conflicts.join(', ')}`, 409, {
        conflicts,
      });
    }

    const autoAssigned: string[] = [];
    for (let i = 1; i <= slot.capacity && selectedSeats.length + autoAssigned.length < requested; i++) {
      const seat = String(i);
      if (!taken.includes(seat) && !selectedSeats.includes(seat)) autoAssigned.push(seat);
    }
    if (selectedSeats.length + autoAssigned.length < requested) {
      throw new BookingError('Not enough seats left on this boat');
    }
    const seats = [...selectedSeats, ...autoAssigned].sort((a, b) => Number(a) - Number(b));

    const totalAmount = adultSeats * slot.priceAdult + childSeats * slot.priceChild;
    const pnr = pnrFor(date, slot.startTime, phoneDigits);
    const conf = confirmationId();

    await conn.query(
      `INSERT INTO bookings
        (confirmation_id, pnr_id, booking_type, item_id, booking_date, slot, time_slot_id, guests,
         adult_seats, child_seats, selected_seats, extras, guest_name, guest_phone, guest_email,
         status, total_amount)
       VALUES
        (:conf, :pnr, 'boat', :itemId, :date, :slot, :slotId, :guests,
         :adultSeats, :childSeats, :seats, :extras, :guestName, :guestPhone, :guestEmail,
         'confirmed', :totalAmount)`,
      {
        conf,
        pnr,
        itemId,
        date,
        slot: slot.startTime,
        slotId,
        guests: requested,
        adultSeats,
        childSeats,
        seats: JSON.stringify(seats),
        extras: JSON.stringify({
          slotName: slot.name,
          adultSeats,
          childSeats,
          seats: seats.join(', '),
          pnr,
        }),
        guestName,
        guestPhone: phoneDigits,
        guestEmail,
        totalAmount,
      }
    );
    await conn.commit();

    return {
      confirmationId: conf,
      pnr,
      status: 'confirmed',
      type: 'boat' as const,
      itemId,
      date,
      slot: slot.startTime,
      guests: requested,
      totalAmount,
      message: 'Booking confirmed (demo — no payment collected).',
      boat: {
        name: boat.name,
        coachType: boat.coachType,
        departurePoint: boat.departurePoint,
      },
      timeSlot: {
        id: slot.id,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        reportingTime: slot.reportingTime,
      },
      adultSeats,
      childSeats,
      seats,
      autoAssignedSeats: autoAssigned,
      guestName,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
