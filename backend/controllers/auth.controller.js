import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../config/prisma.js'
import { env } from '../config/env.js'

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  })
}

function toPublicUser(user) {
  return { id: user.id, email: user.email, nombre: user.nombre, createdAt: user.createdAt }
}

export async function register(req, res, next) {
  try {
    const { email, password, nombre, codigoInvitacion } = req.body

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'email, password y nombre son requeridos' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'El password debe tener al menos 8 caracteres' })
    }
    // Si REGISTRATION_CODE está seteado (típicamente en producción), el
    // registro queda cerrado a quien no conozca el código — evita que
    // cualquiera cree una cuenta y consuma la API de Claude a tu costo.
    if (env.registrationCode && (codigoInvitacion || '').trim() !== env.registrationCode) {
      return res.status(403).json({ error: 'Código de invitación inválido' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, nombre },
    })

    const token = signToken(user)
    res.status(201).json({ token, user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // Mismo mensaje de error para usuario inexistente y password incorrecto:
    // evita que un atacante pueda enumerar qué emails están registrados.
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = signToken(user)
    res.json({ token, user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } })
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}
