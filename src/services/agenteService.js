/**
 * Servicio del Agente IA consultor (Orquestador: n8n + OpenAI LLM).
 *
 * Habla con el webhook de n8n definido en VITE_N8N_WEBHOOK_URL. Igual que
 * el servicio de diagnóstico, nunca lanza excepciones: devuelve siempre un
 * resultado describiendo qué ha pasado, de modo que un fallo de red no
 * pueda romper el estado del chat ni dejarlo colgado.
 *
 * Contrato con n8n:
 *   POST  { mensaje, clienteId, respuestasDiagnostico }
 *   200   { respuesta: "..." }
 */

const WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL

/** ¿Hay webhook configurado? Si no, el chat degrada a respuestas locales. */
export const hayWebhookAgente = Boolean(WEBHOOK_URL)

/** Corta la espera si n8n no responde (el flujo con LLM puede tardar). */
const TIEMPO_MAXIMO_MS = 20000

if (!hayWebhookAgente) {
  console.warn(
    '[n8n] Falta VITE_N8N_WEBHOOK_URL. El consultor responde con explicaciones ' +
      'locales simuladas hasta que se configure el webhook.',
  )
}

/**
 * Extrae el texto de la respuesta tolerando las formas habituales de n8n:
 * el objeto `{ respuesta }`, ese mismo objeto envuelto en un array (salida
 * por items del nodo "Respond to Webhook") o texto plano.
 *
 * @param {unknown} cuerpo - Cuerpo ya parseado de la respuesta HTTP.
 * @returns {string|null} Texto del agente, o `null` si no viene ninguno.
 */
function extraerRespuesta(cuerpo) {
  if (!cuerpo) return null
  if (typeof cuerpo === 'string') return cuerpo.trim() || null
  if (Array.isArray(cuerpo)) return extraerRespuesta(cuerpo[0])
  if (typeof cuerpo.respuesta === 'string') return cuerpo.respuesta.trim() || null
  return null
}

/**
 * Envía una consulta al agente y devuelve su respuesta.
 *
 * @param {{
 *   mensaje: string,
 *   clienteId: string|null,
 *   respuestasDiagnostico: Record<string, unknown>|null,
 * }} consulta
 * @returns {Promise<{ ok: boolean, respuesta?: string, motivo?: string }>}
 */
export async function consultarAgente({ mensaje, clienteId, respuestasDiagnostico }) {
  if (!hayWebhookAgente) return { ok: false, motivo: 'sin webhook configurado' }

  try {
    const respuestaHttp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensaje, clienteId, respuestasDiagnostico }),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    })

    if (!respuestaHttp.ok) {
      return { ok: false, motivo: `el servicio respondió ${respuestaHttp.status}` }
    }

    // El cuerpo se lee como texto y luego se intenta parsear: así un flujo
    // que devuelva texto plano tampoco rompe la conversación.
    const bruto = await respuestaHttp.text()
    let cuerpo
    try {
      cuerpo = JSON.parse(bruto)
    } catch {
      cuerpo = bruto
    }

    const respuesta = extraerRespuesta(cuerpo)
    if (!respuesta) return { ok: false, motivo: 'el agente devolvió una respuesta vacía' }

    return { ok: true, respuesta }
  } catch (e) {
    const motivo =
      e?.name === 'TimeoutError'
        ? 'el agente ha tardado demasiado en responder'
        : (e?.message ?? 'error de red')
    console.warn(`[n8n] Consulta al agente fallida: ${motivo}`)
    return { ok: false, motivo }
  }
}
