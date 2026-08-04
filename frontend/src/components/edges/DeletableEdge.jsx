import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow'
import { X } from 'lucide-react'

// Muestra un botón "×" para borrar la conexión, pero solo cuando está
// seleccionada (click sobre la línea) — así no se llena el canvas de botones
// todo el tiempo. Backspace/Delete con la conexión seleccionada también borra.
function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}) {
  const { deleteElements } = useReactFlow()
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={selected ? { ...style, stroke: '#7c4dff', strokeWidth: 2 } : style}
        markerEnd={markerEnd}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="nodrag nopan absolute flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-500 shadow ring-1 ring-slate-200 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation()
              deleteElements({ edges: [{ id }] })
            }}
          >
            <X size={11} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default DeletableEdge
