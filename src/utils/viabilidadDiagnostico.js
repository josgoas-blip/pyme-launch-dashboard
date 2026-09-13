/**
 * Derivación de la pestaña "Viabilidad" a partir del diagnóstico real.
 *
 * Traduce el bloque financiero y legal del cuestionario del TFM (p16-p20) a
 * los indicadores, escenarios y supuestos que muestra el Dashboard, sin
 * inventar cifras:
 *   - p19_meses_colchon / p19_meses_breakeven → autonomía y margen de
 *     seguridad (la misma brecha que penaliza `calcularDiagnostico`).
 *   - p18_inversion_total / p18_recursos_propios → caja inicial, cobertura
 *     con recursos propios y consumo medio mensual implícito.
 *   - p16_previsiones_financieras → nivel de elaboración del plan financiero.
 *   - p17 / p20 y `penalizaciones` → alertas financieras y legales.
 *
 * Regla de honestidad del PMV (la misma de adaptadorDiagnostico.js y
 * estrategiaDiagnostico.js): el cuestionario no recoge costes fijos
 * mensuales, margen de contribución ni tasa de descuento, así que el Punto
 * Muerto, el VAN y la TIR NO se calculan. Se declaran como pendientes
 * (`INDICADORES_PENDIENTES`) explicando qué dato falta, en lugar de mostrar
 * una cifra arbitraria.
 *
 * Cada función devuelve `null` (o una lista vacía) cuando el diagnóstico no
 * aporta las variables, para que la vista muestre un placeholder.
 */
import { calcularDiagnostico } from './scoreDiagnostico.js'

/** Conversión usada para expresar el colchón también en días. */
const DIAS_POR_MES = 30

/**
 * Déficit (en meses) a partir del cual el margen de seguridad pasa de
 * ajustado a crítico. Mismo umbral que el Semáforo de supervivencia, para
 * que ambos cuadrantes no se contradigan.
 */
export const MESES_DEFICIT_CRITICO = 3

/**
 * Escenarios de la proyección de caja: desplazan el mes de equilibrio
 * declarado. No alteran los euros declarados, solo el plazo, que es la
 * única variable sobre la que el diagnóstico recoge una estimación.
 */
const FACTORES_ESCENARIO = { favorable: 0.75, base: 1, adverso: 1.5 }

/** Nº máximo de puntos del gráfico, para que la línea siga siendo legible. */
const MAX_PUNTOS_GRAFICO = 13

/** Etiquetas de p16 (respaldo si el payload no trae `etiquetas`). */
const NIVEL_PREVISIONES = {
  1: 'Sin previsiones numéricas',
  2: 'Estimación aproximada de ventas',
  3: 'Costes fijos y variables calculados',
  4: 'Punto de equilibrio y cuenta de resultados',
  5: 'Modelo financiero integral a 3 escenarios',
}

/** Situación legal declarada en p17 → texto legible. */
const TEXTO_AUTORIZACION = {
  si: 'Autorización concedida',
  tramite: 'Autorización en trámite',
  no: 'Sin autorización para operar',
}

/**
 * Indicadores clásicos de viabilidad que el cuestionario de 20 preguntas no
 * sostiene. Se muestran como pendientes, con el dato que haría falta para
 * calcularlos, en lugar de rellenarlos con cifras simuladas.
 */
export const INDICADORES_PENDIENTES = [
  {
    id: 'punto-muerto',
    etiqueta: 'Punto Muerto',
    requiere: 'Necesita tus costes fijos mensuales y tu margen de contribución por venta.',
  },
  {
    id: 'van',
    etiqueta: 'VAN',
    requiere: 'Necesita el flujo de caja previsto por periodo y una tasa de descuento.',
  },
  {
    id: 'tir',
    etiqueta: 'TIR',
    requiere: 'Necesita la serie completa de flujos de caja, no solo la inversión inicial.',
  },
]

const formatoEUR = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

/** Lee una cantidad del diagnóstico solo si es un número finito no negativo. */
function cantidadDe(respuestas, clave) {
  const bruto = respuestas?.[clave]
  const n = typeof bruto === 'string' ? Number(bruto.replace(',', '.')) : bruto
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Lee un nivel Likert 1-5 del diagnóstico. */
function nivelDe(respuestas, clave) {
  const n = Number(respuestas?.[clave])
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined
}

/**
 * Métricas de la fila superior de Viabilidad, todas derivadas de variables
 * declaradas. Devuelve `null` si el diagnóstico no aporta ninguna.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{
 *   autonomiaMeses: number | undefined,
 *   autonomiaDias: number | undefined,
 *   breakevenMeses: number | undefined,
 *   margenMeses: number | undefined,
 *   estadoMargen: string | undefined,
 *   scoreSolvencia: number | undefined,
 *   nivelPrevisiones: number | undefined,
 *   etiquetaPrevisiones: string | undefined,
 *   inversionTotal: number | undefined,
 *   recursosPropios: number | undefined,
 *   financiacionExterna: number | undefined,
 *   coberturaPropia: number | undefined,
 *   consumoMensual: number | undefined,
 * } | null}
 */
export function derivarMetricasViabilidad(respuestas) {
  if (!respuestas) return null

  const colchon = cantidadDe(respuestas, 'p19_meses_colchon')
  const breakeven = cantidadDe(respuestas, 'p19_meses_breakeven')
  const inversion = cantidadDe(respuestas, 'p18_inversion_total')
  const propiosBrutos = cantidadDe(respuestas, 'p18_recursos_propios')
  const nivelPrevisiones = nivelDe(respuestas, 'p16_previsiones_financieras')
  const solvencia = Number(respuestas?.dimensiones?.solvencia_financiera)

  // Sin ninguna variable financiera no hay nada que derivar.
  if (
    colchon === undefined &&
    breakeven === undefined &&
    inversion === undefined &&
    nivelPrevisiones === undefined
  ) {
    return null
  }

  // Margen de seguridad: la misma brecha que penaliza `puntuarSolvencia`.
  let margenMeses
  let estadoMargen
  if (colchon !== undefined && breakeven !== undefined) {
    margenMeses = colchon - breakeven
    if (margenMeses >= 0) estadoMargen = 'holgado'
    else estadoMargen = Math.abs(margenMeses) >= MESES_DEFICIT_CRITICO ? 'critico' : 'ajustado'
  }

  // Los recursos propios nunca pueden superar la inversión declarada.
  const recursosPropios =
    inversion !== undefined && propiosBrutos !== undefined
      ? Math.min(propiosBrutos, inversion)
      : propiosBrutos

  const financiacionExterna =
    inversion !== undefined && recursosPropios !== undefined
      ? Math.max(0, inversion - recursosPropios)
      : undefined

  const coberturaPropia =
    inversion !== undefined && inversion > 0 && recursosPropios !== undefined
      ? Math.round((recursosPropios / inversion) * 100)
      : undefined

  // Consumo medio implícito: la inversión declarada repartida entre los
  // meses de colchón declarados. Es aritmética sobre datos del usuario, no
  // un burn rate traído de fuera.
  const consumoMensual =
    inversion !== undefined && inversion > 0 && colchon !== undefined && colchon > 0
      ? Math.round(inversion / colchon)
      : undefined

  return {
    autonomiaMeses: colchon,
    autonomiaDias: colchon !== undefined ? Math.round(colchon * DIAS_POR_MES) : undefined,
    breakevenMeses: breakeven,
    margenMeses,
    estadoMargen,
    scoreSolvencia: Number.isFinite(solvencia) ? solvencia : undefined,
    nivelPrevisiones,
    etiquetaPrevisiones:
      nivelPrevisiones !== undefined
        ? respuestas?.etiquetas?.p16_previsiones_financieras ?? NIVEL_PREVISIONES[nivelPrevisiones]
        : undefined,
    inversionTotal: inversion,
    recursosPropios,
    financiacionExterna,
    coberturaPropia,
    consumoMensual,
  }
}

/** Saldo de caja en un mes: se consume hasta el equilibrio y ahí se estabiliza. */
function saldoEnMes(inversion, consumo, mesEquilibrio, mes) {
  return Math.round(inversion - consumo * Math.min(mes, mesEquilibrio))
}

/**
 * Parámetros del modelo de caja, comunes al gráfico de la pestaña y a la
 * exportación a CSV: caja inicial, consumo mensual implícito y el mes de
 * equilibrio de cada escenario. Se extrae aquí para que las dos salidas no
 * puedan divergir.
 *
 * @param {Record<string, unknown> | null} respuestas
 * @returns {{ inversion: number, colchon: number, breakeven: number,
 *   consumoMensual: number, equilibrios: { favorable: number, base: number, adverso: number }
 * } | null} `null` si faltan la inversión o los plazos.
 */
function modeloCaja(respuestas) {
  const inversion = cantidadDe(respuestas, 'p18_inversion_total')
  const colchon = cantidadDe(respuestas, 'p19_meses_colchon')
  const breakeven = cantidadDe(respuestas, 'p19_meses_breakeven')

  // Sin caja declarada o sin horizonte no hay trayectoria que proyectar.
  if (!inversion || !colchon || breakeven === undefined) return null

  return {
    inversion,
    colchon,
    breakeven,
    consumoMensual: inversion / colchon,
    // Con `breakeven` a 0 los tres escenarios quedan a 0: el proyecto ya
    // estaría en equilibrio y la caja no llega a consumirse.
    equilibrios: {
      favorable: Math.round(breakeven * FACTORES_ESCENARIO.favorable),
      base: Math.round(breakeven * FACTORES_ESCENARIO.base),
      adverso: Math.round(breakeven * FACTORES_ESCENARIO.adverso),
    },
  }
}

/**
 * Serie mes a mes del saldo de caja, sin muestrear.
 *
 * El gráfico de la pestaña reduce los puntos para que la línea siga siendo
 * legible; una hoja de cálculo, en cambio, quiere todos los meses. Ambas
 * salidas comparten `modeloCaja`, así que describen la misma proyección.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @param {number} [mesesHorizonte] - Último mes de la serie (por defecto 12).
 * @returns {{
 *   filas: { mes: number, favorable: number, base: number, adverso: number }[],
 *   consumoMensual: number,
 *   cajaInicial: number,
 *   equilibrios: { favorable: number, base: number, adverso: number },
 * } | null} `null` si faltan la inversión o los plazos.
 */
export function derivarProyeccionMensual(respuestas, mesesHorizonte = 12) {
  const modelo = modeloCaja(respuestas)
  if (!modelo) return null

  const { inversion, consumoMensual, equilibrios } = modelo
  const ultimoMes = Math.max(1, Math.round(mesesHorizonte))

  const filas = []
  for (let mes = 0; mes <= ultimoMes; mes += 1) {
    filas.push({
      mes,
      favorable: saldoEnMes(inversion, consumoMensual, equilibrios.favorable, mes),
      base: saldoEnMes(inversion, consumoMensual, equilibrios.base, mes),
      adverso: saldoEnMes(inversion, consumoMensual, equilibrios.adverso, mes),
    })
  }

  return {
    filas,
    consumoMensual: Math.round(consumoMensual),
    cajaInicial: inversion,
    equilibrios,
  }
}

/**
 * Proyección del saldo de caja bajo tres escenarios, construida únicamente
 * con la inversión y los plazos declarados:
 *   - Caja inicial = inversión total declarada.
 *   - Consumo mensual = inversión / meses de colchón.
 *   - El saldo deja de caer al alcanzar el equilibrio (sin beneficio: es la
 *     hipótesis conservadora).
 * Los escenarios solo desplazan el mes de equilibrio (-25 % / +50 %).
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{
 *   datos: { periodo: string, mes: number, favorable: number, base: number, adverso: number }[],
 *   consumoMensual: number,
 *   cajaInicial: number,
 *   equilibrioBase: number,
 *   mesAgotamiento: number | null,
 * } | null} `null` si faltan la inversión o los plazos.
 */
export function derivarEscenariosCaja(respuestas) {
  const modelo = modeloCaja(respuestas)
  if (!modelo) return null

  const { inversion, colchon, consumoMensual, equilibrios } = modelo

  // Horizonte: un par de meses más allá del peor escenario, sin bajar del
  // colchón declarado, para que la autonomía siempre quede visible.
  const horizonte = Math.max(equilibrios.adverso + 2, Math.ceil(colchon) + 1, 6)
  const paso = Math.max(1, Math.ceil(horizonte / (MAX_PUNTOS_GRAFICO - 1)))

  const datos = []
  for (let mes = 0; mes <= horizonte; mes += paso) {
    datos.push({
      mes,
      periodo: `Mes ${mes}`,
      favorable: saldoEnMes(inversion, consumoMensual, equilibrios.favorable, mes),
      base: saldoEnMes(inversion, consumoMensual, equilibrios.base, mes),
      adverso: saldoEnMes(inversion, consumoMensual, equilibrios.adverso, mes),
    })
  }

  return {
    datos,
    consumoMensual: Math.round(consumoMensual),
    cajaInicial: inversion,
    equilibrioBase: equilibrios.base,
    // El escenario base agota la caja si el equilibrio llega más tarde que
    // el colchón: ocurre justo al consumirse los meses declarados.
    mesAgotamiento: equilibrios.base > colchon ? Math.floor(colchon) : null,
  }
}

/**
 * Supuestos clave: exclusivamente las variables que el usuario ha declarado
 * (o su derivación aritmética directa), cada una con su procedencia según
 * la Taxonomía de Evidencia.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {import('../types/viabilidad.js').SupuestoClave[]} Vacío sin diagnóstico.
 */
export function derivarSupuestosViabilidad(respuestas) {
  const metricas = derivarMetricasViabilidad(respuestas)
  if (!metricas) return []

  const supuestos = []
  const anadir = (id, etiqueta, valor, tipo_evidencia) =>
    supuestos.push({ id, etiqueta, valor: { valor, tipo_evidencia } })

  if (metricas.inversionTotal !== undefined) {
    anadir('inversion-total', 'Inversión total', formatoEUR(metricas.inversionTotal), 'Dato declarado')
  }
  if (metricas.recursosPropios !== undefined) {
    const cobertura = metricas.coberturaPropia !== undefined ? ` (${metricas.coberturaPropia} %)` : ''
    anadir(
      'recursos-propios',
      'Recursos propios',
      `${formatoEUR(metricas.recursosPropios)}${cobertura}`,
      'Dato declarado',
    )
  }
  if (metricas.financiacionExterna !== undefined) {
    anadir(
      'financiacion-externa',
      'Financiación externa',
      formatoEUR(metricas.financiacionExterna),
      'Dato declarado',
    )
  }
  if (metricas.autonomiaMeses !== undefined) {
    anadir('meses-colchon', 'Colchón de liquidez', `${metricas.autonomiaMeses} meses`, 'Dato declarado')
  }
  if (metricas.breakevenMeses !== undefined) {
    anadir('meses-breakeven', 'Plazo hasta el equilibrio', `${metricas.breakevenMeses} meses`, 'Estimación')
  }
  if (metricas.consumoMensual !== undefined) {
    anadir('consumo-mensual', 'Consumo medio implícito', `${formatoEUR(metricas.consumoMensual)}/mes`, 'Estimación')
  }
  if (metricas.etiquetaPrevisiones) {
    anadir('previsiones', 'Previsiones financieras', metricas.etiquetaPrevisiones, 'Dato declarado')
  }

  const autorizacion = TEXTO_AUTORIZACION[respuestas?.p17_autorizacion_espana]
  if (autorizacion) {
    anadir('autorizacion', 'Situación legal en España', autorizacion, 'Dato declarado')
  }

  return supuestos
}

/**
 * Alertas financieras y legales: son exactamente las penalizaciones que
 * aplica `calcularDiagnostico` sobre la dimensión de solvencia, para que la
 * pestaña no contradiga al score. Se recalculan si el payload no las trae.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {string[]} Vacío si no hay diagnóstico o no hay alertas.
 */
export function derivarAlertasFinancieras(respuestas) {
  if (!respuestas) return []
  if (Array.isArray(respuestas.penalizaciones)) return respuestas.penalizaciones

  return calcularDiagnostico(respuestas).penalizaciones ?? []
}
