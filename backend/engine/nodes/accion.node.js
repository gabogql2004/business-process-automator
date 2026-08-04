import { readSheet, appendRow } from '../../services/googleSheetsService.js'

// Nodo de Acción: por ahora solo integra con Google Sheets. "leer" ignora el
// input y devuelve las filas de la hoja; "escribir" toma el input del nodo
// anterior (objeto o array) y lo agrega como fila nueva.
export async function execute({ node, input }) {
  const { operacion = 'leer', spreadsheetId, range } = node.data || {}

  if (!spreadsheetId || !range) {
    throw new Error('El nodo de Acción necesita spreadsheetId y range configurados')
  }

  switch (operacion) {
    case 'leer':
      return readSheet(spreadsheetId, range)
    case 'escribir':
      return appendRow(spreadsheetId, range, input)
    default:
      throw new Error(`Operación de Acción desconocida: "${operacion}"`)
  }
}
