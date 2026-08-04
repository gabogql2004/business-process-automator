import api from './api'

export async function runExecution(workflowId, input) {
  const { data } = await api.post(`/workflows/${workflowId}/executions`, { input })
  return data
}

export async function listExecutions(workflowId) {
  const { data } = await api.get(`/workflows/${workflowId}/executions`)
  return data.executions
}

export async function getExecution(executionId) {
  const { data } = await api.get(`/executions/${executionId}`)
  return data.execution
}
