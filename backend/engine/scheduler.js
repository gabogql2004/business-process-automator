import cron from 'node-cron'
import { prisma } from '../config/prisma.js'
import { runWorkflow } from './executor.js'

// Mapa en memoria de tareas cron activas (workflowId -> Task de node-cron).
// Como es solo un proceso, no necesita persistirse: al reiniciar el server,
// initScheduler() vuelve a leer los workflows con cron desde la base y los
// reprograma desde cero.
const activeTasks = new Map()

function stopTask(workflowId) {
  const task = activeTasks.get(workflowId)
  if (task) {
    task.stop()
    activeTasks.delete(workflowId)
  }
}

// Programa (o reprograma) un workflow según su cronExpression actual. Se
// llama tanto al arrancar el server como cada vez que se guarda un workflow,
// así un cambio de horario o desactivar el workflow tiene efecto inmediato
// sin reiniciar el proceso.
export function scheduleWorkflow(workflow) {
  stopTask(workflow.id)

  if (!workflow.activo || !workflow.cronExpression) return

  if (!cron.validate(workflow.cronExpression)) {
    console.error(
      `[scheduler] Workflow ${workflow.id} tiene un cronExpression inválido: "${workflow.cronExpression}" — no se programó.`,
    )
    return
  }

  const task = cron.schedule(workflow.cronExpression, async () => {
    try {
      await runWorkflow(workflow, { input: '' })
    } catch {
      // El error ya quedó registrado en la Execution/ExecutionLog por
      // runWorkflow — acá solo evitamos que una excepción no capturada
      // tumbe el proceso del scheduler.
    }
  })

  activeTasks.set(workflow.id, task)
}

export function unscheduleWorkflow(workflowId) {
  stopTask(workflowId)
}

// Al arrancar el servidor, programa todos los workflows activos que tengan
// un cron configurado.
export async function initScheduler() {
  const workflows = await prisma.workflow.findMany({
    where: { activo: true, cronExpression: { not: null } },
  })
  for (const workflow of workflows) {
    scheduleWorkflow(workflow)
  }
  console.log(`[scheduler] ${activeTasks.size} workflow(s) programado(s) con cron`)
}
