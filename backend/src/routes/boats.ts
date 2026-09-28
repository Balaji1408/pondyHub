import { Router } from 'express';
import { pool } from '../db.js';
import { mapBoat } from '../mappers.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const clauses: string[] = ['1=1'];
    const params: Record<string, unknown> = {};

    if (type && typeof type === 'string') {
      clauses.push('type = :type');
      params.type = type;
    }

    const [rows] = await pool.query(
      `SELECT * FROM boats WHERE ${clauses.join(' AND ')} ORDER BY rating DESC, id`,
      params
    );
    res.json((rows as Record<string, unknown>[]).map(mapBoat));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch boats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM boats WHERE id = :id', { id });
    const list = rows as Record<string, unknown>[];
    if (!list.length) return res.status(404).json({ error: 'Boat not found' });
    res.json(mapBoat(list[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch boat' });
  }
});

export default router;
