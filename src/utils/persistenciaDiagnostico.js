/**
 * Persistencia local del diagnóstico (localStorage).
 *
 * Supabase guarda el histórico; esto guarda la sesión de trabajo del
 * navegador: el usuario recarga con F5 o vuelve al día siguiente y el
 * Dashboard sigue donde estaba, sin repetir las 20 preguntas. Es
 * deliberadamente independiente de `diagnosticoService.js`, porque el
 * panel debe recuperarse aunque no haya credenciales, red ni sesión.
 *
 * Principio de diseño (el mismo del servicio): la persistencia nunca puede
 * romper la experiencia. Ninguna función lanza. Si el almacenamiento está
 * bloqueado (navegación privada, cookies de terceros desactivadas, cuota
 * agotada) o el contenido guardado está corrupto, se devuelve `null` y el
 * usuario simplemente vuelve a ver el cuestionario.
 *
 * El payload guardado NUNCA se confía a ciegas: puede haber sido escrito
 * por una versión anterior de la aplicación, manipulado a mano desde las
 * DevTools o truncado por una escritura interrumpida. Antes de devolverlo
 * se valida que sea un objeto con un diagnóstico reconocible; si no lo es,
 * se descarta y se limpia la clave.
 */
import { VARIABLES_DIAGNOSTICO } from './scoreDiagnostico.js'

/**
 * Clave versionada. Si el contrato del payload cambiara de forma
 * incompatible, basta con subir el sufijo para que los diagnósticos
 * antiguos se ignoren en lugar de romper el panel.
 */
export const CLAVE_DIAGNOSTICO = 'pyme-launch:diagnostico:v1'

/**
 * ¿El almacenamiento está disponible?
 *
 * No basta con comprobar que `localStorage` existe: en navegación privada
 * o con el almacenamiento de sitio bloqueado, el objeto está presente pero
 * `setItem` lanza. La única comprobación fiable es intentar escribir.
 */
function hayAlmacenamiento() {
  try {
    const sonda = '__pyme_launch_sonda__'
    localStorage.setItem(sonda, '1')
    localStorage.removeItem(sonda)
    return true
  } catch {
    return false
  }
}

/**
 * ¿El objeto recuperado contiene un diagnóstico reconocible?
 *
 * Se exige un objeto plano (no un array, no `null`) con, al menos, una de
 * las 22 variables del modelo o un `score_total` numérico. Con menos que
 * eso el panel no podría derivar nada y es preferible volver al
 * cuestionario que pintar una sesión vacía.
 *
 * @param {unknown} valor
 * @returns {boolean}
 */
export function esDiagnosticoValido(valor) {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false

  if (Number.isFinite(Number(valor.score_total))) return true

  return VARIABLES_DIAGNOSTICO.some((variable) => {
    const dato = valor[variable]
    return dato !== undefined && dato !== null
  })
}

/**
 * Recupera el diagnóstico guardado en este navegador.
 *
 * Descarta y limpia cualquier contenido que no supere la validación: JSON
 * malformado, `null`, un array, una cadena suelta o un objeto sin ninguna
 * variable del modelo.
 *
 * @returns {Record<string, unknown> | null} `null` si no hay nada utilizable.
 */
export function cargarDiagnosticoLocal() {
  if (!hayAlmacenamiento()) return null

  let crudo
  try {
    crudo = localStorage.getItem(CLAVE_DIAGNOSTICO)
  } catch {
    return null
  }

  if (!crudo) return null

  let analizado
  try {
    analizado = JSON.parse(crudo)
  } catch {
    // Escritura interrumpida o contenido manipulado: no es recuperable.
    console.warn('[Persistencia] Diagnóstico guardado ilegible. Se descarta.')
    borrarDiagnosticoLocal()
    return null
  }

  if (!esDiagnosticoValido(analizado)) {
    console.warn('[Persistencia] Diagnóstico guardado sin variables del modelo. Se descarta.')
    borrarDiagnosticoLocal()
    return null
  }

  return analizado
}

/**
 * Guarda el diagnóstico completo —respuestas, score, fase, dimensiones y
 * penalizaciones— para que la sesión sobreviva a una recarga.
 *
 * @param {Record<string, unknown>} respuestas - Salida del OnboardingWizard.
 * @returns {boolean} `true` si quedó guardado.
 */
export function guardarDiagnosticoLocal(respuestas) {
  if (!esDiagnosticoValido(respuestas) || !hayAlmacenamiento()) return false

  try {
    localStorage.setItem(CLAVE_DIAGNOSTICO, JSON.stringify(respuestas))
    return true
  } catch {
    // Cuota agotada o serialización imposible (referencias cíclicas).
    console.warn('[Persistencia] No se pudo guardar el diagnóstico en este navegador.')
    return false
  }
}

/**
 * Borra el diagnóstico guardado. Lo usa el reinicio del cuestionario para
 * que "empezar de cero" signifique exactamente eso, también tras cerrar y
 * reabrir el navegador.
 *
 * @returns {boolean} `true` si la clave quedó eliminada.
 */
export function borrarDiagnosticoLocal() {
  try {
    localStorage.removeItem(CLAVE_DIAGNOSTICO)
    return true
  } catch {
    return false
  }
}

/**
 * Clave del identificador de la fila de `diagnosticos` creada al guardar.
 *
 * Es el "expediente": permite consultar después esa fila concreta en vez de
 * rastrear la tabla. Antes no se guardaba porque la política RLS impedía al
 * visitante anónimo leer la fila recién insertada; con la política pública
 * de SELECT activa, el insert ya puede devolver su `id`.
 */
export const CLAVE_EXPEDIENTE = 'pyme-launch:expediente:v1'

/**
 * Identificador del expediente de este navegador.
 *
 * @returns {string|null} `null` si no hay ninguno guardado.
 */
export function cargarExpedienteId() {
  try {
    const guardado = localStorage.getItem(CLAVE_EXPEDIENTE)
    return typeof guardado === 'string' && guardado.trim() ? guardado : null
  } catch {
    return null
  }
}

/**
 * Guarda el identificador del expediente.
 *
 * @param {string} id
 * @returns {boolean} `true` si quedó guardado.
 */
export function guardarExpedienteId(id) {
  if (typeof id !== 'string' || !id.trim()) return false

  try {
    localStorage.setItem(CLAVE_EXPEDIENTE, id)
    return true
  } catch {
    return false
  }
}

/** Borra el expediente guardado. Lo usa el reinicio del diagnóstico. */
export function borrarExpedienteId() {
  try {
    localStorage.removeItem(CLAVE_EXPEDIENTE)
    return true
  } catch {
    return false
  }
}
