// Flujo de ejemplo: procesamiento de facturas. Trigger → extrae los datos
// con IA → revisa si encontró un monto → si sí, lo guarda en Google Sheets;
// si no, termina sin escribir nada. Sirve como punto de partida para un
// workflow nuevo en vez de arrancar de un canvas completamente vacío.
export const exampleWorkflow = {
  nodes: [
    {
      id: 'ejemplo-trigger',
      type: 'trigger',
      position: { x: 40, y: 160 },
      data: { label: 'Inicio manual' },
    },
    {
      id: 'ejemplo-ia',
      type: 'ia',
      position: { x: 300, y: 160 },
      data: { label: 'Extraer datos de la factura', subtipo: 'extraccion' },
    },
    {
      id: 'ejemplo-condicion',
      type: 'condicion',
      position: { x: 580, y: 160 },
      data: { label: '¿Tiene monto?', campo: 'monto', operador: 'existe' },
    },
    {
      id: 'ejemplo-accion',
      type: 'accion',
      position: { x: 880, y: 40 },
      data: { label: 'Guardar en Sheets', operacion: 'escribir', spreadsheetId: '', range: '' },
    },
    {
      id: 'ejemplo-fin-ok',
      type: 'end',
      position: { x: 1150, y: 40 },
      data: { label: 'Guardado' },
    },
    {
      id: 'ejemplo-fin-sin-monto',
      type: 'end',
      position: { x: 880, y: 300 },
      data: { label: 'Sin monto detectado' },
    },
  ],
  edges: [
    { id: 'ejemplo-e1', source: 'ejemplo-trigger', target: 'ejemplo-ia' },
    { id: 'ejemplo-e2', source: 'ejemplo-ia', target: 'ejemplo-condicion' },
    {
      id: 'ejemplo-e3',
      source: 'ejemplo-condicion',
      target: 'ejemplo-accion',
      sourceHandle: 'true',
    },
    { id: 'ejemplo-e4', source: 'ejemplo-accion', target: 'ejemplo-fin-ok' },
    {
      id: 'ejemplo-e5',
      source: 'ejemplo-condicion',
      target: 'ejemplo-fin-sin-monto',
      sourceHandle: 'false',
    },
  ],
}
