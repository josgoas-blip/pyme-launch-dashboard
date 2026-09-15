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
 *           fecha_propuesta, fase, score_total }
 *   2xx   solicitud registrada (el cuerpo puede venir vacío)
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { obtenerClienteAnonimo } from './diagnosticoService.js'
import { extraerCitaDeFila } from '../utils/citaDiagnostico.js'

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
 * de variables del modelo en cada sondeo. `estado_cita` y `estado` son
 * opcionales: si no existen en el esquema, Supabase devuelve error y la
 * consulta cae al conjunto mínimo.
 */
const COLUMNAS_CITA = 'respuestas, fase_embudo, estado_cita, estado'
const COLUMNAS_CITA_MINIMAS = 'respuestas, fase_embudo'

/** Código de PostgreSQL para "la columna no existe". */
const COLUMNA_INEXISTENTE = '42703'

/**
 * ¿Merece la pena pedir las columnas opcionales?
 *
 * Se apaga en cuanto PostgreSQL responde que no existen. Sin esta memoria,
 * cada visita a Configuración lanzaría una consulta condenada a fallar y
 * dejaría un 400 en la consola del usuario: el esquema no cambia a mitad
 * de sesión, así que basta con preguntarlo una vez.
 */
let columnasOpcionalesDisponibles = true

/**
 * Lee la cita que n8n haya escrito, ya normalizada.
 *
 * Mira primero `respuestas.cita` —que es lo que trae fecha y enlace— y, si
 * no está, las columnas sueltas de la fila.
 *
 * Es un intento, no una garantía: la política RLS de `diagnosticos` permite
 * al visitante anónimo insertar pero no seleccionar, así que hoy esta
 * lectura devuelve `null` salvo que haya sesión autenticada. Queda escrita
 * para que la tarjeta refleje la confirmación real en cuanto se active el
 * inicio de sesión o una política de lectura por `cliente_anonimo`.
 *
 * @returns {Promise<import('../utils/citaDiagnostico.js').CitaNormalizada|null>}
 */
export async function leerCitaRemota() {
  if (!haySupabase) return null

  /** Una consulta con el juego de columnas indicado. */
  const consultar = (columnas) =>
    supabase.from('diagnosticos').select(columnas).order('id', { ascending: false }).limit(1)

  try {
    const clienteAnonimo = obtenerClienteAnonimo()

    let data = null
    let error = null

    if (columnasOpcionalesDisponibles) {
      ;({ data, error } = await consultar(COLUMNAS_CITA))

      // Un esquema sin `estado_cita`/`estado` rechaza la consulta entera:
      // se anota para no repetirla y se reintenta con lo imprescindible,
      // que es donde vive de verdad la cita (`respuestas.cita`).
      if (error?.code === COLUMNA_INEXISTENTE) {
        columnasOpcionalesDisponibles = false
        error = null
      }
    }

    if (!columnasOpcionalesDisponibles) {
      ;({ data, error } = await consultar(COLUMNAS_CITA_MINIMAS))
    }

    // Sin permiso de lectura, la política RLS no da error: devuelve cero
    // filas. Ambos casos acaban igual, en la copia local.
    if (error || !data?.length) return null

    const fila = data[0]

    // Con varias filas por navegador, solo vale la del propio visitante.
    const duenno = fila?.respuestas?.meta?.cliente_anonimo
    if (duenno && clienteAnonimo && duenno !== clienteAnonimo) return null

    return extraerCitaDeFila(fila)
  } catch {
    // Sin red o sin permiso de lectura: la tarjeta se queda con la copia local.
    return null
  }
}
