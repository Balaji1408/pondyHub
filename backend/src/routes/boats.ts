import { Router } from 'express';
import { pool } from '../db.js';
import { isValidDate, loadBoatsForDate, takenSeats, todayIst } from '../boatSchedule.js';

const router = Router();

function dateParam(value: unknown) {
  return isValidDate(value) ? value : todayIst();
}

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const boats = await loadBoatsForDate(dateParam(req.query.date), {
      type: typeof type === 'string' && type ? type : undefined,
    });
    res.json(boats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch boats' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid boat id' });
    const [boat] = await loadBoatsForDate(dateParam(req.query.date), { ids: [id] });
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    res.json(boat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch boat' });
  }
});

router.get('/:id/seats', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const slotId = Number(req.query.slotId);
    const { date } = req.query;
    if (!Number.isInteger(id) || !Number.isInteger(slotId) || !isValidDate(date)) {
      return res.status(400).json({ error: 'boat id, slotId and date (YYYY-MM-DD) are required' });
    }
    const result = await takenSeats(pool, id, slotId, date);
    if (!result) return res.status(404).json({ error: 'Slot not found for this boat and date' });
    res.json({ capacity: result.slot.capacity, takenSeats: result.taken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

export default router;
