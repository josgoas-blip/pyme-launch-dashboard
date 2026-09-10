/**
 * Adaptador del diagnóstico → datos del Dashboard.
 *
 * Traduce las respuestas del OnboardingWizard a la forma exacta que ya
 * consumen los cuadrantes (contratos de src/types/). Todo lo que el
 * cuestionario no cubre se toma de los mocks base, que actúan como
 * respaldo: si `respuestas` es `null` o una respuesta concreta falta, el
 * Dashboard sigue mostrando el mock íntegro, nunca huecos.
 *
 * Regla de honestidad del PMV: solo se derivan las cifras que el
 * diagnóstico sustenta de verdad. Autonomía, VAN y TIR siguen viniendo del
 * mock porque ninguna pregunta aporta reserva de caja ni horizonte de
 * inversión.
 */
import { controlProyecto, calidadEvidencia, recorridoProyecto } from '../data/dashboardMock.js'
import { metricasProyectadas, escenariosVan, supuestosClave } from '../data/viabilidadMock.js'
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
  accionesSugeridas,
} from '../data/estrategiaMock.js'

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
    accionesSugeridas,
  },
  viabilidad: { metricasProyectadas, escenariosVan, supuestosClave },
}

/**
 * Fase declarada → etiqueta, progreso del recorrido y paso "En curso".
 * `pasoEnCurso` es el índice dentro de `recorridoProyecto`: los anteriores
 * quedan Completados y los posteriores Bloqueados.
 */
const FASE_PROYECTO = {
  idea: { etiqueta: 'Definición de la idea', progreso: 12, pasoEnCurso: 0 },
  validacion: { etiqueta: 'Validación del problema', progreso: 31, pasoEnCurso: 2 },
  traccion: { etiqueta: 'Tracción inicial', progreso: 58, pasoEnCurso: 3 },
  consolidacion: { etiqueta: 'Consolidación y escalado', progreso: 82, pasoEnCurso: 4 },
}

/** Reto prioritario declarado → próxima acción recomendada (tarjeta de Inicio). */
const PROXIMA_ACCION_POR_RETO = {
  captar_clientes: 'Registrar 5 entrevistas de venta',
  rentabilidad: 'Recalcular el punto muerto con costes reales',
  procesos_equipo: 'Documentar los 3 procesos críticos',
  financiacion: 'Preparar el plan de tesorería a 6 meses',
}

/** Punto medio representativo de cada tramo declarado (€/mes). */
const COSTES_FIJOS_EUR = {
  menos_1k: 600,
  de_1k_a_3k: 2000,
  de_3k_a_10k: 6500,
  mas_de_10k: 14000,
}

const FACTURACION_EUR = {
  sin_ingresos: 0,
  hasta_3k: 1500,
  de_3k_a_15k: 9000,
  mas_de_15k: 22000,
}

/**
 * Modelo de negocio → etiqueta y margen de contribución típico del modelo.
 * El margen es el divisor del punto muerto: cuánto de cada euro facturado
 * queda para cubrir la estructura fija.
 */
const MODELO_NEGOCIO = {
  b2b_servicios: { etiqueta: 'B2B Servicios', margenContribucion: 0.55 },
  saas_digital: { etiqueta: 'SaaS / Digital', margenContribucion: 0.75 },
  comercio_b2c: { etiqueta: 'Comercio / B2C', margenContribucion: 0.35 },
  otro: { etiqueta: 'Otro', margenContribucion: 0.5 },
}

/**
 * Canal declarado → etiqueta y fila equivalente de la matriz de canales.
 * La economía (inversión, CAC, LTV/CAC, ROAS) sigue siendo la del mock:
 * el cuestionario identifica el canal, no su rendimiento real.
 */
const CANAL_CAPTACION = {
  meta_ads: { etiqueta: 'Meta Ads', filaBase: 'meta-ads' },
  seo_contenido: { etiqueta: 'SEO / Contenido', filaBase: 'seo-local' },
  contacto_directo: { etiqueta: 'Contacto directo', filaBase: 'email' },
  redes_organicas: { etiqueta: 'Redes sociales', filaBase: 'seo-local' },
}

const formatoEUR = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

/** Lee el `valor` de una respuesta del wizard, tolerando ausencias. */
function valorDe(respuestas, idPregunta) {
  return respuestas?.[idPregunta]?.valor
}

/** Busca en una tabla de mapeo, devolviendo `undefined` si no hay respuesta válida. */
function mapear(tabla, clave) {
  return clave === undefined ? undefined : tabla[clave]
}

/**
 * Inicio: fase actual, progreso y estado del recorrido (fase_proyecto) +
 * próxima acción recomendada (reto_prioritario).
 */
function adaptarInicio(respuestas, base) {
  const fase = mapear(FASE_PROYECTO, valorDe(respuestas, 'fase_proyecto'))
  const proximaAccion = mapear(PROXIMA_ACCION_POR_RETO, valorDe(respuestas, 'reto_prioritario'))

  return {
    ...base,
    controlProyecto: {
      progreso_recorrido: fase?.progreso ?? base.controlProyecto.progreso_recorrido,
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
 * Viabilidad: punto muerto calculado (costes fijos ÷ margen de contribución
 * del modelo) y supuestos clave sustituidos por lo que el cliente ha
 * declarado. Autonomía, VAN y TIR permanecen como respaldo del mock.
 */
function adaptarViabilidad(respuestas, base) {
  const costesFijos = mapear(COSTES_FIJOS_EUR, valorDe(respuestas, 'costes_fijos'))
  const facturacion = mapear(FACTURACION_EUR, valorDe(respuestas, 'facturacion_mensual'))
  const modelo = mapear(MODELO_NEGOCIO, valorDe(respuestas, 'modelo_negocio'))

  if (costesFijos === undefined && facturacion === undefined) return base

  const margen = modelo?.margenContribucion ?? MODELO_NEGOCIO.otro.margenContribucion

  // Umbral de rentabilidad: facturación mínima que cubre la estructura fija.
  const puntoMuerto =
    costesFijos === undefined
      ? base.metricasProyectadas.puntoMuerto
      : Math.round(costesFijos / margen / 100) * 100

  // Etiquetas breves: el panel de Supuestos Clave las trunca a una línea.
  const supuestosDeclarados = []
  if (costesFijos !== undefined) {
    supuestosDeclarados.push({
      id: 'costes-fijos',
      etiqueta: 'Costes fijos / mes',
      valor: { valor: formatoEUR(costesFijos), tipo_evidencia: 'Dato declarado' },
    })
  }
  if (facturacion !== undefined) {
    supuestosDeclarados.push({
      id: 'facturacion-actual',
      etiqueta: 'Facturación / mes',
      valor: {
        valor: facturacion === 0 ? 'Sin ingresos' : formatoEUR(facturacion),
        tipo_evidencia: 'Dato declarado',
      },
    })
  }
  if (modelo) {
    supuestosDeclarados.push({
      id: 'margen-contribucion',
      etiqueta: 'Margen de contrib.',
      valor: { valor: `${Math.round(margen * 100)} %`, tipo_evidencia: 'Estimación' },
    })
  }

  return {
    ...base,
    metricasProyectadas: { ...base.metricasProyectadas, puntoMuerto },
    // Los supuestos declarados desplazan a las hipótesis del mock; se
    // conserva el crecimiento anual, que sigue siendo un escenario.
    supuestosClave: [
      ...supuestosDeclarados,
      ...base.supuestosClave.filter((s) => s.id === 'crecimiento-anual'),
    ],
  }
}

/**
 * Análisis: las etiquetas de mercado se contextualizan con el modelo de
 * negocio y el canal principal declarados. Las cifras no se tocan.
 */
function adaptarAnalisis(respuestas, base) {
  const modelo = mapear(MODELO_NEGOCIO, valorDe(respuestas, 'modelo_negocio'))
  const canal = mapear(CANAL_CAPTACION, valorDe(respuestas, 'canal_captacion'))

  if (!modelo && !canal) return base

  return {
    ...base,
    metricasMercado: base.metricasMercado.map((metrica) => {
      if (metrica.id === 'ltv' && canal) {
        return { ...metrica, descripcion: `${metrica.descripcion} · captación por ${canal.etiqueta}` }
      }
      if (modelo && metrica.id !== 'ltv') {
        return { ...metrica, descripcion: `${metrica.descripcion} · ${modelo.etiqueta}` }
      }
      return metrica
    }),
  }
}

/**
 * Estrategia: el canal declarado encabeza la matriz de captación marcado
 * como principal, y da nombre a la etapa de atracción del funnel.
 */
function adaptarEstrategia(respuestas, base) {
  const canal = mapear(CANAL_CAPTACION, valorDe(respuestas, 'canal_captacion'))
  if (!canal) return base

  const filaPrincipal = base.canalesCaptacion.find((c) => c.id === canal.filaBase)

  return {
    ...base,
    canalesCaptacion: filaPrincipal
      ? [
          { ...filaPrincipal, canal: canal.etiqueta, esPrincipal: true },
          ...base.canalesCaptacion.filter((c) => c.id !== canal.filaBase),
        ]
      : base.canalesCaptacion,
    funnelConversion: base.funnelConversion.map((etapa) =>
      etapa.id === 'atraccion'
        ? { ...etapa, etiqueta: `Visitas y Leads · ${canal.etiqueta}` }
        : etapa,
    ),
  }
}

/**
 * Función principal: construye los datos de las 4 pestañas de contenido a
 * partir del diagnóstico, usando los mocks como respaldo.
 *
 * @param {Record<string, { opcion: string, valor: string, etiqueta: string }> | null} respuestas
 *   Respuestas del OnboardingWizard (`null` mientras no se complete).
 * @param {typeof MOCKS_BASE} [mocksBase] - Respaldo inyectable (útil para pruebas).
 * @returns {typeof MOCKS_BASE} Datos listos para los cuadrantes.
 */
export function adaptarDiagnostico(respuestas, mocksBase = MOCKS_BASE) {
  if (!respuestas) return mocksBase

  return {
    inicio: adaptarInicio(respuestas, mocksBase.inicio),
    analisis: adaptarAnalisis(respuestas, mocksBase.analisis),
    estrategia: adaptarEstrategia(respuestas, mocksBase.estrategia),
    viabilidad: adaptarViabilidad(respuestas, mocksBase.viabilidad),
  }
}
