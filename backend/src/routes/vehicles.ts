import { Router } from 'express';
import { pool } from '../db.js';
import { mapVehicle } from '../mappers.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { type, withDriver } = req.query;
    const clauses: string[] = ['available = 1'];
    const params: Record<string, unknown> = {};

    if (type && typeof type === 'string') {
      clauses.push('type = :type');
      params.type = type;
    }
    if (withDriver === 'true' || withDriver === '1') {
      clauses.push('with_driver = 1');
    } else if (withDriver === 'false' || withDriver === '0') {
      clauses.push('with_driver = 0');
    }

    const [rows] = await pool.query(
      `SELECT * FROM vehicles WHERE ${clauses.join(' AND ')} ORDER BY rating DESC, id`,
      params
    );
    res.json((rows as Record<string, unknown>[]).map(mapVehicle));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM vehicles WHERE id = :id', { id });
    const list = rows as Record<string, unknown>[];
    if (!list.length) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(mapVehicle(list[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

export default router;
