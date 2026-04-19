export interface Project {
  id: number
  name: string
  client?: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  color: string
  description?: string
  due_date?: string
  members: string[]
  notes: Note[]
  created_at: string
}

export interface StatusUpdate {
  text: string
  timestamp: string
}

export interface Task {
  id: number
  title: string
  description?: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'todo' | 'inprogress' | 'review' | 'done'
  category: 'proj' | 'adhoc'
  project_id?: number
  project_name?: string
  assigned_from?: string
  report_to?: string
  assignee?: string
  due_date?: string
  completed_at?: string
  notes: Note[]
  status_updates: StatusUpdate[]
  created_at: string
}

export interface Employee {
  id: number
  name: string
  role: string
  initials: string
  color: string
  last_meeting?: string
  agenda_items: AgendaItem[]
  meeting_notes: MeetingNote[]
  created_at: string
}

export interface StaffCall {
  id: number
  name: string
  schedule?: string
  next_date?: string
  agenda_items: SimpleAgendaItem[]
  created_at: string
}

export interface Note {
  text: string
  by?: string
  timestamp: string
}

export interface AgendaItem {
  text: string
  done: boolean
  date_added: string
  notes: Note[]
}

export interface SimpleAgendaItem {
  text: string
  done: boolean
}

export interface MeetingNote {
  date: string
  summary?: string
  items?: string[]
  timestamp: string
}

export type View =
  | 'dashboard'
  | 'all-tasks'
  | 'due-this-week'
  | 'project'
  | 'adhoc-tasks'
  | 'employee'
  | 'staff-calls'

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low'
export type TaskStatus = 'todo' | 'inprogress' | 'review' | 'done'
