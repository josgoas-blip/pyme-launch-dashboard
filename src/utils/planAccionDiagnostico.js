/**
 * Derivación del Plan de Acción a partir del diagnóstico real.
 *
 * Convierte el resultado del modelo del TFM en un plan escalonado en tres
 * horizontes (0-30, 30-90 y 90-180 días), sin listas fijas de tareas:
 *   - `penalizaciones` de `calcularDiagnostico` → acciones críticas que
 *     abren el plan (brecha de tesorería, autorización legal, incidencias).
 *   - Respuestas Likert más bajas (p1-p16) → acciones de refuerzo, ordenadas
 *     de menor a mayor puntuación y priorizadas por la dimensión más débil.
 *   - `fase_embudo` → enfoque de cada horizonte y acciones base cuando el
 *     diagnóstico no arroja debilidades suficientes para llenarlo.
 *
 * Regla de honestidad del PMV (la misma de estrategiaDiagnostico.js y
 * viabilidadDiagnostico.js): cada acción nace de una respuesta concreta y
 * cita en su justificación la cifra o la etiqueta que la motiva. No se
 * inventan tareas desconectadas del cuestionario ni plazos de proyecto que
 * el diagnóstico no sostiene.
 *
 * Devuelve `null` cuando no hay diagnóstico, para que la vista muestre un
 * placeholder en lugar de un plan ficticio.
 */
import { calcularDiagnostico, dimensionMasDebil, DIMENSIONES } from './scoreDiagnostico.js'

/** Los tres tramos temporales del plan, en orden de ejecución. */
export const HORIZONTES = [
  { id: 'inmediato', etiqueta: 'Primeros 30 días', rango: '0-30 días' },
  { id: 'corto', etiqueta: 'Del mes 1 al mes 3', rango: '30-90 días' },
  { id: 'consolidacion', etiqueta: 'Del mes 3 al mes 6', rango: '90-180 días' },
]

/** Nº máximo de acciones por horizonte, para que el plan siga siendo accionable. */
const MAX_ACCIONES_POR_HORIZONTE = 3

/**
 * Nivel Likert a partir del cual una respuesta ya no genera acción: con 4 o
 * 5 el aspecto está suficientemente cubierto para la fase semilla.
 */
const NIVEL_SIN_ACCION = 4

/** Pestaña del Dashboard donde el usuario ve la evidencia de cada dimensión. */
const ORIGEN_POR_DIMENSION = {
  validacion_mercado: 'Análisis',
  modelo_competencia: 'Estrategia',
  operaciones_equipo: 'Inicio',
  solvencia_financiera: 'Viabilidad',
}

/** Dimensión a la que pertenece cada pregunta Likert. */
const DIMENSION_POR_PREGUNTA = Object.fromEntries(
  DIMENSIONES.flatMap((d) => d.preguntas.map((id) => [id, d.id])),
)

/**
 * Acción de refuerzo asociada a cada pregunta del cuestionario. El título es
 * la tarea; el horizonte es el tramo natural donde encaja si no la desplaza
 * una alerta crítica.
 */
const ACCION_POR_PREGUNTA = {
  p1_idea_negocio: {
    titulo: 'Concretar tu idea de negocio en una sola frase',
    horizonte: 'inmediato',
  },
  p2_problema_necesidad: {
    titulo: 'Documentar qué problema resuelves y a quién le duele',
    horizonte: 'inmediato',
  },
  p3_cliente_principal: {
    titulo: 'Definir tu cliente principal con criterios verificables',
    horizonte: 'inmediato',
  },
  p4_hablado_clientes: {
    titulo: 'Hablar con clientes potenciales y registrar cada conversación',
    horizonte: 'inmediato',
  },
  p5_encuestas_entrevistas: {
    titulo: 'Levantar evidencia estructurada con encuestas o entrevistas',
    horizonte: 'corto',
  },
  p6_intencion_compra: {
    titulo: 'Contrastar la intención de compra con señales reales',
    horizonte: 'corto',
  },
  p7_aprendizaje_cambios: {
    titulo: 'Registrar qué has aprendido y qué has cambiado por ello',
    horizonte: 'consolidacion',
  },
  p8_identificado_competencia: {
    titulo: 'Mapear a tus competidores y las alternativas del cliente',
    horizonte: 'corto',
  },
  p9_propuesta_valor: {
    titulo: 'Afinar tu propuesta de valor frente a esas alternativas',
    horizonte: 'corto',
  },
  p10_modelo_ingresos: {
    titulo: 'Elegir y documentar tu modelo de ingresos',
    horizonte: 'corto',
  },
  p11_precio_logica: {
    titulo: 'Justificar tu precio con tus costes y con el mercado',
    horizonte: 'corto',
  },
  p12_primeros_clientes: {
    titulo: 'Definir cómo vas a conseguir tus primeros clientes',
    horizonte: 'corto',
  },
  p13_necesidades_operativas: {
    titulo: 'Detallar tus necesidades operativas y tus proveedores',
    horizonte: 'consolidacion',
  },
  p14_mvp_prototipo: {
    titulo: 'Construir una versión mínima que puedas enseñar a un cliente',
    horizonte: 'consolidacion',
  },
  p15_experiencia_equipo: {
    titulo: 'Cubrir las capacidades que hoy le faltan al equipo',
    horizonte: 'consolidacion',
  },
  p16_previsiones_financieras: {
    titulo: 'Elaborar tus previsiones de ventas, costes y punto muerto',
    horizonte: 'inmediato',
  },
}

/**
 * Enfoque del plan y acciones base de cada fase del embudo. Las acciones
 * base solo entran si un horizonte se queda vacío: son el mínimo coherente
 * con la fase que ha calculado el modelo, no relleno genérico.
 */
const PLAN_POR_FASE = {
  Idea: {
    enfoque: 'Concretar la idea y contrastarla con clientes antes de comprometer dinero.',
    focos: {
      inmediato: 'Definir el problema y a quién le duele',
      corto: 'Buscar las primeras señales de demanda',
      consolidacion: 'Esbozar cómo vas a ganar dinero',
    },
    base: {
      inmediato: 'Escribir en una frase el problema que resuelves y para quién',
      corto: 'Conversar con cinco personas de tu cliente objetivo',
      consolidacion: 'Esbozar tu modelo de ingresos y tu estructura de costes',
    },
  },
  Validación: {
    enfoque: 'Convertir tus hipótesis en evidencia contrastada con clientes reales.',
    focos: {
      inmediato: 'Recoger evidencia directa de cliente',
      corto: 'Validar precio y disposición a pagar',
      consolidacion: 'Preparar la puesta en mercado',
    },
    base: {
      inmediato: 'Registrar cinco entrevistas con clientes potenciales',
      corto: 'Contrastar tu precio con tres clientes potenciales',
      consolidacion: 'Definir tu canal de captación principal y cómo medirlo',
    },
  },
  Tracción: {
    enfoque: 'Medir lo que ya funciona antes de escalar la inversión.',
    focos: {
      inmediato: 'Medir de dónde viene cada cliente',
      corto: 'Conocer tu coste de adquisición real',
      consolidacion: 'Concentrar recursos en lo que convierte',
    },
    base: {
      inmediato: 'Registrar el origen de cada contacto y de cada venta',
      corto: 'Calcular tu coste de adquisición por canal',
      consolidacion: 'Reasignar presupuesto al canal con mejor coste por cliente',
    },
  },
  Consolidación: {
    enfoque: 'Escalar sin que el coste de adquisición erosione la rentabilidad.',
    focos: {
      inmediato: 'Proteger la caja mientras creces',
      corto: 'Asegurar la rentabilidad unitaria',
      consolidacion: 'Reducir la dependencia de un solo canal',
    },
    base: {
      inmediato: 'Revisar tu plan de tesorería antes de aumentar la inversión',
      corto: 'Comprobar que el valor de cada cliente triplica su coste de captación',
      consolidacion: 'Validar un segundo canal de captación',
    },
  },
}

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
 * Score, fase, dimensiones y penalizaciones del diagnóstico. Usa lo que trae
 * el payload del cuestionario y recalcula lo que falte, para que el plan
 * nunca contradiga al score que ve el usuario.
 */
function resumenDiagnostico(respuestas) {
  const tieneResultado =
    Number.isFinite(Number(respuestas?.score_total)) &&
    typeof respuestas?.fase_embudo === 'string' &&
    respuestas?.dimensiones &&
    Array.isArray(respuestas?.penalizaciones)

  if (tieneResultado) {
    return {
      score: Number(respuestas.score_total),
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
 * Acciones críticas: una por cada penalización que el modelo aplica sobre la
 * dimensión de solvencia. Abren siempre el plan porque son las que más
 * recortan el score y las que pueden bloquear el proyecto entero.
 */
function accionesCriticas(respuestas) {
  const acciones = []

  const colchon = cantidadDe(respuestas, 'p19_meses_colchon')
  const breakeven = cantidadDe(respuestas, 'p19_meses_breakeven')
  if (colchon !== undefined && breakeven !== undefined && colchon < breakeven) {
    const brecha = breakeven - colchon
    acciones.push({
      id: 'critica-colchon',
      titulo: `Cerrar la brecha de ${brecha} ${brecha === 1 ? 'mes' : 'meses'} de tesorería`,
      prioridad: 'Alta',
      origen: 'Viabilidad',
      justificacion: `Declaraste ${colchon} meses de colchón frente a ${breakeven} hasta el equilibrio: la caja se agota antes de que el negocio se sostenga solo.`,
    })
  }

  const autorizacion = respuestas?.p17_autorizacion_espana
  if (autorizacion === 'no') {
    acciones.push({
      id: 'critica-autorizacion',
      titulo: 'Resolver tu autorización para operar en España',
      prioridad: 'Alta',
      origen: 'Viabilidad',
      justificacion:
        'Declaraste no disponer de autorización para trabajar y emprender en España: sin ella, el resto del plan no puede ejecutarse.',
    })
  } else if (autorizacion === 'tramite') {
    acciones.push({
      id: 'critica-autorizacion-tramite',
      titulo: 'Hacer seguimiento del trámite de autorización',
      prioridad: 'Media',
      origen: 'Viabilidad',
      justificacion:
        'Declaraste tener la autorización en trámite: confirma los plazos antes de comprometer inversión o contratos.',
    })
  }

  if (respuestas?.p20_incidencias_financieras === true) {
    acciones.push({
      id: 'critica-incidencias',
      titulo: 'Regularizar las incidencias financieras declaradas',
      prioridad: 'Alta',
      origen: 'Viabilidad',
      justificacion:
        'Declaraste incidencias financieras activas: el modelo recorta un 25 % tu dimensión de solvencia porque comprometen el acceso a financiación.',
    })
  }

  const inversion = cantidadDe(respuestas, 'p18_inversion_total')
  const propios = cantidadDe(respuestas, 'p18_recursos_propios')
  if (inversion !== undefined && inversion > 0 && propios !== undefined) {
    const cobertura = Math.round((Math.min(propios, inversion) / inversion) * 100)
    if (cobertura < 50) {
      acciones.push({
        id: 'critica-cobertura',
        titulo: 'Asegurar la financiación externa que aún no tienes cerrada',
        prioridad: 'Alta',
        origen: 'Viabilidad',
        justificacion: `Tus recursos propios cubren el ${cobertura} % de la inversión declarada: el resto depende de financiación que conviene tener comprometida antes de arrancar.`,
      })
    }
  }

  return acciones
}

/**
 * Acciones de refuerzo derivadas de las respuestas Likert más bajas. Se
 * ordenan por puntuación ascendente y, a igual puntuación, primero las de la
 * dimensión más débil del diagnóstico.
 */
function accionesPorDebilidad(respuestas, dimensiones) {
  const debil = dimensionMasDebil(dimensiones)

  return Object.entries(ACCION_POR_PREGUNTA)
    .map(([pregunta, plantilla]) => {
      const nivel = nivelDe(respuestas, pregunta)
      if (nivel === undefined || nivel >= NIVEL_SIN_ACCION) return null

      const dimension = DIMENSION_POR_PREGUNTA[pregunta]
      const etiqueta = respuestas?.etiquetas?.[pregunta]

      return {
        id: `refuerzo-${pregunta}`,
        titulo: plantilla.titulo,
        horizonte: plantilla.horizonte,
        // Nivel 1-2: es una carencia. Nivel 3: hay base, pero queda recorrido.
        prioridad: nivel <= 2 ? 'Alta' : 'Media',
        origen: ORIGEN_POR_DIMENSION[dimension] ?? 'Análisis',
        justificacion: etiqueta
          ? `Respondiste "${etiqueta}" (nivel ${nivel} de 5).`
          : `Tu respuesta se sitúa en el nivel ${nivel} de 5.`,
        nivel,
        esDimensionDebil: dimension === debil?.id,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.nivel - b.nivel || Number(b.esDimensionDebil) - Number(a.esDimensionDebil))
}

/**
 * Construye el plan de acción completo a partir del diagnóstico.
 *
 * @param {Record<string, unknown> | null} respuestas - Salida del OnboardingWizard.
 * @returns {{
 *   fase: string,
 *   score: number,
 *   enfoque: string,
 *   totalAcciones: number,
 *   totalCriticas: number,
 *   alertasModelo: string[],
 *   horizontes: {
 *     id: string,
 *     etiqueta: string,
 *     rango: string,
 *     foco: string,
 *     acciones: { id: string, titulo: string, prioridad: string, justificacion: string, origen: string }[],
 *   }[],
 * } | null} `null` si no hay diagnóstico utilizable.
 */
export function derivarPlanAccion(respuestas) {
  if (!respuestas) return null

  // Sin ninguna respuesta del cuestionario no hay plan que derivar: un plan
  // construido sobre los valores por defecto sería ficticio.
  const hayRespuestas = Object.keys(ACCION_POR_PREGUNTA).some(
    (pregunta) => nivelDe(respuestas, pregunta) !== undefined,
  )
  if (!hayRespuestas) return null

  const { score, fase, dimensiones, penalizaciones } = resumenDiagnostico(respuestas)
  const plantillaFase = PLAN_POR_FASE[fase] ?? PLAN_POR_FASE.Idea

  const criticas = accionesCriticas(respuestas)
  const refuerzos = accionesPorDebilidad(respuestas, dimensiones)

  // Las críticas abren el primer horizonte; los refuerzos rellenan por orden
  // de debilidad, empezando también por los primeros 30 días.
  const porHorizonte = { inmediato: [...criticas], corto: [], consolidacion: [] }

  /**
   * Tope de cada tramo. El de los primeros 30 días cede ante las alertas
   * críticas: ninguna puede quedarse fuera del plan por el límite de
   * legibilidad, porque son justo las que bloquean el proyecto.
   */
  const tope = (id) =>
    id === 'inmediato' ? Math.max(MAX_ACCIONES_POR_HORIZONTE, criticas.length) : MAX_ACCIONES_POR_HORIZONTE

  for (const accion of refuerzos) {
    const { horizonte, nivel, esDimensionDebil, ...visible } = accion
    // Orden de preferencia: su tramo natural y, si está lleno, el siguiente.
    const orden = ['inmediato', 'corto', 'consolidacion']
    const desde = orden.indexOf(horizonte)
    const destino = orden
      .slice(desde)
      .concat(orden.slice(0, desde))
      .find((id) => porHorizonte[id].length < tope(id))

    if (destino) porHorizonte[destino].push(visible)
  }

  const horizontes = HORIZONTES.map(({ id, etiqueta, rango }) => {
    const acciones = porHorizonte[id].slice(0, tope(id))

    // Horizonte sin debilidades que atacar: se ofrece la acción base de la
    // fase en la que el modelo ha situado el proyecto.
    if (acciones.length === 0) {
      acciones.push({
        id: `base-${id}`,
        titulo: plantillaFase.base[id],
        prioridad: 'Media',
        origen: 'Inicio',
        justificacion: `Tu diagnóstico no señala carencias en este tramo: es la acción que corresponde a la fase de ${fase}.`,
      })
    }

    return { id, etiqueta, rango, foco: plantillaFase.focos[id], acciones }
  })

  return {
    fase,
    score,
    enfoque: plantillaFase.enfoque,
    totalAcciones: horizontes.reduce((total, h) => total + h.acciones.length, 0),
    totalCriticas: criticas.length,
    // Texto literal de las penalizaciones del modelo, para que el plan y el
    // score citen exactamente las mismas alertas.
    alertasModelo: penalizaciones,
    horizontes,
  }
}
