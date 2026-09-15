/**
 * Carga del expediente en Modo Consultor.
 *
 * El mentor entra por un enlace, sin sesión, así que aquí no se usa ni el
 * cliente anónimo ni el `user_id`: todo se resuelve con el identificador
 * del expediente que viaja en la URL.
 *
 * Como el resto de servicios, nunca lanza: devuelve un resultado con el
 * motivo, para que la vista pueda distinguir "no existe" de "no se pudo
 * consultar" y decir algo útil en cada caso.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { parsearRespuestas } from '../utils/citaDiagnostico.js'
import { tokenCoincide } from '../utils/modoConsultor.js'

/**
 * Columnas del expediente más el join con los mentores asignados, para que
 * la ficha de Configuración funcione igual que para el cliente.
 */
const SELECT_EXPEDIENTE = `
  id,
  user_id,
  completado_en,
  respuestas,
  fase_embudo,
  score_total,
  mentor_principal:mentor_principal_id (id, nombre, especialidad, avatar_url),
  comentor:comentor_id (id, nombre, especialidad, avatar_url)
`

/**
 * Expediente cargado para el consultor.
 *
 * @typedef {Object} ExpedienteConsultor
 * @property {string} id
 * @property {Record<string, unknown>} respuestas - Diagnóstico completo.
 * @property {string} nombreCliente
 * @property {Date|null} completadoEn
 */

/**
 * Nombre del emprendedor, con la cadena de respaldo habitual.
 *
 * `profiles` es el dato editable del producto; si no hay fila —o no se
 * puede leer— se recurre a lo que quedó en el JSON del expediente, que es
 * lo que n8n copia del payload del webhook.
 */
async function resolverNombreCliente(fila, respuestas) {
  const delJson = [respuestas?.cliente_nombre, respuestas?.meta?.cliente_nombre]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .find(Boolean)

  if (fila?.user_id) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('nombre, apellidos, email')
        .eq('id', fila.user_id)
        .maybeSingle()

      const completo = [data?.nombre, data?.apellidos]
        .map((v) => (typeof v === 'string' ? v.trim() : ''))
        .filter(Boolean)
        .join(' ')

      if (completo) return completo
      if (data?.email) return data.email
    } catch {
      // Sin perfil legible se sigue con el respaldo del JSON.
    }
  }

  return delJson || respuestas?.cliente_email || 'Cliente sin identificar'
}

/**
 * Carga el expediente indicado en el enlace de consultoría.
 *
 * @param {string|null} expedienteId
 * @param {string|null} token
 * @returns {Promise<{ ok: true, expediente: ExpedienteConsultor }
 *   | { ok: false, motivo: 'sin-configuracion'|'enlace-invalido'|'no-encontrado'|'token-invalido'|'error-red' }>}
 */
export async function cargarExpedienteConsultor(expedienteId, token) {
  if (!haySupabase) return { ok: false, motivo: 'sin-configuracion' }
  if (!expedienteId) return { ok: false, motivo: 'enlace-invalido' }

  try {
    const { data, error } = await supabase
      .from('diagnosticos')
      .select(SELECT_EXPEDIENTE)
      .eq('id', expedienteId)
      .maybeSingle()

    // Se distingue el error de la ausencia: "no se pudo consultar" y "no
    // existe" piden mensajes distintos al mentor.
    if (error) return { ok: false, motivo: 'error-red' }
    if (!data) return { ok: false, motivo: 'no-encontrado' }

    // `respuestas` llega unas veces como objeto y otras como cadena JSON,
    // según quién escribiera la fila.
    const respuestas = parsearRespuestas(data.respuestas)
    if (!respuestas) return { ok: false, motivo: 'no-encontrado' }

    if (!tokenCoincide(respuestas, token)) return { ok: false, motivo: 'token-invalido' }

    const completadoEn = data.completado_en ? new Date(data.completado_en) : null

    return {
      ok: true,
      expediente: {
        id: data.id,
        respuestas,
        nombreCliente: await resolverNombreCliente(data, respuestas),
        completadoEn: Number.isFinite(completadoEn?.getTime()) ? completadoEn : null,
      },
    }
  } catch {
    return { ok: false, motivo: 'error-red' }
  }
}
