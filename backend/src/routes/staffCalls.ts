import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const staffCallsRouter = Router()

staffCallsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM staff_calls ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff calls' })
  }
})

staffCallsRouter.post('/', async (req: Request, res: Response) => {
  const { name, schedule, next_date } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO staff_calls (name, schedule, next_date) VALUES ($1, $2, $3) RETURNING *`,
      [name, schedule, next_date]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff call' })
  }
})

staffCallsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, schedule, next_date } = req.body
  try {
    const result = await pool.query(
      `UPDATE staff_calls SET name=$1, schedule=$2, next_date=$3 WHERE id=$4 RETURNING *`,
      [name, schedule, next_date, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update staff call' })
  }
})

staffCallsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM staff_calls WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete staff call' })
  }
})

staffCallsRouter.patch('/:id/agenda-items', async (req: Request, res: Response) => {
  const { id } = req.params
  const { agenda_items } = req.body
  try {
    const result = await pool.query(
      'UPDATE staff_calls SET agenda_items=$1 WHERE id=$2 RETURNING *',
      [JSON.stringify(agenda_items), id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update agenda items' })
  }
})
