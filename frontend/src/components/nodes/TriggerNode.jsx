import { Handle, Position } from 'reactflow'
import { Play } from 'lucide-react'
import { NodeDeleteButton, NodeWarningBadge } from './NodeChrome.jsx'

function TriggerNode({ id, data }) {
  return (
    <div className="group relative min-w-[180px] rounded-xl border-l-4 border-l-emerald-500 bg-white px-3.5 py-3 shadow-sm ring-1 ring-slate-200">
      <NodeDeleteButton id={id} />
      <NodeWarningBadge message={data._warning} />
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
          <Play size={13} fill="currentColor" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
          Trigger
        </p>
      </div>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{data.label || 'Inicio manual'}</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500" />
    </div>
  )
}

export default TriggerNode
