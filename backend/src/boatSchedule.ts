import type { Pool, PoolConnection } from 'mysql2/promise';
import { pool } from './db.js';
import { mapBoat, parseJson } from './mappers.js';

type Db = Pool | PoolConnection;

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function istParts(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);
  return { date, time };
}

export function todayIst() {
  return istParts().date;
}

export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** 1 = Monday … 7 = Sunday, matching `days_of_week`. */
function isoWeekday(date: string) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

const hhmm = (t: unknown) => (t == null ? null : String(t).slice(0, 5));

type SlotRow = Record<string, unknown>;

function slotRunsOn(slot: SlotRow, date: string) {
  if (!Number(slot.is_seasonal)) return true;
  if (!slot.valid_from || !slot.valid_until) return false;
  if (date < String(slot.valid_from) || date > String(slot.valid_until)) return false;
  const days = String(slot.days_of_week ?? '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  return days.length === 0 || days.includes(String(isoWeekday(date)));
}

type ScheduleRow = Record<string, unknown>;

function buildSlot(
  boat: ReturnType<typeof mapBoat>,
  slot: SlotRow,
  schedule: ScheduleRow | undefined,
  boatDisabled: boolean,
  bookedCount: number,
  departed: boolean
) {
  const blockedSeatNumbers = parseJson(schedule?.blocked_seat_numbers, [] as string[]).map(String);
  const capacity =
    schedule?.override_capacity != null ? Number(schedule.override_capacity) : Number(boat.seats);
  const isDisabled = boatDisabled || Boolean(Number(schedule?.is_disabled ?? 0));
  const available = Math.max(0, capacity - blockedSeatNumbers.length - bookedCount);
  return {
    id: Number(slot.id),
    name: (slot.name as string | null) ?? null,
    startTime: hhmm(slot.start_time)!,
    endTime: hhmm(slot.end_time)!,
    reportingTime: hhmm(slot.reporting_time),
    isSeasonal: Boolean(Number(slot.is_seasonal)),
    isDisabled,
    isDeparted: departed,
    capacity,
    priceAdult:
      schedule?.override_price_adult != null ? Number(schedule.override_price_adult) : boat.price,
    priceChild:
      schedule?.override_price_child != null ? Number(schedule.override_price_child) : boat.priceChild,
    bookedSeats: bookedCount,
    blockedSeatNumbers,
    availableSeats: isDisabled || departed ? 0 : available,
  };
}

async function loadBookingsByBoat(db: Db, boatIds: number[], date: string) {
  const [rows] = await db.query(
    `SELECT item_id, time_slot_id, slot, guests, adult_seats, child_seats, selected_seats
       FROM bookings
      WHERE booking_type = 'boat' AND booking_date = :date AND status <> 'cancelled'
        AND item_id IN (:boatIds)`,
    { date, boatIds }
  );
  return rows as Record<string, unknown>[];
}

/** Every boat (or the listed ones) with the time slots that run on `date` and their live availability. */
export async function loadBoatsForDate(
  date: string,
  opts: { ids?: number[]; type?: string; db?: Db } = {}
) {
  const db = opts.db ?? pool;
  const clauses = ['1=1'];
  const params: Record<string, string | number[]> = {};
  if (opts.ids) {
    if (!opts.ids.length) return [];
    clauses.push('id IN (:ids)');
    params.ids = opts.ids;
  }
  if (opts.type) {
    clauses.push('type = :type');
    params.type = opts.type;
  }
  const [boatRows] = await db.query(
    `SELECT * FROM boats WHERE ${clauses.join(' AND ')} ORDER BY rating DESC, id`,
    params
  );
  const boats = (boatRows as Record<string, unknown>[]).map(mapBoat);
  if (!boats.length) return [];
  const boatIds = boats.map((b) => Number(b.id));

  const [[slotRows], [scheduleRows], bookingRows] = await Promise.all([
    db.query(
      `SELECT id, boat_id, name, start_time, end_time, reporting_time, is_seasonal, days_of_week,
              DATE_FORMAT(valid_from, '%Y-%m-%d') AS valid_from,
              DATE_FORMAT(valid_until, '%Y-%m-%d') AS valid_until
         FROM boat_time_slots WHERE boat_id IN (:boatIds) ORDER BY start_time, id`,
      { boatIds }
    ),
    db.query(
      `SELECT * FROM boat_schedules WHERE schedule_date = :date AND boat_id IN (:boatIds)`,
      { date, boatIds }
    ),
    loadBookingsByBoat(db, boatIds, date),
  ]);
  const slots = slotRows as SlotRow[];
  const schedules = scheduleRows as ScheduleRow[];
  const now = istParts();

  return boats.map((boat) => {
    const boatId = Number(boat.id);
    const boatSchedules = schedules.filter((s) => Number(s.boat_id) === boatId);
    const boatDisabled = Boolean(
      Number(boatSchedules.find((s) => s.time_slot_id == null)?.is_disabled ?? 0)
    );
    const boatSlots = slots.filter((s) => Number(s.boat_id) === boatId && slotRunsOn(s, date));
    const boatBookings = bookingRows.filter((b) => Number(b.item_id) === boatId);

    const timeSlots = boatSlots.map((slot) => {
      const slotId = Number(slot.id);
      const start = hhmm(slot.start_time);
      // Bookings made before slots had ids only carry the start time.
      const matches = boatBookings.filter((b) =>
        b.time_slot_id != null ? Number(b.time_slot_id) === slotId : hhmm(b.slot) === start
      );
      const bookedCount = matches.reduce(
        (sum, b) =>
          sum +
          (b.adult_seats != null
            ? Number(b.adult_seats) + Number(b.child_seats ?? 0)
            : Number(b.guests ?? 1)),
        0
      );
      const departed = date < now.date || (date === now.date && String(start) <= now.time);
      return buildSlot(
        boat,
        slot,
        boatSchedules.find((s) => Number(s.time_slot_id) === slotId),
        boatDisabled,
        bookedCount,
        departed
      );
    });

    return {
      ...boat,
      slots: timeSlots.map((s) => s.startTime),
      date,
      isDisabled: boatDisabled,
      timeSlots,
    };
  });
}

/** Seat numbers that can't be picked for a slot: already booked plus admin-blocked. */
export async function takenSeats(db: Db, boatId: number, slotId: number, date: string) {
  const [boat] = await loadBoatsForDate(date, { ids: [boatId], db });
  const slot = boat?.timeSlots.find((s) => s.id === slotId);
  if (!boat || !slot) return null;
  const bookings = await loadBookingsByBoat(db, [boatId], date);
  const booked = bookings
    .filter((b) =>
      b.time_slot_id != null ? Number(b.time_slot_id) === slotId : hhmm(b.slot) === slot.startTime
    )
    .flatMap((b) => parseJson(b.selected_seats, [] as string[]).map(String));
  return {
    boat,
    slot,
    taken: [...new Set([...booked, ...slot.blockedSeatNumbers])],
  };
}
