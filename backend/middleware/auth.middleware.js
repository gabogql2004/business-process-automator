import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null

  if (!token) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret)
    req.userId = payload.sub
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
