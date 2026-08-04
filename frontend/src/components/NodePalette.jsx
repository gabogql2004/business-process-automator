import { Play, Sparkles, GitBranch, FileSpreadsheet, Flag, GripVertical } from 'lucide-react'

const NODE_TYPES = [
  {
    type: 'trigger',
    label: 'Trigger manual',
    icon: Play,
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    type: 'ia',
    label: 'Acción (IA)',
    icon: Sparkles,
    iconClass: 'bg-brand-50 text-brand-600',
  },
  {
    type: 'condicion',
    label: 'Condición (if/else)',
    icon: GitBranch,
    iconClass: 'bg-amber-50 text-amber-600',
  },
  {
    type: 'accion',
    label: 'Acción (Sheets)',
    icon: FileSpreadsheet,
    iconClass: 'bg-teal-50 text-teal-600',
  },
  {
    type: 'end',
    label: 'Fin',
    icon: Flag,
    iconClass: 'bg-slate-100 text-slate-500',
  },
]

function onDragStart(e, nodeType) {
  e.dataTransfer.setData('application/reactflow', nodeType)
  e.dataTransfer.effectAllowed = 'move'
}

function NodePalette() {
  return (
    <aside className="w-52 shrink-0 border-r border-slate-200 bg-white p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Arrastra al canvas
      </p>
      <div className="space-y-1.5">
        {NODE_TYPES.map((n) => (
          <div
            key={n.type}
            draggable
            onDragStart={(e) => onDragStart(e, n.type)}
            className="group flex cursor-grab items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700 ring-1 ring-transparent hover:bg-slate-50 hover:ring-slate-200 active:cursor-grabbing"
          >
            <span className={`flex h-7 w-7 items-center justify-center rounded-md ${n.iconClass}`}>
              <n.icon size={14} />
            </span>
            <span className="flex-1">{n.label}</span>
            <GripVertical size={14} className="text-slate-300 group-hover:text-slate-400" />
          </div>
        ))}
      </div>
    </aside>
  )
}

export default NodePalette
