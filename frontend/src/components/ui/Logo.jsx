import { Workflow } from 'lucide-react'

function Logo({ withLabel = true, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white">
        <Workflow size={16} strokeWidth={2.25} />
      </span>
      {withLabel && (
        <span className="text-sm font-semibold tracking-tight text-slate-900">
          Process Automator
        </span>
      )}
    </div>
  )
}

export default Logo
