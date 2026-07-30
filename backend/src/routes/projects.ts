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

// Tasks cache their project's name in tasks.project_name, so a rename has to be
// pushed out to them or cards and search results keep showing the old name.
projectsRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, client, priority, color, description, due_date, members } = req.body
  const dbClient = await pool.connect()
  try {
    await dbClient.query('BEGIN')
    const result = await dbClient.query(
      `UPDATE projects SET name=$1, client=$2, priority=$3, color=$4, description=$5,
       due_date=$6, members=$7 WHERE id=$8 RETURNING *`,
      [name, client, priority, color, description, due_date || null, members, id]
    )
    if (result.rows.length === 0) {
      await dbClient.query('ROLLBACK')
      return res.status(404).json({ error: 'Not found' })
    }
    await dbClient.query('UPDATE tasks SET project_name=$1 WHERE project_id=$2', [
      result.rows[0].name,
      id,
    ])
    await dbClient.query('COMMIT')
    res.json(result.rows[0])
  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: 'Failed to update project' })
  } finally {
    dbClient.release()
  }
})

// The tasks FK is ON DELETE SET NULL, which would leave tasks pointing at no
// project while still carrying its name and category 'proj' — invisible on every
// project board but still badged. Convert them to ad-hoc tasks instead of
// deleting them, so nothing is silently lost.
projectsRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const dbClient = await pool.connect()
  try {
    await dbClient.query('BEGIN')
    await dbClient.query(
      `UPDATE tasks SET project_name=NULL, category='adhoc' WHERE project_id=$1`,
      [id]
    )
    await dbClient.query('DELETE FROM projects WHERE id=$1', [id])
    await dbClient.query('COMMIT')
    res.status(204).send()
  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: 'Failed to delete project' })
  } finally {
    dbClient.release()
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
