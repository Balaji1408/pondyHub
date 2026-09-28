import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'hub_1',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: '+05:30',
});

/** Adds guest-pricing columns to existing databases that were imported before they existed. */
export async function ensureSchema() {
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rooms'
       AND COLUMN_NAME IN ('base_guests', 'extra_guest_price')`
  );
  const existing = new Set((cols as { COLUMN_NAME: string }[]).map((c) => c.COLUMN_NAME));
  if (existing.size === 2) return;

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

export async function pingDb() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
    return true;
  } finally {
    conn.release();
  }
}
