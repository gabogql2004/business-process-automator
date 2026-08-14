import 'dotenv/config'

function required(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Revisa backend/.env`)
  }
  return value
}

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  googleServiceAccountKeyPath: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '',
  googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Si está seteado, el registro exige este código (ver auth.controller.js).
  // Vacío = registro abierto, útil para desarrollo local.
  registrationCode: process.env.REGISTRATION_CODE || '',
}
