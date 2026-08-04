import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import Logo from '../components/ui/Logo.jsx'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuth((state) => state.register)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ nombre, email, password })
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <Card className="p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500">
            Empieza a automatizar procesos en minutos
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Nombre</label>
              <Input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1.5 text-xs text-slate-400">Mínimo 8 caracteres</p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
