import { CalendarClock } from 'lucide-react'
import { Card, CardTitle, Badge } from '../ui/Card.jsx'

// Color semafórico por prioridad (design.md): Alta = alerta roja, Media = advertencia ámbar.
const ESTILO_POR_PRIORIDAD = {
  Alta: 'bg-accent-red/10 text-accent-red',
  Media: 'bg-accent-amber/10 text-accent-amber',
  Baja: 'bg-accent-green/10 text-accent-green',
}

/**
 * Cuadrante "Plan de Acción": las recomendaciones de prevalidación de la
 * Fase Semilla escalonadas en tres horizontes (0-30, 30-90 y 90-180 días).
 *
 * Cada acción sale de una respuesta concreta del diagnóstico —una
 * penalización del modelo o una pregunta con puntuación baja— y cita en su
 * justificación la cifra o la etiqueta que la motiva, además de la pestaña
 * donde el usuario puede ver esa evidencia. Los primeros 30 días los ocupan
 * siempre las alertas críticas de Viabilidad, que son las que pueden
 * bloquear el proyecto entero.
 *
 * @param {{ plan: ReturnType<typeof import('../../utils/planAccionDiagnostico.js').derivarPlanAccion> }} props
 */
export default function PlanAccionCameDetail({ plan }) {
  if (!plan) {
    return (
      <Card>
        <CardTitle>Plan de Acción</CardTitle>
        <p className="mt-3 text-sm text-[#4B5563]">
          Completa el diagnóstico para ver tu plan. Las acciones se construyen con tus propias
          respuestas: aquí no hay una lista de tareas genérica.
        </p>
      </Card>
    )
  }

  const { fase, enfoque, totalAcciones, totalCriticas, horizontes } = plan

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Plan de Acción</CardTitle>
          <p className="mt-1 text-xs text-[#4B5563]">
            {totalAcciones} acciones derivadas de tu diagnóstico · fase de {fase}
          </p>
        </div>
        {totalCriticas > 0 && (
          <Badge className="shrink-0 bg-accent-red/10 text-accent-red">
            {totalCriticas} {totalCriticas === 1 ? 'alerta crítica' : 'alertas críticas'}
          </Badge>
        )}
      </div>

      <p className="mt-3 rounded-xl bg-canvas px-4 py-3 text-sm leading-snug text-[#1F2937]">
        {enfoque}
      </p>

      <div className="mt-5 space-y-6">
        {horizontes.map((horizonte) => (
          <section key={horizonte.id}>
            {/* Cabecera del tramo temporal */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="flex items-center gap-1.5 text-sm font-bold text-[#1F2937]">
                <CalendarClock className="h-4 w-4 shrink-0 text-primary" />
                {horizonte.etiqueta}
              </span>
              <Badge className="bg-primary/10 text-primary">{horizonte.rango}</Badge>
            </div>
            <p className="mt-1 text-xs text-[#4B5563]">{horizonte.foco}</p>

            <ol className="mt-3 space-y-4 border-l-2 border-card-border pl-4">
              {horizonte.acciones.map((accion) => (
                <li key={accion.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#1F2937]">{accion.titulo}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTILO_POR_PRIORIDAD[accion.prioridad]}`}
                    >
                      Prioridad {accion.prioridad}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-[#4B5563]">
                    {accion.justificacion}{' '}
                    <span className="font-semibold text-[#1F2937]">Ver en {accion.origen}.</span>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <p className="mt-5 border-t border-card-border pt-3 text-xs text-[#4B5563]">
        Recomendaciones, no instrucciones. El emprendedor conserva la decisión final.
      </p>
    </Card>
  )
}
