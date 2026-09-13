/**
 * Adaptador del diagnóstico → datos del Dashboard.
 *
 * Traduce el resultado del modelo de evaluación del TFM (20 variables,
 * `score_total` y `fase_embudo`) a la forma exacta que ya consumen los
 * cuadrantes. Todo lo que el cuestionario no cubre se toma de los mocks
 * base, que actúan como respaldo: si `respuestas` es `null` o una variable
 * falta, el Dashboard sigue mostrando el mock íntegro, nunca huecos.
 *
 * Regla de honestidad del PMV: solo se derivan las cifras que el
 * diagnóstico sustenta de verdad. La pestaña de Viabilidad ya no pasa por
 * aquí ni tiene mock: sus cifras se derivan del bloque financiero real en
 * `viabilidadDiagnostico.js`, y lo que el cuestionario no sostiene (punto
 * muerto, VAN, TIR) se declara pendiente en vez de simularse.
 */
import { controlProyecto, calidadEvidencia, recorridoProyecto } from '../data/dashboardMock.js'
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
import { dimensionMasDebil } from './scoreDiagnostico.js'

/** Mocks agrupados por pestaña. Es el respaldo por defecto del adaptador. */
export const MOCKS_BASE = {
  inicio: { controlProyecto, calidadEvidencia, recorridoProyecto },
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

/**
 * Fase del embudo → etiqueta del cuadrante y paso "En curso" del recorrido.
 * `pasoEnCurso` es el índice dentro de `recorridoProyecto`: los anteriores
 * quedan Completados y los posteriores Bloqueados.
 */
const FASE_EMBUDO = {
  Idea: { etiqueta: 'Definición de la idea', pasoEnCurso: 0 },
  Validación: { etiqueta: 'Validación del problema', pasoEnCurso: 2 },
  Tracción: { etiqueta: 'Tracción inicial', pasoEnCurso: 3 },
  Consolidación: { etiqueta: 'Consolidación y escalado', pasoEnCurso: 4 },
}

/**
 * Dimensión más floja del diagnóstico → próxima acción recomendada.
 * La palanca de mejora es aquello que más lastra el score, no una lista
 * genérica de buenas prácticas.
 */
const PROXIMA_ACCION_POR_DIMENSION = {
  validacion_mercado: 'Registrar 5 entrevistas con clientes',
  modelo_competencia: 'Justificar tu precio con costes y mercado',
  operaciones_equipo: 'Definir tus necesidades operativas',
  solvencia_financiera: 'Preparar el plan de tesorería a 6 meses',
}

/** Lee una variable del diagnóstico solo si es un número utilizable. */
function numeroDe(respuestas, clave) {
  const valor = respuestas?.[clave]
  return Number.isFinite(valor) ? valor : undefined
}

/**
 * Inicio: fase y progreso del recorrido a partir de `fase_embudo` y
 * `score_total`; próxima acción a partir de la dimensión más débil.
 */
function adaptarInicio(respuestas, base) {
  const fase = FASE_EMBUDO[respuestas?.fase_embudo]
  const score = numeroDe(respuestas, 'score_total')
  const debil = dimensionMasDebil(respuestas?.dimensiones)
  const proximaAccion = debil ? PROXIMA_ACCION_POR_DIMENSION[debil.id] : undefined

  return {
    ...base,
    controlProyecto: {
      // El score del modelo ES el avance del recorrido: una sola cifra,
      // sin un segundo indicador de progreso que pueda contradecirla.
      progreso_recorrido: score ?? base.controlProyecto.progreso_recorrido,
      fase_actual: fase?.etiqueta ?? base.controlProyecto.fase_actual,
      proxima_accion: proximaAccion ?? base.controlProyecto.proxima_accion,
    },
    recorridoProyecto: fase
      ? base.recorridoProyecto.map((paso, indice) => ({
          ...paso,
          estado:
            indice < fase.pasoEnCurso
              ? 'Completado'
              : indice === fase.pasoEnCurso
                ? 'En curso'
                : 'Bloqueado',
        }))
      : base.recorridoProyecto,
  }
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
 * Función principal: construye los datos de las 4 pestañas de contenido a
 * partir del diagnóstico, usando los mocks como respaldo.
 *
 * Estrategia no se adapta aquí: sus cuadrantes conectados al diagnóstico se
 * derivan en `estrategiaDiagnostico.js` (Adquisición y Monetización) y en
 * `planAccionDiagnostico.js` (Plan de Acción), y el resto sigue mostrando
 * datos de referencia del mock.
 *
 * Viabilidad tampoco pasa por aquí: se deriva íntegramente del bloque
 * financiero del cuestionario en `viabilidadDiagnostico.js`, sin mock de
 * respaldo, porque una cifra financiera simulada induciría a error.
 *
 * @param {Record<string, unknown> | null} respuestas - Salida del OnboardingWizard.
 * @param {typeof MOCKS_BASE} [mocksBase] - Respaldo inyectable (útil para pruebas).
 * @returns {typeof MOCKS_BASE} Datos listos para los cuadrantes.
 */
export function adaptarDiagnostico(respuestas, mocksBase = MOCKS_BASE) {
  if (!respuestas) return mocksBase

  return {
    inicio: adaptarInicio(respuestas, mocksBase.inicio),
    analisis: adaptarAnalisis(respuestas, mocksBase.analisis),
    estrategia: mocksBase.estrategia,
  }
}
