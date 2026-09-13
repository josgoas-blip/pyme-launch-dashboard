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
import AvisoModuloPendiente from './AvisoModuloPendiente.jsx'

const MENSAJE_GATING_AVANZADO =
  'Desbloquea el análisis de mercado y entorno estructural con Launch Assist'

/**
 * Avisos de calibración por bloque.
 *
 * El cuestionario de 20 variables no recoge entorno sectorial, costes
 * unitarios ni histórico de revisiones, así que estos cuadrantes se pintan
 * con perfiles de referencia. Decirlo antes de que el usuario lea las
 * cifras evita que las tome por un análisis de su propio proyecto.
 */
const AVISOS = {
  progresoRiesgo:
    'El scoring del Doble Indicador sí es el tuyo. La evolución histórica y la matriz DAFO, en cambio, usan un perfil de referencia: el diagnóstico todavía no guarda revisiones anteriores ni pregunta por tus debilidades y amenazas concretas.',
  sensibilidad:
    'Los umbrales de tolerancia son valores sectoriales de referencia. Se calcularán con tus costes fijos, tu margen de contribución y tu volumen previsto en cuanto el diagnóstico incorpore esas preguntas.',
  mercado:
    'TAM, SAM, SOM y el benchmark son magnitudes sectoriales de referencia, no una medición de tu mercado. Se activarán con tu sector, tu ámbito geográfico y tu ticket medio.',
  estructurales:
    'Módulo cualitativo en calibración sectorial: PESTEL y las 5 Fuerzas de Porter se muestran con un perfil de referencia. Los marcos estratégicos avanzados se activarán con las preguntas específicas de tu sector.',
}

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
        <AvisoModuloPendiente mensaje={AVISOS.progresoRiesgo} />
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
        <AvisoModuloPendiente mensaje={AVISOS.sensibilidad} />
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
        <AvisoModuloPendiente mensaje={AVISOS.mercado} />
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
        <AvisoModuloPendiente mensaje={AVISOS.estructurales} />
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
