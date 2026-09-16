/**
 * Estado de navegación que debe sobrevivir a una recarga (F5): la pestaña
 * activa del panel y el plan elegido en el selector de pruebas.
 *
 * Se guarda en `sessionStorage` y no en `localStorage` a propósito:
 *   - Una recarga conserva la pestaña en la que estaba el usuario.
 *   - Una pestaña nueva del navegador, o un nuevo inicio de sesión, entra
 *     siempre por "Inicio", que es la entrada por defecto del panel.
 *
 * Igual que el resto de módulos de persistencia, nada lanza: sin
 * almacenamiento (navegación privada estricta) se vuelve a los valores por
 * defecto y el panel funciona igual.
 */

const CLAVE_PESTANA = 'pyme-launch:pestana:v1'
const CLAVE_PESTANA_CONSULTOR = 'pyme-launch:pestana-consultor:v1'
const CLAVE_PLAN = 'pyme-launch:plan:v1'

function leer(clave) {
  try {
    return sessionStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribir(clave, valor) {
  try {
    sessionStorage.setItem(clave, valor)
  } catch {
    // Sin almacenamiento: la recarga volverá al valor por defecto.
  }
}

function borrar(clave) {
  try {
    sessionStorage.removeItem(clave)
  } catch {
    // Nada que borrar.
  }
}

/**
 * Pestaña guardada, si es una de las permitidas.
 *
 * Se valida contra la lista para que un valor antiguo o manipulado no deje
 * el panel sin vista que pintar.
 *
 * @param {string[]} permitidas
 * @param {boolean} [consultor] - El Modo Consultor lleva su propia clave.
 * @returns {string|null}
 */
export function cargarPestanaActiva(permitidas, consultor = false) {
  const valor = leer(consultor ? CLAVE_PESTANA_CONSULTOR : CLAVE_PESTANA)
  return permitidas.includes(valor) ? valor : null
}

/**
 * @param {string} pestana
 * @param {boolean} [consultor]
 */
export function guardarPestanaActiva(pestana, consultor = false) {
  escribir(consultor ? CLAVE_PESTANA_CONSULTOR : CLAVE_PESTANA, pestana)
}

/** Vuelve a "Inicio" en la próxima carga: al cerrar sesión o reiniciar el diagnóstico. */
export function borrarPestanaActiva() {
  borrar(CLAVE_PESTANA)
}

/**
 * Plan guardado, si es uno de los permitidos.
 *
 * @param {string[]} permitidos
 * @returns {string|null}
 */
export function cargarPlan(permitidos) {
  const valor = leer(CLAVE_PLAN)
  return permitidos.includes(valor) ? valor : null
}

/** @param {string} plan */
export function guardarPlan(plan) {
  escribir(CLAVE_PLAN, plan)
}

export function borrarPlan() {
  borrar(CLAVE_PLAN)
}
