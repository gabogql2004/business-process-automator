import { Router } from 'express'
import {
  listWorkflows,
  createWorkflow,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
} from '../controllers/workflows.controller.js'
import { createExecution, listExecutions } from '../controllers/executions.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', listWorkflows)
router.post('/', createWorkflow)
router.get('/:id', getWorkflow)
router.put('/:id', updateWorkflow)
router.delete('/:id', deleteWorkflow)

router.post('/:id/executions', createExecution)
router.get('/:id/executions', listExecutions)

export default router
