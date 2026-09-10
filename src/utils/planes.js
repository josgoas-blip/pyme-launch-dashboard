/**
 * Planes de suscripción del SaaS, ordenados de menor a mayor acceso.
 * Usado por la lógica de bloqueo por plan (Gating) del dashboard.
 */
export const PLANES = ['report', 'assist', 'total']

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
