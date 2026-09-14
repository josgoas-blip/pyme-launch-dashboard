import { AlertTriangle, ShieldCheck, Wallet } from 'lucide-react'
import { Card, CardTitle } from './ui/Card.jsx'
import { useOnboarding } from '../context/OnboardingContext.jsx'

/**
 * Déficit (en meses) a partir del cual la alerta pasa de ámbar a roja.
 * Por debajo hay margen de reacción; por encima, el agotamiento de caja
 * llega demasiado pronto para corregirlo solo con ajustes operativos.
 */
const MESES_DEFICIT_CRITICO = 3

const formatoEUR = (n) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)

const enMeses = (n) => `${n} ${n === 1 ? 'mes' : 'meses'}`

/** Lee una variable numérica del diagnóstico, tolerando ausencias. */
function numeroDe(respuestas, clave) {
  const valor = Number(respuestas?.[clave])
  return Number.isFinite(valor) ? valor : undefined
}

/** Barra horizontal proporcional con su etiqueta y su cifra en meses. */
function BarraMeses({ etiqueta, meses, porcentaje, color, descripcion }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-main">{etiqueta}</p>
        <p className="shrink-0 text-sm font-bold text-main">{enMeses(meses)}</p>
      </div>
      <div
        className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-canvas"
        role="progressbar"
        aria-valuenow={meses}
        aria-valuemin={0}
        aria-label={etiqueta}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${porcentaje}%`, backgroundColor: color }}
        />
      </div>
      {descripcion && <p className="mt-1 text-xs text-muted">{descripcion}</p>}
    </div>
  )
}

/**
 * Semáforo de supervivencia: contrasta el colchón de liquidez declarado
 * con el tiempo estimado hasta el punto de equilibrio, y desglosa cómo se
 * financia la inversión de arranque.
 *
 * Las cuatro variables provienen del bloque financiero del diagnóstico
 * (p18 y p19). Sin diagnóstico no inventa cifras: muestra un estado vacío
 * invitando a completar el cuestionario.
 */
export default function SemaforoSupervivencia() {
  const { respuestas } = useOnboarding()

  const colchon = numeroDe(respuestas, 'p19_meses_colchon')
  const breakeven = numeroDe(respuestas, 'p19_meses_breakeven')
  const inversion = numeroDe(respuestas, 'p18_inversion_total')
  const propios = numeroDe(respuestas, 'p18_recursos_propios')

  // Estado vacío: el diagnóstico aún no aporta las variables financieras.
  if (colchon === undefined && breakeven === undefined && inversion === undefined) {
    return (
      <Card>
        <CardTitle>Semáforo de supervivencia</CardTitle>
        <p className="mt-3 text-sm text-muted">
          Completa el bloque financiero del diagnóstico para ver tu margen de tesorería y tu
          estructura de financiación.
        </p>
      </Card>
    )
  }

  const mesesColchon = colchon ?? 0
  const mesesBreakeven = breakeven ?? 0
  const holgura = mesesColchon - mesesBreakeven
  const hayMargen = holgura >= 0

  // Ambas barras comparten escala para que su longitud sea comparable.
  const escala = Math.max(mesesColchon, mesesBreakeven, 1)
  const porcentaje = (meses) => Math.round((meses / escala) * 100)

  const deficit = Math.abs(holgura)
  const critico = deficit >= MESES_DEFICIT_CRITICO

  const insignia = hayMargen
    ? {
        estilo: 'border-accent-green/30 bg-accent-green/10 text-accent-green',
        Icono: ShieldCheck,
        texto: `Margen de maniobra positivo: te sobran ${enMeses(holgura)} de oxígeno`,
      }
    : {
        estilo: critico
          ? 'border-accent-red/30 bg-accent-red/10 text-accent-red'
          : 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber',
        Icono: AlertTriangle,
        texto: `Alerta de liquidez: te quedas sin caja ${enMeses(deficit)} antes del mes de equilibrio`,
      }

  const inversionTotal = inversion ?? 0
  const recursosPropios = Math.min(propios ?? 0, inversionTotal)
  const financiacionExterna = Math.max(0, inversionTotal - recursosPropios)
  const hayInversion = inversionTotal > 0
  const porcentajePropios = hayInversion ? Math.round((recursosPropios / inversionTotal) * 100) : 0
  const porcentajeExterna = hayInversion ? 100 - porcentajePropios : 0

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="h-4 w-4" />
        </span>
        <CardTitle>Semáforo de supervivencia</CardTitle>
      </div>

      {/* ── Bloque 1: comparativa de tesorería ────────────────────────── */}
      <section className="space-y-4">
        <BarraMeses
          etiqueta="Meses de oxígeno"
          meses={mesesColchon}
          porcentaje={porcentaje(mesesColchon)}
          color={hayMargen ? '#10B981' : '#E53E3E'}
          descripcion="Runway: tiempo que puedes sostener la estructura sin ingresos suficientes."
        />
        <BarraMeses
          etiqueta="Mes de equilibrio"
          meses={mesesBreakeven}
          porcentaje={porcentaje(mesesBreakeven)}
          color="#1B4D3E"
          descripcion="Break-even: mes previsto para cubrir los costes con ingresos propios."
        />

        <p
          className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold leading-snug ${insignia.estilo}`}
        >
          <insignia.Icono className="mt-0.5 h-4 w-4 shrink-0" />
          {insignia.texto}
        </p>
      </section>

      {/* ── Bloque 2: estructura de financiación ──────────────────────── */}
      <section className="border-t border-card-border pt-5">
        <p className="text-sm font-semibold text-main">Estructura de financiación</p>

        {hayInversion ? (
          <>
            <div
              className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-canvas"
              role="progressbar"
              aria-valuenow={porcentajePropios}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Porcentaje cubierto con recursos propios"
            >
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${porcentajePropios}%` }}
              />
              <div
                className="h-full bg-accent-amber transition-all duration-500"
                style={{ width: `${porcentajeExterna}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-card-border bg-canvas p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                  Recursos propios
                </p>
                <p className="mt-1 text-lg font-bold text-main">{formatoEUR(recursosPropios)}</p>
                <p className="text-xs text-muted">{porcentajePropios} % de la inversión</p>
              </div>

              <div className="rounded-lg border border-card-border bg-canvas p-3">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent-amber" />
                  Financiación externa
                </p>
                <p className="mt-1 text-lg font-bold text-main">{formatoEUR(financiacionExterna)}</p>
                <p className="text-xs text-muted">{porcentajeExterna} % de la inversión</p>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted">
              Inversión total declarada: <span className="font-semibold text-main">{formatoEUR(inversionTotal)}</span>
              {financiacionExterna === 0 && ' · cubierta íntegramente con recursos propios.'}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No has declarado inversión de arranque, así que no hay estructura de financiación que
            desglosar.
          </p>
        )}
      </section>
    </Card>
  )
}
