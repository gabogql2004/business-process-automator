import api from './api'

export async function listWorkflows() {
  const { data } = await api.get('/workflows')
  return data.workflows
}

export async function createWorkflow({ nombre, descripcion, definicionJson }) {
  const { data } = await api.post('/workflows', { nombre, descripcion, definicionJson })
  return data.workflow
}

export async function getWorkflow(id) {
  const { data } = await api.get(`/workflows/${id}`)
  return data.workflow
}

export async function updateWorkflow(id, payload) {
  const { data } = await api.put(`/workflows/${id}`, payload)
  return data.workflow
}

export async function deleteWorkflow(id) {
  await api.delete(`/workflows/${id}`)
}

// Duplica un workflow existente: crea uno nuevo con el mismo definicionJson,
// pero SIN heredar el cron — evita que dos workflows terminen corriendo
// automáticamente en el mismo horario sin que el usuario se dé cuenta.
export async function duplicateWorkflow(workflow) {
  return createWorkflow({
    nombre: `${workflow.nombre} (copia)`,
    descripcion: workflow.descripcion,
    definicionJson: workflow.definicionJson,
  })
}
