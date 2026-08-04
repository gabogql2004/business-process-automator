import { useReactFlow } from 'reactflow'
import { Trash2, AlertTriangle } from 'lucide-react'

// Botón de eliminar que aparece al pasar el mouse sobre el nodo (el atajo de
// teclado Backspace/Delete ya funciona nativo en React Flow, pero sin esto
// nadie se entera de que existe).
export function NodeDeleteButton({ id }) {
  const { deleteElements } = useReactFlow()

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        deleteElements({ nodes: [{ id }] })
      }}
      title="Eliminar nodo"
      className="nodrag absolute -right-2 -top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 shadow ring-1 ring-slate-200 hover:text-red-600 group-hover:flex"
    >
      <Trash2 size={12} />
    </button>
  )
}

// Aviso de configuración incompleta/ambigua (ej. nodo de Sheets sin
// spreadsheetId, o un nodo con más de una conexión saliente que el motor no
// va a recorrer completa) — se ve en el builder en vez de recién al ejecutar.
export function NodeWarningBadge({ message }) {
  if (!message) return null
  return (
    <span
      title={message}
      className="absolute -right-2 -bottom-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-2 ring-white"
    >
      <AlertTriangle size={11} />
    </span>
  )
}
