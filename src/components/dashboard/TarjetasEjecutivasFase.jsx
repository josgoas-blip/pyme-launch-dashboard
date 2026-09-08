import { Compass, TrendingUp, ArrowRight } from 'lucide-react'
import { Card, CardTitle, KpiNumber } from '../ui/Card.jsx'

/**
 * Bloque "¿Dónde estoy y qué me falta?": 3 tarjetas ejecutivas con la fase
 * actual del recorrido, el % de progreso global y la próxima acción
 * recomendada. Sustituye los antiguos bloques financieros/Gantt.
 *
 * @param {{ controlProyecto: import('../../types/dashboard.js').ControlProyecto }} props
 */
export default function TarjetasEjecutivasFase({ controlProyecto }) {
  const { fase_actual, progreso_recorrido, proxima_accion } = controlProyecto

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Fase Actual</CardTitle>
          <p className="mt-1 truncate text-lg font-bold text-main">{fase_actual}</p>
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Progreso</CardTitle>
          <KpiNumber className="mt-1">{progreso_recorrido}%</KpiNumber>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progreso_recorrido}%` }} />
          </div>
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-amber/10 text-accent-amber">
          <ArrowRight className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Próxima Acción</CardTitle>
          <p className="mt-1 text-lg font-bold leading-snug text-main">{proxima_accion}</p>
        </div>
      </Card>
    </div>
  )
}
