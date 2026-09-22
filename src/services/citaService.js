/**
 * Servicio de agendado de la Sesión Estratégica de Mentoría.
 *
 * Habla con el webhook de n8n, que es quien decide la cita: recibe la
 * propuesta del emprendedor, la pone en revisión del equipo de mentoría y,
 * al aprobarla, escribe `respuestas.cita` en Supabase con el enlace de
 * Google Meet.
 *
 * Igual que el resto de servicios del proyecto, nunca lanza: devuelve
 * siempre un resultado describiendo qué ha pasado, de modo que un fallo de
 * red no pueda dejar el botón colgado ni romper el estado de la tarjeta.
 *
 * Contrato con n8n:
 *   POST  { id_usuario, expediente_id, cliente_nombre, cliente_email,
 *           fecha_propuesta, fase, score_total,
 *           consentimiento_compartir_datos }
 *   2xx   solicitud registrada (el cuerpo puede venir vacío)
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { obtenerClienteAnonimo, usuarioActual } from './diagnosticoService.js'
import { extraerCitaDeFila, filaDelVisitante, identidadesDeFila, parsearRespuestas } from '../utils/citaDiagnostico.js'
import { cargarExpedienteId } from '../utils/persistenciaDiagnostico.js'

/**
 * Webhook de agendado.
 *
 * Se lee del entorno para respetar la regla 3 de CLAUDE.md, con la
 * instancia del proyecto como valor por defecto para que la función
 * funcione en un clon recién descargado. Es un endpoint, no una
 * credencial: quien quiera apuntar a otra instancia solo tiene que definir
 * `VITE_N8N_WEBHOOK_CITA_URL`.
 */
export const URL_WEBHOOK_CITA =
  import.meta.env.VITE_N8N_WEBHOOK_CITA_URL ||
  'https://pymelaunch.app.n8n.cloud/webhook/658b4044-87b4-4ae0-97be-92df63a8e226'

/** ¿Hay webhook al que enviar la solicitud? */
export const hayWebhookCita = Boolean(URL_WEBHOOK_CITA)

/** Corta la espera si n8n no responde. */
const TIEMPO_MAXIMO_MS = 15000

/**
 * Envía la solicitud de sesión al equipo de mentoría.
 *
 * @param {{
 *   id_usuario: string|null,
 *   expediente_id: string|null,
 *   cliente_nombre: string,
 *   cliente_email: string,
 *   fecha_propuesta: string,
 *   fase: string,
 *   score_total: number,
 *   consentimiento_compartir_datos: boolean,
 * }} solicitud
 * @returns {Promise<{ ok: boolean, motivo?: string }>}
 */
export async function solicitarSesion(solicitud) {
  if (!hayWebhookCita) return { ok: false, motivo: 'sin webhook configurado' }

  const cancelacion = new AbortController()
  const temporizador = setTimeout(() => cancelacion.abort(), TIEMPO_MAXIMO_MS)

  try {
    const respuesta = await fetch(URL_WEBHOOK_CITA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud),
      signal: cancelacion.signal,
    })

    if (!respuesta.ok) {
      return { ok: false, motivo: `el servidor respondió ${respuesta.status}` }
    }

    return { ok: true }
  } catch (e) {
    // `abort` llega aquí como AbortError: se traduce para que el mensaje
    // que ve el usuario diga algo útil.
    const motivo =
      e?.name === 'AbortError' ? 'la solicitud ha tardado demasiado' : (e?.message ?? 'error de red')
    return { ok: false, motivo }
  } finally {
    clearTimeout(temporizador)
  }
}

/**
 * Columnas que se piden a `diagnosticos` para resolver el estado de la cita.
 *
 * Se seleccionan por nombre y no con `*` para no arrastrar las 22 columnas
 * de variables del modelo en cada sondeo. No se piden `estado_cita` ni
 * `estado`: no existen en esta tabla y pedirlas hacía fallar la consulta
 * entera con un 42703.
 */
const COLUMNAS_CITA = 'id, user_id, respuestas, fase_embudo'

/**
 * Filas que se revisan cuando no hay expediente guardado.
 *
 * Es un rastreo acotado, no una consulta ideal: `respuestas` llega unas
 * veces como objeto y otras como cadena JSON, así que un filtro del lado
 * del servidor (`respuestas->>id_usuario`) solo encontraría la mitad de
 * las filas. Se filtra en cliente sobre una ventana reciente. Cuando la
 * columna tenga un tipo único, esto debería pasar a un `.eq()`.
 */
const LIMITE_RASTREO = 100

/**
 * Lee la cita que n8n haya escrito, ya normalizada.
 *
 * Dos caminos: el expediente guardado al crear el diagnóstico y, si ese no
 * tiene cita, un rastreo acotado de las filas de este visitante.
 *
 * Se revalida en cada llamada, sin memorizar fallos: la cita aparece
 * cuando el mentor la aprueba, que es justo mientras el usuario usa el
 * panel, así que cachear un "no hay" dejaría la tarjeta congelada en "en
 * revisión" hasta recargar.
 *
 * @param {string|null} [expedienteId]
 * @param {{ aislado?: boolean }} [opciones] - `aislado`: no usar la identidad
 *   del navegador, solo la que venga en el propio expediente (Modo Consultor).
 * @returns {Promise<import('../utils/citaDiagnostico.js').CitaNormalizada|null>}
 */
export async function leerCitaRemota(expedienteId = cargarExpedienteId(), { aislado = false } = {}) {
  if (!haySupabase) return null

  try {
    /**
     * Identidades con las que reconocer las demás filas de este cliente.
     */
    const identidades = new Set()

    // 1. Consulta directa al expediente, que es el camino barato y exacto.
    if (expedienteId) {
      const { data, error } = await supabase
        .from('diagnosticos')
        .select(COLUMNAS_CITA)
        .eq('id', expedienteId)
        .single()

      if (!error && data) {
        const cita = extraerCitaDeFila(data)
        if (cita) return cita
        identidadesDeFila(data).forEach((id) => identidades.add(id))
      }
    }

    // 2. Sin expediente, o con un expediente que aún no tiene cita: se
    //    buscan las filas de este visitante. n8n no actualiza la fila del
    //    diagnóstico, crea una propia con el payload del webhook, así que
    //    la cita suele estar en una fila distinta a la del expediente.
    //
    //    En modo aislado (Modo Consultor) solo valen las identidades que
    //    venían en el propio expediente: el `localStorage` es el del
    //    mentor, y sumar la suya le mostraría su propia cita en la ficha
    //    del cliente que está revisando.
    if (!aislado) {
      // Se aceptan las dos identidades: la fila puede ser anterior al registro.
      const clienteAnonimo = obtenerClienteAnonimo()
      const usuario = await usuarioActual()
      if (clienteAnonimo) identidades.add(clienteAnonimo)
      if (usuario?.id) identidades.add(usuario.id)
    }

    if (identidades.size === 0) return null

    const { data, error } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_CITA)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)

    if (error || !data?.length) return null

    // Solo filas del propio visitante: sin esta comprobación el panel
    // podría anunciar la sesión de otra persona.
    for (const fila of data) {
      if (!filaDelVisitante(fila, ...identidades)) continue

      const cita = extraerCitaDeFila(fila)
      if (cita) return cita
    }

    return null
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta se queda con la copia local.
    return null
  }
}

// ── Cancelación de la sesión ─────────────────────────────────────────────

/**
 * Webhook de n8n que recibe las cancelaciones.
 *
 * Sin valor por defecto a propósito: reutilizar el de agendado crearía una
 * reserva nueva en lugar de cancelar. Si no está definido, la cancelación
 * solo se registra en Supabase y el mentor no recibe aviso automático.
 */
export const URL_WEBHOOK_CANCELACION = import.meta.env.VITE_N8N_WEBHOOK_CANCELACION_URL || ''

/** ¿Hay webhook de cancelación? */
export const hayWebhookCancelacion = Boolean(URL_WEBHOOK_CANCELACION)

/** Longitud mínima y máxima del motivo. */
export const MOTIVO_MINIMO = 10
export const MOTIVO_MAXIMO = 500

/**
 * Comprueba el motivo de la cancelación.
 *
 * @param {string} motivo
 * @returns {string|null} Mensaje de error, o `null` si es válido.
 */
export function validarMotivoCancelacion(motivo) {
  const limpio = typeof motivo === 'string' ? motivo.trim() : ''
  if (!limpio) return 'Indica el motivo de la cancelación.'
  if (limpio.length < MOTIVO_MINIMO) {
    return `Explica el motivo con un poco más de detalle (al menos ${MOTIVO_MINIMO} caracteres).`
  }
  if (limpio.length > MOTIVO_MAXIMO) return `El motivo admite como máximo ${MOTIVO_MAXIMO} caracteres.`
  return null
}

/**
 * Marca como cancelada la cita guardada en una fila de `diagnosticos`.
 *
 * La cita no se borra del JSON: se sustituye por
 * `{ estado: 'cancelada', motivo, cancelada_en, fecha_anterior, meet_url_anterior }`.
 * La tarjeta muestra la cita más reciente que encuentra entre las filas del
 * cliente; si esta desapareciera sin más, una reserva anterior ya confirmada
 * volvería a mostrarse como vigente. Además queda constancia del motivo.
 *
 * También se ponen `estado_reserva = 'cancelada'`, `fecha_sesion = null` y
 * `meet_url = null`. Se respeta el formato de `respuestas`: n8n lo guarda
 * como texto JSON y así se sigue guardando, para no cambiarle el formato a
 * su flujo.
 *
 * @param {string} filaId
 * @param {{ motivo: string, canceladaEn: string, estadoAnterior: string|null }} cancelacion
 * @returns {Promise<{ ok: true } | { ok: false, motivo: 'sin-permiso'|'no-encontrada'|'error' }>}
 */
async function marcarCitaCanceladaEnSupabase(filaId, { motivo, canceladaEn, estadoAnterior }) {
  const { data: fila, error: errorLectura } = await supabase
    .from('diagnosticos')
    .select('id, respuestas')
    .eq('id', filaId)
    .maybeSingle()

  if (errorLectura) return { ok: false, motivo: 'error' }
  if (!fila) return { ok: false, motivo: 'no-encontrada' }

  const eraTexto = typeof fila.respuestas === 'string'
  const json = parsearRespuestas(fila.respuestas) ?? {}
  const anterior = json.cita && typeof json.cita === 'object' ? json.cita : {}

  const nuevas = {
    ...json,
    cita: {
      estado: 'cancelada',
      motivo,
      cancelada_en: canceladaEn,
      estado_anterior: estadoAnterior,
      fecha_anterior: anterior.fecha ?? anterior.fecha_propuesta ?? null,
      meet_url_anterior: anterior.meet_url ?? null,
    },
  }

  const { data, error } = await supabase
    .from('diagnosticos')
    .update({
      respuestas: eraTexto ? JSON.stringify(nuevas) : nuevas,
      estado_reserva: 'cancelada',
      fecha_sesion: null,
      meet_url: null,
    })
    .eq('id', filaId)
    .select('id')

  if (error) return { ok: false, motivo: error.code === '42501' ? 'sin-permiso' : 'error' }
  // Sin fila devuelta, RLS no ha dejado modificarla (lo habitual si la creó
  // n8n sin `user_id`): no se ha escrito nada.
  if (!data?.length) return { ok: false, motivo: 'sin-permiso' }
  return { ok: true }
}

/**
 * Avisa a n8n de la cancelación, para que libere el evento del calendario y
 * el Meet y lo comunique al mentor.
 *
 * @param {Record<string, unknown>} aviso
 * @returns {Promise<boolean|null>} `null` si no hay webhook configurado.
 */
async function avisarCancelacionAN8n(aviso) {
  if (!hayWebhookCancelacion) return null

  const cancelacion = new AbortController()
  const temporizador = setTimeout(() => cancelacion.abort(), TIEMPO_MAXIMO_MS)
  try {
    const respuesta = await fetch(URL_WEBHOOK_CANCELACION, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aviso),
      signal: cancelacion.signal,
    })
    return respuesta.ok
  } catch {
    return false
  } finally {
    clearTimeout(temporizador)
  }
}

/**
 * Cancela la sesión confirmada o anula la solicitud aún en revisión.
 *
 * Dos vías, y basta con que funcione una:
 *   - Supabase: se marca la cita como cancelada en su fila. Puede fallar por
 *     RLS: la fila la crea n8n sin `user_id` y el emprendedor no es su
 *     dueño a ojos de la base de datos.
 *   - n8n (si hay webhook): recibe el motivo, avisa al mentor, cancela el
 *     evento y puede actualizar la fila con sus propios permisos.
 *
 * Si fallan las dos, no se cancela nada y se devuelve el motivo: marcarla
 * solo en el navegador haría creer al emprendedor que ha cancelado una
 * sesión que el mentor sigue teniendo en su agenda.
 *
 * @param {{
 *   filaId: string|null,
 *   motivo: string,
 *   cita: import('../utils/citaDiagnostico.js').CitaNormalizada,
 *   contacto: { id_usuario: string|null, expediente_id: string|null, cliente_nombre: string|null, cliente_email: string|null },
 * }} datos
 * @returns {Promise<
 *   | { ok: true, canceladaEn: string, filaId: string|null, enSupabase: boolean, avisoMentor: boolean|null }
 *   | { ok: false, motivo: string }
 * >}
 */
export async function cancelarCita({ filaId, motivo, cita, contacto }) {
  const problema = validarMotivoCancelacion(motivo)
  if (problema) return { ok: false, motivo: problema }
  if (!haySupabase && !hayWebhookCancelacion) {
    return { ok: false, motivo: 'La cancelación no está disponible en esta instalación.' }
  }

  const motivoLimpio = motivo.trim()
  const canceladaEn = new Date().toISOString()

  // La fila de la cita puede no venir en la copia local (una solicitud
  // recién enviada solo existe en este navegador hasta que n8n la registra):
  // se busca. Solo vale si está en el mismo estado que la que se cancela;
  // si no, es una cita anterior (por ejemplo, una ya cancelada) y marcarla
  // daría por anulada una solicitud que sigue viva.
  const remota = filaId ? null : await leerCitaRemota()
  const fila = filaId ?? (remota && remota.estado === cita?.estado ? remota.filaId : null)

  const resultadoSupabase =
    haySupabase && fila
      ? await marcarCitaCanceladaEnSupabase(fila, {
          motivo: motivoLimpio,
          canceladaEn,
          estadoAnterior: cita?.estado ?? null,
        }).catch(() => ({
          ok: false,
          motivo: 'error',
        }))
      : { ok: false, motivo: 'no-encontrada' }

  const avisoMentor = await avisarCancelacionAN8n({
    tipo: 'cancelacion_sesion',
    ...contacto,
    fila_cita_id: fila,
    // 'pendiente': se retira una solicitud que el mentor aún no ha aceptado;
    // 'confirmada': se cancela una sesión ya agendada (evento y Meet).
    estado_anterior: cita?.estado ?? null,
    fecha_sesion_cancelada: cita?.fecha ? cita.fecha.toISOString() : null,
    meet_url: cita?.meetUrl ?? null,
    motivo: motivoLimpio,
    cancelada_en: canceladaEn,
    // Para que n8n sepa si le toca actualizar la fila con sus permisos.
    actualizada_en_supabase: resultadoSupabase.ok,
  })

  if (resultadoSupabase.ok || avisoMentor === true) {
    return { ok: true, canceladaEn, filaId: fila, enSupabase: resultadoSupabase.ok, avisoMentor }
  }

  const detalle =
    resultadoSupabase.motivo === 'sin-permiso'
      ? 'la base de datos no permite modificar esta reserva desde tu cuenta'
      : resultadoSupabase.motivo === 'no-encontrada'
        ? cita?.estado === 'pendiente'
          ? 'tu solicitud todavía no figura registrada'
          : 'no se ha encontrado la reserva'
        : 'no hay conexión con el servidor'
  const sinAviso =
    avisoMentor === false
      ? ' y no se ha podido avisar al equipo de mentoría'
      : avisoMentor === null
        ? ' y no hay un canal configurado para avisar al equipo de mentoría'
        : ''

  return {
    ok: false,
    motivo:
      cita?.estado === 'pendiente'
        ? `No se ha podido anular la solicitud: ${detalle}${sinAviso}. Escribe a tu mentor para anularla.`
        : `No se ha podido cancelar: ${detalle}${sinAviso}. Escribe a tu mentor para cancelarla.`,
  }
}
