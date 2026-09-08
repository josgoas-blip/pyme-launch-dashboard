/**
 * Tipos (JSDoc) de la pestaña "Análisis" — Pyme Launch Dashboard.
 * Contrato entre los mocks (src/data/analisisMock.js) y los componentes
 * visuales de src/components/dashboard/ (Fase 4 del plan maestro).
 */

/**
 * Un ítem del análisis DAFO.
 * @typedef {Object} ItemDafo
 * @property {string} id
 * @property {string} texto
 */

/**
 * Matriz DAFO completa (4 cuadrantes) + medidor de riesgo general.
 * @typedef {Object} RiesgoDafo
 * @property {ItemDafo[]} fortalezas
 * @property {ItemDafo[]} debilidades
 * @property {ItemDafo[]} oportunidades
 * @property {ItemDafo[]} amenazas
 * @property {number} riesgoGeneral - % de riesgo general (0-100).
 */

/**
 * Una métrica del Análisis de Mercado (TAM/SAM/SOM/LTV/Market Share). No
 * incluye CAC real, Churn Rate ni NPS: no son aplicables a un proyecto en
 * Fase Semilla (pre-lanzamiento).
 * @typedef {Object} MetricaMercado
 * @property {string} id
 * @property {string} etiqueta
 * @property {import('./dashboard.js').ValorConEvidencia} valor - Valor + procedencia (Taxonomía de Evidencia).
 * @property {string} [descripcion] - Aclaración breve de la métrica.
 */

/**
 * Un punto del histórico de Evolución del Scoring de Viabilidad.
 * @typedef {Object} PuntoScoring
 * @property {string} mes - p.ej. "Mes 1".
 * @property {number} score - Score de Viabilidad (0-100).
 * @property {string} hito - Hito destacado alcanzado en ese punto (tooltip).
 */

/**
 * Un ítem del Análisis de Sensibilidad (barra de tolerancia a un umbral de riesgo).
 * @typedef {Object} ItemSensibilidad
 * @property {string} id
 * @property {string} etiqueta
 * @property {number} valor - Valor del umbral (puede ser negativo, p.ej. -22).
 * @property {number} escalaMaxima - Valor de referencia (100% de la barra), en valor absoluto.
 * @property {string} unidad - '%', 'días', etc.
 * @property {string} descripcion - Explicación breve del umbral.
 */

/**
 * Una comparativa de Benchmark Sectorial (PYME vs Media del Sector en España).
 * @typedef {Object} ComparativaSectorial
 * @property {string} id
 * @property {string} metrica
 * @property {number} valorPyme
 * @property {number} valorSector
 * @property {string} unidad - '€', '%', 'pts', etc.
 * @property {'altoEsFavorable'|'bajoEsFavorable'} sentido
 */

/**
 * Un eje del análisis PESTEL con su evaluación cuantitativa.
 * @typedef {Object} EjePestel
 * @property {string} eje - Político, Económico, Social, Tecnológico, Ecológico, Legal.
 * @property {number} impacto - Escala 1-5.
 * @property {number} probabilidad - Escala 1-5.
 */

/**
 * Una de las 5 Fuerzas de Porter con su intensidad evaluada.
 * @typedef {Object} FuerzaPorter
 * @property {string} fuerza
 * @property {number} intensidad - Escala 1-5.
 */

/**
 * Estructura completa de datos de la pestaña Análisis.
 * @typedef {Object} AnalisisDashboardData
 * @property {number} indiceMadurez - Índice de madurez del proyecto (0-100).
 * @property {number} indiceSolidezEvidencia - Índice de solidez de la evidencia (0-100).
 * @property {RiesgoDafo} riesgoDafo
 * @property {MetricaMercado[]} metricasMercado - TAM, SAM, SOM, LTV, Market Share.
 * @property {EjePestel[]} ejesPestel - Exactamente 6 ejes.
 * @property {FuerzaPorter[]} fuerzasPorter - Exactamente 5 fuerzas.
 * @property {PuntoScoring[]} evolucionScoring - Histórico del Score de Viabilidad.
 * @property {ItemSensibilidad[]} analisisSensibilidad - Umbrales de tolerancia al riesgo.
 * @property {ComparativaSectorial[]} benchmarkSectorial - PYME vs Media del Sector.
 */

export {}
