import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  reconnectEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  ArrowLeft,
  History,
  Play,
  Save,
  AlertCircle,
  Check,
  Pencil,
  MousePointerSquareDashed,
  Sparkles,
} from 'lucide-react'
import { getWorkflow, updateWorkflow } from '../services/workflowService'
import { runExecution } from '../services/executionService'
import { exampleWorkflow } from '../data/exampleWorkflow.js'
import TriggerNode from '../components/nodes/TriggerNode.jsx'
import IANode from '../components/nodes/IANode.jsx'
import EndNode from '../components/nodes/EndNode.jsx'
import ConditionNode from '../components/nodes/ConditionNode.jsx'
import AccionNode from '../components/nodes/AccionNode.jsx'
import NodePalette from '../components/NodePalette.jsx'
import DeletableEdge from '../components/edges/DeletableEdge.jsx'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'
import Input from '../components/ui/Input.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

const nodeTypes = {
  trigger: TriggerNode,
  ia: IANode,
  end: EndNode,
  condicion: ConditionNode,
  accion: AccionNode,
}

const edgeTypes = { deletable: DeletableEdge }

const LABELS = {
  trigger: 'Inicio manual',
  ia: 'Nodo de IA',
  condicion: 'Si/No',
  accion: 'Sheets',
  end: 'Fin del flujo',
}

let idCounter = 0
function nextId() {
  idCounter += 1
  return `node_${Date.now()}_${idCounter}`
}

// Marca nodos con configuración incompleta o conexiones ambiguas, para
// avisar en el canvas en vez de que el usuario se entere recién al ejecutar.
function computeWarning(node, edgesBySourceCount) {
  if (node.type === 'accion' && (!node.data?.spreadsheetId || !node.data?.range)) {
    return 'Faltan spreadsheetId y/o range'
  }
  if (
    node.type !== 'condicion' &&
    node.type !== 'end' &&
    (edgesBySourceCount.get(node.id) || 0) > 1
  ) {
    return 'Tiene varias conexiones salientes: el motor solo sigue la primera'
  }
  return null
}

function WorkflowBuilderInner() {
  const { id } = useParams()
  const toast = useToast()
  const [workflow, setWorkflow] = useState(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const wrapperRef = useRef(null)
  const [reactFlowInstance, setReactFlowInstance] = useState(null)
  const [showRunPanel, setShowRunPanel] = useState(false)
  const [runInput, setRunInput] = useState('')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const [cronExpression, setCronExpression] = useState('')
  const [nombreInput, setNombreInput] = useState('')
  const [editingNombre, setEditingNombre] = useState(false)
  const [savingNombre, setSavingNombre] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const wf = await getWorkflow(id)
        setWorkflow(wf)
        setNodes(wf.definicionJson?.nodes || [])
        setEdges(wf.definicionJson?.edges || [])
        setCronExpression(wf.cronExpression || '')
        setNombreInput(wf.nombre)
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar el workflow')
      }
    }
    load()
  }, [id, setNodes, setEdges])

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  // Permite agarrar la punta de una conexión (igual que al crearla) y
  // arrastrarla a otro handle para reconectarla, o soltarla en el vacío del
  // canvas para desconectarla — mismo gesto que conectar, pero al revés.
  const edgeReconnectSuccessful = useRef(true)

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false
  }, [])

  const onReconnect = useCallback((oldEdge, newConnection) => {
    edgeReconnectSuccessful.current = true
    setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
  }, [setEdges])

  const onReconnectEnd = useCallback((_event, edge) => {
    if (!edgeReconnectSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id))
    }
    edgeReconnectSuccessful.current = true
  }, [setEdges])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('application/reactflow')
      if (!type || !reactFlowInstance) return

      // screenToFlowPosition espera coordenadas de pantalla (clientX/Y) y ya
      // descuenta internamente la posición del canvas — no restar el bounds a mano.
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      })

      const newNode = {
        id: nextId(),
        type,
        position,
        data: {
          label: LABELS[type],
          ...(type === 'ia' ? { subtipo: 'extraccion' } : {}),
          ...(type === 'condicion' ? { operador: 'existe' } : {}),
          ...(type === 'accion' ? { operacion: 'leer' } : {}),
        },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [reactFlowInstance, setNodes],
  )

  function handleLoadExample() {
    setNodes(exampleWorkflow.nodes)
    setEdges(exampleWorkflow.edges)
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const definicionJson = { nodes, edges }
      await updateWorkflow(id, { definicionJson, cronExpression: cronExpression.trim() || null })
      toast.success('Workflow guardado')
    } catch (err) {
      const message = err.response?.data?.error || 'No se pudo guardar el workflow'
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNombre() {
    const trimmed = nombreInput.trim()
    if (!trimmed || trimmed === workflow?.nombre) {
      setNombreInput(workflow?.nombre || '')
      setEditingNombre(false)
      return
    }
    setSavingNombre(true)
    try {
      const updated = await updateWorkflow(id, { nombre: trimmed })
      setWorkflow(updated)
      toast.success('Nombre actualizado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo renombrar el workflow')
      setNombreInput(workflow?.nombre || '')
    } finally {
      setSavingNombre(false)
      setEditingNombre(false)
    }
  }

  async function handleRun() {
    setRunning(true)
    setRunResult(null)
    try {
      const { execution, logs } = await runExecution(id, runInput)
      setRunResult({ execution, logs })
    } catch (err) {
      // Un flujo fallido responde 422 con el error y los logs ya guardados
      // hasta el nodo donde se detuvo — igual los mostramos, no es un error de red.
      const data = err.response?.data
      setRunResult({
        execution: { estado: 'fallido' },
        logs: data?.logs || [],
        error: data?.error || 'No se pudo ejecutar el workflow',
      })
    } finally {
      setRunning(false)
    }
  }

  const displayNodes = useMemo(() => {
    const edgesBySourceCount = new Map()
    for (const edge of edges) {
      edgesBySourceCount.set(edge.source, (edgesBySourceCount.get(edge.source) || 0) + 1)
    }
    return nodes.map((node) => ({
      ...node,
      data: { ...node.data, _warning: computeWarning(node, edgesBySourceCount) },
    }))
  }, [nodes, edges])

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>

          {editingNombre ? (
            <div className="flex items-center gap-1.5">
              <Input
                autoFocus
                value={nombreInput}
                onChange={(e) => setNombreInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveNombre()}
                disabled={savingNombre}
                className="w-56 py-1 text-lg font-semibold"
              />
              <button
                onClick={handleSaveNombre}
                disabled={savingNombre}
                className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50"
              >
                <Check size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingNombre(true)}
              className="group flex items-center gap-1.5"
              title="Renombrar workflow"
            >
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                {workflow?.nombre || 'Cargando...'}
              </h1>
              <Pencil
                size={13}
                className="text-slate-300 opacity-0 group-hover:opacity-100"
              />
            </button>
          )}

          <Link
            to={`/workflows/${id}/executions`}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <History size={14} />
            Ver historial de ejecuciones
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="text"
            value={cronExpression}
            onChange={(e) => setCronExpression(e.target.value)}
            placeholder="Cron (ej: 0 9 * * *)"
            title="Expresión cron para correr este workflow automáticamente. Déjalo vacío para ejecutarlo solo manualmente."
            className="w-52"
          />
          {error && (
            <span className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle size={14} />
              {error}
            </span>
          )}
          <Button variant="secondary" onClick={() => setShowRunPanel((v) => !v)}>
            <Play size={14} />
            {showRunPanel ? 'Ocultar ejecución' : 'Ejecutar'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save size={14} />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div className="relative flex-1 bg-slate-50" ref={wrapperRef}>
          {nodes.length === 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
              <MousePointerSquareDashed size={28} className="text-slate-300" />
              <p className="max-w-xs text-sm text-slate-400">
                Arrastra un nodo del panel de la izquierda para empezar a armar tu flujo
              </p>
              <Button
                variant="secondary"
                onClick={handleLoadExample}
                className="pointer-events-auto"
              >
                <Sparkles size={14} />
                Cargar ejemplo: procesamiento de facturas
              </Button>
            </div>
          )}
          <ReactFlow
            nodes={displayNodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onInit={setReactFlowInstance}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={['Backspace', 'Delete']}
            defaultEdgeOptions={{ type: 'deletable', style: { stroke: '#94a3b8', strokeWidth: 1.5 } }}
            fitView
          >
            <Background color="#cbd5e1" gap={20} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {showRunPanel && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Input inicial (nodo Trigger)
            </p>
            <textarea
              value={runInput}
              onChange={(e) => setRunInput(e.target.value)}
              rows={4}
              placeholder="Ej: Factura #123, monto $500, proveedor Acme"
              className="w-full rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button onClick={handleRun} disabled={running} className="mt-2 w-full">
              <Play size={14} />
              {running ? 'Ejecutando...' : 'Correr flujo'}
            </Button>

            {runResult && (
              <div className="mt-4 flex-1 overflow-y-auto">
                <Badge
                  variant={runResult.execution.estado === 'exitoso' ? 'success' : 'danger'}
                  className="mb-3"
                >
                  Estado: {runResult.execution.estado}
                </Badge>
                {runResult.error && (
                  <p className="mb-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-200">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    {runResult.error}
                  </p>
                )}
                <ul className="space-y-1.5">
                  {runResult.logs.map((log) => (
                    <li
                      key={log.id}
                      className={`rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset ${
                        log.nivel === 'error'
                          ? 'bg-red-50 text-red-700 ring-red-200'
                          : log.nivel === 'warning'
                            ? 'bg-amber-50 text-amber-700 ring-amber-200'
                            : 'bg-slate-50 text-slate-600 ring-slate-200'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-slate-400">{log.nodoId}</span>{' '}
                      {log.mensaje}
                    </li>
                  ))}
                </ul>
                {runResult.execution.resultado?.output !== undefined && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Resultado final
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                      {typeof runResult.execution.resultado.output === 'object'
                        ? JSON.stringify(runResult.execution.resultado.output, null, 2)
                        : String(runResult.execution.resultado.output)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  )
}

export default WorkflowBuilderPage
