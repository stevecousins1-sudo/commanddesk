import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const projectsRouter = Router()

projectsRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM projects ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' })
  }
})

projectsRouter.post('/', async (req: Request, res: Response) => {
  const { name, client, priority, color, description, due_date, members } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO projects (name, client, priority, color, description, due_date, members)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, client, priority || 'Medium', color || '#60a5fa', description, due_date, members || []]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project' })
  }
})

projectsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, client, priority, color, description, due_date, members } = req.body
  try {
    const result = await pool.query(
      `UPDATE projects SET name=$1, client=$2, priority=$3, color=$4, description=$5,
       due_date=$6, members=$7 WHERE id=$8 RETURNING *`,
      [name, client, priority, color, description, due_date, members, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' })
  }
})

projectsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM projects WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project' })
  }
})

projectsRouter.post('/:id/notes', async (req: Request, res: Response) => {
  const { id } = req.params
  const { text, by } = req.body
  try {
    const project = await pool.query('SELECT notes FROM projects WHERE id=$1', [id])
    if (project.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const notes = project.rows[0].notes || []
    notes.push({ text, by, timestamp: new Date().toISOString() })
    const result = await pool.query('UPDATE projects SET notes=$1 WHERE id=$2 RETURNING *', [JSON.stringify(notes), id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' })
  }
})
