/**
 * Datos de seguimiento del proyecto: métricas operativas y hitos.
 *
 * A diferencia del diagnóstico —lo que el emprendedor declaró al
 * responder el cuestionario—, estos datos se registran después, a medida
 * que el negocio opera: vienen de `metric_snapshots` y `project_milestones`.
 * Por eso se evalúan con sus propios umbrales y se muestran aparte.
 *
 * Módulo puro: sin red, sin React ni almacenamiento.
 */

/** Cadena recortada, o `''`. */
function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : ''
}

/**
 * Número utilizable, o `null`.
 *
 * PostgREST entrega las columnas `numeric` como número, pero una columna
 * `text` o un valor escrito a mano pueden llegar como cadena, incluso con
 * coma decimal.
 */
function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null
  const n = typeof valor === 'string' ? Number(valor.replace(',', '.')) : Number(valor)
  return Number.isFinite(n) ? n : null
}

/**
 * Tasa expresada como porcentaje 0-100.
 *
 * `quote_conversion_rate` se llama "rate" y no "pct" como sus vecinas, lo
 * que sugiere una fracción 0-1. Se aceptan las dos escalas: un valor entre
 * 0 y 1 se interpreta como fracción (0,35 → 35 %) y uno mayor, como
 * porcentaje. El único caso ambiguo es exactamente 1, que se lee como
 * 100 %: una conversión del 1 % se registraría como 0,01.
 *
 * @param {number|null} valor
 * @returns {number|null}
 */
export function tasaComoPorcentaje(valor) {
  if (valor === null) return null
  return valor >= 0 && valor <= 1 ? valor * 100 : valor
}

/**
 * Snapshot de métricas ya normalizado.
 * @typedef {Object} SnapshotMetricas
 * @property {string|null} id
 * @property {string|null} registradoEn - Fecha ISO del snapshot.
 * @property {number|null} runwayPersonalMeses
 * @property {number|null} diasMediosCobro
 * @property {number|null} conversionPresupuestosPct - Siempre en 0-100.
 * @property {number|null} utilizacionCapacidadPct
 * @property {number|null} concentracionClientePct
 */

/**
 * @param {Record<string, unknown>|null} fila - Fila de `metric_snapshots`.
 * @returns {SnapshotMetricas|null}
 */
export function normalizarSnapshot(fila) {
  if (!fila || typeof fila !== 'object') return null

  return {
    id: fila.id ?? null,
    registradoEn: fila.created_at ?? null,
    runwayPersonalMeses: numero(fila.personal_runway_months),
    diasMediosCobro: numero(fila.avg_collection_days),
    conversionPresupuestosPct: tasaComoPorcentaje(numero(fila.quote_conversion_rate)),
    utilizacionCapacidadPct: numero(fila.capacity_utilization_pct),
    concentracionClientePct: numero(fila.top_client_revenue_pct),
  }
}

const formatoDecimal = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 })
const formatoEntero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

/**
 * Definición de cada métrica: cómo se lee y cuándo preocupa.
 *
 * Los umbrales son orientativos para un negocio pequeño de servicios y así
 * se indica en la tarjeta; no son una norma. Donde existe una referencia
 * objetiva se usa: en España el plazo máximo de pago entre empresas es de
 * 60 días (Ley 3/2004, modificada por la Ley 15/2010), así que cobrar a más
 * plazo ya es una anomalía, no solo una mala práctica.
 *
 * `evaluar` devuelve 'bien' | 'atencion' | 'riesgo'.
 */
const DEFINICIONES = [
  {
    id: 'runway-personal',
    clave: 'runwayPersonalMeses',
    etiqueta: 'Runway personal',
    unidad: (v) => `${formatoDecimal.format(v)} ${v === 1 ? 'mes' : 'meses'}`,
    evaluar: (v) => (v < 3 ? 'riesgo' : v < 6 ? 'atencion' : 'bien'),
    criterio: 'Meses que puedes cubrir tus gastos personales sin ingresos. Menos de 3 es zona de riesgo; 6 o más da margen.',
  },
  {
    id: 'dias-cobro',
    clave: 'diasMediosCobro',
    etiqueta: 'Días medios de cobro',
    unidad: (v) => `${formatoEntero.format(v)} ${v === 1 ? 'día' : 'días'}`,
    evaluar: (v) => (v > 60 ? 'riesgo' : v > 30 ? 'atencion' : 'bien'),
    criterio: 'Hasta 30 días es sano. Por encima de 60 superas el plazo legal máximo entre empresas en España.',
  },
  {
    id: 'conversion-presupuestos',
    clave: 'conversionPresupuestosPct',
    etiqueta: 'Conversión de presupuestos',
    unidad: (v) => `${formatoEntero.format(v)} %`,
    evaluar: (v) => (v < 20 ? 'riesgo' : v < 35 ? 'atencion' : 'bien'),
    criterio: 'Presupuestos aceptados sobre los enviados. Por debajo del 20 % conviene revisar precio o encaje del cliente.',
  },
  {
    id: 'utilizacion-capacidad',
    clave: 'utilizacionCapacidadPct',
    etiqueta: 'Utilización de capacidad',
    unidad: (v) => `${formatoEntero.format(v)} %`,
    // Es la única de doble filo: poca utilización no paga los costes y
    // demasiada deja sin margen para imprevistos ni para captar clientes.
    evaluar: (v) => (v < 50 || v > 95 ? 'riesgo' : v < 70 || v > 85 ? 'atencion' : 'bien'),
    criterio: 'Entre el 70 % y el 85 % es la zona sana. Por debajo no cubres costes; por encima del 95 % no tienes margen.',
  },
  {
    id: 'concentracion-cliente',
    clave: 'concentracionClientePct',
    etiqueta: 'Peso del cliente principal',
    unidad: (v) => `${formatoEntero.format(v)} %`,
    evaluar: (v) => (v > 50 ? 'riesgo' : v >= 30 ? 'atencion' : 'bien'),
    criterio: 'Parte de tu facturación que depende de un solo cliente. Por encima del 50 %, perderlo pone en juego el negocio.',
  },
]

/**
 * Métrica lista para pintar.
 * @typedef {Object} MetricaOperativa
 * @property {string} id
 * @property {string} etiqueta
 * @property {number|null} valor
 * @property {string|null} valorTexto
 * @property {'bien'|'atencion'|'riesgo'|'sin-dato'} estado
 * @property {string} criterio
 */

/**
 * Las cinco métricas del snapshot, evaluadas.
 *
 * Una métrica sin valor se devuelve como `sin-dato` en lugar de omitirse:
 * la tarjeta muestra siempre las cinco, y un hueco explícito dice qué falta
 * por registrar.
 *
 * @param {SnapshotMetricas|null} snapshot
 * @returns {MetricaOperativa[]}
 */
export function evaluarMetricas(snapshot) {
  return DEFINICIONES.map((def) => {
    const valor = snapshot?.[def.clave] ?? null
    return {
      id: def.id,
      etiqueta: def.etiqueta,
      valor,
      valorTexto: valor === null ? null : def.unidad(valor),
      estado: valor === null ? 'sin-dato' : def.evaluar(valor),
      criterio: def.criterio,
    }
  })
}

/**
 * Hito del proyecto ya normalizado.
 * @typedef {Object} HitoProyecto
 * @property {string} id
 * @property {string} titulo
 * @property {string|null} categoria
 * @property {boolean} completado
 * @property {string|null} completadoEn
 */

/**
 * @param {Array<Record<string, unknown>>|null} filas - Filas de `project_milestones`.
 * @returns {HitoProyecto[]}
 */
export function normalizarHitos(filas) {
  if (!Array.isArray(filas)) return []

  return filas
    .filter((fila) => fila && fila.id && texto(fila.title))
    .map((fila) => ({
      id: String(fila.id),
      titulo: texto(fila.title),
      categoria: texto(fila.category) || null,
      // Solo `true` cuenta como hecho: un `null` en una columna recién
      // creada no debe pintar el hito como completado.
      completado: fila.is_completed === true,
      completadoEn: fila.completed_at ?? null,
    }))
}

/**
 * Proyecto normalizado.
 * @typedef {Object} ProyectoActivo
 * @property {string} id
 * @property {string} nombre
 * @property {string|null} sector
 * @property {boolean} marcadoActivo - `is_active = true` en la tabla; `false` si se
 *   eligió como último modificado a falta de marca.
 */

/**
 * @param {Record<string, unknown>|null} fila - Fila de `projects`.
 * @returns {ProyectoActivo|null}
 */
export function normalizarProyecto(fila) {
  if (!fila?.id) return null
  return {
    id: String(fila.id),
    nombre: texto(fila.name) || 'Proyecto sin nombre',
    sector: texto(fila.sector) || null,
    marcadoActivo: fila.is_active === true,
  }
}

// ── Formulario de actualización de métricas ──────────────────────────

/**
 * Campos del formulario de actualización, en el orden en que se muestran.
 *
 * `tipo` decide la validación:
 *   - 'entero'     número entero >= 0 (las dos columnas son `integer`).
 *   - 'porcentaje' número entre 0 y 100, con hasta dos decimales (las
 *                  columnas son `numeric`).
 *
 * `columna` es la de `metric_snapshots`; `clave`, la del snapshot
 * normalizado de donde se precarga el valor.
 */
export const CAMPOS_METRICAS = [
  { id: 'runway', clave: 'runwayPersonalMeses', columna: 'personal_runway_months', etiqueta: 'Runway personal', unidad: 'meses', tipo: 'entero' },
  { id: 'cobro', clave: 'diasMediosCobro', columna: 'avg_collection_days', etiqueta: 'Días medios de cobro', unidad: 'días', tipo: 'entero' },
  { id: 'conversion', clave: 'conversionPresupuestosPct', columna: 'quote_conversion_rate', etiqueta: 'Conversión de presupuestos', unidad: '%', tipo: 'porcentaje' },
  { id: 'capacidad', clave: 'utilizacionCapacidadPct', columna: 'capacity_utilization_pct', etiqueta: 'Utilización de capacidad', unidad: '%', tipo: 'porcentaje' },
  { id: 'concentracion', clave: 'concentracionClientePct', columna: 'top_client_revenue_pct', etiqueta: 'Peso del cliente principal', unidad: '%', tipo: 'porcentaje' },
]

/** Redondeo sin arrastrar errores de coma flotante (14,3 / 100 → 0,143). */
function redondear(valor, decimales) {
  return Number(valor.toFixed(decimales))
}

/**
 * Valores iniciales del formulario a partir del último snapshot.
 *
 * Se entregan como texto, que es lo que maneja un `<input>`. La conversión
 * ya llega en 0-100 desde `normalizarSnapshot`, así que el usuario siempre
 * ve y escribe porcentajes, sea cual sea la escala guardada. Un valor que
 * no consta queda vacío.
 *
 * @param {SnapshotMetricas|null} snapshot
 * @returns {Record<string, string>} Texto por `id` de campo.
 */
export function borradorDesdeSnapshot(snapshot) {
  return Object.fromEntries(
    CAMPOS_METRICAS.map((campo) => {
      const valor = snapshot?.[campo.clave]
      if (valor === null || valor === undefined) return [campo.id, '']
      const mostrado = campo.tipo === 'porcentaje' ? redondear(valor, 2) : valor
      return [campo.id, String(mostrado).replace('.', ',')]
    }),
  )
}

/**
 * Valida el formulario y construye la fila para `metric_snapshots`.
 *
 * Un campo vacío se guarda como `null` ("no lo he medido esta vez"): es
 * más honesto que obligar a escribir una cifra que el usuario no tiene. Al
 * menos una métrica debe tener valor; una medición vacía no aporta nada al
 * histórico.
 *
 * `quote_conversion_rate` se guarda como fracción 0-1 (35 % → 0,35). Es el
 * único formato que la lectura interpreta sin ambigüedad: si se guardara
 * el porcentaje, una conversión del 1 % se escribiría como 1 y se leería
 * como 100 %.
 *
 * @param {Record<string, string>} borrador - Texto por `id` de campo.
 * @returns {{ ok: true, fila: Record<string, number|null> } | { ok: false, errores: Record<string, string>, general?: string }}
 */
export function validarMetricas(borrador) {
  const errores = {}
  const fila = {}

  for (const campo of CAMPOS_METRICAS) {
    const bruto = texto(borrador?.[campo.id])

    if (!bruto) {
      fila[campo.columna] = null
      continue
    }

    // Se acepta coma o punto decimal; cualquier otro carácter es un error,
    // no algo que corregir en silencio.
    const normalizado = bruto.replace(',', '.')
    const valor = /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : NaN

    if (!Number.isFinite(valor)) {
      errores[campo.id] = 'Escribe un número.'
    } else if (campo.tipo === 'entero') {
      if (!Number.isInteger(valor)) errores[campo.id] = 'Debe ser un número entero.'
      else if (valor < 0) errores[campo.id] = 'No puede ser negativo.'
      else fila[campo.columna] = valor
    } else if (valor < 0 || valor > 100) {
      errores[campo.id] = 'Debe estar entre 0 y 100.'
    } else {
      const porcentaje = redondear(valor, 2)
      fila[campo.columna] = campo.columna === 'quote_conversion_rate' ? redondear(porcentaje / 100, 6) : porcentaje
    }
  }

  if (Object.keys(errores).length > 0) return { ok: false, errores }

  if (CAMPOS_METRICAS.every((campo) => fila[campo.columna] === null)) {
    return { ok: false, errores: {}, general: 'Rellena al menos una métrica para registrar la medición.' }
  }

  return { ok: true, fila }
}
