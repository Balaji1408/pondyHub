import { Router } from 'express'
import { pool } from '../db.js'
import { mapPlace, mapRoom } from '../mappers.js'
import { googlePhotoProxyUrl, resolveGoogleMeta } from '../googlePlaces.js'
import { googleReviewsUrl } from '../placeReviews.js'

const router = Router()

async function enrichRoom(room: ReturnType<typeof mapRoom>) {
  const google = await resolveGoogleMeta(
    room.name as string,
    room.location as string,
    room.rating,
    'room',
  )
  const googleImages = google.photoNames.map((n) => googlePhotoProxyUrl(n, 1600))
  return {
    ...room,
    rating: google.rating,
    reviewCount: google.reviewCount,
    reviewSnippet: google.snippet || null,
    googleReviewsUrl: googleReviewsUrl(room.name as string, room.location as string),
    images: googleImages.length ? googleImages : room.images,
    photosFromGoogle: googleImages.length > 0,
  }
}

router.get('/', async (req, res) => {
  try {
    const { category, roomType, minMembers, maxMembers } = req.query
    const clauses: string[] = ['1=1']
    const params: Record<string, unknown> = {}

    if (category && typeof category === 'string') {
      clauses.push('category = :category')
      params.category = category
    }
    if (roomType && typeof roomType === 'string') {
      clauses.push('room_type = :roomType')
      params.roomType = roomType
    }
    if (minMembers) {
      clauses.push('max_members >= :minMembers')
      params.minMembers = Number(minMembers)
    }
    if (maxMembers) {
      clauses.push('min_members <= :maxMembers')
      params.maxMembers = Number(maxMembers)
    }

    const [rows] = await pool.query(
      `SELECT * FROM rooms WHERE ${clauses.join(' AND ')} ORDER BY rating DESC, id`,
      params,
    )
    const rooms = await Promise.all(
      (rows as Record<string, unknown>[]).map((row) => enrichRoom(mapRoom(row))),
    )
    res.json(rooms)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch rooms' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const [rows] = await pool.query('SELECT * FROM rooms WHERE id = :id', { id })
    const list = rows as Record<string, unknown>[]
    if (!list.length) return res.status(404).json({ error: 'Room not found' })

    const room = await enrichRoom(mapRoom(list[0]))
    const [nearby] = await pool.query(
      `SELECT * FROM places WHERE near_room_id = :id ORDER BY rating DESC LIMIT 8`,
      { id },
    )
    res.json({
      ...room,
      nearby: (nearby as Record<string, unknown>[]).map(mapPlace),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch room' })
  }
})

export default router
