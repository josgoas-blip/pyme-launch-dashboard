/**
 * Reevaluación: abrir el cuestionario con las respuestas del último
 * diagnóstico para que el emprendedor cambie solo lo que ha evolucionado.
 *
 * El cuestionario maneja dos estados por pregunta:
 *   - `valores`: la puntuación (lo que consumen el score y Supabase).
 *   - `seleccion`: el ÍNDICE de la opción elegida en las preguntas
 *     cualitativas. No se puede deducir siempre de la puntuación: en p1 las
 *     cinco opciones valen 4.
 *
 * Aquí se reconstruyen ambos a partir de un diagnóstico guardado y se
 * recuerda qué había antes, para que la vista pueda señalar la respuesta
 * anterior y contar cuántas han cambiado. Módulo puro: sin red ni React.
 */
import {
  CAMPOS_CANTIDAD,
  VALORES_POR_DEFECTO,
  VARIABLES_DIAGNOSTICO,
  normalizarVariables,
} from './scoreDiagnostico.js'
import {
  INDICE_OPCION_POR_DEFECTO,
  PREGUNTAS_TFM,
  VALORES_INICIALES_TFM,
} from '../data/preguntasDiagnostico.js'

/**
 * Índice de la opción que el usuario eligió en una pregunta cualitativa.
 *
 * Primero por la etiqueta guardada en `respuestas.etiquetas`, que identifica
 * la opción sin ambigüedad. Si no la hay (diagnósticos antiguos), por la
 * puntuación, pero solo cuando una única opción tiene ese valor. Si la
 * puntuación la comparten varias (p1), no se adivina: se devuelve `null`.
 *
 * @param {{ id: string, opciones: Array<{ valor: number, etiqueta: string }> }} pregunta
 * @param {Record<string, unknown>} respuestas
 * @returns {number|null}
 */
export function indiceElegido(pregunta, respuestas) {
  const etiqueta = respuestas?.etiquetas?.[pregunta.id]
  if (typeof etiqueta === 'string') {
    const porEtiqueta = pregunta.opciones.findIndex((opcion) => opcion.etiqueta === etiqueta)
    if (porEtiqueta >= 0) return porEtiqueta
  }

  const valor = Number(respuestas?.[pregunta.id])
  if (!Number.isFinite(valor)) return null

  const coincidencias = pregunta.opciones
    .map((opcion, indice) => (opcion.valor === valor ? indice : -1))
    .filter((indice) => indice >= 0)

  return coincidencias.length === 1 ? coincidencias[0] : null
}

/** ¿Contiene el objeto alguna respuesta del cuestionario? */
function tieneRespuestas(respuestas) {
  return Boolean(respuestas) && VARIABLES_DIAGNOSTICO.some((id) => respuestas[id] !== undefined && respuestas[id] !== null)
}

/**
 * Estado inicial del cuestionario.
 *
 * Sin respuestas previas devuelve el arranque habitual (valores por
 * defecto y la opción central preseleccionada) y `anteriores: null`.
 *
 * Con respuestas previas precarga cada pregunta con lo que el usuario
 * contestó. Si en p1 no se puede saber qué opción eligió, se deja la
 * central: puntúa igual (4), así que el score no cambia, y la vista no la
 * señalará como "respuesta anterior" porque no lo es con certeza.
 *
 * @param {Record<string, unknown>|null} respuestasPrevias
 * @returns {{
 *   valores: Record<string, unknown>,
 *   seleccion: Record<string, number>,
 *   anteriores: {
 *     valores: Record<string, unknown>,
 *     seleccion: Record<string, number|null>,
 *     score: number|null,
 *     fase: string|null,
 *     completadoEn: string|null,
 *   } | null,
 * }}
 */
export function prepararCuestionario(respuestasPrevias) {
  const base = {
    valores: { ...VALORES_POR_DEFECTO, ...VALORES_INICIALES_TFM },
    seleccion: Object.fromEntries(PREGUNTAS_TFM.map((p) => [p.id, INDICE_OPCION_POR_DEFECTO])),
    anteriores: null,
  }

  if (!tieneRespuestas(respuestasPrevias)) return base

  const variables = normalizarVariables(respuestasPrevias)
  const seleccionAnterior = Object.fromEntries(
    PREGUNTAS_TFM.map((pregunta) => [pregunta.id, indiceElegido(pregunta, respuestasPrevias)]),
  )

  const score = Number(respuestasPrevias.score_total)

  return {
    valores: { ...base.valores, ...variables },
    seleccion: Object.fromEntries(
      PREGUNTAS_TFM.map((p) => [p.id, seleccionAnterior[p.id] ?? INDICE_OPCION_POR_DEFECTO]),
    ),
    anteriores: {
      valores: variables,
      seleccion: seleccionAnterior,
      score: Number.isFinite(score) ? score : null,
      fase: typeof respuestasPrevias.fase_embudo === 'string' ? respuestasPrevias.fase_embudo : null,
      completadoEn: respuestasPrevias.meta?.completadoEn ?? null,
    },
  }
}

/**
 * ¿Ha cambiado la respuesta a esta pregunta respecto a la anterior?
 *
 * En las cualitativas se compara la opción elegida cuando se conoce la
 * anterior (en p1 cambiar de tipo de negocio es un cambio aunque puntúe
 * igual); si no se conoce, la puntuación. En las cantidades se compara el
 * número, de modo que "5000" y 5000 no cuentan como cambio.
 *
 * @param {string} id
 * @param {ReturnType<typeof prepararCuestionario>['anteriores']} anteriores
 * @param {Record<string, unknown>} valores
 * @param {Record<string, number>} seleccion
 * @returns {boolean}
 */
export function respuestaCambiada(id, anteriores, valores, seleccion) {
  if (!anteriores) return false

  if (id in anteriores.seleccion) {
    const indiceAnterior = anteriores.seleccion[id]
    if (indiceAnterior !== null) return seleccion[id] !== indiceAnterior
  }

  if (CAMPOS_CANTIDAD.includes(id)) {
    return Number(valores[id]) !== Number(anteriores.valores[id])
  }

  return valores[id] !== anteriores.valores[id]
}

/**
 * Preguntas cuya respuesta ha cambiado, en el orden del cuestionario.
 *
 * @param {ReturnType<typeof prepararCuestionario>['anteriores']} anteriores
 * @param {Record<string, unknown>} valores
 * @param {Record<string, number>} seleccion
 * @returns {string[]}
 */
export function respuestasCambiadas(anteriores, valores, seleccion) {
  if (!anteriores) return []
  return VARIABLES_DIAGNOSTICO.filter((id) => respuestaCambiada(id, anteriores, valores, seleccion))
}
