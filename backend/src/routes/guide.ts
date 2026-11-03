import { Router } from 'express'
import type { RowDataPacket } from 'mysql2'
import { pool } from '../db.js'
import { DEFAULT_GUIDE, type GuideContent } from '../guideDefault.js'
import { parseJson } from '../mappers.js'

const router = Router()

export async function loadGuide(): Promise<GuideContent & { updatedAt: string | null }> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT title, subtitle, content, updated_at FROM guide WHERE id = 1 LIMIT 1`
  )
  const row = rows[0]
  if (!row) {
    return { ...DEFAULT_GUIDE, updatedAt: null }
  }
  const content = parseJson<GuideContent>(row.content, DEFAULT_GUIDE)
  return {
    title: String(row.title || content.title || DEFAULT_GUIDE.title),
    subtitle: String(row.subtitle ?? content.subtitle ?? ''),
    sections: Array.isArray(content.sections) ? content.sections : DEFAULT_GUIDE.sections,
    footer: content.footer ?? DEFAULT_GUIDE.footer,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }
}

router.get('/', async (_req, res) => {
  try {
    res.json(await loadGuide())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load guide' })
  }
})

export default router
