/**
 * Datos simulados (mock) de la pestaña "Estrategia" — Pyme Launch Dashboard.
 * Tipado según src/types/estrategia.js.
 */

/**
 * 1. Iniciativas de la Matriz CAME (Impacto vs Esfuerzo, escala 0-10).
 * @type {import('../types/estrategia.js').IniciativaCame[]}
 */
export const iniciativasCame = [
  { id: 'i1', nombre: 'Automatizar onboarding de clientes', nombreCorto: 'Onboarding IA', impacto: 8, esfuerzo: 3 },
  { id: 'i2', nombre: 'Campaña de referidos', nombreCorto: 'Referidos', impacto: 7, esfuerzo: 2 },
  { id: 'i3', nombre: 'Expansión a nuevo mercado regional', nombreCorto: 'Expansión Regional', impacto: 9, esfuerzo: 8 },
  { id: 'i4', nombre: 'Certificación de calidad ISO', nombreCorto: 'Certificación ISO', impacto: 6, esfuerzo: 7 },
  { id: 'i5', nombre: 'Rediseño de la web corporativa', nombreCorto: 'Web Corporativa', impacto: 4, esfuerzo: 3 },
  { id: 'i6', nombre: 'Presencia en ferias del sector', nombreCorto: 'Ferias del Sector', impacto: 3, esfuerzo: 2 },
  { id: 'i7', nombre: 'Nueva línea de producto secundaria', nombreCorto: 'Nueva Línea', impacto: 3, esfuerzo: 8 },
  { id: 'i8', nombre: 'Migración a nuevo ERP', nombreCorto: 'Migración ERP', impacto: 2, esfuerzo: 9 },
]

/**
 * 2. Estado de Mitigación de Riesgos.
 * @type {import('../types/estrategia.js').MitigacionRiesgos}
 */
export const mitigacionRiesgos = {
  riesgosTotales: 12,
  riesgosMitigados: 8,
}

/**
 * 3. Matriz de Canales de Captación: Inversión, CAC, LTV/CAC y ROAS objetivo.
 * @type {import('../types/estrategia.js').CanalCaptacion[]}
 */
export const canalesCaptacion = [
  { id: 'meta-ads', canal: 'Meta Ads', inversionEstimada: 800, cacCanal: 68, ltvCacRatio: 2.7, roasObjetivo: 3.0 },
  { id: 'google-search', canal: 'Google Search', inversionEstimada: 600, cacCanal: 55, ltvCacRatio: 3.3, roasObjetivo: 3.5 },
  { id: 'seo-local', canal: 'SEO Local', inversionEstimada: 300, cacCanal: 32, ltvCacRatio: 5.8, roasObjetivo: 4.5 },
  { id: 'email', canal: 'Email', inversionEstimada: 100, cacCanal: 12, ltvCacRatio: 15.3, roasObjetivo: 6.0 },
]

/**
 * 4. Funnel de Conversión Digital: volumen de prospectos por etapa.
 * @type {import('../types/estrategia.js').EtapaFunnel[]}
 */
export const funnelConversion = [
  { id: 'atraccion', fase: 'Atracción', etiqueta: 'Visitas y Leads (Top)', volumen: 5200 },
  { id: 'nutricion', fase: 'Nutrición', etiqueta: 'Leads Cualificados (Mid)', volumen: 780 },
  { id: 'conversion', fase: 'Conversión', etiqueta: 'Clientes Cerrados (Bottom)', volumen: 94 },
]

/**
 * 5. Escalera de Ofertas / Pricing.
 * @type {import('../types/estrategia.js').EscalonOferta[]}
 */
export const escaleraOfertas = [
  {
    id: 'tripwire',
    tipo: 'Tripwire',
    nombre: 'Auditoría Exprés',
    precio: 49,
    periodicidad: 'Pago único',
    margenContribucion: 78,
    descripcion: 'Diagnóstico inicial de bajo ticket para captar y cualificar leads.',
  },
  {
    id: 'core-offer',
    tipo: 'Core Offer',
    nombre: 'Programa de Mentoría Pyme Launch',
    precio: 490,
    periodicidad: '/mes',
    margenContribucion: 62,
    descripcion: 'Oferta principal: acompañamiento mensual con seguimiento del Dashboard.',
  },
  {
    id: 'high-ticket',
    tipo: 'High Ticket',
    nombre: 'Acompañamiento Estratégico Anual',
    precio: 3600,
    periodicidad: '/año',
    margenContribucion: 55,
    descripcion: 'Recurrencia de alto valor con sesiones estratégicas y soporte prioritario.',
  },
]

export default {
  iniciativasCame,
  mitigacionRiesgos,
  canalesCaptacion,
  funnelConversion,
  escaleraOfertas,
}
