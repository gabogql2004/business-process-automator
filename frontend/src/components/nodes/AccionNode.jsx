import { Handle, Position, useReactFlow } from 'reactflow'
import { FileSpreadsheet } from 'lucide-react'
import { NodeDeleteButton, NodeWarningBadge } from './NodeChrome.jsx'

const OPERACIONES = [
  { value: 'leer', label: 'Leer de Sheets' },
  { value: 'escribir', label: 'Escribir en Sheets' },
]

function AccionNode({ id, data }) {
  const { setNodes } = useReactFlow()

  function updateData(patch) {
    setNodes((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)),
    )
  }

  return (
    <div className="group relative min-w-[230px] rounded-xl border-l-4 border-l-teal-500 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-200">
      <NodeDeleteButton id={id} />
      <NodeWarningBadge message={data._warning} />
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-teal-500" />

      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-600">
          <FileSpreadsheet size={13} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-600">
          Acción (Sheets)
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{data.label || 'Sheets'}</p>

      <select
        value={data.operacion || 'leer'}
        onChange={(e) => updateData({ operacion: e.target.value })}
        className="nodrag mt-2 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        {OPERACIONES.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      <input
        type="text"
        value={data.spreadsheetId || ''}
        onChange={(e) => updateData({ spreadsheetId: e.target.value })}
        placeholder="spreadsheetId"
        className="nodrag mt-1.5 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <input
        type="text"
        value={data.range || ''}
        onChange={(e) => updateData({ range: e.target.value })}
        placeholder="Rango (ej: Hoja1!A1:D10)"
        className="nodrag mt-1.5 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />

      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-teal-500" />
    </div>
  )
}

export default AccionNode
