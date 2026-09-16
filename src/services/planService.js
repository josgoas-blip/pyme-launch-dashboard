/**
 * Plan contratado por el usuario: `profiles.plan_contratado`.
 *
 * Es la fuente de verdad del acceso a cada pestaña. El selector de la
 * barra superior solo simula planes en local para probar los bloqueos;
 * nunca escribe aquí.
 *
 * Igual que el resto de servicios, nunca lanza: ante cualquier problema
 * devuelve un resultado con el motivo y quien llama aplica el plan de
 * entrada, que es la opción segura (no regala acceso de pago).
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { PLAN_POR_DEFECTO, planDesdeBaseDatos } from '../utils/planes.js'

/**
 * Espera máxima de la consulta.
 *
 * El panel no se pinta hasta conocer el plan (para no mostrar muros de
 * pago a quien ha pagado), así que una consulta colgada no puede dejar al
 * usuario en la pantalla de carga indefinidamente.
 */
const TIEMPO_MAXIMO_MS = 8000

/**
 * @typedef {(
 *   { estado: 'ok', plan: 'report'|'assist'|'total', valorOriginal: string|null }
 *   | { estado: 'error', plan: 'report' }
 * )} LecturaPlan
 */

/**
 * Lee el plan contratado del usuario.
 *
 * Sin fila de perfil, con el valor a `null` o con un valor desconocido se
 * aplica el plan de entrada ('REPORT'), como indica el valor por defecto
 * de la columna.
 *
 * @param {string|null} userId
 * @returns {Promise<LecturaPlan>}
 */
export async function leerPlanContratado(userId) {
  if (!haySupabase || !userId) return { estado: 'error', plan: PLAN_POR_DEFECTO }

  const cancelacion = new AbortController()
  const temporizador = setTimeout(() => cancelacion.abort(), TIEMPO_MAXIMO_MS)

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('plan_contratado')
      .eq('id', userId)
      .abortSignal(cancelacion.signal)
      .maybeSingle()

    if (error) return { estado: 'error', plan: PLAN_POR_DEFECTO }

    const valorOriginal = typeof data?.plan_contratado === 'string' ? data.plan_contratado : null
    return { estado: 'ok', plan: planDesdeBaseDatos(valorOriginal) ?? PLAN_POR_DEFECTO, valorOriginal }
  } catch {
    return { estado: 'error', plan: PLAN_POR_DEFECTO }
  } finally {
    clearTimeout(temporizador)
  }
}
