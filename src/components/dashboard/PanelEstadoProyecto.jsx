import { Compass, ArrowRight } from 'lucide-react'
import { Card, CardTitle } from '../ui/Card.jsx'
import ScoreCircular from './ScoreCircular.jsx'

/**
 * Color del donut según el tramo del score. Mismos cortes semafóricos que
 * el resto del panel (33/66), para que la lectura de color sea la misma en
 * todas las vistas.
 */
function colorScore(score) {
  if (score < 33) return '#E53E3E'
  if (score < 66) return '#DD6B20'
  return '#1B4D3E'
}

/**
 * Columna izquierda del Resumen General: el estado del proyecto de un
 * vistazo — score global en donut, fase del embudo y próxima acción.
 *
 * Las tres cifras son las mismas que vio el usuario en la pantalla final
 * del cuestionario. Esto es solo presentación: llegan ya calculadas en
 * `resumen`.
 *
 * @param {{ resumen: ReturnType<typeof import('../../utils/resumenDiagnostico.js').derivarResumenGlobal> }} props
 */
export default function PanelEstadoProyecto({ resumen }) {
  if (!resumen) {
    return (
      <Card className="border-gray-100">
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
    <div className="space-y-4">
      {/* Score global en donut */}
      <Card className="border-gray-100">
        <CardTitle>Score Global</CardTitle>
        <div className="mt-4 flex justify-center">
          <ScoreCircular valor={score} color={colorScore(score)} />
        </div>
        <p className="mt-4 text-center text-xs leading-snug text-[#4B5563]">
          Ponderación de las cuatro dimensiones del diagnóstico
        </p>
      </Card>

      {/* Fase del embudo */}
      <Card className="flex items-start gap-3 border-gray-100">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Fase del embudo</CardTitle>
          <p className="mt-1 truncate text-lg font-bold text-[#1F2937]">{fase}</p>
          <p className="mt-0.5 text-xs text-[#4B5563]">Según el modelo de 20 variables</p>
        </div>
      </Card>

      {/* Próxima acción */}
      <Card className="flex items-start gap-3 border-gray-100">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-amber/10 text-accent-amber">
          <ArrowRight className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <CardTitle>Próxima acción</CardTitle>
          <p className="mt-1 text-base font-bold leading-snug text-[#1F2937]">
            {proximaAccion ?? 'Revisa tu plan de acción en Estrategia'}
          </p>
        </div>
      </Card>
    </div>
  )
}
