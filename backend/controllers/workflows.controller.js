import cron from 'node-cron'
import { prisma } from '../config/prisma.js'
import { scheduleWorkflow, unscheduleWorkflow } from '../engine/scheduler.js'

const EMPTY_DEFINICION = { nodes: [], edges: [] }

export async function listWorkflows(req, res, next) {
  try {
    const workflows = await prisma.workflow.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ workflows })
  } catch (err) {
    next(err)
  }
}

export async function createWorkflow(req, res, next) {
  try {
    const { nombre, descripcion, definicionJson } = req.body
    if (!nombre) {
      return res.status(400).json({ error: 'nombre es requerido' })
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId: req.userId,
        nombre,
        descripcion: descripcion || null,
        // Permite arrancar con un definicionJson ya armado (ej. al duplicar
        // un workflow existente) en vez de forzar siempre un canvas vacío.
        definicionJson: definicionJson ?? EMPTY_DEFINICION,
      },
    })
    res.status(201).json({ workflow })
  } catch (err) {
    next(err)
  }
}

export async function getWorkflow(req, res, next) {
  try {
    const workflow = await prisma.workflow.findUnique({ where: { id: req.params.id } })
    if (!workflow || workflow.userId !== req.userId) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }
    res.json({ workflow })
  } catch (err) {
    next(err)
  }
}

export async function updateWorkflow(req, res, next) {
  try {
    const existing = await prisma.workflow.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }

    const { nombre, descripcion, definicionJson, activo, cronExpression } = req.body

    if (cronExpression && !cron.validate(cronExpression)) {
      return res.status(400).json({ error: `Expresión cron inválida: "${cronExpression}"` })
    }

    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: {
        ...(nombre !== undefined && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(definicionJson !== undefined && { definicionJson }),
        ...(activo !== undefined && { activo }),
        ...(cronExpression !== undefined && { cronExpression: cronExpression || null }),
      },
    })

    // Reprograma en caliente: si cambió el cron o el estado activo, el
    // scheduler debe reflejarlo sin esperar a un reinicio del servidor.
    if (workflow.cronExpression) {
      scheduleWorkflow(workflow)
    } else {
      unscheduleWorkflow(workflow.id)
    }

    res.json({ workflow })
  } catch (err) {
    next(err)
  }
}

export async function deleteWorkflow(req, res, next) {
  try {
    const existing = await prisma.workflow.findUnique({ where: { id: req.params.id } })
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Workflow no encontrado' })
    }

    unscheduleWorkflow(existing.id)

    // No hay onDelete: Cascade en el schema, así que hay que borrar en orden
    // manualmente: logs -> ejecuciones -> workflow, dentro de una transacción
    // para que quede todo o nada si algo falla a mitad de camino.
    await prisma.$transaction([
      prisma.executionLog.deleteMany({
        where: { execution: { workflowId: existing.id } },
      }),
      prisma.execution.deleteMany({ where: { workflowId: existing.id } }),
      prisma.workflow.delete({ where: { id: existing.id } }),
    ])

    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
