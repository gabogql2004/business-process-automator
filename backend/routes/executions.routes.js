import { Router } from 'express'
import { getExecution } from '../controllers/executions.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.get('/:id', requireAuth, getExecution)

export default router
