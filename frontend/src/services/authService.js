import api from './api'

export async function registerRequest({ email, password, nombre }) {
  const { data } = await api.post('/auth/register', { email, password, nombre })
  return data
}

export async function loginRequest({ email, password }) {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function meRequest() {
  const { data } = await api.get('/auth/me')
  return data
}
