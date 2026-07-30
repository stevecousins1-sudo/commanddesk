import { Router, Request, Response } from 'express'
import { pool } from '../db'

export const tasksRouter = Router()

// Columns a client may write through POST / PUT.
const WRITABLE_COLUMNS = [
  'title',
  'description',
  'priority',
  'status',
  'category',
  'project_id',
  'project_name',
  'assigned_from',
  'report_to',
  'due_date',
  'assignee',
  'video_link',
  'today',
] as const

// Nullable columns where an empty string from a cleared form field means "unset".
const NULL_IF_EMPTY = new Set([
  'project_id',
  'project_name',
  'assigned_from',
  'report_to',
  'due_date',
  'assignee',
  'video_link',
])

function normalize(column: string, value: unknown): unknown {
  if (NULL_IF_EMPTY.has(column) && (value === '' || value === undefined)) return null
  return value
}

tasksRouter.get('/', async (req: Request, res: Response) => {
  try {
    const conditions: string[] = []
    const values: unknown[] = []
    let idx = 1

    if (req.query.status) {
      conditions.push(`status = $${idx++}`)
      values.push(req.query.status)
    }
    if (req.query.project_id) {
      conditions.push(`project_id = $${idx++}`)
      values.push(req.query.project_id)
    }
    if (req.query.category) {
      conditions.push(`category = $${idx++}`)
      values.push(req.query.category)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const result = await pool.query(
      `SELECT * FROM tasks ${where} ORDER BY created_at DESC`,
      values
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' })
  }
})

tasksRouter.post('/', async (req: Request, res: Response) => {
  const { title, description, priority, status, category, project_id, project_name, assigned_from, report_to, due_date, assignee, video_link } = req.body
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, priority, status, category, project_id, project_name, assigned_from, report_to, due_date, assignee, video_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        title,
        description,
        priority || 'Medium',
        status || 'todo',
        category || 'proj',
        normalize('project_id', project_id),
        normalize('project_name', project_name),
        normalize('assigned_from', assigned_from),
        normalize('report_to', report_to),
        normalize('due_date', due_date),
        normalize('assignee', assignee),
        normalize('video_link', video_link),
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' })
  }
})

// Updates only the columns present in the request body. Editing a task through a
// form that omits a field (e.g. the edit modal has no video_link input) must not
// blank that column out.
tasksRouter.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  const assignments: string[] = []
  const values: unknown[] = []
  let idx = 1

  for (const column of WRITABLE_COLUMNS) {
    if (!(column in req.body)) continue
    assignments.push(`${column}=$${idx++}`)
    values.push(normalize(column, req.body[column]))
  }

  if (assignments.length === 0) {
    return res.status(400).json({ error: 'No fields to update' })
  }

  values.push(id)
  try {
    const result = await pool.query(
      `UPDATE tasks SET ${assignments.join(', ')} WHERE id=$${idx} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' })
  }
})

tasksRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params
  const { status } = req.body
  try {
    const result = await pool.query(
      'UPDATE tasks SET status=$1 WHERE id=$2 RETURNING *',
      [status, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' })
  }
})

tasksRouter.patch('/:id/complete', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    const result = await pool.query(
      `UPDATE tasks SET status='done', completed_at=$1, today=false WHERE id=$2 RETURNING *`,
      [new Date().toISOString(), id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete task' })
  }
})

tasksRouter.patch('/:id/today', async (req: Request, res: Response) => {
  const { id } = req.params
  const { today } = req.body
  try {
    const result = await pool.query(
      'UPDATE tasks SET today=$1 WHERE id=$2 RETURNING *',
      [today, id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to update today flag' })
  }
})

tasksRouter.post('/:id/notes', async (req: Request, res: Response) => {
  const { id } = req.params
  const { text, by } = req.body
  try {
    const task = await pool.query('SELECT notes FROM tasks WHERE id=$1', [id])
    if (task.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const notes = task.rows[0].notes || []
    notes.push({ text, by, timestamp: new Date().toISOString() })
    const result = await pool.query('UPDATE tasks SET notes=$1 WHERE id=$2 RETURNING *', [JSON.stringify(notes), id])
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' })
  }
})

tasksRouter.post('/:id/status-updates', async (req: Request, res: Response) => {
  const { id } = req.params
  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'Text is required' })
  try {
    const task = await pool.query('SELECT status_updates FROM tasks WHERE id=$1', [id])
    if (task.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const updates = task.rows[0].status_updates || []
    updates.unshift({ text: text.trim(), timestamp: new Date().toISOString() })
    const result = await pool.query(
      'UPDATE tasks SET status_updates=$1 WHERE id=$2 RETURNING *',
      [JSON.stringify(updates), id]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Failed to add status update' })
  }
})

tasksRouter.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  try {
    await pool.query('DELETE FROM tasks WHERE id=$1', [id])
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' })
  }
})
