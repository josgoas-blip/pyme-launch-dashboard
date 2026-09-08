/**
 * Datos simulados (mock) de la pestaña "Análisis" — Pyme Launch Dashboard.
 * Tipado según src/types/analisis.js. Modelo PMV (Fase Semilla): se han
 * retirado las métricas operativas propias de un negocio ya lanzado (CAC
 * real, Churn Rate, NPS, Resultados vs Proyecciones).
 */

/**
 * 1. Doble Indicador: madurez del proyecto y solidez de la evidencia aportada.
 * @type {{ indice_madurez: number, indice_solidez_evidencia: number }}
 */
export const indiceMadurez = 76
export const indiceSolidezEvidencia = 52

/**
 * 2. Matriz DAFO (4 cuadrantes) + Medidor de Riesgo General.
 * @type {import('../types/analisis.js').RiesgoDafo}
 */
export const riesgoDafo = {
  fortalezas: [
    { id: 'f1', texto: 'Equipo fundador con experiencia previa en el sector' },
    { id: 'f2', texto: 'Producto validado con clientes piloto' },
    { id: 'f3', texto: 'Estructura de costes ligera' },
  ],
  debilidades: [
    { id: 'd1', texto: 'Dependencia de un único canal de captación' },
    { id: 'd2', texto: 'Equipo comercial reducido' },
  ],
  oportunidades: [
    { id: 'o1', texto: 'Crecimiento del mercado digital en el sector' },
    { id: 'o2', texto: 'Ayudas y subvenciones para digitalización de pymes' },
    { id: 'o3', texto: 'Baja competencia directa en el nicho local' },
  ],
  amenazas: [
    { id: 'a1', texto: 'Entrada de competidores con más capital' },
    { id: 'a2', texto: 'Subida de costes de adquisición de clientes' },
  ],
  riesgoGeneral: 38,
}

/**
 * 3. Análisis de Mercado: TAM, SAM, SOM, LTV, Market Share — cada valor
 * etiquetado con su procedencia (Taxonomía de Evidencia). Se han retirado
 * CAC real, Churn Rate y NPS por no ser aplicables a un proyecto pre-lanzamiento.
 * @type {import('../types/analisis.js').MetricaMercado[]}
 */
export const metricasMercado = [
  {
    id: 'tam',
    etiqueta: 'TAM',
    valor: { valor: '850.000.000 €', tipo_evidencia: 'Fuente externa' },
    descripcion: 'Mercado Total Disponible',
  },
  {
    id: 'sam',
    etiqueta: 'SAM',
    valor: { valor: '120.000.000 €', tipo_evidencia: 'Estimación' },
    descripcion: 'Mercado Disponible Servible',
  },
  {
    id: 'som',
    etiqueta: 'SOM',
    valor: { valor: '3.500.000 €', tipo_evidencia: 'Hipótesis' },
    descripcion: 'Mercado Obtenible Servible',
  },
  {
    id: 'ltv',
    etiqueta: 'LTV',
    valor: { valor: '1.840 €', tipo_evidencia: 'Hipótesis' },
    descripcion: 'Valor de vida del cliente (proyectado)',
  },
  {
    id: 'market-share',
    etiqueta: 'Market Share Objetivo',
    valor: { valor: '2,9 %', tipo_evidencia: 'Hipótesis' },
    descripcion: 'Cuota de mercado objetivo a 3 años',
  },
]

/**
 * 4. PESTEL — evaluación cuantitativa por eje (Impacto x Probabilidad, escala 1-5).
 * @type {import('../types/analisis.js').EjePestel[]}
 */
export const ejesPestel = [
  { eje: 'Político', impacto: 2, probabilidad: 2 },
  { eje: 'Económico', impacto: 4, probabilidad: 4 },
  { eje: 'Social', impacto: 3, probabilidad: 4 },
  { eje: 'Tecnológico', impacto: 5, probabilidad: 4 },
  { eje: 'Ecológico', impacto: 2, probabilidad: 3 },
  { eje: 'Legal', impacto: 3, probabilidad: 2 },
]

/**
 * 5. Las 5 Fuerzas de Porter — intensidad evaluada (escala 1-5).
 * @type {import('../types/analisis.js').FuerzaPorter[]}
 */
export const fuerzasPorter = [
  { fuerza: 'Poder de Clientes', intensidad: 3 },
  { fuerza: 'Poder de Proveedores', intensidad: 2 },
  { fuerza: 'Nuevos Competidores', intensidad: 4 },
  { fuerza: 'Productos Sustitutos', intensidad: 2 },
  { fuerza: 'Rivalidad del Sector', intensidad: 4 },
]

/**
 * 6. Evolución del Scoring de Viabilidad (histórico + hitos alcanzados).
 * @type {import('../types/analisis.js').PuntoScoring[]}
 */
export const evolucionScoring = [
  { mes: 'Mes 1', score: 38, hito: 'Validación inicial de la idea de negocio' },
  { mes: 'Mes 3', score: 65, hito: '6 LOIs validadas en b4' },
  { mes: 'Mes 6', score: 84, hito: 'Punto de equilibrio alcanzado al 84%' },
]

/**
 * 7. Análisis de Sensibilidad: umbrales de tolerancia al riesgo.
 * @type {import('../types/analisis.js').ItemSensibilidad[]}
 */
export const analisisSensibilidad = [
  {
    id: 'ventas',
    etiqueta: 'Tolerancia Caída de Ventas',
    valor: -22,
    escalaMaxima: 50,
    unidad: '%',
    descripcion: 'Caída de ventas máxima asumible antes de entrar en pérdidas.',
  },
  {
    id: 'costes',
    etiqueta: 'Soporte Aumento de Costes',
    valor: 15,
    escalaMaxima: 30,
    unidad: '%',
    descripcion: 'Incremento de costes absorbible sin romper la rentabilidad.',
  },
  {
    id: 'burn-rate',
    etiqueta: 'Reserva de Caja / Burn Rate',
    valor: 180,
    escalaMaxima: 365,
    unidad: 'días',
    descripcion: 'Autonomía financiera del negocio sin nuevos ingresos.',
  },
]

/**
 * 8. Benchmark Sectorial: PYME vs Media del Sector en España.
 * @type {import('../types/analisis.js').ComparativaSectorial[]}
 */
export const benchmarkSectorial = [
  { id: 'margen-neto', metrica: 'Margen Neto', valorPyme: 21, valorSector: 14, unidad: '%', sentido: 'altoEsFavorable' },
  { id: 'cac', metrica: 'CAC', valorPyme: 62, valorSector: 45, unidad: '€', sentido: 'bajoEsFavorable' },
  { id: 'churn', metrica: 'Churn Rate', valorPyme: 3.2, valorSector: 5.1, unidad: '%', sentido: 'bajoEsFavorable' },
  { id: 'nps', metrica: 'NPS', valorPyme: 42, valorSector: 30, unidad: 'pts', sentido: 'altoEsFavorable' },
]

/**
 * Estructura completa de datos de la pestaña Análisis, agrupada.
 * @type {import('../types/analisis.js').AnalisisDashboardData}
 */
export const analisisDashboardMock = {
  indiceMadurez,
  indiceSolidezEvidencia,
  riesgoDafo,
  metricasMercado,
  ejesPestel,
  fuerzasPorter,
  evolucionScoring,
  analisisSensibilidad,
  benchmarkSectorial,
}

export default analisisDashboardMock
