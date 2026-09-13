import { useOnboarding } from '../../context/OnboardingContext.jsx'
import BloqueHeader from './BloqueHeader.jsx'
import MatrizCameScatter from './MatrizCameScatter.jsx'
import BarraMitigacionRiesgos from './BarraMitigacionRiesgos.jsx'
import MatrizCanalesCaptacion from './MatrizCanalesCaptacion.jsx'
import FunnelConversionDigital from './FunnelConversionDigital.jsx'
import EscaleraOfertasPricing from './EscaleraOfertasPricing.jsx'
import PlanAccionCameDetail from './PlanAccionCameDetail.jsx'
import PaywallCard from './PaywallCard.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { tieneAcceso } from '../../utils/planes.js'
import { derivarAdquisicion, derivarMonetizacion } from '../../utils/estrategiaDiagnostico.js'
import { derivarPlanAccion } from '../../utils/planAccionDiagnostico.js'

/**
 * Ensambla la pestaña "Estrategia" — "¿Qué debería trabajar ahora?": 3
 * bloques de lectura progresiva (1) Priorización CAME y Plan de
 * Mitigación, (2) Adquisición y Funnel de Conversión Digital,
 * (3) Monetización y Acciones Sugeridas.
 *
 * Gating: pestaña bloqueada por completo con el plan 'report'. Requiere,
 * como mínimo, 'assist'.
 */
export default function EstrategiaView() {
  const { plan } = usePlan()
  const { datos, respuestas } = useOnboarding()
  const { iniciativasCame, mitigacionRiesgos, funnelConversion } = datos.estrategia

  // Bloques conectados al diagnóstico real (p12 y p10). Devuelven `null`
  // cuando no hay diagnóstico cargado; los componentes muestran entonces un
  // placeholder en lugar de datos ficticios.
  const adquisicion = derivarAdquisicion(respuestas)
  const monetizacion = derivarMonetizacion(respuestas)

  // Plan de Acción: horizontes y tareas derivados de las penalizaciones del
  // modelo, de las respuestas más bajas y de la fase del embudo.
  const planAccion = derivarPlanAccion(respuestas)

  if (!tieneAcceso(plan, 'assist')) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <PaywallCard
          planRequerido="assist"
          titulo="La Estrategia se desbloquea con Launch Assist"
          mensaje="Prioriza iniciativas, canales de captación y tu plan de acción con el acompañamiento de Launch Assist."
        />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Título principal de la pestaña */}
      <div>
        <h1 className="text-2xl font-bold text-main">¿Qué debería trabajar ahora?</h1>
        <p className="mt-1 text-sm text-muted">
          Priorización de iniciativas y recomendaciones para las próximas decisiones del proyecto.
        </p>
      </div>

      {/* BLOQUE 1: Priorización CAME y Plan de Mitigación */}
      <section className="space-y-4">
        <BloqueHeader
          numero={1}
          titulo="Priorización CAME y Plan de Mitigación"
          subtitulo="Matriz Impacto vs Esfuerzo y avance en la mitigación de riesgos"
        />
        <MatrizCameScatter iniciativasCame={iniciativasCame} />
        <BarraMitigacionRiesgos mitigacionRiesgos={mitigacionRiesgos} />
      </section>

      {/* BLOQUE 2: Adquisición y Funnel de Conversión Digital */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={2}
          titulo="Adquisición y Funnel de Conversión Digital"
          subtitulo="Canales de captación y embudo de conversión de prospectos"
        />
        <MatrizCanalesCaptacion adquisicion={adquisicion} />
        <FunnelConversionDigital funnelConversion={funnelConversion} />
      </section>

      {/* BLOQUE 3: Monetización y Acciones Sugeridas */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Monetización y Plan de Acción"
          subtitulo="Escalera de ofertas y plan escalonado a 6 meses según tu diagnóstico"
        />
        <EscaleraOfertasPricing monetizacion={monetizacion} />
        <PlanAccionCameDetail plan={planAccion} />
      </section>
    </div>
  )
}
