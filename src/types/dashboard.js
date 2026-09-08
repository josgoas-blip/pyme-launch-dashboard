/**
 * Tipos (JSDoc) de la pestaña "Inicio" — Pyme Launch Dashboard (PMV, Fase Semilla).
 * El proyecto usa JavaScript (no TypeScript), por lo que las "interfaces" se
 * documentan aquí como typedefs JSDoc. Sirven de contrato entre los mocks
 * (src/data/dashboardMock.js) y los componentes visuales.
 */

/**
 * Procedencia de un dato mostrado en el dashboard (Taxonomía de Evidencia).
 * @typedef {'Dato documentado'|'Dato declarado'|'Fuente externa'|'Estimación'|'Hipótesis'|'Escenario'} TipoEvidencia
 */

/**
 * Un valor de KPI acompañado de su procedencia (Taxonomía de Evidencia).
 * @typedef {Object} ValorConEvidencia
 * @property {string|number} valor
 * @property {TipoEvidencia} tipo_evidencia
 */

/**
 * Variables de control del recorrido del proyecto (Fase Semilla).
 * @typedef {Object} ControlProyecto
 * @property {number} progreso_recorrido - % de avance global del recorrido (0-100).
 * @property {string} fase_actual - Fase actual dentro del recorrido, p.ej. "Validación del problema".
 * @property {string} proxima_accion - Próxima acción recomendada, p.ej. "Registrar 5 entrevistas".
 */

/**
 * Desglose de la Calidad de la Evidencia aportada al proyecto.
 * @typedef {Object} ItemCalidadEvidencia
 * @property {string} id
 * @property {TipoEvidencia} tipo
 * @property {number} porcentaje - % del total de datos con esta procedencia (las 4 partidas suman 100).
 */

/**
 * Un paso del Recorrido del proyecto (Idea, Propuesta, Validación, Modelo, Mercado).
 * @typedef {Object} PasoRecorrido
 * @property {string} id
 * @property {string} paso
 * @property {'Completado'|'En curso'|'Bloqueado'} estado
 */

/**
 * Estructura completa de datos de la pestaña Inicio.
 * @typedef {Object} InicioDashboardData
 * @property {ControlProyecto} controlProyecto
 * @property {ItemCalidadEvidencia[]} calidadEvidencia - Exactamente 4 partidas.
 * @property {PasoRecorrido[]} recorridoProyecto - Exactamente 5 pasos.
 */

export {}
