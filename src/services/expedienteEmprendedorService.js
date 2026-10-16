/**
 * Expediente de pago e informe del emprendedor: tabla `Entrepreneur_diagnostics`.
 *
 * Es la fuente de verdad de dos cosas del panel:
 *   - Si el emprendedor ha pagado: `estado_pago = 'activo'`.
 *   - El informe ejecutivo en HTML que genera n8n: `informe_html`.
 *
 * Las métricas de las pestañas NO salen de aquí: esta tabla no guarda las
 * respuestas del cuestionario, que siguen en `diagnosticos`.
 *
 * Columnas que se usan (verificadas contra la instancia): id, email, nombre,
 * empresa, estado_pago, informe_html, created_at. La tabla no tiene
 * `user_id`, así que la fila se localiza por el `?id=` del enlace o, sin
 * él, por el email de la sesión.
 *
 * RLS: el usuario autenticado solo debe poder leer sus propias filas.
 *
 *   alter table public."Entrepreneur_diagnostics" enable row level security;
 *   create policy "lectura del propio expediente"
 *     on public."Entrepreneur_diagnostics" for select to authenticated
 *     using (lower(email) = lower(auth.jwt() ->> 'email'));
 *
 * Como el resto de servicios, nunca lanza: devuelve un estado.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'

const TABLA = 'Entrepreneur_diagnostics'
const COLUMNAS = 'id, email, nombre, empresa, estado_pago, informe_html, created_at'

/** Valor de `estado_pago` que da acceso al informe. */
export const ESTADO_PAGO_ACTIVO = 'activo'

/** Espera máxima de la consulta, para no dejar la tarjeta cargando sin fin. */
const TIEMPO_MAXIMO_MS = 8000

/**
 * @typedef {Object} ExpedienteEmprendedor
 * @property {string} id
 * @property {string|null} nombre
 * @property {string|null} empresa
 * @property {boolean} pagoActivo - `estado_pago = 'activo'`.
 * @property {string|null} informeHtml - HTML sin sanitizar; pasarlo por `sanitizeReportHtml`.
 * @property {string|null} creadoEn
 */

/**
 * @typedef {(
 *   { estado: 'ok', expediente: ExpedienteEmprendedor }
 *   | { estado: 'sin-expediente' }
 *   | { estado: 'sin-acceso' }
 *   | { estado: 'error' }
 * )} LecturaExpedienteEmprendedor
 */

/** Escapa los comodines de LIKE para comparar un email literal. */
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** ¿El estado de pago de la fila es el activo? Tolera mayúsculas y espacios. */
export function esPagoActivo(estadoPago) {
  return typeof estadoPago === 'string' && estadoPago.trim().toLowerCase() === ESTADO_PAGO_ACTIVO
}

/**
 * Lee el expediente del emprendedor.
 *
 * Con `id` (el `?id=` del enlace) se lee esa fila y se comprueba que sea del
 * email de la sesión: RLS es la barrera real, esto evita además pintar un
 * expediente ajeno si la política estuviera mal configurada. Sin `id`, se
 * toma la fila más reciente con el email de la sesión.
 *
 * @param {{ id?: string|null, email?: string|null }} filtro
 * @returns {Promise<LecturaExpedienteEmprendedor>}
 */
export async function leerExpedienteEmprendedor({ id = null, email = null }) {
  if (!haySupabase) return { estado: 'error' }
  if (!email) return { estado: 'sin-acceso' }

  const cancelacion = new AbortController()
  const temporizador = setTimeout(() => cancelacion.abort(), TIEMPO_MAXIMO_MS)

  try {
    let consulta = supabase.from(TABLA).select(COLUMNAS)
    consulta = id
      ? consulta.eq('id', id)
      : consulta.ilike('email', escaparLike(email.trim())).order('created_at', { ascending: false })

    const { data, error } = await consulta.limit(1).abortSignal(cancelacion.signal)

    if (error) return { estado: 'error' }

    const fila = data?.[0]
    if (!fila) return { estado: 'sin-expediente' }
    if (String(fila.email ?? '').trim().toLowerCase() !== email.trim().toLowerCase()) {
      return { estado: 'sin-acceso' }
    }

    return {
      estado: 'ok',
      expediente: {
        id: String(fila.id),
        nombre: fila.nombre ?? null,
        empresa: fila.empresa ?? null,
        pagoActivo: esPagoActivo(fila.estado_pago),
        informeHtml: typeof fila.informe_html === 'string' && fila.informe_html.trim() ? fila.informe_html : null,
        creadoEn: fila.created_at ?? null,
      },
    }
  } catch {
    return { estado: 'error' }
  } finally {
    clearTimeout(temporizador)
  }
}
