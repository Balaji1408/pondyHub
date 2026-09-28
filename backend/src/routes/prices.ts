import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/from', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         (SELECT MIN(price_per_night) FROM rooms) AS room,
         (SELECT MIN(price_per_day) FROM vehicles WHERE available = 1) AS vehicle,
         (SELECT MIN(price) FROM boats) AS boat`
    );
    const r = (rows as Record<string, unknown>[])[0] ?? {};
    const num = (v: unknown) => (v == null ? null : Number(v));
    res.json({ room: num(r.room), vehicle: num(r.vehicle), boat: num(r.boat) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch prices' });
  }
});

export default router;
