/**
 * Planes de suscripción del SaaS, ordenados de menor a mayor acceso.
 * Usado por la lógica de bloqueo por plan (Gating) del dashboard.
 */
export const PLANES = ['report', 'assist', 'total']

/** Plan de entrada: el que se aplica si el perfil no tiene otro. */
export const PLAN_POR_DEFECTO = 'report'

/**
 * Valores de `profiles.plan_contratado` en la base de datos y su plan
 * interno. La base de datos usa el nombre comercial en mayúsculas; el
 * código, un identificador corto.
 */
export const PLAN_POR_VALOR_BD = {
  REPORT: 'report',
  'LAUNCH ASSIST': 'assist',
  'LAUNCH TOTAL': 'total',
}

/**
 * Traduce `profiles.plan_contratado` al plan interno.
 *
 * Tolera variaciones de escritura habituales al editar a mano en Supabase
 * (minúsculas, espacios de más, guion bajo o guion en lugar de espacio):
 * un "launch_total" no debe dejar a un cliente de pago con el plan de
 * entrada.
 *
 * @param {unknown} valor
 * @returns {'report'|'assist'|'total'|null} `null` si no se reconoce.
 */
export function planDesdeBaseDatos(valor) {
  if (typeof valor !== 'string') return null
  const clave = valor.trim().toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
  return PLAN_POR_VALOR_BD[clave] ?? null
}

export const PLAN_INFO = {
  report: { id: 'report', nombre: 'Report', etiqueta: 'Report (31 €)' },
  assist: { id: 'assist', nombre: 'Launch Assist', etiqueta: 'Launch Assist' },
  total: { id: 'total', nombre: 'Launch Total', etiqueta: 'Launch Total' },
}

/**
 * ¿El plan actual da acceso a contenido que requiere, como mínimo, `planMinimo`?
 * @param {'report'|'assist'|'total'} planActual
 * @param {'report'|'assist'|'total'} planMinimo
 * @returns {boolean}
 */
export function tieneAcceso(planActual, planMinimo) {
  return PLANES.indexOf(planActual) >= PLANES.indexOf(planMinimo)
}

/**
 * Cupo de créditos de consulta del Agente IA incluido en cada plan.
 * Es el máximo disponible: el consumo se descuenta de esta cifra.
 */
export const CREDITOS_POR_PLAN = {
  report: 15,
  assist: 40,
  total: 100,
}

/**
 * Cupo de créditos del plan indicado, con el plan de entrada como respaldo.
 * @param {'report'|'assist'|'total'} plan
 * @returns {number}
 */
export function creditosDelPlan(plan) {
  return CREDITOS_POR_PLAN[plan] ?? CREDITOS_POR_PLAN.report
}

/**
 * Plan inmediatamente superior, o `null` si ya es el más alto.
 * @param {'report'|'assist'|'total'} plan
 * @returns {'assist'|'total'|null}
 */
export function siguientePlan(plan) {
  const indice = PLANES.indexOf(plan)
  return indice >= 0 && indice < PLANES.length - 1 ? PLANES[indice + 1] : null
}
