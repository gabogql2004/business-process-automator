import { extractData, classify, generateSummary } from '../../services/claudeService.js'

// Llama a Claude según el subtipo elegido en el nodo (ver selector en el
// builder visual). El input es el texto que viene del nodo anterior.
export async function execute({ node, input }) {
  const subtipo = node.data?.subtipo || 'extraccion'

  switch (subtipo) {
    case 'extraccion':
      return extractData(input)
    case 'clasificacion':
      return classify(input)
    case 'generacion':
      return generateSummary(input)
    default:
      throw new Error(`Subtipo de nodo IA desconocido: "${subtipo}"`)
  }
}
