import { Handle, Position, useReactFlow } from 'reactflow'
import { Sparkles } from 'lucide-react'
import { NodeDeleteButton, NodeWarningBadge } from './NodeChrome.jsx'

const SUBTIPOS = [
  { value: 'extraccion', label: 'Extracción de datos' },
  { value: 'clasificacion', label: 'Clasificación' },
  { value: 'generacion', label: 'Generación de contenido' },
]

function IANode({ id, data }) {
  const { setNodes } = useReactFlow()

  function handleSubtipoChange(e) {
    const subtipo = e.target.value
    setNodes((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, subtipo } } : node)),
    )
  }

  return (
    <div className="group relative min-w-[220px] rounded-xl border-l-4 border-l-brand-500 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-200">
      <NodeDeleteButton id={id} />
      <NodeWarningBadge message={data._warning} />
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-brand-500" />

      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-600">
          <Sparkles size={13} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-600">
          Acción (IA)
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{data.label || 'Nodo de IA'}</p>

      <select
        value={data.subtipo || 'extraccion'}
        onChange={handleSubtipoChange}
        className="nodrag mt-2 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        {SUBTIPOS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-brand-500" />
    </div>
  )
}

export default IANode
