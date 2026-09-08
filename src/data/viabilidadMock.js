/**
 * Datos simulados (mock) de la pestaña "Viabilidad" — Pyme Launch Dashboard.
 * Tipado según src/types/viabilidad.js. Modelo PMV (Fase Semilla): las
 * cifras son proyecciones condicionadas a los Supuestos Clave, no datos de
 * una empresa ya operativa.
 */

/**
 * 1. Las 4 métricas principales proyectadas.
 * @type {import('../types/viabilidad.js').MetricasProyectadas}
 */
export const metricasProyectadas = {
  puntoMuerto: 8500,
  autonomia: 180,
  vanProyectado: 68000,
  tirProyectada: 24.6,
}

/**
 * 2. Escenarios de Flujo de Caja acumulado (datos ilustrativos), 3 curvas:
 * Favorable, Base, Adverso.
 * @type {import('../types/viabilidad.js').PuntoEscenario[]}
 */
export const escenariosVan = [
  { periodo: 'Año 1', favorable: -8000, base: -15000, adverso: -22000 },
  { periodo: 'Año 2', favorable: 12000, base: -2000, adverso: -18000 },
  { periodo: 'Año 3', favorable: 38000, base: 16000, adverso: -6000 },
  { periodo: 'Año 4', favorable: 71000, base: 39000, adverso: 9000 },
  { periodo: 'Año 5', favorable: 112000, base: 68000, adverso: 27000 },
]

/**
 * 3. Supuestos Clave usados en los cálculos de viabilidad (VAN, TIR,
 * escenarios…), cada uno con su procedencia (Taxonomía de Evidencia).
 * @type {import('../types/viabilidad.js').SupuestoClave[]}
 */
export const supuestosClave = [
  { id: 'precio-medio', etiqueta: 'Precio medio', valor: { valor: '45 €', tipo_evidencia: 'Hipótesis' } },
  { id: 'ventas-mes-12', etiqueta: 'Ventas mes 12', valor: { valor: '350', tipo_evidencia: 'Estimación' } },
  { id: 'coste-variable', etiqueta: 'Coste variable', valor: { valor: '17 €', tipo_evidencia: 'Dato documentado' } },
  { id: 'crecimiento-anual', etiqueta: 'Crecimiento anual', valor: { valor: '12 %', tipo_evidencia: 'Escenario' } },
]

export default { metricasProyectadas, escenariosVan, supuestosClave }
