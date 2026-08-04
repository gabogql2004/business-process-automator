import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

const STYLES = {
  success: 'bg-white ring-emerald-200 text-slate-800',
  error: 'bg-white ring-red-200 text-slate-800',
}

const ICONS = {
  success: { Icon: CheckCircle2, className: 'text-emerald-500' },
  error: { Icon: XCircle, className: 'text-red-500' },
}

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message, type = 'success') => {
      idCounter += 1
      const id = idCounter
      setToasts((current) => [...current, { id, message, type }])
      setTimeout(() => dismiss(id), 3500)
    },
    [dismiss],
  )

  const toast = {
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => {
          const { Icon, className } = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm shadow-lg ring-1 ${STYLES[t.type]}`}
            >
              <Icon size={16} className={className} />
              <span>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="ml-1 text-slate-300 hover:text-slate-500"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
