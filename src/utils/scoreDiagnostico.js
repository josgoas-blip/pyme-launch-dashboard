/**
 * Modelo de evaluación del TFM: 20 variables agrupadas en 4 dimensiones y
 * un `score_total` en escala 0-100.
 *
 * Se implementa como utilidad pura (sin React ni Supabase) para que la
 * misma función la usen el cuestionario —que muestra el resultado al
 * terminar— y el servicio de persistencia —que escribe `score_total` y
 * `fase_embudo` en sus columnas—. Así nunca pueden discrepar.
 *
 * Las 17 primeras variables son escala Likert 1-5. Las de la dimensión
 * financiera son heterogéneas (permiso legal, euros, meses, un booleano) y
 * se normalizan cada una a 0-1 antes de ponderarlas.
 */

/** Escala Likert usada en las preguntas p1-p16. */
export const ESCALA_MINIMA = 1
export const ESCALA_MAXIMA = 5

/** Etiquetas de la escala, de 1 a 5 (índice 0 = valor 1). */
export const ETIQUETAS_ESCALA = ['Nada', 'Poco', 'Algo', 'Bastante', 'Totalmente']

/**
 * Las 4 dimensiones del modelo y su peso sobre el score total.
 * Los pesos suman 1: la validación de mercado domina porque es lo que el
 * TFM considera determinante en fase semilla, y la solvencia pesa por
 * encima de operaciones porque puede bloquear el proyecto entero.
 */
export const DIMENSIONES = [
  {
    id: 'validacion_mercado',
    etiqueta: 'Validación y mercado',
    peso: 0.35,
    preguntas: [
      'p1_idea_negocio',
      'p2_problema_necesidad',
      'p3_cliente_principal',
      'p4_hablado_clientes',
      'p5_encuestas_entrevistas',
      'p6_intencion_compra',
      'p7_aprendizaje_cambios',
    ],
  },
  {
    id: 'modelo_competencia',
    etiqueta: 'Modelo comercial y competencia',
    peso: 0.25,
    preguntas: [
      'p8_identificado_competencia',
      'p9_propuesta_valor',
      'p10_modelo_ingresos',
      'p11_precio_logica',
      'p12_primeros_clientes',
    ],
  },
  {
    id: 'operaciones_equipo',
    etiqueta: 'Operaciones y equipo',
    peso: 0.15,
    preguntas: ['p13_necesidades_operativas', 'p14_mvp_prototipo', 'p15_experiencia_equipo'],
  },
  {
    id: 'solvencia_financiera',
    etiqueta: 'Solvencia financiera y legal',
    peso: 0.25,
    // Calculada aparte (variables heterogéneas): ver `puntuarSolvencia`.
    preguntas: [
      'p16_previsiones_financieras',
      'p17_autorizacion_espana',
      'p18_inversion_total',
      'p18_recursos_propios',
      'p19_meses_colchon',
      'p19_meses_breakeven',
      'p20_incidencias_financieras',
    ],
  },
]

/** Todas las preguntas Likert (p1-p16), en orden. */
export const PREGUNTAS_LIKERT = [
  ...DIMENSIONES[0].preguntas,
  ...DIMENSIONES[1].preguntas,
  ...DIMENSIONES[2].preguntas,
  'p16_previsiones_financieras',
]

/**
 * Las 22 columnas de variables de la tabla `diagnosticos` (las 20
 * preguntas del TFM, con p18 y p19 desdobladas en dos campos cada una).
 */
export const VARIABLES_DIAGNOSTICO = DIMENSIONES.flatMap((d) => d.preguntas)

/** Variables que se capturan como cantidad (euros o meses). */
export const CAMPOS_CANTIDAD = [
  'p18_inversion_total',
  'p18_recursos_propios',
  'p19_meses_colchon',
  'p19_meses_breakeven',
]

/** Opciones de la autorización para operar en España (p17). */
export const OPCIONES_AUTORIZACION = [
  { valor: 'si', etiqueta: 'Sí' },
  { valor: 'tramite', etiqueta: 'En trámite' },
  { valor: 'no', etiqueta: 'No' },
]

/** Puntuación 0-1 de cada situación legal. */
const PUNTOS_AUTORIZACION = { si: 1, tramite: 0.5, no: 0 }

/**
 * Valores iniciales del cuestionario. El punto medio de la escala evita
 * empujar al usuario hacia una respuesta optimista o pesimista, y los
 * campos numéricos arrancan con cifras plausibles de un proyecto semilla
 * para que nadie se quede bloqueado ante un formulario vacío.
 */
export const VALORES_POR_DEFECTO = {
  ...Object.fromEntries(PREGUNTAS_LIKERT.map((id) => [id, 3])),
  p17_autorizacion_espana: 'tramite',
  p18_inversion_total: 10000,
  p18_recursos_propios: 5000,
  p19_meses_colchon: 6,
  p19_meses_breakeven: 9,
  p20_incidencias_financieras: false,
}

/**
 * Umbrales del embudo de maduración sobre `score_total`.
 * Ajusta aquí los cortes si el TFM define otros: es el único sitio donde
 * se decide la fase.
 */
export const UMBRALES_FASE_EMBUDO = [
  { minimo: 80, fase: 'Consolidación' },
  { minimo: 60, fase: 'Tracción' },
  { minimo: 35, fase: 'Validación' },
  { minimo: 0, fase: 'Idea' },
]

const acotar = (n, minimo, maximo) => Math.min(maximo, Math.max(minimo, n))

/** Convierte un número dudoso (texto de un input, null, NaN) en número seguro. */
function numeroSeguro(valor, porDefecto = 0) {
  const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : valor
  return Number.isFinite(n) ? n : porDefecto
}

/** Normaliza una respuesta Likert (1-5) a 0-1. */
function normalizarLikert(valor) {
  const n = acotar(numeroSeguro(valor, ESCALA_MINIMA), ESCALA_MINIMA, ESCALA_MAXIMA)
  return (n - ESCALA_MINIMA) / (ESCALA_MAXIMA - ESCALA_MINIMA)
}

/** Media 0-1 de un grupo de preguntas Likert. */
function promedioLikert(valores, preguntas) {
  const suma = preguntas.reduce((total, id) => total + normalizarLikert(valores[id]), 0)
  return suma / preguntas.length
}

/**
 * Dimensión financiera y legal. Combina cuatro componentes heterogéneos y
 * aplica las dos penalizaciones que exige el modelo:
 *
 *  - Colchón insuficiente: si `meses_colchon < meses_breakeven`, el
 *    componente de autonomía cae en proporción a lo que falta.
 *  - Incidencias financieras declaradas: recorta un 25 % la dimensión
 *    completa, porque comprometen el acceso a financiación de todo el
 *    proyecto, no solo un aspecto.
 *
 * @param {Record<string, unknown>} valores
 * @returns {{ puntuacion: number, penalizaciones: string[] }} puntuación 0-1.
 */
function puntuarSolvencia(valores) {
  const penalizaciones = []

  // 1. Previsiones financieras elaboradas (Likert).
  const previsiones = normalizarLikert(valores.p16_previsiones_financieras)

  // 2. Situación legal para operar en España.
  const legal = PUNTOS_AUTORIZACION[valores.p17_autorizacion_espana] ?? 0
  if (valores.p17_autorizacion_espana === 'no') {
    penalizaciones.push('Sin autorización para operar en España')
  }

  // 3. Cobertura de la inversión con recursos propios.
  const inversion = Math.max(0, numeroSeguro(valores.p18_inversion_total))
  const propios = Math.max(0, numeroSeguro(valores.p18_recursos_propios))
  // Sin inversión declarada no hay brecha que cubrir: no penaliza ni premia.
  const cobertura = inversion > 0 ? acotar(propios / inversion, 0, 1) : 0.5

  // 4. Autonomía: meses de colchón frente a meses hasta el equilibrio.
  const colchon = Math.max(0, numeroSeguro(valores.p19_meses_colchon))
  const breakeven = Math.max(0, numeroSeguro(valores.p19_meses_breakeven))
  let autonomia
  if (breakeven <= 0) {
    autonomia = 1 // Ya se opera en equilibrio.
  } else if (colchon >= breakeven) {
    autonomia = 1
  } else {
    autonomia = acotar(colchon / breakeven, 0, 1)
    penalizaciones.push(
      `Colchón de ${colchon} meses frente a ${breakeven} hasta el punto de equilibrio`,
    )
  }

  const base = previsiones * 0.25 + legal * 0.2 + cobertura * 0.25 + autonomia * 0.3

  // Penalización transversal por incidencias financieras.
  const hayIncidencias = valores.p20_incidencias_financieras === true
  if (hayIncidencias) penalizaciones.push('Incidencias financieras declaradas')

  return { puntuacion: hayIncidencias ? base * 0.75 : base, penalizaciones }
}

/**
 * Devuelve las 22 variables con el tipo que espera la base de datos:
 * enteros 1-5 en las Likert, cantidades no negativas, texto controlado en
 * la autorización y booleano en las incidencias. Lo usan tanto el
 * cuestionario como el servicio de persistencia, para que un formulario
 * (que entrega texto) y una llamada programática acaben en lo mismo.
 *
 * @param {Record<string, unknown>} valores
 * @returns {Record<string, number|string|boolean>}
 */
export function normalizarVariables(valores = {}) {
  const completos = { ...VALORES_POR_DEFECTO, ...valores }
  const normalizadas = {}

  for (const id of VARIABLES_DIAGNOSTICO) {
    if (id === 'p17_autorizacion_espana') {
      normalizadas[id] =
        completos[id] in PUNTOS_AUTORIZACION ? completos[id] : VALORES_POR_DEFECTO[id]
    } else if (id === 'p20_incidencias_financieras') {
      normalizadas[id] = completos[id] === true
    } else if (CAMPOS_CANTIDAD.includes(id)) {
      normalizadas[id] = Math.max(0, numeroSeguro(completos[id], 0))
    } else {
      normalizadas[id] = acotar(
        Math.round(numeroSeguro(completos[id], 3)),
        ESCALA_MINIMA,
        ESCALA_MAXIMA,
      )
    }
  }

  return normalizadas
}

/**
 * Fase del embudo correspondiente a un score.
 * @param {number} score - 0-100.
 * @returns {string}
 */
export function faseEmbudo(score) {
  const tramo = UMBRALES_FASE_EMBUDO.find((u) => score >= u.minimo)
  return tramo?.fase ?? 'Idea'
}

/**
 * Calcula el diagnóstico completo a partir de las 20 variables.
 *
 * @param {Record<string, unknown>} valores - Variables p1…p20 del cuestionario.
 * @returns {{
 *   score_total: number,
 *   fase_embudo: string,
 *   dimensiones: Record<string, number>,
 *   penalizaciones: string[],
 * }} Score y dimensiones en escala 0-100.
 */
export function calcularDiagnostico(valores = {}) {
  const completos = { ...VALORES_POR_DEFECTO, ...valores }
  const solvencia = puntuarSolvencia(completos)

  const dimensiones = {}
  let acumulado = 0

  for (const dimension of DIMENSIONES) {
    const puntuacion =
      dimension.id === 'solvencia_financiera'
        ? solvencia.puntuacion
        : promedioLikert(completos, dimension.preguntas)

    dimensiones[dimension.id] = Math.round(puntuacion * 100)
    acumulado += puntuacion * dimension.peso
  }

  const score_total = Math.round(acotar(acumulado * 100, 0, 100))

  return {
    score_total,
    fase_embudo: faseEmbudo(score_total),
    dimensiones,
    penalizaciones: solvencia.penalizaciones,
  }
}

/**
 * Dimensión con la puntuación más baja: es la palanca de mejora que el
 * Dashboard convierte en "Próxima acción".
 *
 * @param {Record<string, number>} dimensiones
 * @returns {{ id: string, etiqueta: string, puntuacion: number } | null}
 */
export function dimensionMasDebil(dimensiones) {
  if (!dimensiones) return null

  const ordenadas = DIMENSIONES.map((d) => ({
    id: d.id,
    etiqueta: d.etiqueta,
    puntuacion: dimensiones[d.id] ?? 100,
  })).sort((a, b) => a.puntuacion - b.puntuacion)

  return ordenadas[0] ?? null
}
