import { prisma } from '../config/prisma.js'
import { runWorkflow } from '../engine/executor.js'

async function findOwnedWorkflow(id, userId) {
  const workflow = await prisma.workflow.findUnique({ where: { id } })
  if (!workflow || workflow.userId !== userId) return null
  return workflow
}

export async function createExecution(req, res) {
  const workflow = await findOwnedWorkflow(req.params.id, req.userId)
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow no encontrado' })
  }

  try {
    const { input } = req.body
    const execution = await runWorkflow(workflow, { input })
    const logs = await prisma.executionLog.findMany({
      where: { executionId: execution.id },
      orderBy: { timestamp: 'asc' },
    })
    res.status(201).json({ execution, logs })
  } catch (err) {
    // El motor ya guardó el fallo en la Execution/ExecutionLog correspondiente;
    // acá solo le devolvemos el error + logs al cliente sin tumbar el servidor.
    const logs = err.executionId
      ? await prisma.executionLog.findMany({
          where: { executionId: err.executionId },
          orderBy: { timestamp: 'asc' },
        })
      : []
    res.status(422).json({ error: err.message, logs })
  }
}

export async function listExecutions(req, res, next) {
  try {
    const workflow = await findOwnedWorkflow(req.params.id, req.userId)
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }
    const executions = await prisma.execution.findMany({
      where: { workflowId: workflow.id },
      orderBy: { iniciadoEn: 'desc' },
    })
    res.json({ executions })
  } catch (err) {
    next(err)
  }
}

export async function getExecution(req, res, next) {
  try {
    const execution = await prisma.execution.findUnique({
      where: { id: req.params.id },
      include: { logs: { orderBy: { timestamp: 'asc' } } },
    })
    if (!execution) {
      return res.status(404).json({ error: 'Ejecución no encontrada' })
    }
    const workflow = await findOwnedWorkflow(execution.workflowId, req.userId)
    if (!workflow) {
      return res.status(404).json({ error: 'Ejecución no encontrada' })
    }
    res.json({ execution })
  } catch (err) {
    next(err)
  }
}
