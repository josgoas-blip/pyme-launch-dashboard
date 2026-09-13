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
 * @property {boolean} [esPrincipal] - Canal principal declarado en el diagnóstico de onboarding.
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
 * Una acción del Plan de Acción (PMV Fase Semilla): recomendación de
 * prevalidación, no instrucción ni tarea operativa. Ya no vive en el mock:
 * la deriva `src/utils/planAccionDiagnostico.js` a partir de las respuestas
 * del diagnóstico.
 * @typedef {Object} AccionSugerida
 * @property {string} id
 * @property {string} titulo
 * @property {'Alta'|'Media'|'Baja'} prioridad
 * @property {string} justificacion - Respuesta o cifra declarada que la motiva.
 * @property {string} origen - Pestaña donde se ve esa evidencia.
 */

/**
 * Un tramo temporal del Plan de Acción.
 * @typedef {Object} HorizontePlan
 * @property {string} id - 'inmediato' | 'corto' | 'consolidacion'.
 * @property {string} etiqueta - p.ej. "Primeros 30 días".
 * @property {string} rango - p.ej. "0-30 días".
 * @property {string} foco - Objetivo del tramo según la fase del embudo.
 * @property {AccionSugerida[]} acciones
 */

export {}
