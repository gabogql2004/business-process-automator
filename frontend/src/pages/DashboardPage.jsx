import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Plus, Clock, Workflow as WorkflowIcon, History, Copy, Trash2 } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import {
  listWorkflows,
  createWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
} from '../services/workflowService'
import Topbar from '../components/Topbar.jsx'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import { useToast } from '../components/ui/ToastProvider.jsx'

function DashboardPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const user = useAuth((state) => state.user)
  const logout = useAuth((state) => state.logout)
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [duplicatingId, setDuplicatingId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        setWorkflows(await listWorkflows())
      } catch (err) {
        setError(err.response?.data?.error || 'No se pudieron cargar los workflows')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError('')
    try {
      const workflow = await createWorkflow({
        nombre: `Workflow ${workflows.length + 1}`,
      })
      navigate(`/workflows/${workflow.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear el workflow')
      setCreating(false)
    }
  }

  async function handleDuplicate(wf, e) {
    e.stopPropagation()
    setDuplicatingId(wf.id)
    try {
      const copy = await duplicateWorkflow(wf)
      setWorkflows((current) => [copy, ...current])
      toast.success(`"${wf.nombre}" duplicado`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo duplicar el workflow')
    } finally {
      setDuplicatingId(null)
    }
  }

  async function handleDeleteConfirmed() {
    setDeleting(true)
    try {
      await deleteWorkflow(deleteTarget.id)
      setWorkflows((current) => current.filter((wf) => wf.id !== deleteTarget.id))
      toast.success(`"${deleteTarget.nombre}" eliminado`)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el workflow')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar user={user} onLogout={logout} />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Tus workflows
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Crea, edita y monitorea tus flujos de automatización
            </p>
          </div>
          <Button onClick={handleCreate} disabled={creating}>
            <Plus size={16} />
            {creating ? 'Creando...' : 'Nuevo workflow'}
          </Button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-sm text-slate-500">Cargando...</p>
        ) : workflows.length === 0 ? (
          <Card className="mt-8 flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <WorkflowIcon size={22} />
            </span>
            <div>
              <p className="font-medium text-slate-900">Todavía no tienes workflows</p>
              <p className="mt-1 text-sm text-slate-500">
                Crea el primero con el botón de arriba
              </p>
            </div>
          </Card>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <li key={wf.id}>
                <Card className="group flex h-full flex-col p-5 shadow-sm transition-shadow hover:shadow-md">
                  <button
                    onClick={() => navigate(`/workflows/${wf.id}`)}
                    className="flex flex-1 flex-col items-start text-left"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <WorkflowIcon size={16} />
                    </span>
                    <p className="mt-3 font-medium text-slate-900 group-hover:text-brand-700">
                      {wf.nombre}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={12} />
                      {new Date(wf.createdAt).toLocaleDateString()}
                    </p>
                    {wf.cronExpression && (
                      <Badge variant="brand" className="mt-3">
                        cron: {wf.cronExpression}
                      </Badge>
                    )}
                  </button>
                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      to={`/workflows/${wf.id}/executions`}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600"
                    >
                      <History size={13} />
                      Ver historial
                    </Link>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDuplicate(wf, e)}
                        disabled={duplicatingId === wf.id}
                        title="Duplicar workflow"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(wf)
                        }}
                        title="Eliminar workflow"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar workflow"
        description={`Vas a eliminar "${deleteTarget?.nombre}" junto con todo su historial de ejecuciones. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default DashboardPage
