export function notFoundHandler(req, res) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

// Middleware de error centralizado: cualquier error lanzado (o pasado a next())
// en rutas/controladores termina aquí en vez de tumbar el proceso.
export function errorHandler(err, req, res, _next) {
  console.error(err)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Error interno del servidor' })
}
