/**
 * Derivación del Resumen General (pestaña "Inicio") a partir del
 * diagnóstico real.
 *
 * Es la vista donde aterriza el usuario al salir del cuestionario, así que
 * sus cifras tienen que coincidir exactamente con la pantalla final del
 * onboarding: el mismo `score_total`, la misma `fase_embudo` y las mismas
 * cuatro dimensiones que pinta `ResumenScore`. Para garantizarlo se recorre
 * el catálogo `DIMENSIONES` del modelo del TFM —no las claves del
 * resultado—, igual que hace el wizard.
 *
 * Deriva cuatro bloques:
 *   - Resumen global: score, fase, dimensiones, dimensión más débil,
 *     alertas (`penalizaciones`) y próxima acción.
 *   - Calidad de la evidencia: las cuatro preguntas del modelo que miden
 *     qué ha contrastado el usuario (p4-p7), con la procedencia que implica
 *     cada nivel declarado.
 *   - Recorrido: los cinco pasos de la Fase Semilla, con el estado que
 *     corresponde a la fase calculada.
 *
 * Regla de honestidad del PMV (la misma de estrategiaDiagnostico.js,
 * viabilidadDiagnostico.js y planAccionDiagnostico.js): ninguna cifra sale
 * de un mock. Sin diagnóstico se devuelve `null` o una lista vacía para que
 * la vista muestre un placeholder.
 */
import { calcularDiagnostico, dimensionMasDebil, DIMENSIONES } from './scoreDiagnostico.js'

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

/**
 * Los cinco pasos del recorrido de la Fase Semilla y el paso "En curso" que
 * corresponde a cada fase del embudo. Es la estructura del modelo, no datos
 * de ejemplo: lo único que varía con el diagnóstico es el estado.
 */
const PASOS_RECORRIDO = [
  { id: 'idea', paso: 'Idea' },
  { id: 'propuesta', paso: 'Propuesta' },
  { id: 'validacion', paso: 'Validación' },
  { id: 'modelo', paso: 'Modelo' },
  { id: 'mercado', paso: 'Mercado' },
]

/** Índice del paso "En curso" dentro de `PASOS_RECORRIDO` por fase. */
const PASO_EN_CURSO_POR_FASE = {
  Idea: 0,
  Validación: 2,
  Tracción: 3,
  Consolidación: 4,
}

/**
 * Las cuatro preguntas del modelo que miden qué ha contrastado el usuario.
 * Son las que sostienen el cuadrante "Calidad de la Evidencia": el resto
 * del cuestionario mide madurez, no procedencia del dato.
 */
const PREGUNTAS_EVIDENCIA = [
  { id: 'contacto-cliente', pregunta: 'p4_hablado_clientes', etiqueta: 'Contacto directo con clientes' },
  { id: 'evidencia-estructurada', pregunta: 'p5_encuestas_entrevistas', etiqueta: 'Evidencia estructurada' },
  { id: 'intencion-compra', pregunta: 'p6_intencion_compra', etiqueta: 'Señales de intención de compra' },
  { id: 'aprendizaje', pregunta: 'p7_aprendizaje_cambios', etiqueta: 'Aprendizaje incorporado' },
]

/**
 * Procedencia que implica cada nivel declarado (Taxonomía de Evidencia).
 * Con 1-2 el usuario aún no lo ha verificado; con 3 lo ha declarado; con
 * 4-5 tiene registro de ello.
 */
const EVIDENCIA_POR_NIVEL = {
  1: 'Hipótesis',
  2: 'Hipótesis',
  3: 'Dato declarado',
  4: 'Dato documentado',
  5: 'Dato documentado',
}

/**
 * Puntuación por debajo de la cual una dimensión se considera palanca de
 * mejora. Es el corte superior del semáforo del panel (33/66): por encima
 * de 66 la dimensión es sólida y señalarla como lastre sería ruido.
 */
const UMBRAL_PALANCA = 66

/** Lee un nivel Likert 1-5 del diagnóstico. */
function nivelDe(respuestas, clave) {
  const n = Number(respuestas?.[clave])
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined
}

/** Todas las preguntas del modelo, para detectar si hay respuestas reales. */
const PREGUNTAS_MODELO = DIMENSIONES.flatMap((dimension) => dimension.preguntas)

/**
 * ¿El objeto de respuestas contiene un diagnóstico real?
 *
 * Un objeto vacío no vale: `calcularDiagnostico` lo completaría con los
 * valores por defecto y el panel mostraría un score que el usuario nunca
 * ha respondido. Basta con una pregunta contestada o con el resultado ya
 * calculado por el wizard.
 */
function hayDiagnostico(respuestas) {
  if (!respuestas) return false
  if (Number.isFinite(Number(respuestas.score_total))) return true
  return PREGUNTAS_MODELO.some((pregunta) => nivelDe(respuestas, pregunta) !== undefined)
}

/**
 * Score, fase, dimensiones y penalizaciones. Usa lo que trae el payload del
 * cuestionario y recalcula lo que falte, para que el panel nunca muestre un
 * score distinto del que vio el usuario al terminar el diagnóstico.
 */
function resultadoDiagnostico(respuestas) {
  const completo =
    Number.isFinite(Number(respuestas?.score_total)) &&
    typeof respuestas?.fase_embudo === 'string' &&
    respuestas?.dimensiones &&
    Array.isArray(respuestas?.penalizaciones)

  if (completo) {
    return {
      score: Math.round(Number(respuestas.score_total)),
      fase: respuestas.fase_embudo,
      dimensiones: respuestas.dimensiones,
      penalizaciones: respuestas.penalizaciones,
    }
  }

  const calculado = calcularDiagnostico(respuestas)
  return {
    score: calculado.score_total,
    fase: calculado.fase_embudo,
    dimensiones: calculado.dimensiones,
    penalizaciones: calculado.penalizaciones ?? [],
  }
}

/**
 * Resumen global del proyecto: las cifras de cabecera del panel.
 *
 * @param {Record<string, unknown> | null} respuestas - Salida del OnboardingWizard.
 * @returns {{
 *   score: number,
 *   fase: string,
 *   dimensiones: { id: string, etiqueta: string, peso: number, puntuacion: number }[],
 *   dimensionDebil: { id: string, etiqueta: string, puntuacion: number } | null,
 *   alertas: string[],
 *   proximaAccion: string | undefined,
 * } | null} `null` si no hay diagnóstico.
 */
export function derivarResumenGlobal(respuestas) {
  if (!hayDiagnostico(respuestas)) return null

  const { score, fase, dimensiones, penalizaciones } = resultadoDiagnostico(respuestas)

  // Se recorre el catálogo del modelo, no las claves del resultado: las 4
  // dimensiones existen aunque el diagnóstico llegara incompleto.
  const desglose = DIMENSIONES.map((dimension) => {
    const bruto = Number(dimensiones?.[dimension.id])
    return {
      id: dimension.id,
      etiqueta: dimension.etiqueta,
      peso: dimension.peso,
      puntuacion: Number.isFinite(bruto) ? Math.round(bruto) : 0,
    }
  })

  // La dimensión más baja solo es "palanca" si de verdad hay recorrido de
  // mejora: con las cuatro por encima de 66 no se señala ningún lastre ni
  // se recomienda una acción correctora que no toca.
  const masBaja = dimensionMasDebil(dimensiones)
  const debil = masBaja && masBaja.puntuacion < UMBRAL_PALANCA ? masBaja : null

  return {
    score,
    fase,
    dimensiones: desglose,
    dimensionDebil: debil,
    alertas: penalizaciones,
    proximaAccion: debil ? PROXIMA_ACCION_POR_DIMENSION[debil.id] : undefined,
  }
}

/**
 * Calidad de la evidencia: una barra por cada pregunta del modelo que mide
 * qué ha contrastado el usuario, con el nivel declarado normalizado a 0-100
 * y la procedencia que ese nivel implica.
 *
 * No es un reparto porcentual del total de datos del proyecto (eso el
 * cuestionario no lo recoge): cada barra dice, por separado, cómo de sólida
 * es esa fuente de evidencia.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{ id: string, etiqueta: string, nivel: number, porcentaje: number,
 *   tipo: string, detalle: string | undefined }[]} Vacío sin diagnóstico.
 */
export function derivarCalidadEvidencia(respuestas) {
  if (!hayDiagnostico(respuestas)) return []

  return PREGUNTAS_EVIDENCIA.map(({ id, pregunta, etiqueta }) => {
    const nivel = nivelDe(respuestas, pregunta)
    if (nivel === undefined) return null

    return {
      id,
      etiqueta,
      nivel,
      porcentaje: Math.round((nivel / 5) * 100),
      tipo: EVIDENCIA_POR_NIVEL[nivel],
      detalle: respuestas?.etiquetas?.[pregunta] ?? undefined,
    }
  }).filter(Boolean)
}

/**
 * Recorrido de la Fase Semilla con el estado de cada paso: los anteriores a
 * la fase calculada quedan Completados, el de la fase En curso y los
 * posteriores Bloqueados.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{ id: string, paso: string, estado: string }[]} Vacío sin diagnóstico.
 */
export function derivarRecorrido(respuestas) {
  if (!hayDiagnostico(respuestas)) return []

  const { fase } = resultadoDiagnostico(respuestas)
  const enCurso = PASO_EN_CURSO_POR_FASE[fase]
  if (enCurso === undefined) return []

  return PASOS_RECORRIDO.map((paso, indice) => ({
    ...paso,
    estado: indice < enCurso ? 'Completado' : indice === enCurso ? 'En curso' : 'Bloqueado',
  }))
}
