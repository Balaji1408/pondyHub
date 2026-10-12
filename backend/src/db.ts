import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { parseJson } from './mappers.js';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'hub_1',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: '+05:30',
});

async function existingColumns(table: string, names: string[]) {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME IN (:names)`,
    { table, names }
  );
  return new Set((cols as { COLUMN_NAME: string }[]).map((c) => c.COLUMN_NAME));
}

async function tableExists(table: string) {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
    { table }
  );
  return (rows as unknown[]).length > 0;
}

async function ensureRoomColumns() {
  const existing = await existingColumns('rooms', ['base_guests', 'extra_guest_price', 'room_gallery']);
  if (existing.size === 3) return;

  if (!existing.has('room_gallery')) {
    await pool.query(`ALTER TABLE rooms ADD COLUMN room_gallery JSON NULL AFTER images`);
  }
  if (!existing.has('base_guests')) {
    await pool.query(
      `ALTER TABLE rooms ADD COLUMN base_guests INT NOT NULL DEFAULT 2 AFTER price_per_night`
    );
    await pool.query(
      `UPDATE rooms SET base_guests = IF(category = 'couples', 2, GREATEST(min_members, 1))`
    );
  }
  if (!existing.has('extra_guest_price')) {
    await pool.query(
      `ALTER TABLE rooms ADD COLUMN extra_guest_price DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER base_guests`
    );
    await pool.query(
      `UPDATE rooms SET extra_guest_price = ROUND(price_per_night * 0.2 / 50) * 50`
    );
  }
}

/** "2 hrs" → 120, "90 min" → 90, "20 min each way" → 40; defaults to an hour. */
function routeMinutes(duration: unknown) {
  const text = String(duration ?? '');
  const m = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minutes)\b/i);
  if (!m) return 60;
  const minutes = Number(m[1]) * (m[2].toLowerCase().startsWith('h') ? 60 : 1);
  return Math.round(/each way/i.test(text) ? minutes * 2 : minutes);
}

function shiftTime(hhmm: string, deltaMinutes: number) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (((h * 60 + m + deltaMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Turns the legacy `boats.slots` start-time list into rows of `boat_time_slots`. */
async function backfillBoatTimeSlots() {
  const [boats] = await pool.query('SELECT id, slots, routes FROM boats');
  for (const boat of boats as Record<string, unknown>[]) {
    const starts = parseJson(boat.slots, [] as string[]).filter((s) => /^\d{1,2}:\d{2}$/.test(s));
    const routes = parseJson(boat.routes, [] as { duration?: string }[]);
    const minutes = routeMinutes(routes[0]?.duration);
    const times = starts.map((s) => s.padStart(5, '0')).sort();
    const labels = times.map((start) => {
      const hour = Number(start.slice(0, 2));
      return hour < 8 ? 'Sunrise' : hour < 12 ? 'Morning' : hour < 16 ? 'Afternoon' : 'Sunset';
    });
    const seen: Record<string, number> = {};
    for (const [i, start] of times.entries()) {
      const label = labels[i];
      seen[label] = (seen[label] ?? 0) + 1;
      const repeats = labels.filter((l) => l === label).length > 1;
      const name = `${label} Trip${repeats ? ` ${seen[label]}` : ''}`;
      await pool.query(
        `INSERT INTO boat_time_slots (boat_id, name, start_time, end_time, reporting_time)
         VALUES (:boatId, :name, :start, :end, :reporting)`,
        {
          boatId: Number(boat.id),
          name,
          start,
          end: shiftTime(start, minutes),
          reporting: shiftTime(start, -15),
        }
      );
    }
  }
}

async function ensureBoatSchema() {
  const boatCols = await existingColumns('boats', ['coach_type', 'departure_point', 'price_child']);
  if (!boatCols.has('coach_type')) {
    await pool.query(`ALTER TABLE boats ADD COLUMN coach_type VARCHAR(80) NULL AFTER type`);
  }
  if (!boatCols.has('departure_point')) {
    await pool.query(`ALTER TABLE boats ADD COLUMN departure_point VARCHAR(200) NULL AFTER coach_type`);
    await pool.query(
      `UPDATE boats SET departure_point = JSON_UNQUOTE(JSON_EXTRACT(routes, '$[0].stops[0]'))`
    );
  }
  if (!boatCols.has('price_child')) {
    await pool.query(
      `ALTER TABLE boats ADD COLUMN price_child DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER price`
    );
    await pool.query(`UPDATE boats SET price_child = ROUND(price * 0.6 / 10) * 10`);
  }

  if (!(await tableExists('boat_time_slots'))) {
    await pool.query(`
      CREATE TABLE boat_time_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boat_id INT NOT NULL,
        name VARCHAR(80) NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        reporting_time TIME NULL,
        is_seasonal TINYINT(1) NOT NULL DEFAULT 0,
        valid_from DATE NULL,
        valid_until DATE NULL,
        days_of_week VARCHAR(20) NULL,
        INDEX idx_boat_slots_boat (boat_id),
        CONSTRAINT fk_boat_slots_boat FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    await backfillBoatTimeSlots();
  }

  if (!(await tableExists('boat_schedules'))) {
    await pool.query(`
      CREATE TABLE boat_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        boat_id INT NOT NULL,
        time_slot_id INT NULL,
        schedule_date DATE NOT NULL,
        is_disabled TINYINT(1) NOT NULL DEFAULT 0,
        blocked_seat_numbers JSON NULL,
        override_capacity INT NULL,
        override_price_adult DECIMAL(10, 2) NULL,
        override_price_child DECIMAL(10, 2) NULL,
        UNIQUE KEY uq_boat_schedule (boat_id, schedule_date, time_slot_id),
        CONSTRAINT fk_boat_schedule_boat FOREIGN KEY (boat_id) REFERENCES boats(id) ON DELETE CASCADE,
        CONSTRAINT fk_boat_schedule_slot FOREIGN KEY (time_slot_id) REFERENCES boat_time_slots(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  }

  const bookingCols = await existingColumns('bookings', [
    'guest_email',
    'time_slot_id',
    'adult_seats',
    'child_seats',
    'selected_seats',
    'pnr_id',
  ]);
  const add: string[] = [];
  if (!bookingCols.has('guest_email')) add.push('ADD COLUMN guest_email VARCHAR(160) NULL AFTER guest_phone');
  if (!bookingCols.has('time_slot_id')) add.push('ADD COLUMN time_slot_id INT NULL AFTER slot');
  if (!bookingCols.has('adult_seats')) add.push('ADD COLUMN adult_seats INT NULL AFTER guests');
  if (!bookingCols.has('child_seats')) add.push('ADD COLUMN child_seats INT NULL AFTER adult_seats');
  if (!bookingCols.has('selected_seats')) add.push('ADD COLUMN selected_seats JSON NULL AFTER child_seats');
  if (!bookingCols.has('pnr_id')) add.push('ADD COLUMN pnr_id VARCHAR(20) NULL AFTER confirmation_id');
  if (!bookingCols.has('time_slot_id')) add.push('ADD INDEX idx_bookings_item_date (booking_type, item_id, booking_date)');
  if (add.length) await pool.query(`ALTER TABLE bookings ${add.join(', ')}`);
}

/** Adds columns and tables to existing databases that were imported before they existed. */
export async function ensureSchema() {
  await ensureRoomColumns();
  await ensureBoatSchema();
}

export async function pingDb() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}
