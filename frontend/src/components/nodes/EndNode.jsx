import { Handle, Position } from 'reactflow'
import { Flag } from 'lucide-react'
import { NodeDeleteButton } from './NodeChrome.jsx'

function EndNode({ id, data }) {
  return (
    <div className="group relative min-w-[170px] rounded-xl border-l-4 border-l-slate-400 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-200">
      <NodeDeleteButton id={id} />
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400" />
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <Flag size={13} />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Fin</p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{data.label || 'Fin del flujo'}</p>
    </div>
  )
}

export default EndNode
