/**
 * Normalización de la cita de mentoría.
 *
 * El estado de la cita puede llegar de sitios distintos y con vocabularios
 * distintos, porque lo escriben actores distintos:
 *   - n8n, al aprobar la solicitud, añade `respuestas.cita` con
 *     `{ estado: 'confirmada', fecha: <ISO>, meet_url }`.
 *   - El propio panel, al enviar la solicitud, guarda una copia local con
 *     `{ estado: 'pendiente_aprobacion', fecha_propuesta: 'YYYY-MM-DD HH:mm' }`.
 *   - La fila puede exponer además columnas sueltas (`estado_cita`,
 *     `estado`).
 *
 * Este módulo traduce todo eso a una única forma canónica para que la
 * tarjeta no tenga que conocer cada variante. Es puro y sin React: no toca
 * la red ni el almacenamiento.
 */

/**
 * Cita ya normalizada, tal y como la consume la vista.
 * @typedef {Object} CitaNormalizada
 * @property {'sin_solicitar'|'pendiente'|'confirmada'} estado
 * @property {Date|null} fecha - Momento de la sesión, o `null` si no consta.
 * @property {string|null} meetUrl - Enlace de videollamada, o `null`.
 * @property {string|null} estadoOriginal - Valor tal cual llegó, para depurar.
 */

/** Estados canónicos, en orden de avance. */
export const ESTADO_CITA = {
  SIN_SOLICITAR: 'sin_solicitar',
  PENDIENTE: 'pendiente',
  CONFIRMADA: 'confirmada',
}

/**
 * Vocabularios que se aceptan para cada estado canónico.
 *
 * Se admite más de un término a propósito: el flujo de n8n puede
 * renombrarlos sin que el panel deje de entenderlos, y es preferible
 * reconocer un sinónimo a mostrar el formulario de solicitud a alguien que
 * ya tiene la sesión confirmada.
 */
const SINONIMOS = {
  [ESTADO_CITA.CONFIRMADA]: ['confirmada', 'confirmado', 'sesion_agendada', 'agendada', 'aprobada', 'confirmed'],
  [ESTADO_CITA.PENDIENTE]: [
    'pendiente',
    'pendiente_aprobacion',
    'en_revision',
    'en revisión',
    'solicitada',
    'solicitado',
    'pending',
  ],
}

/** Quita acentos y normaliza para comparar sin depender de la tilde. */
function clave(valor) {
  if (typeof valor !== 'string') return ''
  return valor
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Traduce un texto de estado al vocabulario canónico.
 *
 * @param {unknown} valor
 * @returns {'pendiente'|'confirmada'|null} `null` si no lo reconoce.
 */
export function estadoCanonico(valor) {
  const normalizado = clave(valor)
  if (!normalizado) return null

  for (const [canonico, sinonimos] of Object.entries(SINONIMOS)) {
    if (sinonimos.some((sinonimo) => clave(sinonimo) === normalizado)) return canonico
  }
  return null
}

/**
 * Convierte a `Date` las dos formas de fecha que circulan por el sistema:
 * el ISO con huso que escribe n8n ("2026-09-18T12:00:00+02:00") y el
 * "YYYY-MM-DD HH:mm" que genera el formulario del panel.
 *
 * @param {unknown} valor
 * @returns {Date|null} `null` si no es una fecha utilizable.
 */
export function parsearFechaCita(valor) {
  if (valor instanceof Date) return Number.isFinite(valor.getTime()) ? valor : null
  if (typeof valor !== 'string' || !valor.trim()) return null

  // "2026-09-16 16:00" no es ISO válido en todos los motores: el espacio
  // se sustituye por la T para que se interprete como hora local.
  const texto = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(valor) ? valor.replace(' ', 'T') : valor

  const fecha = new Date(texto)
  return Number.isFinite(fecha.getTime()) ? fecha : null
}

/**
 * Normaliza un objeto `cita` venga con la forma que venga.
 *
 * @param {unknown} cruda - `respuestas.cita` o la copia local.
 * @returns {CitaNormalizada|null} `null` si no describe ninguna cita.
 */
export function normalizarCita(cruda) {
  if (typeof cruda !== 'object' || cruda === null || Array.isArray(cruda)) return null

  const estado = estadoCanonico(cruda.estado)
  if (!estado) return null

  return {
    estado,
    // `fecha` es lo que escribe n8n; `fecha_propuesta`, lo que guarda el
    // panel al solicitarla.
    fecha: parsearFechaCita(cruda.fecha ?? cruda.fecha_propuesta),
    meetUrl: cruda.meet_url ?? cruda.meetUrl ?? cruda.url_meet ?? null,
    estadoOriginal: typeof cruda.estado === 'string' ? cruda.estado : null,
  }
}

/**
 * Extrae la cita de una fila de `diagnosticos`.
 *
 * Prioridad: el objeto `respuestas.cita`, que es el que trae fecha y
 * enlace; después las columnas sueltas, que solo aportan estado.
 *
 * Sobre `fase_embudo`: en este esquema esa columna guarda la fase del
 * modelo ("Idea", "Validación", "Tracción", "Consolidación"), no el estado
 * de la cita. Se consulta igualmente por si un flujo de n8n la reutilizara,
 * pero solo se acepta si su valor pertenece al vocabulario de citas — de
 * lo contrario "Validación" se confundiría con una sesión pendiente y el
 * panel anunciaría una cita que nadie ha pedido.
 *
 * @param {Record<string, unknown>|null} fila
 * @returns {CitaNormalizada|null}
 */
export function extraerCitaDeFila(fila) {
  if (!fila) return null

  const desdeObjeto = normalizarCita(fila?.respuestas?.cita ?? fila?.cita)
  if (desdeObjeto) return desdeObjeto

  for (const columna of ['estado_cita', 'estado', 'fase_embudo']) {
    const estado = estadoCanonico(fila[columna])
    if (estado) {
      return {
        estado,
        fecha: parsearFechaCita(fila.fecha_cita ?? fila.cita_fecha),
        meetUrl: fila.meet_url ?? null,
        estadoOriginal: String(fila[columna]),
      }
    }
  }

  return null
}

/**
 * Formateador de la fecha de la sesión.
 *
 * Se fija el huso de Madrid a propósito: n8n envía la hora con su
 * desfase ("+02:00") y, sin fijarlo, un navegador en otro huso mostraría
 * una hora distinta de la que el mentor tiene en su calendario.
 */
const FECHA_LARGA = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Europe/Madrid',
})

const HORA_CORTA = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Europe/Madrid',
})

/**
 * "viernes 18 de septiembre a las 12:00 h".
 *
 * @param {Date|null} fecha
 * @returns {string|null} `null` si no hay fecha que formatear.
 */
export function formatearFechaCita(fecha) {
  if (!(fecha instanceof Date) || !Number.isFinite(fecha.getTime())) return null

  // Intl intercala una coma ("viernes, 18 de septiembre") que sobra en la
  // frase corrida de la tarjeta.
  const dia = FECHA_LARGA.format(fecha).replace(',', '')
  return `${dia} a las ${HORA_CORTA.format(fecha)} h`
}
