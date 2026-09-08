/**
 * Tipos (JSDoc) de la pestaña "Estrategia" — Pyme Launch Dashboard.
 * Contrato entre los mocks (src/data/estrategiaMock.js) y los componentes
 * visuales de src/components/dashboard/ (Fase 4 del plan maestro).
 */

/**
 * Una iniciativa de la Matriz de Priorización CAME.
 * @typedef {Object} IniciativaCame
 * @property {string} id
 * @property {string} nombre - Nombre completo (usado en el tooltip).
 * @property {string} [nombreCorto] - Nombre corto para la etiqueta junto al punto del gráfico.
 * @property {number} impacto - Escala 0-10.
 * @property {number} esfuerzo - Escala 0-10.
 */

/**
 * Estado de mitigación de riesgos.
 * @typedef {Object} MitigacionRiesgos
 * @property {number} riesgosTotales
 * @property {number} riesgosMitigados
 */

/**
 * Un canal de captación de la Matriz de Canales.
 * @typedef {Object} CanalCaptacion
 * @property {string} id
 * @property {string} canal - p.ej. "Meta Ads", "Google Search", "SEO Local", "Email".
 * @property {number} inversionEstimada - Inversión mensual estimada (€).
 * @property {number} cacCanal - CAC específico del canal (€).
 * @property {number} ltvCacRatio - Ratio LTV/CAC del canal (p.ej. 4.2 = 4.2x).
 * @property {number} roasObjetivo - ROAS objetivo del canal (multiplicador, p.ej. 3.5 = 3.5x).
 */

/**
 * Una etapa del Funnel de Conversión Digital.
 * @typedef {Object} EtapaFunnel
 * @property {string} id
 * @property {'Atracción'|'Nutrición'|'Conversión'} fase
 * @property {string} etiqueta - Nombre descriptivo de la etapa.
 * @property {number} volumen - Nº de prospectos/leads en la etapa.
 */

/**
 * Un escalón de la Escalera de Ofertas / Pricing.
 * @typedef {Object} EscalonOferta
 * @property {string} id
 * @property {'Tripwire'|'Core Offer'|'High Ticket'} tipo
 * @property {string} nombre - Nombre comercial de la oferta.
 * @property {number} precio - Precio (€).
 * @property {string} periodicidad - p.ej. "Pago único", "/mes", "/año".
 * @property {number} margenContribucion - Margen de contribución (%).
 * @property {string} descripcion
 */

/**
 * Una Acción Sugerida del bloque "Acciones Sugeridas" (PMV Fase Semilla):
 * recomendación de prevalidación, no instrucción ni tarea operativa.
 * @typedef {Object} AccionSugerida
 * @property {number} id
 * @property {string} titulo
 * @property {'Alta'|'Media'|'Baja'} prioridad
 * @property {string} justificacion - Evidencia que motiva la recomendación.
 */

export {}
