import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/error.middleware.js'
import authRoutes from './routes/auth.routes.js'
import workflowsRoutes from './routes/workflows.routes.js'
import executionsRoutes from './routes/executions.routes.js'
import { initScheduler } from './engine/scheduler.js'

const app = express()

app.use(cors({ origin: env.frontendUrl }))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/workflows', workflowsRoutes)
app.use('/api/executions', executionsRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`Backend escuchando en http://localhost:${env.port}`)
  initScheduler()
})
