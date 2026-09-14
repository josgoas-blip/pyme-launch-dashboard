/**
 * Riesgos críticos activos del proyecto.
 *
 * Es la cara accionable de las penalizaciones que aplica
 * `calcularDiagnostico` sobre la dimensión de solvencia: las mismas
 * condiciones, pero enriquecidas con lo que el panel necesita para que el
 * usuario pueda hacer algo al respecto — severidad, pestaña donde está la
 * evidencia y qué toca hacer.
 *
 * Se recomputan las condiciones a partir de las variables declaradas en
 * lugar de interpretar los textos de `penalizaciones`: analizar cadenas
 * sería frágil ante cualquier reescritura de esos mensajes. A cambio, hay
 * que mantener las dos listas alineadas, y por eso cada regla cita aquí la
 * penalización del modelo con la que se corresponde.
 *
 * Módulo puro, sin React: no toca ni modifica `scoreDiagnostico.js` ni
 * ninguna de las derivaciones ya existentes.
 */

/** Lee una cantidad del diagnóstico solo si es un número finito no negativo. */
function cantidadDe(respuestas, clave) {
  const bruto = respuestas?.[clave]
  const n = typeof bruto === 'string' ? Number(bruto.replace(',', '.')) : bruto
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Riesgos activos, ordenados por severidad (críticos primero).
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {{
 *   id: string,
 *   titulo: string,
 *   detalle: string,
 *   comoResolver: string,
 *   severidad: 'critico' | 'aviso',
 *   pestana: string,
 *   etiquetaPestana: string,
 * }[]} Lista vacía si no hay diagnóstico o no hay riesgos.
 */
export function derivarRiesgosActivos(respuestas) {
  if (!respuestas) return []

  const riesgos = []

  // Penalización del modelo: "Colchón de X meses frente a Y hasta el
  // punto de equilibrio".
  const colchon = cantidadDe(respuestas, 'p19_meses_colchon')
  const breakeven = cantidadDe(respuestas, 'p19_meses_breakeven')
  if (colchon !== undefined && breakeven !== undefined && colchon < breakeven) {
    const brecha = breakeven - colchon
    riesgos.push({
      id: 'brecha-tesoreria',
      titulo: `Brecha de tesorería de ${brecha} ${brecha === 1 ? 'mes' : 'meses'}`,
      detalle: `Declaraste ${colchon} meses de oxígeno frente al mes ${breakeven} de equilibrio: te quedas sin caja antes de que el negocio se sostenga solo.`,
      comoResolver: 'Amplía el colchón o acorta el plazo hasta el equilibrio',
      severidad: 'critico',
      pestana: 'viabilidad',
      etiquetaPestana: 'Viabilidad',
    })
  }

  // Penalización del modelo: "Sin autorización para operar en España".
  const autorizacion = respuestas?.p17_autorizacion_espana
  if (autorizacion === 'no') {
    riesgos.push({
      id: 'sin-autorizacion',
      titulo: 'Sin autorización para operar en España',
      detalle:
        'Declaraste no disponer de la autorización necesaria. Sin ella no puedes facturar ni contratar legalmente, así que bloquea todo lo demás.',
      comoResolver: 'Inicia el trámite antes de comprometer inversión',
      severidad: 'critico',
      pestana: 'viabilidad',
      etiquetaPestana: 'Viabilidad',
    })
  } else if (autorizacion === 'tramite') {
    riesgos.push({
      id: 'autorizacion-tramite',
      titulo: 'Autorización en trámite',
      detalle:
        'Tu situación legal aún no está resuelta. No penaliza tanto como no tenerla, pero condiciona los plazos del arranque.',
      comoResolver: 'Confirma los plazos antes de firmar contratos',
      severidad: 'aviso',
      pestana: 'viabilidad',
      etiquetaPestana: 'Viabilidad',
    })
  }

  // Penalización del modelo: "Incidencias financieras declaradas".
  if (respuestas?.p20_incidencias_financieras === true) {
    riesgos.push({
      id: 'incidencias',
      titulo: 'Incidencias financieras activas',
      detalle:
        'El modelo recorta un 25 % tu dimensión de solvencia: los impagos o registros de morosidad cierran el acceso a financiación bancaria.',
      comoResolver: 'Regulariza tu situación o busca financiación alternativa',
      severidad: 'critico',
      pestana: 'viabilidad',
      etiquetaPestana: 'Viabilidad',
    })
  }

  // No es una penalización nominal del modelo, pero sí uno de los cuatro
  // componentes que puntúa la solvencia, y el Plan de Acción ya lo trata
  // como acción crítica. Se refleja aquí para que ambos coincidan.
  const inversion = cantidadDe(respuestas, 'p18_inversion_total')
  const propios = cantidadDe(respuestas, 'p18_recursos_propios')
  if (inversion !== undefined && inversion > 0 && propios !== undefined) {
    const cobertura = Math.round((Math.min(propios, inversion) / inversion) * 100)
    if (cobertura < 50) {
      riesgos.push({
        id: 'cobertura-baja',
        titulo: `Solo cubres el ${cobertura} % de la inversión`,
        detalle:
          'El resto depende de financiación externa que conviene tener comprometida antes de arrancar, no darla por hecha.',
        comoResolver: 'Cierra la financiación externa antes del lanzamiento',
        severidad: 'aviso',
        pestana: 'estrategia',
        etiquetaPestana: 'Estrategia',
      })
    }
  }

  // Críticos arriba: son los que pueden detener el proyecto.
  return riesgos.sort((a, b) => (a.severidad === b.severidad ? 0 : a.severidad === 'critico' ? -1 : 1))
}

/** Nº de riesgos de severidad crítica. */
export function contarCriticos(riesgos) {
  return riesgos.filter((riesgo) => riesgo.severidad === 'critico').length
}
