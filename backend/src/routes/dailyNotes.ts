import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const dailyNotesRouter = Router()

dailyNotesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM daily_notes
       WHERE created_at >= NOW() - INTERVAL '60 days'
       ORDER BY created_at DESC`
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily notes' })
  }
})

dailyNotesRouter.post('/', async (req: Request, res: Response) => {
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required' })
  try {
    const result = await pool.query(
      'INSERT INTO daily_notes (text) VALUES ($1) RETURNING *',
      [text.trim()]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' })
  }
})
