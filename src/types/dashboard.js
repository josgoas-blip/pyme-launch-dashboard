/**
 * Tipos (JSDoc) del Resumen General — pestaña "Inicio" del Pyme Launch
 * Dashboard (PMV, Fase Semilla). El proyecto usa JavaScript (no
 * TypeScript), por lo que las "interfaces" se documentan aquí como
 * typedefs JSDoc.
 *
 * Esta pestaña no tiene mock: es el contrato entre las derivaciones de
 * `src/utils/resumenDiagnostico.js` y los componentes visuales. La
 * Taxonomía de Evidencia que se define aquí la comparten además los
 * cuadrantes de Análisis y Viabilidad.
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
 * Una de las cuatro dimensiones del modelo de evaluación del TFM, con la
 * puntuación que ha obtenido en el diagnóstico.
 * @typedef {Object} DimensionDiagnostico
 * @property {string} id - p.ej. "validacion_mercado".
 * @property {string} etiqueta - p.ej. "Validación y mercado".
 * @property {number} peso - Peso sobre el score total (0-1).
 * @property {number} puntuacion - Puntuación de la dimensión (0-100).
 */

/**
 * Resumen global del proyecto: las cifras de cabecera del panel, idénticas
 * a las de la pantalla final del cuestionario.
 * @typedef {Object} ResumenGlobal
 * @property {number} score - `score_total` del diagnóstico (0-100).
 * @property {string} fase - `fase_embudo`, p.ej. "Validación".
 * @property {DimensionDiagnostico[]} dimensiones - Exactamente 4.
 * @property {{ id: string, etiqueta: string, puntuacion: number } | null} dimensionDebil
 * @property {string[]} alertas - Penalizaciones que aplica el modelo al score.
 * @property {string|undefined} proximaAccion - Palanca derivada de la dimensión más débil.
 */

/**
 * Una barra del cuadrante "Calidad de la Evidencia": una de las cuatro
 * preguntas del modelo que miden qué ha contrastado el usuario (p4-p7).
 * @typedef {Object} ItemCalidadEvidencia
 * @property {string} id
 * @property {string} etiqueta - p.ej. "Contacto directo con clientes".
 * @property {number} nivel - Nivel declarado (1-5).
 * @property {number} porcentaje - El nivel normalizado a 0-100.
 * @property {TipoEvidencia} tipo - Procedencia que implica ese nivel.
 * @property {string|undefined} detalle - Opción que el usuario eligió.
 */

/**
 * Un paso del Recorrido del proyecto (Idea, Propuesta, Validación, Modelo, Mercado).
 * @typedef {Object} PasoRecorrido
 * @property {string} id
 * @property {string} paso
 * @property {'Completado'|'En curso'|'Bloqueado'} estado
 */

export {}
