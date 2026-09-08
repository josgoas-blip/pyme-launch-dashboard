/**
 * Tipos (JSDoc) de la pestaña "Viabilidad" — Pyme Launch Dashboard (PMV,
 * Fase Semilla). Las cifras son proyecciones condicionadas a supuestos, no
 * datos de una empresa operativa.
 * Contrato entre los mocks (src/data/viabilidadMock.js) y los componentes
 * visuales de src/components/dashboard/.
 */

/**
 * Un punto temporal del escenario de Flujo de Caja proyectado.
 * @typedef {Object} PuntoEscenario
 * @property {string} periodo - p.ej. "Año 1".
 * @property {number} favorable - Flujo de caja acumulado (€), escenario favorable.
 * @property {number} base - Flujo de caja acumulado (€), escenario base.
 * @property {number} adverso - Flujo de caja acumulado (€), escenario adverso.
 */

/**
 * Las 4 métricas principales proyectadas (fila superior de la pestaña).
 * @typedef {Object} MetricasProyectadas
 * @property {number} puntoMuerto - Punto Muerto: facturación mínima mensual (€/mes).
 * @property {number} autonomia - Autonomía financiera / reserva de caja (días).
 * @property {number} vanProyectado - Valor Actual Neto proyectado (€).
 * @property {number} tirProyectada - Tasa Interna de Retorno proyectada (%).
 */

/**
 * Un supuesto clave usado en los cálculos de viabilidad, con su procedencia
 * (Taxonomía de Evidencia — ver src/utils/evidencia.js).
 * @typedef {Object} SupuestoClave
 * @property {string} id
 * @property {string} etiqueta - p.ej. "Precio medio".
 * @property {import('./dashboard.js').ValorConEvidencia} valor
 */

export {}
