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
import { extraerCitaDeFila, filaDelVisitante } from '../utils/citaDiagnostico.js'
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
  'https://pymelaunch.app.n8n.cloud/webhook/webhook-agendar-consultoria'

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
 * @returns {Promise<import('../utils/citaDiagnostico.js').CitaNormalizada|null>}
 */
export async function leerCitaRemota(expedienteId = cargarExpedienteId()) {
  if (!haySupabase) return null

  try {
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
      }
    }

    // 2. Sin expediente, o con un expediente que aún no tiene cita: se
    //    buscan las filas de este visitante. n8n no actualiza la fila del
    //    diagnóstico, crea una propia con el payload del webhook, así que
    //    la cita suele estar en una fila distinta a la del expediente.
    // Se aceptan las dos identidades: la fila puede ser anterior al registro.
    const clienteAnonimo = obtenerClienteAnonimo()
    const usuario = await usuarioActual()
    if (!clienteAnonimo && !usuario?.id) return null

    const { data, error } = await supabase
      .from('diagnosticos')
      .select(COLUMNAS_CITA)
      .order('completado_en', { ascending: false })
      .limit(LIMITE_RASTREO)

    if (error || !data?.length) return null

    // Solo filas del propio visitante: sin esta comprobación el panel
    // podría anunciar la sesión de otra persona.
    for (const fila of data) {
      if (!filaDelVisitante(fila, clienteAnonimo, usuario?.id)) continue

      const cita = extraerCitaDeFila(fila)
      if (cita) return cita
    }

    return null
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta se queda con la copia local.
    return null
  }
}
