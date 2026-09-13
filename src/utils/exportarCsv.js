/**
 * Exportación del modelo económico a CSV.
 *
 * Se genera en el cliente, sin dependencias: un `Blob` de texto y un enlace
 * temporal bastan, y evitan añadir una librería de hojas de cálculo (~400 kB)
 * a un bundle que ya supera el umbral de aviso de Vite.
 *
 * Dos decisiones de formato, ambas para que el fichero se abra bien en un
 * Excel en español:
 *   - Separador `;`. Con la configuración regional es-ES, Excel espera punto
 *     y coma; con comas metería toda la fila en una sola celda.
 *   - BOM UTF-8 al principio. Sin él, Excel interpreta el fichero como
 *     ANSI y los acentos salen corruptos ("ColchÃ³n").
 *
 * Las cifras van como enteros sin separador de miles, para que lleguen como
 * números y no como texto.
 */
import { derivarMetricasViabilidad, derivarProyeccionMensual } from './viabilidadDiagnostico.js'
import { derivarResumenGlobal } from './resumenDiagnostico.js'

/** Separador de campos (ver nota de formato en la cabecera del módulo). */
const SEPARADOR = ';'

/** Meses que cubre la proyección exportada. */
export const MESES_PROYECCION = 12

/** Nombre del fichero que descarga el usuario. */
export const NOMBRE_FICHERO_CSV = 'modelo-economico-pyme.csv'

/**
 * Escapa un campo según RFC 4180: si contiene el separador, comillas o un
 * salto de línea, se entrecomilla y se duplican las comillas interiores.
 *
 * @param {string|number|undefined|null} valor
 * @returns {string}
 */
function campo(valor) {
  if (valor === undefined || valor === null) return ''

  const texto = String(valor)
  if (texto.includes(SEPARADOR) || texto.includes('"') || /[\r\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`
  }
  return texto
}

/** Une celdas en una fila CSV. */
const fila = (...celdas) => celdas.map(campo).join(SEPARADOR)

/**
 * Construye el contenido CSV del modelo económico a partir del diagnóstico.
 *
 * Incluye la cabecera del informe, las variables financieras declaradas y
 * la proyección de saldo de caja mes a mes en los tres escenarios. Todo
 * sale de los mismos módulos de derivación que alimentan la pestaña de
 * Viabilidad, así que la hoja y el panel no pueden discrepar.
 *
 * @param {Record<string, unknown> | null} respuestas - Diagnóstico actual.
 * @returns {string | null} `null` si el diagnóstico no sostiene el modelo.
 */
export function construirCsvModeloEconomico(respuestas) {
  const metricas = derivarMetricasViabilidad(respuestas)
  if (!metricas) return null

  const resumen = derivarResumenGlobal(respuestas)
  const proyeccion = derivarProyeccionMensual(respuestas, MESES_PROYECCION)

  const lineas = []

  // ── Cabecera ────────────────────────────────────────────────────────
  lineas.push(fila('Pyme Launch - Modelo económico'))
  lineas.push(fila('Fecha de exportación', new Date().toLocaleDateString('es-ES')))
  if (resumen) {
    lineas.push(fila('Score global', resumen.score, 'sobre 100'))
    lineas.push(fila('Fase del embudo', resumen.fase))
  }
  lineas.push('')

  // ── Variables declaradas ────────────────────────────────────────────
  lineas.push(fila('Variable', 'Valor', 'Unidad'))

  const variables = [
    ['Inversión total declarada', metricas.inversionTotal, 'EUR'],
    ['Recursos propios', metricas.recursosPropios, 'EUR'],
    ['Financiación externa', metricas.financiacionExterna, 'EUR'],
    ['Cobertura con recursos propios', metricas.coberturaPropia, '%'],
    ['Meses de colchón de liquidez', metricas.autonomiaMeses, 'meses'],
    ['Meses estimados hasta el equilibrio', metricas.breakevenMeses, 'meses'],
    ['Margen de seguridad', metricas.margenMeses, 'meses'],
    ['Consumo medio mensual implícito', metricas.consumoMensual, 'EUR/mes'],
  ]

  for (const [etiqueta, valor, unidad] of variables) {
    // Solo se exporta lo que el usuario ha declarado: una celda vacía es
    // más honesta que un cero que nadie ha escrito.
    if (valor !== undefined) lineas.push(fila(etiqueta, valor, unidad))
  }

  // ── Proyección de saldo de caja ─────────────────────────────────────
  lineas.push('')

  if (!proyeccion) {
    lineas.push(
      fila(
        'Proyección de saldo de caja',
        'No disponible: requiere inversión total y meses de colchón declarados',
      ),
    )
  } else {
    lineas.push(fila(`Proyección de saldo de caja (EUR) - meses 0 a ${MESES_PROYECCION}`))
    lineas.push(
      fila('Supuesto', `Caja inicial ${proyeccion.cajaInicial} EUR`, `Consumo ${proyeccion.consumoMensual} EUR/mes`),
    )
    lineas.push(
      fila(
        'Mes de equilibrio por escenario',
        `Favorable: ${proyeccion.equilibrios.favorable}`,
        `Base: ${proyeccion.equilibrios.base}`,
        `Adverso: ${proyeccion.equilibrios.adverso}`,
      ),
    )
    lineas.push('')
    lineas.push(fila('Mes', 'Escenario favorable', 'Escenario base', 'Escenario adverso'))
    for (const punto of proyeccion.filas) {
      lineas.push(fila(punto.mes, punto.favorable, punto.base, punto.adverso))
    }
  }

  // ── Aviso ───────────────────────────────────────────────────────────
  lineas.push('')
  lineas.push(
    fila(
      'Aviso',
      'Proyección construida con las variables declaradas en el diagnóstico. No constituye certificación de viabilidad ni asesoramiento financiero.',
    ),
  )

  // CRLF: es el fin de línea que esperan Excel y la RFC 4180.
  return lineas.join('\r\n')
}

/**
 * Dispara la descarga de un contenido de texto como fichero.
 *
 * Se antepone el BOM UTF-8 para que Excel respete los acentos, y se libera
 * la URL del objeto tras el clic para no retener el Blob en memoria.
 *
 * @param {string} nombre - Nombre del fichero descargado.
 * @param {string} contenido - Texto del CSV.
 * @returns {boolean} `true` si la descarga llegó a lanzarse.
 */
export function descargarCsv(nombre, contenido) {
  if (typeof document === 'undefined' || !contenido) return false

  try {
    const blob = new Blob([`﻿${contenido}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombre
    enlace.style.display = 'none'

    document.body.appendChild(enlace)
    enlace.click()
    document.body.removeChild(enlace)

    // Se revoca en el siguiente ciclo: hacerlo de inmediato puede cancelar
    // la descarga en algunos navegadores.
    setTimeout(() => URL.revokeObjectURL(url), 0)
    return true
  } catch {
    console.warn('[Exportación] No se pudo generar el fichero CSV en este navegador.')
    return false
  }
}
