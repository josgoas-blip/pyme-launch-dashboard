/**
 * Tipos (JSDoc) de la pestaña "Viabilidad" — Pyme Launch Dashboard (PMV,
 * Fase Semilla). Las cifras son proyecciones condicionadas a los supuestos
 * que el usuario ha declarado, no datos de una empresa operativa.
 *
 * Contrato entre las derivaciones del diagnóstico
 * (src/utils/viabilidadDiagnostico.js) y los componentes visuales de
 * src/components/dashboard/. Esta pestaña no tiene mock: si el diagnóstico
 * no aporta una variable, el componente muestra un placeholder.
 */

/**
 * Un punto mensual de la proyección de saldo de caja. Los tres escenarios
 * comparten caja inicial y consumo mensual; solo difieren en el mes en que
 * se alcanza el equilibrio.
 * @typedef {Object} PuntoEscenario
 * @property {number} mes - Mes del horizonte proyectado (0 = hoy).
 * @property {string} periodo - Etiqueta del eje X, p.ej. "Mes 6".
 * @property {number} favorable - Saldo de caja (€) alcanzando el equilibrio un 25 % antes.
 * @property {number} base - Saldo de caja (€) con el plazo declarado en p19.
 * @property {number} adverso - Saldo de caja (€) alcanzando el equilibrio un 50 % más tarde.
 */

/**
 * Indicador clásico de viabilidad que el cuestionario de 20 preguntas no
 * permite calcular. Se muestra con el dato que le falta, nunca con una
 * cifra simulada.
 * @typedef {Object} IndicadorPendiente
 * @property {string} id
 * @property {string} etiqueta - p.ej. "Punto Muerto".
 * @property {string} requiere - Dato que haría falta para calcularlo.
 */

/**
 * Un supuesto clave usado en los cálculos de viabilidad, con su procedencia
 * (Taxonomía de Evidencia — ver src/utils/evidencia.js).
 * @typedef {Object} SupuestoClave
 * @property {string} id
 * @property {string} etiqueta - p.ej. "Inversión total".
 * @property {import('./dashboard.js').ValorConEvidencia} valor
 */

export {}
