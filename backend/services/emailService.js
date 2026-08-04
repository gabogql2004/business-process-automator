import { Resend } from 'resend'
import { env } from '../config/env.js'

const resend = new Resend(env.resendApiKey)

// Dominio de pruebas de Resend — no requiere verificar un dominio propio.
// Solo puede enviar a la dirección con la que te registraste en Resend
// mientras la cuenta esté en modo sandbox (sin dominio verificado).
const FROM = 'Business Process Automator <onboarding@resend.dev>'

export async function sendFailureAlert(to, { workflow, execution, errorMessage }) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Workflow "${workflow.nombre}" falló`,
    html: `
      <p>El workflow <strong>${workflow.nombre}</strong> falló durante su ejecución.</p>
      <p><strong>Ejecución:</strong> ${execution.id}</p>
      <p><strong>Error:</strong> ${errorMessage}</p>
      <p><strong>Hora:</strong> ${new Date(execution.iniciadoEn).toLocaleString()}</p>
    `,
  })
}
