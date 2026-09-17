/**
 * Diagnósticos completados que aún no se han podido guardar en Supabase.
 *
 * Problema que resuelve: al terminar el cuestionario, el diagnóstico se
 * guarda al instante en el navegador y se sube a Supabase en segundo plano.
 * Si la subida fallaba, la única copia era la del navegador, y "Salir" la
 * borra (para que el siguiente usuario del equipo no vea datos ajenos). Al
 * volver a iniciar sesión Supabase no tenía nada y el usuario se
 * encontraba otra vez con el cuestionario.
 *
 * Aquí la copia pendiente se guarda asociada a su `user_id` y sobrevive al
 * cierre de sesión. Al volver a entrar **esa misma cuenta**, se recupera y
 * se reintenta la subida. Otra cuenta en el mismo navegador nunca la ve.
 * En cuanto Supabase confirma la escritura, se borra.
 *
 * Mismo principio defensivo que el resto de módulos de persistencia: nada
 * lanza y un contenido corrupto se descarta.
 */
import { esDiagnosticoValido } from './persistenciaDiagnostico.js'

export const CLAVE_PENDIENTES = 'pyme-launch:diagnosticos-pendientes:v1'

/** @returns {Record<string, { respuestas: Record<string, unknown>, guardadoEn: string }>} */
function leerTodos() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CLAVE_PENDIENTES) ?? '{}')
    return bruto && typeof bruto === 'object' && !Array.isArray(bruto) ? bruto : {}
  } catch {
    return {}
  }
}

function escribirTodos(pendientes) {
  try {
    if (Object.keys(pendientes).length === 0) localStorage.removeItem(CLAVE_PENDIENTES)
    else localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(pendientes))
  } catch {
    // Sin almacenamiento: se pierde la red de seguridad, no la sesión actual.
  }
}

/**
 * Diagnóstico pendiente de subir para este usuario, o `null`.
 *
 * @param {string|null} userId
 * @returns {{ respuestas: Record<string, unknown>, guardadoEn: string } | null}
 */
export function cargarDiagnosticoPendiente(userId) {
  if (!userId) return null
  const entrada = leerTodos()[userId]
  if (!entrada || !esDiagnosticoValido(entrada.respuestas)) return null
  return entrada
}

/**
 * Registra un diagnóstico como pendiente de subir. Solo se conserva el
 * último por usuario: es el único que el panel mostraría.
 *
 * @param {string|null} userId
 * @param {Record<string, unknown>} respuestas
 */
export function guardarDiagnosticoPendiente(userId, respuestas) {
  if (!userId || !esDiagnosticoValido(respuestas)) return
  escribirTodos({ ...leerTodos(), [userId]: { respuestas, guardadoEn: new Date().toISOString() } })
}

/**
 * Da por subido el diagnóstico pendiente de este usuario.
 *
 * Solo se borra si es el mismo que se acaba de guardar: si mientras tanto
 * se completó otro, ese sigue pendiente.
 *
 * @param {string|null} userId
 * @param {Record<string, unknown>} [respuestasSubidas]
 */
export function borrarDiagnosticoPendiente(userId, respuestasSubidas) {
  if (!userId) return
  const todos = leerTodos()
  const actual = todos[userId]
  if (!actual) return

  const mismo =
    !respuestasSubidas ||
    actual.respuestas?.meta?.completadoEn === respuestasSubidas?.meta?.completadoEn

  if (mismo) {
    delete todos[userId]
    escribirTodos(todos)
  }
}
