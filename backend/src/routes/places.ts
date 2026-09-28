import { Router } from 'express';
import { pool } from '../db.js';
import { mapPlace } from '../mappers.js';
import { resolveGoogleMeta } from '../googlePlaces.js';
import { googleReviewsUrl } from '../placeReviews.js';

const router = Router();

async function enrichPlace(place: ReturnType<typeof mapPlace>) {
  const google = await resolveGoogleMeta(place.name as string, place.location as string | null, place.rating);
  return {
    ...place,
    rating: google.rating,
    reviewCount: google.reviewCount,
    reviewSnippet: google.snippet || null,
    googleReviewsUrl: googleReviewsUrl(place.name as string, place.location as string | null),
  };
}

router.get('/', async (req, res) => {
  try {
    const { kind, nearRoomId, nearBeachId, openNow, seafood } = req.query;
    const clauses: string[] = ['1=1'];
    const params: Record<string, unknown> = {};

    if (kind && typeof kind === 'string') {
      const kinds = kind.split(',').map((k) => k.trim()).filter(Boolean);
      if (kinds.length === 1) {
        clauses.push('kind = :kind');
        params.kind = kinds[0];
      } else if (kinds.length > 1) {
        clauses.push(`kind IN (${kinds.map((_, i) => `:kind${i}`).join(',')})`);
        kinds.forEach((k, i) => {
          params[`kind${i}`] = k;
        });
      }
    }
    if (nearRoomId) {
      clauses.push('near_room_id = :nearRoomId');
      params.nearRoomId = Number(nearRoomId);
    }
    if (nearBeachId) {
      clauses.push('near_beach_id = :nearBeachId');
      params.nearBeachId = Number(nearBeachId);
    }
    if (seafood === 'true' || seafood === '1') {
      clauses.push('is_seafood_spot = 1');
    }

    const [rows] = await pool.query(
      `SELECT * FROM places WHERE ${clauses.join(' AND ')} ORDER BY rating DESC`,
      params
    );
    let places = (rows as Record<string, unknown>[]).map(mapPlace);

    if (openNow === 'true' || openNow === '1') {
      places = places.filter((p) => p.openNow);
    }

    const enriched = await Promise.all(places.map((p) => enrichPlace(p)));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query('SELECT * FROM places WHERE id = :id', { id });
    const list = rows as Record<string, unknown>[];
    if (!list.length) return res.status(404).json({ error: 'Place not found' });

    const place = await enrichPlace(mapPlace(list[0]));
    let seafoodSpots: Awaited<ReturnType<typeof enrichPlace>>[] = [];
    if (place.kind === 'beach') {
      const [seafood] = await pool.query(
        `SELECT * FROM places WHERE near_beach_id = :id AND is_seafood_spot = 1`,
        { id }
      );
      seafoodSpots = await Promise.all(
        (seafood as Record<string, unknown>[]).map((row) => enrichPlace(mapPlace(row)))
      );
    }

    res.json({ ...place, seafoodSpots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});

export default router;
