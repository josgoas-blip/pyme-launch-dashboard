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
const CLAVE_PLAN_CONTRATADO = 'pyme-launch:plan-contratado:v1'

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
 * Plan elegido en el selector de pruebas, si es uno de los permitidos.
 *
 * Es solo una simulación local: el plan real es el de
 * `profiles.plan_contratado`, que nunca se modifica desde el selector.
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

/**
 * Última lectura del plan contratado, asociada a su usuario.
 *
 * Tras un F5 permite pintar el panel con el plan correcto al instante
 * mientras se vuelve a consultar Supabase, en lugar de mostrar una
 * pantalla de carga o, peor, los muros de pago del plan de entrada. Se
 * guarda con el `userId` para no aplicar el plan de otra cuenta.
 *
 * @param {string|null} userId
 * @param {string[]} permitidos
 * @returns {string|null}
 */
export function cargarPlanContratadoCache(userId, permitidos) {
  try {
    const { userId: dueno, plan } = JSON.parse(leer(CLAVE_PLAN_CONTRATADO) ?? 'null') ?? {}
    return userId && dueno === userId && permitidos.includes(plan) ? plan : null
  } catch {
    return null
  }
}

/**
 * @param {string} userId
 * @param {string} plan
 */
export function guardarPlanContratadoCache(userId, plan) {
  escribir(CLAVE_PLAN_CONTRATADO, JSON.stringify({ userId, plan }))
}

/** Olvida el plan de pruebas y la copia del plan contratado (al cerrar sesión). */
export function borrarPlan() {
  borrar(CLAVE_PLAN)
  borrar(CLAVE_PLAN_CONTRATADO)
}

/** Deja de simular un plan y vuelve al contratado. */
export function borrarPlanPrueba() {
  borrar(CLAVE_PLAN)
}
