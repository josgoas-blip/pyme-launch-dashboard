/**
 * Datos simulados (mock) de la pestaña "Inicio" — Pyme Launch Dashboard.
 * Tipado según src/types/dashboard.js. Modelo PMV orientado a la Fase Semilla
 * (prevalidación de la idea): "¿Dónde estoy y qué me falta?".
 */

/**
 * 1. Variables de control del recorrido del proyecto.
 * @type {import('../types/dashboard.js').ControlProyecto}
 */
export const controlProyecto = {
  progreso_recorrido: 31,
  fase_actual: 'Validación del problema',
  proxima_accion: 'Registrar 5 entrevistas',
}

/**
 * 2. Calidad de la Evidencia: desglose % por procedencia del dato.
 * @type {import('../types/dashboard.js').ItemCalidadEvidencia[]}
 */
export const calidadEvidencia = [
  { id: 'documentado', tipo: 'Dato documentado', porcentaje: 20 },
  { id: 'declarado', tipo: 'Dato declarado', porcentaje: 35 },
  { id: 'fuente-externa', tipo: 'Fuente externa', porcentaje: 25 },
  { id: 'hipotesis', tipo: 'Hipótesis', porcentaje: 20 },
]

/**
 * 3. Recorrido del proyecto: pasos de la Fase Semilla y su estado.
 * @type {import('../types/dashboard.js').PasoRecorrido[]}
 */
export const recorridoProyecto = [
  { id: 'idea', paso: 'Idea', estado: 'Completado' },
  { id: 'propuesta', paso: 'Propuesta', estado: 'Completado' },
  { id: 'validacion', paso: 'Validación', estado: 'En curso' },
  { id: 'modelo', paso: 'Modelo', estado: 'Bloqueado' },
  { id: 'mercado', paso: 'Mercado', estado: 'Bloqueado' },
]

/**
 * Estructura completa de datos de la pestaña Inicio, agrupada.
 * @type {import('../types/dashboard.js').InicioDashboardData}
 */
export const inicioDashboardMock = {
  controlProyecto,
  calidadEvidencia,
  recorridoProyecto,
}

export default inicioDashboardMock
