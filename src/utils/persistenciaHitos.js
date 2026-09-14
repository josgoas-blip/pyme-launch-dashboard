/**
 * Persistencia local del avance de la hoja de ruta.
 *
 * Guarda qué hitos ha marcado el emprendedor como hechos, para que el
 * progreso sobreviva a una recarga igual que el diagnóstico. Va en su
 * propia clave y no dentro del payload del diagnóstico: son cosas
 * distintas —una es lo que el usuario respondió, la otra lo que ha hecho
 * después— y mezclarlas obligaría a reescribir el diagnóstico entero cada
 * vez que se marca una casilla.
 *
 * Mismo principio defensivo que `persistenciaDiagnostico.js`: ninguna
 * función lanza, se valida antes de confiar en lo guardado y un contenido
 * corrupto se descarta en lugar de romper la vista.
 */

/** Clave versionada, para poder ignorar formatos antiguos sin romper nada. */
export const CLAVE_HITOS = 'pyme-launch:hitos:v1'

/**
 * ¿Está disponible el almacenamiento? En navegación privada el objeto
 * existe pero `setItem` lanza, así que la única comprobación fiable es
 * intentar escribir.
 */
function hayAlmacenamiento() {
  try {
    const sonda = '__pyme_launch_sonda_hitos__'
    localStorage.setItem(sonda, '1')
    localStorage.removeItem(sonda)
    return true
  } catch {
    return false
  }
}

/**
 * Identificadores de los hitos marcados como completados.
 *
 * Se filtra a cadenas: un array manipulado a mano podría traer objetos o
 * números, y el componente los usaría como claves de React.
 *
 * @returns {string[]} Vacío si no hay nada guardado o es ilegible.
 */
export function cargarHitosCompletados() {
  if (!hayAlmacenamiento()) return []

  try {
    const crudo = localStorage.getItem(CLAVE_HITOS)
    if (!crudo) return []

    const analizado = JSON.parse(crudo)
    if (!Array.isArray(analizado)) return []

    return analizado.filter((id) => typeof id === 'string')
  } catch {
    // JSON malformado o almacenamiento bloqueado: se empieza de cero.
    return []
  }
}

/**
 * Guarda los hitos completados.
 *
 * @param {string[]} ids
 * @returns {boolean} `true` si quedó guardado.
 */
export function guardarHitosCompletados(ids) {
  if (!Array.isArray(ids) || !hayAlmacenamiento()) return false

  try {
    localStorage.setItem(CLAVE_HITOS, JSON.stringify(ids.filter((id) => typeof id === 'string')))
    return true
  } catch {
    return false
  }
}

/** Borra el avance guardado. Lo usa el reinicio del diagnóstico. */
export function borrarHitosCompletados() {
  try {
    localStorage.removeItem(CLAVE_HITOS)
    return true
  } catch {
    return false
  }
}
