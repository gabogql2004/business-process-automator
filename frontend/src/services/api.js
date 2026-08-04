import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si el token expiró o quedó inválido, cualquier request autenticado
// responde 401. En vez de dejar que cada pantalla muestre un error genérico,
// limpiamos la sesión y mandamos al usuario a /login. Se excluye login/register
// porque ahí un 401 es una credencial incorrecta, no una sesión vencida.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token')
      window.location.assign('/login')
    }
    return Promise.reject(error)
  },
)

export default api
