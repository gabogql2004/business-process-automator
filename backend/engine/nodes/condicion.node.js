// El nodo de condición no transforma el dato (el input pasa intacto al
// siguiente nodo), solo decide por cuál de las dos salidas ("true"/"false")
// debe continuar el executor. Por eso su forma de retorno es distinta a la
// de los demás nodos: { output, branch } en vez de solo el output.
function getCampo(input, campo) {
  if (!campo) return input
  if (input && typeof input === 'object') return input[campo]
  return undefined
}

function evaluar(valorEvaluado, operador, valorComparado) {
  switch (operador) {
    case 'existe':
      return valorEvaluado !== undefined && valorEvaluado !== null && valorEvaluado !== ''
    case 'igual':
      return (
        String(valorEvaluado ?? '').trim().toLowerCase() ===
        String(valorComparado ?? '').trim().toLowerCase()
      )
    case 'contiene':
      return String(valorEvaluado ?? '')
        .toLowerCase()
        .includes(String(valorComparado ?? '').toLowerCase())
    default:
      throw new Error(`Operador de condición desconocido: "${operador}"`)
  }
}

export async function execute({ node, input }) {
  const { campo, operador = 'existe', valor } = node.data || {}
  const valorEvaluado = getCampo(input, campo)
  const branch = evaluar(valorEvaluado, operador, valor) ? 'true' : 'false'
  return { output: input, branch }
}
