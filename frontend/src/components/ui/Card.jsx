function Card({ className = '', ...props }) {
  return (
    <div
      className={`rounded-xl bg-white ring-1 ring-slate-200 ${className}`}
      {...props}
    />
  )
}

export default Card
