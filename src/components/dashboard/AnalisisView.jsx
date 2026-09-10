import { useOnboarding } from '../../context/OnboardingContext.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { tieneAcceso } from '../../utils/planes.js'
import DobleIndicador from './DobleIndicador.jsx'
import EvolucionScoringChart from './EvolucionScoringChart.jsx'
import RiesgoDafoGauge from './RiesgoDafoGauge.jsx'
import AnalisisSensibilidadGrid from './AnalisisSensibilidadGrid.jsx'
import AnalisisMercadoGrid from './AnalisisMercadoGrid.jsx'
import BenchmarkSectorialBar from './BenchmarkSectorialBar.jsx'
import RadarPestel from './RadarPestel.jsx'
import RadarPorter from './RadarPorter.jsx'
import BloqueHeader from './BloqueHeader.jsx'
import SeccionBloqueada from './SeccionBloqueada.jsx'

const MENSAJE_GATING_AVANZADO =
  'Desbloquea el análisis de mercado y entorno estructural con Launch Assist'

/**
 * Ensambla la pestaña "Análisis" — "¿Qué sabemos del proyecto?": Doble
 * Indicador de cabecera + 4 bloques de análisis progresivo: (1) Progreso y
 * Riesgo, (2) Analítica de Sensibilidad, (3) Métricas de Mercado &
 * Entorno, (4) Entornos Estructurales.
 *
 * Gating: con el plan 'report' solo el Bloque 1 (Scoring de Viabilidad +
 * Matriz DAFO) está desbloqueado; los Bloques 2-4 muestran una tarjeta de
 * Paywall sobre el contenido difuminado. Requieren, como mínimo, 'assist'.
 */
export default function AnalisisView() {
  const { plan } = usePlan()
  const accesoAvanzado = tieneAcceso(plan, 'assist')
  const { datos } = useOnboarding()
  const {
    indiceMadurez,
    indiceSolidezEvidencia,
    riesgoDafo,
    metricasMercado,
    ejesPestel,
    fuerzasPorter,
    evolucionScoring,
    analisisSensibilidad,
    benchmarkSectorial,
  } = datos.analisis

  return (
    <div className="space-y-10">
      {/* Doble Indicador: madurez del proyecto + solidez de la evidencia */}
      <DobleIndicador indiceMadurez={indiceMadurez} indiceSolidezEvidencia={indiceSolidezEvidencia} />

      {/* BLOQUE 1: Progreso y Riesgo — desbloqueado en todos los planes */}
      <section className="space-y-4">
        <BloqueHeader
          numero={1}
          titulo="Progreso y Riesgo"
          subtitulo="Evolución del scoring de viabilidad y análisis DAFO"
        />
        <EvolucionScoringChart evolucionScoring={evolucionScoring} />
        <RiesgoDafoGauge riesgoDafo={riesgoDafo} />
      </section>

      {/* BLOQUE 2: Analítica de Sensibilidad — requiere 'assist' */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={2}
          titulo="Analítica de Sensibilidad"
          subtitulo="Umbrales de tolerancia al riesgo del proyecto"
        />
        {accesoAvanzado ? (
          <AnalisisSensibilidadGrid analisisSensibilidad={analisisSensibilidad} />
        ) : (
          <SeccionBloqueada mensaje={MENSAJE_GATING_AVANZADO} planRequerido="assist">
            <AnalisisSensibilidadGrid analisisSensibilidad={analisisSensibilidad} />
          </SeccionBloqueada>
        )}
      </section>

      {/* BLOQUE 3: Métricas de Mercado & Entorno — requiere 'assist' */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Métricas de Mercado & Entorno"
          subtitulo="Tamaño de mercado y benchmark sectorial, con su procedencia"
        />
        {accesoAvanzado ? (
          <>
            <AnalisisMercadoGrid metricasMercado={metricasMercado} />
            <BenchmarkSectorialBar benchmarkSectorial={benchmarkSectorial} />
          </>
        ) : (
          <SeccionBloqueada mensaje={MENSAJE_GATING_AVANZADO} planRequerido="assist">
            <div className="space-y-6">
              <AnalisisMercadoGrid metricasMercado={metricasMercado} />
              <BenchmarkSectorialBar benchmarkSectorial={benchmarkSectorial} />
            </div>
          </SeccionBloqueada>
        )}
      </section>

      {/* BLOQUE 4: Entornos Estructurales — requiere 'assist' */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={4}
          titulo="Entornos Estructurales"
          subtitulo="PESTEL y 5 Fuerzas de Porter"
        />
        {accesoAvanzado ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RadarPestel ejesPestel={ejesPestel} />
            <RadarPorter fuerzasPorter={fuerzasPorter} />
          </div>
        ) : (
          <SeccionBloqueada mensaje={MENSAJE_GATING_AVANZADO} planRequerido="assist">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <RadarPestel ejesPestel={ejesPestel} />
              <RadarPorter fuerzasPorter={fuerzasPorter} />
            </div>
          </SeccionBloqueada>
        )}
      </section>
    </div>
  )
}
