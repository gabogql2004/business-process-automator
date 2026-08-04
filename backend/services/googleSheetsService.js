import { google } from 'googleapis'
import path from 'node:path'
import { env } from '../config/env.js'

// En local usamos el archivo de credenciales (gitignored). En producción no
// hay filesystem persistente para subir ese archivo, así que ahí se espera
// el JSON completo en la variable de entorno GOOGLE_SERVICE_ACCOUNT_JSON.
const credentialSource = env.googleServiceAccountJson
  ? { credentials: JSON.parse(env.googleServiceAccountJson) }
  : { keyFile: path.resolve(process.cwd(), env.googleServiceAccountKeyPath) }

const auth = new google.auth.GoogleAuth({
  ...credentialSource,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

export async function readSheet(spreadsheetId, range) {
  const { data } = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  return data.values || []
}

// Agrega una fila al final del rango indicado. `row` puede ser un array de
// valores, o un objeto (ej. el JSON que devuelve el nodo de extracción de
// IA) — en ese caso se usan los valores en el orden de sus propiedades.
export async function appendRow(spreadsheetId, range, row) {
  const values = Array.isArray(row) ? row : Object.values(row ?? {})
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  })
  return values
}
