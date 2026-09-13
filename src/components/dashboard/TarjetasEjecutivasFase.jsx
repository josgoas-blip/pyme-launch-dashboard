import { Compass, Gauge, ArrowRight } from 'lucide-react'
import { Card, CardTitle, KpiNumber } from '../ui/Card.jsx'

/**
 * Cabecera del Resumen General: Score Global, Fase del embudo y Próxima
 * acción. Las tres salen del diagnóstico y son exactamente las mismas
 * cifras que el usuario vio en la pantalla final del cuestionario: el
 * `score_total` sobre 100 y la `fase_embudo` sin reetiquetar.
 *
 * @param {{ resumen: ReturnType<typeof import('../../utils/resumenDiagnostico.js').derivarResumenGlobal> }} props
 */
export default function TarjetasEjecutivasFase({ resumen }) {
  if (!resumen) {
    return (
      <Card>
        <CardTitle>Resumen general</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el diagnóstico para ver tu score global, tu fase y la próxima acción
          recomendada.
        </p>
      </Card>
    )
  }

  const { score, fase, proximaAccion } = resumen

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gauge className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle>Score Global</CardTitle>
          <div className="mt-1 flex items-baseline gap-1">
            <KpiNumber>{score}</KpiNumber>
            <span className="text-sm font-semibold text-[#4B5563]">/100</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
          </div>
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Fase del embudo</CardTitle>
          <p className="mt-1 truncate text-lg font-bold text-[#1F2937]">{fase}</p>
          <p className="mt-0.5 text-xs text-[#4B5563]">Según el modelo de 20 variables</p>
        </div>
      </Card>

      <Card className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-amber/10 text-accent-amber">
          <ArrowRight className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Próxima Acción</CardTitle>
          <p className="mt-1 text-lg font-bold leading-snug text-[#1F2937]">
            {proximaAccion ?? 'Revisa tu plan de acción en Estrategia'}
          </p>
        </div>
      </Card>
    </div>
  )
}
