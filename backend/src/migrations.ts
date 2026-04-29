import { pool } from './db'

export async function runMigrations(): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        client TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        color TEXT NOT NULL DEFAULT '#60a5fa',
        description TEXT,
        due_date TEXT,
        members TEXT[] DEFAULT '{}',
        notes JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'Medium',
        status TEXT NOT NULL DEFAULT 'todo',
        category TEXT NOT NULL DEFAULT 'proj',
        project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
        project_name TEXT,
        assigned_from TEXT,
        report_to TEXT,
        due_date TEXT,
        completed_at TEXT,
        notes JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT`)
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status_updates JSONB DEFAULT '[]'`)
    await client.query(`ALTER TABLE tasks ADD COLUMN IF NOT EXISTS today BOOLEAN DEFAULT FALSE`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_notes (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        initials TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#60a5fa',
        last_meeting TEXT,
        agenda_items JSONB DEFAULT '[]',
        meeting_notes JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_calls (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        schedule TEXT,
        next_date TEXT,
        agenda_items JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    console.log('Migrations complete')
  } finally {
    client.release()
  }
}
