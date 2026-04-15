import express from 'express'
import cors from 'cors'
import path from 'path'
import { router } from './routes'
import { runMigrations } from './migrations'

const app = express()
const PORT = parseInt(process.env.PORT || '3000')

app.use(cors())
app.use(express.json())

// API routes
app.use('/api', router)

// Serve compiled React app
const publicPath = path.join(__dirname, '..', 'public')
app.use(express.static(publicPath))
app.get('*', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

async function start() {
  try {
    await runMigrations()
    app.listen(PORT, () => {
      console.log(`CommandDesk running on port ${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
