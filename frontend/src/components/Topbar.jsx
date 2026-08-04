import { LogOut } from 'lucide-react'
import Logo from './ui/Logo.jsx'
import Button from './ui/Button.jsx'

function initials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function Topbar({ user, onLogout }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
      <Logo />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
            {initials(user?.nombre)}
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">{user?.nombre}</p>
            <p className="text-xs leading-tight text-slate-500">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          <LogOut size={14} />
          Cerrar sesión
        </Button>
      </div>
    </header>
  )
}

export default Topbar
