import express from 'express'
import cors from 'cors'
import path from 'path'
import { router } from './routes'
import { runMigrations } from './migrations'

const app = express()
const PORT = parseInt(process.env.PORT || '3000')

// The React app is served by this same server (and proxied via Vite in dev),
// so the API is always same-origin and needs no cross-origin access by default.
// Set CORS_ORIGIN (comma-separated) only if a separate front-end origin must reach the API.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  })
)
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
