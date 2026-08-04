function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-lg border-0 px-3 py-2 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`}
      {...props}
    />
  )
}

export default Input
