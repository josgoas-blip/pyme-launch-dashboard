import {
  derivarResumenGlobal,
} from '../../utils/resumenDiagnostico.js'
import { derivarMetricasViabilidad } from '../../utils/viabilidadDiagnostico.js'
import { derivarPlanAccion } from '../../utils/planAccionDiagnostico.js'

/**
 * Colores literales del informe.
 *
 * Se aplican con `style`, no con clases de Tailwind, por el mismo motivo
 * que en el OnboardingWizard: al imprimir, el navegador puede descartar
 * reglas de hoja de estilos o reinterpretar tokens, y un informe con texto
 * gris claro sobre blanco se vuelve ilegible en papel. Con valores
 * literales el contraste está garantizado en pantalla y en PDF.
 */
const TEXTO_FUERTE = '#1F2937'
const TEXTO_SUAVE = '#4B5563'
const BORDE = '#D1D5DB'
const VERDE = '#1B4D3E'
const ROJO = '#B91C1C'
const AMBAR = '#B45309'

const formatoEUR = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

/** Color semafórico de una puntuación 0-100 (mismos cortes que el panel). */
function colorPuntuacion(puntuacion) {
  if (puntuacion < 33) return ROJO
  if (puntuacion < 66) return AMBAR
  return VERDE
}

/** Fecha del diagnóstico, con la de hoy como reserva. */
function fechaInforme(respuestas) {
  const guardada = respuestas?.meta?.completadoEn
  const fecha = guardada ? new Date(guardada) : new Date()
  const valida = Number.isFinite(fecha.getTime()) ? fecha : new Date()

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(valida)
}

/** Encabezado de sección numerada del informe. */
function Seccion({ numero, titulo, children }) {
  return (
    <section className="evitar-corte" style={{ marginTop: '22px' }}>
      <h2
        style={{
          margin: 0,
          paddingBottom: '6px',
          borderBottom: `2px solid ${VERDE}`,
          fontSize: '13px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: VERDE,
        }}
      >
        {numero}. {titulo}
      </h2>
      <div style={{ marginTop: '10px' }}>{children}</div>
    </section>
  )
}

/** Barra horizontal con etiqueta y valor, apta para impresión. */
function Barra({ etiqueta, valor, sufijo = '', porcentaje, color, nota }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: TEXTO_FUERTE }}>{etiqueta}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: TEXTO_FUERTE }}>
          {valor}
          {sufijo}
        </span>
      </div>
      <div
        style={{
          marginTop: '3px',
          height: '7px',
          width: '100%',
          borderRadius: '999px',
          backgroundColor: '#E5E7EB',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, porcentaje))}%`,
            borderRadius: '999px',
            backgroundColor: color,
          }}
        />
      </div>
      {nota && <p style={{ margin: '3px 0 0', fontSize: '9px', color: TEXTO_SUAVE }}>{nota}</p>}
    </div>
  )
}

/**
 * Informe Ejecutivo imprimible.
 *
 * No se ve en pantalla (`solo-imprimir` lo mantiene oculto): existe en el
 * DOM para que `window.print()` pueda componerlo. Las reglas `@media print`
 * de index.css ocultan el resto de la aplicación y dejan solo este bloque,
 * de modo que el PDF que genera el navegador sale con texto vectorial
 * —seleccionable y buscable—, no con una captura rasterizada.
 *
 * Reúne lo esencial del diagnóstico: score y fase, las cuatro dimensiones,
 * el margen de tesorería y las acciones críticas de los primeros 30 días.
 * Todo sale de los mismos módulos de derivación que alimentan el panel, así
 * que el informe no puede decir algo distinto de lo que el usuario ve.
 *
 * @param {{ respuestas: Record<string, unknown> | null }} props
 */
export default function InformeEjecutivo({ respuestas }) {
  const resumen = derivarResumenGlobal(respuestas)

  // Sin diagnóstico no hay informe que componer. El botón de descarga
  // también está deshabilitado en ese caso.
  if (!resumen) return null

  const metricas = derivarMetricasViabilidad(respuestas)
  const plan = derivarPlanAccion(respuestas)
  const criticas = plan?.horizontes?.find((h) => h.id === 'inmediato')?.acciones ?? []

  return (
    <div
      className="solo-imprimir"
      style={{
        backgroundColor: '#FFFFFF',
        color: TEXTO_FUERTE,
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: '11px',
        lineHeight: 1.45,
        padding: '0',
      }}
    >
      {/* ── Cabecera ──────────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
          paddingBottom: '10px',
          borderBottom: `3px solid ${VERDE}`,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: VERDE,
            }}
          >
            Pyme Launch
          </p>
          <h1 style={{ margin: '2px 0 0', fontSize: '20px', fontWeight: 800, color: TEXTO_FUERTE }}>
            Informe Ejecutivo
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '10px', color: TEXTO_SUAVE }}>Prediagnóstico de viabilidad</p>
          <p style={{ margin: '2px 0 0', fontSize: '10px', fontWeight: 600, color: TEXTO_FUERTE }}>
            {fechaInforme(respuestas)}
          </p>
        </div>
      </header>

      {/* ── 1. Score global y fase ────────────────────────────────────── */}
      <Seccion numero={1} titulo="Diagnóstico global">
        <div
          className="evitar-corte"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            padding: '12px 16px',
            border: `1px solid ${BORDE}`,
            borderRadius: '8px',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXTO_SUAVE,
              }}
            >
              Score global
            </p>
            <p style={{ margin: '1px 0 0', fontSize: '30px', fontWeight: 800, color: TEXTO_FUERTE }}>
              {resumen.score}
            </p>
            <p style={{ margin: 0, fontSize: '9px', color: TEXTO_SUAVE }}>sobre 100</p>
          </div>

          <div style={{ width: '1px', alignSelf: 'stretch', backgroundColor: BORDE }} />

          <div>
            <p
              style={{
                margin: 0,
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: TEXTO_SUAVE,
              }}
            >
              Fase del embudo
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 700, color: VERDE }}>
              {resumen.fase}
            </p>
            {resumen.proximaAccion && (
              <p style={{ margin: '4px 0 0', fontSize: '10px', color: TEXTO_SUAVE }}>
                Próxima acción: <strong style={{ color: TEXTO_FUERTE }}>{resumen.proximaAccion}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Las cuatro dimensiones del modelo */}
        <div style={{ marginTop: '12px' }}>
          {resumen.dimensiones.map((dimension) => (
            <Barra
              key={dimension.id}
              etiqueta={dimension.etiqueta}
              valor={dimension.puntuacion}
              sufijo="/100"
              porcentaje={dimension.puntuacion}
              color={colorPuntuacion(dimension.puntuacion)}
              nota={`${Math.round(dimension.peso * 100)} % del score${
                dimension.id === resumen.dimensionDebil?.id ? ' · punto más flojo' : ''
              }`}
            />
          ))}
        </div>

        {/* Penalizaciones que el modelo aplica al score */}
        {resumen.alertas.length > 0 && (
          <div
            className="evitar-corte"
            style={{
              marginTop: '4px',
              padding: '10px 12px',
              border: `1px solid ${ROJO}`,
              borderRadius: '8px',
              backgroundColor: '#FEF2F2',
            }}
          >
            <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: ROJO }}>
              Aspectos que penalizan el score
            </p>
            <ul style={{ margin: '5px 0 0', paddingLeft: '16px' }}>
              {resumen.alertas.map((alerta) => (
                <li key={alerta} style={{ fontSize: '10px', color: TEXTO_FUERTE }}>
                  {alerta}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      {/* ── 2. Semáforo de supervivencia ──────────────────────────────── */}
      <Seccion numero={2} titulo="Semáforo de supervivencia">
        {metricas ? (
          <>
            {metricas.autonomiaMeses !== undefined && metricas.breakevenMeses !== undefined && (
              <>
                {(() => {
                  const escala = Math.max(metricas.autonomiaMeses, metricas.breakevenMeses, 1)
                  const hayMargen = (metricas.margenMeses ?? 0) >= 0
                  return (
                    <>
                      <Barra
                        etiqueta="Colchón de liquidez disponible"
                        valor={metricas.autonomiaMeses}
                        sufijo=" meses"
                        porcentaje={(metricas.autonomiaMeses / escala) * 100}
                        color={hayMargen ? VERDE : ROJO}
                        nota="Tiempo sosteniendo la estructura sin ingresos suficientes."
                      />
                      <Barra
                        etiqueta="Tiempo estimado hasta el equilibrio"
                        valor={metricas.breakevenMeses}
                        sufijo=" meses"
                        porcentaje={(metricas.breakevenMeses / escala) * 100}
                        color={TEXTO_SUAVE}
                        nota="Meses previstos hasta cubrir los costes con ingresos propios."
                      />
                      <p
                        className="evitar-corte"
                        style={{
                          margin: '2px 0 0',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${hayMargen ? VERDE : ROJO}`,
                          backgroundColor: hayMargen ? '#F0FDF4' : '#FEF2F2',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: hayMargen ? VERDE : ROJO,
                        }}
                      >
                        {hayMargen
                          ? `Margen de tesorería positivo: ${metricas.margenMeses} meses de holgura sobre el equilibrio.`
                          : `Alerta de liquidez: se proyecta agotamiento de caja ${Math.abs(
                              metricas.margenMeses,
                            )} meses antes del equilibrio.`}
                      </p>
                    </>
                  )
                })()}
              </>
            )}

            {/* Estructura de financiación declarada */}
            {metricas.inversionTotal !== undefined && metricas.inversionTotal > 0 && (
              <table
                className="evitar-corte"
                style={{ marginTop: '12px', width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: '5px 0', color: TEXTO_SUAVE }}>Inversión total declarada</td>
                    <td style={{ padding: '5px 0', textAlign: 'right', fontWeight: 700 }}>
                      {formatoEUR(metricas.inversionTotal)}
                    </td>
                  </tr>
                  {metricas.recursosPropios !== undefined && (
                    <tr>
                      <td style={{ padding: '5px 0', color: TEXTO_SUAVE, borderTop: `1px solid ${BORDE}` }}>
                        Recursos propios
                      </td>
                      <td
                        style={{
                          padding: '5px 0',
                          textAlign: 'right',
                          fontWeight: 700,
                          borderTop: `1px solid ${BORDE}`,
                        }}
                      >
                        {formatoEUR(metricas.recursosPropios)}
                        {metricas.coberturaPropia !== undefined && ` (${metricas.coberturaPropia} %)`}
                      </td>
                    </tr>
                  )}
                  {metricas.financiacionExterna !== undefined && (
                    <tr>
                      <td style={{ padding: '5px 0', color: TEXTO_SUAVE, borderTop: `1px solid ${BORDE}` }}>
                        Financiación externa
                      </td>
                      <td
                        style={{
                          padding: '5px 0',
                          textAlign: 'right',
                          fontWeight: 700,
                          borderTop: `1px solid ${BORDE}`,
                        }}
                      >
                        {formatoEUR(metricas.financiacionExterna)}
                      </td>
                    </tr>
                  )}
                  {metricas.consumoMensual !== undefined && (
                    <tr>
                      <td style={{ padding: '5px 0', color: TEXTO_SUAVE, borderTop: `1px solid ${BORDE}` }}>
                        Consumo medio mensual implícito
                      </td>
                      <td
                        style={{
                          padding: '5px 0',
                          textAlign: 'right',
                          fontWeight: 700,
                          borderTop: `1px solid ${BORDE}`,
                        }}
                      >
                        {formatoEUR(metricas.consumoMensual)}/mes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '10px', color: TEXTO_SUAVE }}>
            El diagnóstico no aporta las variables financieras necesarias para este apartado.
          </p>
        )}
      </Seccion>

      {/* ── 3. Plan de acción crítico ─────────────────────────────────── */}
      <Seccion numero={3} titulo="Plan de acción · primeros 30 días">
        {criticas.length === 0 ? (
          <p style={{ margin: 0, fontSize: '10px', color: TEXTO_SUAVE }}>
            El diagnóstico no señala acciones críticas para este tramo.
          </p>
        ) : (
          <ol style={{ margin: 0, paddingLeft: '18px' }}>
            {criticas.map((accion) => (
              <li key={accion.id} className="evitar-corte" style={{ marginBottom: '9px' }}>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: TEXTO_FUERTE }}>
                  {accion.titulo}
                  <span
                    style={{
                      marginLeft: '6px',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: accion.prioridad === 'Alta' ? ROJO : AMBAR,
                    }}
                  >
                    [Prioridad {accion.prioridad}]
                  </span>
                </p>
                <p style={{ margin: '1px 0 0', fontSize: '10px', color: TEXTO_SUAVE }}>
                  {accion.justificacion} <em>Ver en {accion.origen}.</em>
                </p>
              </li>
            ))}
          </ol>
        )}
        {plan?.enfoque && (
          <p style={{ margin: '8px 0 0', fontSize: '10px', fontStyle: 'italic', color: TEXTO_SUAVE }}>
            Enfoque de la fase de {plan.fase}: {plan.enfoque}
          </p>
        )}
      </Seccion>

      {/* ── Pie legal ─────────────────────────────────────────────────── */}
      <footer style={{ marginTop: '24px', paddingTop: '8px', borderTop: `1px solid ${BORDE}` }}>
        <p style={{ margin: 0, fontSize: '8.5px', lineHeight: 1.5, color: TEXTO_SUAVE }}>
          Prediagnóstico asistido por IA generado a partir de las respuestas declaradas por el
          usuario. No constituye certificación de viabilidad, garantía de financiación ni
          asesoramiento jurídico, fiscal o financiero. Las cifras financieras son proyecciones
          condicionadas a los supuestos declarados, no resultados garantizados.
        </p>
      </footer>
    </div>
  )
}
