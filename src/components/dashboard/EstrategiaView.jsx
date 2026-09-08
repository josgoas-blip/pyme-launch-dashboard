import {
  iniciativasCame,
  mitigacionRiesgos,
  canalesCaptacion,
  funnelConversion,
  escaleraOfertas,
  accionesSugeridas,
} from '../../data/estrategiaMock.js'
import BloqueHeader from './BloqueHeader.jsx'
import MatrizCameScatter from './MatrizCameScatter.jsx'
import BarraMitigacionRiesgos from './BarraMitigacionRiesgos.jsx'
import MatrizCanalesCaptacion from './MatrizCanalesCaptacion.jsx'
import FunnelConversionDigital from './FunnelConversionDigital.jsx'
import EscaleraOfertasPricing from './EscaleraOfertasPricing.jsx'
import PlanAccionCameDetail from './PlanAccionCameDetail.jsx'

/**
 * Ensambla la pestaña "Estrategia" — "¿Qué debería trabajar ahora?": 3
 * bloques de lectura progresiva (1) Priorización CAME y Plan de
 * Mitigación, (2) Adquisición y Funnel de Conversión Digital,
 * (3) Monetización y Acciones Sugeridas.
 */
export default function EstrategiaView() {
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
        <MatrizCanalesCaptacion canalesCaptacion={canalesCaptacion} />
        <FunnelConversionDigital funnelConversion={funnelConversion} />
      </section>

      {/* BLOQUE 3: Monetización y Acciones Sugeridas */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Monetización y Acciones Sugeridas"
          subtitulo="Escalera de ofertas y recomendaciones de prevalidación"
        />
        <EscaleraOfertasPricing escaleraOfertas={escaleraOfertas} />
        <PlanAccionCameDetail accionesSugeridas={accionesSugeridas} />
      </section>
    </div>
  )
}
