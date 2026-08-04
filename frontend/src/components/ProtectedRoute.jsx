import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuth from '../hooks/useAuth'

function ProtectedRoute({ children }) {
  const status = useAuth((state) => state.status)
  const token = useAuth((state) => state.token)

  if (status !== 'ready') {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 bg-slate-50 text-slate-400">
        <Loader2 size={16} className="animate-spin" />
        <p className="text-sm">Cargando...</p>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
