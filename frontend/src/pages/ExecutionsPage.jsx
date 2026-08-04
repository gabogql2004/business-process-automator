import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Circle, Inbox } from 'lucide-react'
import { getWorkflow } from '../services/workflowService'
import { listExecutions, getExecution } from '../services/executionService'
import Badge from '../components/ui/Badge.jsx'

const ESTADO_META = {
  exitoso: { variant: 'success', icon: CheckCircle2 },
  fallido: { variant: 'danger', icon: XCircle },
  ejecutando: { variant: 'warning', icon: Loader2 },
  pendiente: { variant: 'neutral', icon: Circle },
}

function EstadoBadge({ estado }) {
  const meta = ESTADO_META[estado] || ESTADO_META.pendiente
  return (
    <Badge variant={meta.variant}>
      <meta.icon size={12} className={estado === 'ejecutando' ? 'animate-spin' : ''} />
      {estado}
    </Badge>
  )
}

function formatDuration(iniciadoEn, finalizadoEn) {
  if (!finalizadoEn) return '—'
  const ms = new Date(finalizadoEn) - new Date(iniciadoEn)
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

function ExecutionsPage() {
  const { id } = useParams()
  const [workflow, setWorkflow] = useState(null)
  const [executions, setExecutions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [wf, execs] = await Promise.all([getWorkflow(id), listExecutions(id)])
        setWorkflow(wf)
        setExecutions(execs)
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudo cargar el historial')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSelect(executionId) {
    setSelectedId(executionId)
    setLoadingDetail(true)
    setSelectedDetail(null)
    try {
      setSelectedDetail(await getExecution(executionId))
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar el detalle de la ejecución')
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <Link
            to={`/workflows/${id}`}
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600"
          >
            <ArrowLeft size={14} />
            Volver al workflow
          </Link>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Historial {workflow ? `— ${workflow.nombre}` : ''}
          </h1>
        </div>
      </header>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-96 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Cargando...</p>
          ) : executions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <Inbox size={22} className="text-slate-300" />
              <p className="text-sm text-slate-500">
                Todavía no hay ejecuciones. Corre el workflow desde el builder o espera a que
                dispare su cron.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {executions.map((exec) => (
                <li key={exec.id}>
                  <button
                    onClick={() => handleSelect(exec.id)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                      selectedId === exec.id ? 'bg-brand-50/60' : ''
                    }`}
                  >
                    <EstadoBadge estado={exec.estado} />
                    <p className="mt-1.5 text-sm text-slate-700">
                      {new Date(exec.iniciadoEn).toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Duración: {formatDuration(exec.iniciadoEn, exec.finalizadoEn)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {!selectedId && (
            <p className="text-sm text-slate-400">
              Selecciona una ejecución de la lista para ver sus logs.
            </p>
          )}
          {loadingDetail && <p className="text-sm text-slate-500">Cargando detalle...</p>}
          {selectedDetail && !loadingDetail && (
            <>
              <div className="mb-3">
                <EstadoBadge estado={selectedDetail.estado} />
              </div>
              <ul className="space-y-1.5">
                {selectedDetail.logs.map((log) => (
                  <li
                    key={log.id}
                    className={`rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-inset ${
                      log.nivel === 'error'
                        ? 'bg-red-50 text-red-700 ring-red-200'
                        : log.nivel === 'warning'
                          ? 'bg-amber-50 text-amber-700 ring-amber-200'
                          : 'bg-white text-slate-600 ring-slate-200'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-slate-400">{log.nodoId}</span>{' '}
                    {log.mensaje}
                  </li>
                ))}
              </ul>
              {selectedDetail.resultado?.output !== undefined && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resultado final
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-white p-2.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200">
                    {typeof selectedDetail.resultado.output === 'object'
                      ? JSON.stringify(selectedDetail.resultado.output, null, 2)
                      : String(selectedDetail.resultado.output)}
                  </pre>
                </div>
              )}
              {selectedDetail.resultado?.error !== undefined && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-400">
                    Error
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg bg-red-50 p-2.5 text-xs text-red-700 ring-1 ring-inset ring-red-200">
                    {selectedDetail.resultado.error}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExecutionsPage
