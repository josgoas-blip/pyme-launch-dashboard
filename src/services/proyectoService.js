/**
 * Acceso a los datos de seguimiento del proyecto en Supabase:
 * `projects`, `metric_snapshots` y `project_milestones`.
 *
 * Esquema usado (comprobado contra la instancia):
 *   projects            id, user_id, name, sector, is_active, created_at, updated_at
 *   metric_snapshots    id, project_id, created_at, personal_runway_months,
 *                       avg_collection_days, quote_conversion_rate,
 *                       capacity_utilization_pct, top_client_revenue_pct
 *   project_milestones  id, project_id, title, category, is_completed,
 *                       completed_at, created_at
 *
 * Igual que el resto de servicios, nunca lanza: devuelve un resultado con
 * el estado para que la vista distinga "no hay proyecto" de "no se pudo
 * consultar".
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'

/** Espera máxima de cada consulta, para no dejar tarjetas cargando sin fin. */
const TIEMPO_MAXIMO_MS = 10000

/**
 * Proyecto con su último snapshot y sus hitos, en una sola petición.
 *
 * PostgREST resuelve las dos relaciones por la clave foránea `project_id`,
 * y el orden y el límite se aplican dentro de cada relación: del snapshot
 * solo viaja el más reciente, no el histórico completo.
 */
const SELECT_DASHBOARD = `
  id, name, sector, is_active, created_at, updated_at,
  metric_snapshots (
    id, created_at, personal_runway_months, avg_collection_days,
    quote_conversion_rate, capacity_utilization_pct, top_client_revenue_pct
  ),
  project_milestones ( id, title, category, is_completed, completed_at, created_at )
`

/**
 * @typedef {(
 *   { estado: 'ok', proyecto: Record<string, unknown>, snapshot: Record<string, unknown>|null, hitos: Array<Record<string, unknown>> }
 *   | { estado: 'sin-proyecto' }
 *   | { estado: 'error' }
 * )} LecturaProyecto
 */

/**
 * Datos del proyecto activo del usuario.
 *
 * Prioridad, resuelta en la propia consulta con una única ordenación:
 *   1. El proyecto marcado con `is_active = true`.
 *   2. Si ninguno lo está (o la marca es `null`), el último modificado y,
 *      a igualdad, el último creado: es el que el usuario está trabajando.
 *
 * Si por error hubiera varios marcados como activos, gana el más reciente
 * de ellos, en lugar de uno arbitrario.
 *
 * @param {string|null} userId
 * @returns {Promise<LecturaProyecto>}
 */
export async function leerDashboardProyecto(userId) {
  if (!haySupabase || !userId) return { estado: 'sin-proyecto' }

  const cancelacion = new AbortController()
  const temporizador = setTimeout(() => cancelacion.abort(), TIEMPO_MAXIMO_MS)

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(SELECT_DASHBOARD)
      .eq('user_id', userId)
      // En orden descendente `true` va antes que `false`; `nullsFirst: false`
      // deja detrás los proyectos sin marca.
      .order('is_active', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'metric_snapshots', ascending: false })
      .limit(1, { referencedTable: 'metric_snapshots' })
      .order('created_at', { referencedTable: 'project_milestones', ascending: true })
      .limit(1)
      .abortSignal(cancelacion.signal)

    if (error) return { estado: 'error' }

    const fila = data?.[0]
    if (!fila) return { estado: 'sin-proyecto' }

    const { metric_snapshots: snapshots, project_milestones: hitos, ...proyecto } = fila

    return {
      estado: 'ok',
      proyecto,
      snapshot: Array.isArray(snapshots) ? (snapshots[0] ?? null) : null,
      hitos: Array.isArray(hitos) ? hitos : [],
    }
  } catch {
    return { estado: 'error' }
  } finally {
    clearTimeout(temporizador)
  }
}

/**
 * Marca un hito como hecho o pendiente.
 *
 * Se pide la fila de vuelta: un `update` que no encuentra fila —o al que
 * RLS no deja tocarla— responde con éxito sin haber escrito nada, y la
 * casilla quedaría marcada en pantalla pero no en la base de datos.
 *
 * @param {string} hitoId
 * @param {boolean} completado
 * @returns {Promise<{ ok: true, hito: Record<string, unknown> } | { ok: false, motivo: string }>}
 */
export async function marcarHito(hitoId, completado) {
  if (!haySupabase) return { ok: false, motivo: 'La base de datos no está configurada.' }

  try {
    const { data, error } = await supabase
      .from('project_milestones')
      .update({ is_completed: completado, completed_at: completado ? new Date().toISOString() : null })
      .eq('id', hitoId)
      .select('id, title, category, is_completed, completed_at, created_at')

    if (error) return { ok: false, motivo: 'No se ha podido guardar el cambio. Inténtalo de nuevo.' }
    if (!data?.length) return { ok: false, motivo: 'No tienes permiso para modificar este hito.' }

    return { ok: true, hito: data[0] }
  } catch {
    return { ok: false, motivo: 'Sin conexión: el cambio no se ha guardado.' }
  }
}
