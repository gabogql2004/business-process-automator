import { Handle, Position, useReactFlow } from 'reactflow'
import { GitBranch, X, Check } from 'lucide-react'
import { NodeDeleteButton, NodeWarningBadge } from './NodeChrome.jsx'

const OPERADORES = [
  { value: 'existe', label: 'existe (no vacío)' },
  { value: 'igual', label: 'es igual a' },
  { value: 'contiene', label: 'contiene' },
]

function ConditionNode({ id, data }) {
  const { setNodes } = useReactFlow()

  function updateData(patch) {
    setNodes((nodes) =>
      nodes.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)),
    )
  }

  const necesitaValor = data.operador !== 'existe' && (data.operador ?? 'existe') !== 'existe'

  return (
    <div className="group relative min-w-[230px] rounded-xl border-l-4 border-l-amber-500 bg-white px-3.5 py-3 pb-5 shadow-sm ring-1 ring-slate-200">
      <NodeDeleteButton id={id} />
      <NodeWarningBadge message={data._warning} />
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500" />

      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600">
          <GitBranch size={13} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
          Condición
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{data.label || 'Si/No'}</p>

      <input
        type="text"
        value={data.campo || ''}
        onChange={(e) => updateData({ campo: e.target.value })}
        placeholder="Campo (vacío = todo el input)"
        className="nodrag mt-2 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      <select
        value={data.operador || 'existe'}
        onChange={(e) => updateData({ operador: e.target.value })}
        className="nodrag mt-1.5 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        {OPERADORES.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {necesitaValor && (
        <input
          type="text"
          value={data.valor || ''}
          onChange={(e) => updateData({ valor: e.target.value })}
          placeholder="Valor a comparar"
          className="nodrag mt-1.5 w-full rounded-md border-0 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      )}

      <div className="mt-3 flex justify-between text-[10px] font-medium text-slate-400">
        <span className="flex items-center gap-0.5">
          <X size={11} className="text-red-500" /> Falso
        </span>
        <span className="flex items-center gap-0.5">
          <Check size={11} className="text-emerald-500" /> Verdadero
        </span>
      </div>

      <Handle
        type="source"
        id="false"
        position={Position.Bottom}
        style={{ left: '25%' }}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-red-500"
      />
      <Handle
        type="source"
        id="true"
        position={Position.Bottom}
        style={{ left: '75%' }}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500"
      />
    </div>
  )
}

export default ConditionNode
