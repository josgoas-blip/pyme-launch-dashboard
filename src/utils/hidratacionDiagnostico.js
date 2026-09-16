/**
 * Hidratación del diagnóstico desde una fila de `diagnosticos`.
 *
 * El panel consume un único objeto `respuestas`, con la misma forma que
 * entrega el cuestionario al terminar: las 20 variables, `score_total`,
 * `fase_embudo`, `dimensiones`, `penalizaciones`, `etiquetas` y `meta`.
 * Todas las pestañas derivan de él.
 *
 * Una fila de Supabase no siempre trae ese objeto completo:
 *   - El JSON `respuestas` puede llegar como objeto o como cadena.
 *   - Hay filas cuyo JSON no incluye `dimensiones`, `penalizaciones` ni
 *     `score_total` (comprobado en la base de datos real). Sin ellos, la
 *     pestaña de Inicio y la de Análisis quedarían vacías aunque el
 *     usuario tenga su diagnóstico guardado.
 *   - Las variables viven además en sus propias columnas (p1…p20), que
 *     sirven de respaldo si faltan en el JSON.
 *
 * Aquí se reconstruye el objeto completo a partir de todo lo disponible,
 * para que un diagnóstico recuperado de Supabase y uno recién respondido
 * sean indistinguibles para las vistas. Es puro: no toca red ni
 * almacenamiento.
 */
import {
  VARIABLES_DIAGNOSTICO,
  PREGUNTAS_LIKERT,
  UMBRALES_FASE_EMBUDO,
  calcularDiagnostico,
  normalizarVariables,
} from './scoreDiagnostico.js'
import { parsearRespuestas } from './citaDiagnostico.js'

/** Fases válidas del modelo, para no confundirlas con estados de n8n. */
const FASES_VALIDAS = new Set(UMBRALES_FASE_EMBUDO.map((u) => u.fase))

/** Columnas de `diagnosticos` que necesita la hidratación. */
export const COLUMNAS_HIDRATACION = ['id', 'completado_en', 'respuestas', 'score_total', 'fase_embudo', ...VARIABLES_DIAGNOSTICO].join(', ')

/**
 * Metadatos del expediente del que salen los datos del panel.
 * @typedef {Object} Expediente
 * @property {string|null} id - Fila de `diagnosticos`, o `null` si no se ha guardado.
 * @property {string|null} completadoEn - Fecha ISO de la evaluación.
 * @property {'supabase'|'local'|'cuestionario'} origen
 */

/** ¿Hay un valor utilizable (no vacío) para esta variable? */
function tieneValor(valor) {
  return valor !== undefined && valor !== null && valor !== ''
}

/**
 * Reconstruye el diagnóstico completo de una fila.
 *
 * Prioridades:
 *   - Variables: el JSON manda; las columnas cubren lo que falte.
 *   - Score y fase: lo guardado (JSON y después columnas); solo si no
 *     consta se recalcula, para no cambiarle al usuario una cifra que ya vio.
 *   - Dimensiones y penalizaciones: las guardadas, o recalculadas.
 *
 * @param {Record<string, unknown>|null} fila
 * @returns {{ respuestas: Record<string, unknown>, expediente: Expediente }|null}
 *   `null` si la fila no contiene respuestas del cuestionario (no es un diagnóstico).
 */
export function hidratarExpediente(fila) {
  if (!fila || typeof fila !== 'object') return null

  const json = parsearRespuestas(fila.respuestas) ?? {}

  const combinadas = {}
  for (const id of VARIABLES_DIAGNOSTICO) {
    const valor = tieneValor(json[id]) ? json[id] : fila[id]
    if (tieneValor(valor)) combinadas[id] = valor
  }

  // Sin ninguna respuesta de escala 1-5 la fila no es un diagnóstico, y
  // hidratarla fabricaría uno con los valores por defecto del cuestionario.
  // No basta con mirar "alguna variable": las filas que crea n8n al agendar
  // una sesión traen en `p17` y `p20` los valores por defecto de la tabla
  // ("SÍ", "NO") sin que nadie haya respondido nada.
  if (!PREGUNTAS_LIKERT.some((id) => tieneValor(combinadas[id]))) return null

  const variables = normalizarVariables(combinadas)
  const calculado = calcularDiagnostico(variables)

  // Se descartan los vacíos antes de convertir: `Number(null)` es 0, y un
  // score sin guardar se habría pintado como un 0 en lugar de recalcularse.
  const scoreGuardado = [json.score_total, fila.score_total].filter(tieneValor).map(Number).find(Number.isFinite)
  const faseGuardada = [json.fase_embudo, fila.fase_embudo].find((f) => FASES_VALIDAS.has(f))

  const dimensionesValidas =
    json.dimensiones && typeof json.dimensiones === 'object' && !Array.isArray(json.dimensiones)
      ? json.dimensiones
      : null

  const completadoEn = json.meta?.completadoEn ?? fila.completado_en ?? null

  return {
    respuestas: {
      ...json,
      ...variables,
      score_total: scoreGuardado ?? calculado.score_total,
      fase_embudo: faseGuardada ?? calculado.fase_embudo,
      dimensiones: dimensionesValidas ?? calculado.dimensiones,
      penalizaciones: Array.isArray(json.penalizaciones) ? json.penalizaciones : calculado.penalizaciones,
      meta: { ...(json.meta ?? {}), completadoEn },
    },
    expediente: {
      id: fila.id ?? null,
      completadoEn: fila.completado_en ?? completadoEn,
      origen: 'supabase',
    },
  }
}

/** Marca temporal en milisegundos, o `null` si la fecha no es válida. */
function milisegundos(fecha) {
  const ms = fecha ? new Date(fecha).getTime() : NaN
  return Number.isFinite(ms) ? ms : null
}

/**
 * ¿Debe el diagnóstico de Supabase sustituir a la copia del navegador?
 *
 * La copia local se pinta al instante tras una recarga; después se
 * contrasta con Supabase. Se sustituye cuando:
 *   - Es el mismo expediente: Supabase es la fuente de verdad y además
 *     completa lo que la copia local pudiera no tener.
 *   - El de Supabase es más reciente: el usuario hizo otra evaluación en
 *     otro dispositivo.
 *   - La copia local no tiene fecha con la que compararse.
 *
 * No se sustituye si la copia local es más reciente: es el caso de un
 * cuestionario recién terminado cuya escritura en Supabase aún no ha
 * llegado o ha fallado, y pisarlo le devolvería al usuario su evaluación
 * anterior.
 *
 * @param {{ respuestas: Record<string, unknown>|null, expedienteId: string|null }} local
 * @param {{ expediente: Expediente }} remoto
 * @returns {boolean}
 */
export function debeSustituirLocal(local, remoto) {
  if (!local?.respuestas) return true
  if (local.expedienteId && local.expedienteId === remoto.expediente.id) return true

  const fechaLocal = milisegundos(local.respuestas.meta?.completadoEn)
  const fechaRemota = milisegundos(remoto.expediente.completadoEn)

  if (fechaLocal === null) return true
  if (fechaRemota === null) return false
  return fechaRemota > fechaLocal
}
