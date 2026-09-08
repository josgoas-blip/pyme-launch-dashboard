/**
 * Taxonomía de Evidencia — mapeo de color por procedencia del dato.
 * Compartido entre "Calidad de la Evidencia" (Inicio) y los badges de
 * `tipo_evidencia` en las tarjetas de métricas (Análisis).
 *
 * @type {Record<import('../types/dashboard.js').TipoEvidencia, { color: string, badge: string }>}
 */
export const COLOR_POR_EVIDENCIA = {
  'Dato documentado': { color: '#1B4D3E', badge: 'bg-primary/10 text-primary' },
  'Dato declarado': { color: '#10B981', badge: 'bg-accent-green/10 text-accent-green' },
  'Fuente externa': { color: '#2563EB', badge: 'bg-blue-500/10 text-blue-600' },
  Estimación: { color: '#6B7280', badge: 'bg-muted/10 text-muted' },
  Hipótesis: { color: '#DD6B20', badge: 'bg-accent-amber/10 text-accent-amber' },
  Escenario: { color: '#7C3AED', badge: 'bg-violet-500/10 text-violet-600' },
}

/** Fallback seguro si algún dato trae un `tipo_evidencia` no contemplado. */
export function colorEvidencia(tipoEvidencia) {
  return COLOR_POR_EVIDENCIA[tipoEvidencia] ?? COLOR_POR_EVIDENCIA.Estimación
}
