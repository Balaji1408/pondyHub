import { Router } from 'express'

const router = Router()

/** Only allow Places photo resource names — never open proxy. */
function isSafePhotoName(name: string) {
  if (!name.startsWith('places/') || !name.includes('/photos/')) return false
  if (name.includes('..') || name.includes('://') || name.includes('\\')) return false
  return name.length < 800
}

/**
 * Proxies Google Place Photos (New) at up to 1600–4800px so the API key
 * stays on the server and the frontend can use /api/google-photo?... as img src.
 */
router.get('/', async (req, res) => {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY?.trim()
    const name = typeof req.query.name === 'string' ? req.query.name : ''
    const w = Math.min(4800, Math.max(200, Number(req.query.w) || 1600))

    if (!key) return res.status(503).json({ error: 'GOOGLE_MAPS_API_KEY not configured' })
    if (!isSafePhotoName(name)) return res.status(400).json({ error: 'Invalid photo name' })

    const url = new URL(`https://places.googleapis.com/v1/${name}/media`)
    url.searchParams.set('maxWidthPx', String(w))
    url.searchParams.set('maxHeightPx', String(w))
    url.searchParams.set('key', key)

    const upstream = await fetch(url)
    if (!upstream.ok) {
      console.warn('Google photo fetch failed', upstream.status)
      return res.status(upstream.status).json({ error: 'Photo unavailable' })
    }

    const type = upstream.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')

    const buf = Buffer.from(await upstream.arrayBuffer())
    res.send(buf)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch photo' })
  }
})

export default router
