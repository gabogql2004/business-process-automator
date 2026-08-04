import { prisma } from '../config/prisma.js'
import { execute as executeTrigger } from './nodes/trigger.node.js'
import { execute as executeIA } from './nodes/ia.node.js'
import { execute as executeEnd } from './nodes/end.node.js'
import { execute as executeCondicion } from './nodes/condicion.node.js'
import { execute as executeAccion } from './nodes/accion.node.js'
import { sendFailureAlert } from '../services/emailService.js'

// Los nodos "normales" reciben { node, input } y retornan directamente el
// nuevo output. El nodo "condicion" es especial: no transforma el dato, solo
// decide la rama a seguir, así que retorna { output, branch } — el executor
// lo distingue por tipo en vez de forzar una interfaz común artificial.
const handlers = {
  trigger: executeTrigger,
  ia: executeIA,
  end: executeEnd,
  accion: executeAccion,
}

const MAX_RETRIES = 3
const RETRY_BASE_DELAY_MS = 500

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Recorta el input/output de un nodo a un snippet legible para el log — sin
// esto, un output grande (ej. un documento largo) inundaría ExecutionLog.
function snapshot(value, maxLen = 200) {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  if (text === undefined) return 'undefined'
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text
}

function buildEdgesBySource(edges) {
  const map = new Map()
  for (const edge of edges) {
    const list = map.get(edge.source) || []
    list.push(edge)
    map.set(edge.source, list)
  }
  return map
}

// Reintenta un nodo hasta MAX_RETRIES veces con backoff exponencial (500ms,
// 1s, 2s) antes de dejar que el error se propague. Solo reintenta ESE nodo,
// no todo el flujo desde el Trigger — así un fallo transitorio de la API de
// Claude en el nodo de IA no obliga a re-ejecutar los nodos anteriores.
async function runWithRetry(fn, { node, log }) {
  let attempt = 0
  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt += 1
      if (attempt > MAX_RETRIES) throw err

      const delay = RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
      await log(
        node.id,
        `Intento ${attempt}/${MAX_RETRIES} falló: ${err.message}. Reintentando en ${delay}ms...`,
        'warning',
      )
      await sleep(delay)
    }
  }
}

// Interpreta el definicionJson de un workflow (nodos + edges de React Flow) y
// ejecuta los nodos en secuencia, empezando por el Trigger y siguiendo las
// conexiones (incluyendo ramas true/false del nodo de condición). Cada paso
// queda registrado en ExecutionLog para poder auditar/depurar qué pasó, y un
// error en un nodo (tras agotar los reintentos) detiene el flujo sin tumbar
// el proceso — el error se guarda en la Execution en vez de propagarse crudo.
export async function runWorkflow(workflow, { input = '' } = {}) {
  const { nodes = [], edges = [] } = workflow.definicionJson || {}

  const execution = await prisma.execution.create({
    data: { workflowId: workflow.id, estado: 'ejecutando' },
  })

  async function log(nodoId, mensaje, nivel = 'info') {
    await prisma.executionLog.create({
      data: { executionId: execution.id, nodoId, mensaje, nivel },
    })
  }

  try {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const edgesBySource = buildEdgesBySource(edges)

    const startNode = nodes.find((n) => n.type === 'trigger')
    if (!startNode) {
      throw new Error('El flujo debe tener un nodo Trigger para poder ejecutarse')
    }

    let currentNode = startNode
    let currentOutput = input
    const visited = new Set()

    while (currentNode) {
      if (visited.has(currentNode.id)) {
        throw new Error(`Ciclo detectado: el nodo "${currentNode.id}" ya se ejecutó antes`)
      }
      visited.add(currentNode.id)

      const nodeLabel = currentNode.data?.label || currentNode.type
      await log(currentNode.id, `Ejecutando nodo "${nodeLabel}" — input: ${snapshot(currentOutput)}`)
      const startedAt = Date.now()

      let nextEdge

      if (currentNode.type === 'condicion') {
        try {
          const { output, branch } = await runWithRetry(
            () => executeCondicion({ node: currentNode, input: currentOutput }),
            { node: currentNode, log },
          )
          currentOutput = output
          const duration = Date.now() - startedAt
          await log(currentNode.id, `Condición evaluada como "${branch}" (${duration}ms)`)
          const outgoing = edgesBySource.get(currentNode.id) || []
          nextEdge = outgoing.find((e) => e.sourceHandle === branch)
        } catch (nodeErr) {
          await log(currentNode.id, `Error: ${nodeErr.message}`, 'error')
          throw nodeErr
        }
      } else {
        const handler = handlers[currentNode.type]
        if (!handler) {
          throw new Error(`Tipo de nodo desconocido: "${currentNode.type}"`)
        }

        try {
          currentOutput = await runWithRetry(
            () => handler({ node: currentNode, input: currentOutput }),
            { node: currentNode, log },
          )
        } catch (nodeErr) {
          await log(currentNode.id, `Error: ${nodeErr.message}`, 'error')
          throw nodeErr
        }

        if (currentNode.type === 'end') {
          const duration = Date.now() - startedAt
          await log(
            currentNode.id,
            `Nodo "${nodeLabel}" completado (${duration}ms) — output: ${snapshot(currentOutput)}`,
          )
          break
        }

        nextEdge = (edgesBySource.get(currentNode.id) || [])[0]
      }

      const duration = Date.now() - startedAt
      await log(
        currentNode.id,
        `Nodo "${nodeLabel}" completado (${duration}ms) — output: ${snapshot(currentOutput)}`,
      )
      currentNode = nextEdge ? nodeMap.get(nextEdge.target) : null
    }

    return await prisma.execution.update({
      where: { id: execution.id },
      data: {
        estado: 'exitoso',
        resultado: { output: currentOutput },
        finalizadoEn: new Date(),
      },
    })
  } catch (err) {
    const failedExecution = await prisma.execution.update({
      where: { id: execution.id },
      data: {
        estado: 'fallido',
        resultado: { error: err.message },
        finalizadoEn: new Date(),
      },
    })

    // El envío del email va en su propio try/catch: si Resend falla (ej. sin
    // API key configurada, o el destinatario no está verificado en modo
    // sandbox), no queremos que eso oculte el error real del workflow.
    try {
      const owner = await prisma.user.findUnique({ where: { id: workflow.userId } })
      if (owner) {
        await sendFailureAlert(owner.email, {
          workflow,
          execution: failedExecution,
          errorMessage: err.message,
        })
      }
    } catch (emailErr) {
      console.error('[emailService] No se pudo enviar la alerta de fallo:', emailErr.message)
    }

    // El id queda en el error para que el caller pueda recuperar los logs
    // ya guardados sin tener que volver a consultar por otra vía.
    err.executionId = execution.id
    throw err
  }
}
