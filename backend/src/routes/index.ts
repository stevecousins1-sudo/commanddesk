import { Router } from 'express'
import { projectsRouter } from './projects'
import { tasksRouter } from './tasks'
import { employeesRouter } from './employees'
import { staffCallsRouter } from './staffCalls'
import { dailyNotesRouter } from './dailyNotes'

export const router = Router()

router.use('/projects', projectsRouter)
router.use('/tasks', tasksRouter)
router.use('/employees', employeesRouter)
router.use('/staff-calls', staffCallsRouter)
router.use('/daily-notes', dailyNotesRouter)
