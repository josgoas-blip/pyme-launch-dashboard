/**
 * Adaptador del diagnóstico → datos del Dashboard.
 *
 * Queda reducido a la pestaña "Análisis": es la única cuyos cuadrantes
 * siguen apoyándose en datos de referencia (PESTEL, Porter, métricas de
 * mercado, sensibilidad y benchmark sectorial), porque el cuestionario de
 * 20 variables no recoge nada de eso. Sobre ese respaldo se sobreescriben
 * las dos cifras que el diagnóstico sí sustenta.
 *
 * Las demás pestañas ya no pasan por aquí ni tienen mock: se derivan
 * íntegramente de las respuestas en módulos puros.
 *   - Inicio     → `resumenDiagnostico.js`
 *   - Estrategia → `estrategiaDiagnostico.js` y `planAccionDiagnostico.js`
 *   - Viabilidad → `viabilidadDiagnostico.js`
 */
import {
  indiceMadurez,
  indiceSolidezEvidencia,
  riesgoDafo,
  metricasMercado,
  ejesPestel,
  fuerzasPorter,
  evolucionScoring,
  analisisSensibilidad,
  benchmarkSectorial,
} from '../data/analisisMock.js'
import {
  iniciativasCame,
  mitigacionRiesgos,
  canalesCaptacion,
  funnelConversion,
  escaleraOfertas,
} from '../data/estrategiaMock.js'

/** Mocks agrupados por pestaña. Es el respaldo por defecto del adaptador. */
export const MOCKS_BASE = {
  analisis: {
    indiceMadurez,
    indiceSolidezEvidencia,
    riesgoDafo,
    metricasMercado,
    ejesPestel,
    fuerzasPorter,
    evolucionScoring,
    analisisSensibilidad,
    benchmarkSectorial,
  },
  estrategia: {
    iniciativasCame,
    mitigacionRiesgos,
    canalesCaptacion,
    funnelConversion,
    escaleraOfertas,
  },
}

/** Lee una variable del diagnóstico solo si es un número utilizable. */
function numeroDe(respuestas, clave) {
  const valor = respuestas?.[clave]
  return Number.isFinite(valor) ? valor : undefined
}

/**
 * Análisis: el Doble Indicador pasa a reflejar el diagnóstico real —
 * madurez global (score) y solidez de la evidencia (dimensión de
 * validación de mercado, que es justo lo que mide el contraste con
 * clientes).
 */
function adaptarAnalisis(respuestas, base) {
  const score = numeroDe(respuestas, 'score_total')
  const validacion = respuestas?.dimensiones?.validacion_mercado

  if (score === undefined && validacion === undefined) return base

  return {
    ...base,
    indiceMadurez: score ?? base.indiceMadurez,
    indiceSolidezEvidencia: Number.isFinite(validacion) ? validacion : base.indiceSolidezEvidencia,
  }
}

/**
 * Función principal: construye los datos de las pestañas que aún usan
 * respaldo de referencia, a partir del diagnóstico.
 *
 * @param {Record<string, unknown> | null} respuestas - Salida del OnboardingWizard.
 * @param {typeof MOCKS_BASE} [mocksBase] - Respaldo inyectable (útil para pruebas).
 * @returns {typeof MOCKS_BASE} Datos listos para los cuadrantes.
 */
export function adaptarDiagnostico(respuestas, mocksBase = MOCKS_BASE) {
  if (!respuestas) return mocksBase

  return {
    analisis: adaptarAnalisis(respuestas, mocksBase.analisis),
    estrategia: mocksBase.estrategia,
  }
}
