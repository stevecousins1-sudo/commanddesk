import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const employeesRouter = Router()

employeesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM employees ORDER BY name ASC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employees' })
  }
})

employeesRouter.post('/', async (req: Request, res: Response) => {
  const { name, role, initials, color, last_meeting } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO employees (name, role, initials, color, last_meeting)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, role, initials, color || '#60a5fa', last_meeting]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' })
  }
})

employeesRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const { name, role, initials, color, last_meeting } = req.body
  try {
    const result = await pool.query(
      `UPDATE employees SET name=$1, role=$2, initials=$3, color=$4, last_meeting=$5 WHERE id=$6 RETURNING *`,
      [name, role, initials, color, last_meeting, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update employee' })
  }
})

employeesRouter.patch('/:id/agenda-items', async (req: Request, res: Response) => {
  const { id } = req.params
  const { agenda_items } = req.body
  try {
    const result = await pool.query(
      'UPDATE employees SET agenda_items=$1 WHERE id=$2 RETURNING *',
      [JSON.stringify(agenda_items), id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update agenda items' })
  }
})

employeesRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM employees WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete employee' })
  }
})

employeesRouter.post('/:id/meeting-notes', async (req: Request, res: Response) => {
  const { id } = req.params
  const { date, summary, items } = req.body
  try {
    const employee = await pool.query('SELECT meeting_notes FROM employees WHERE id=$1', [id])
    if (employee.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const notes = employee.rows[0].meeting_notes || []
    notes.unshift({ date, summary, items, timestamp: new Date().toISOString() })
    const result = await pool.query(
      'UPDATE employees SET meeting_notes=$1, last_meeting=$2 WHERE id=$3 RETURNING *',
      [JSON.stringify(notes), date, id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add meeting notes' })
  }
})
