import { create } from 'zustand'
import { registerRequest, loginRequest, meRequest } from '../services/authService'

const useAuth = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  status: 'idle', // 'idle' | 'loading' | 'ready'

  async login(credentials) {
    const { token, user } = await loginRequest(credentials)
    localStorage.setItem('token', token)
    set({ token, user, status: 'ready' })
  },

  async register(data) {
    const { token, user } = await registerRequest(data)
    localStorage.setItem('token', token)
    set({ token, user, status: 'ready' })
  },

  logout() {
    localStorage.removeItem('token')
    set({ token: null, user: null, status: 'ready' })
  },

  // Al cargar la app con un token guardado, confirma que sigue siendo válido
  // y trae el usuario actual antes de dejar pasar a rutas protegidas.
  async hydrate() {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ status: 'ready' })
      return
    }
    set({ status: 'loading' })
    try {
      const { user } = await meRequest()
      set({ user, token, status: 'ready' })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, status: 'ready' })
    }
  },
}))

export default useAuth
