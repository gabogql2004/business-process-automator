import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env.js'

const client = new Anthropic({ apiKey: env.anthropicApiKey })
const MODEL = 'claude-sonnet-4-6'

const CAMPOS_DEFAULT = ['monto', 'fecha', 'proveedor', 'concepto']
const CATEGORIAS_DEFAULT = ['Urgente', 'Normal', 'Baja prioridad']

async function ask(prompt, maxTokens) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0]?.text?.trim() || ''
}

// Claude a veces envuelve el JSON en ```json ... ``` y a veces agrega una nota
// antes o después del bloque (ej. avisando que el documento no tiene esos
// datos), pese a pedir "SOLO JSON" en el prompt. En vez de asumir que el JSON
// está al inicio/final del string, extraemos el bloque de código si existe y
// después el primer objeto {...} dentro de ese texto.
function parseJson(raw) {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenceMatch ? fenceMatch[1] : raw
  const objectMatch = candidate.match(/\{[\s\S]*\}/)
  const jsonText = (objectMatch ? objectMatch[0] : candidate).trim()

  try {
    return JSON.parse(jsonText)
  } catch {
    throw new Error(`Claude no devolvió JSON válido: ${raw.slice(0, 200)}`)
  }
}

export async function extractData(text, campos = CAMPOS_DEFAULT) {
  const prompt = `Extrae los siguientes campos de este documento: [${campos.join(', ')}]

Documento: ${text}

Responde SOLO en JSON con esos campos exactos.`
  const raw = await ask(prompt, 1024)
  return parseJson(raw)
}

export async function classify(text, categorias = CATEGORIAS_DEFAULT) {
  const prompt = `Clasifica el siguiente texto en una de estas categorías: [${categorias.join(', ')}]

Texto: ${text}

Responde solo con la categoría.`
  return ask(prompt, 50)
}

export async function generateSummary(text) {
  const prompt = `Genera un resumen breve y accionable del siguiente contenido: ${text}

Responde en español, máximo 3 líneas.`
  return ask(prompt, 300)
}
