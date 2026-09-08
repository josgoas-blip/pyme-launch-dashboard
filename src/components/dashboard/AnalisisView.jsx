import {
  indiceMadurez,
  indiceSolidezEvidencia,
  riesgoDafo,
  metricasMercado,
  ejesPestel,
  fuerzasPorter,
  evolucionScoring,
  analisisSensibilidad,
  benchmarkSectorial,
} from '../../data/analisisMock.js'
import DobleIndicador from './DobleIndicador.jsx'
import EvolucionScoringChart from './EvolucionScoringChart.jsx'
import RiesgoDafoGauge from './RiesgoDafoGauge.jsx'
import AnalisisSensibilidadGrid from './AnalisisSensibilidadGrid.jsx'
import AnalisisMercadoGrid from './AnalisisMercadoGrid.jsx'
import BenchmarkSectorialBar from './BenchmarkSectorialBar.jsx'
import RadarPestel from './RadarPestel.jsx'
import RadarPorter from './RadarPorter.jsx'
import BloqueHeader from './BloqueHeader.jsx'

/**
 * Ensambla la pestaña "Análisis" — "¿Qué sabemos del proyecto?": Doble
 * Indicador de cabecera + 4 bloques de análisis progresivo: (1) Progreso y
 * Riesgo, (2) Analítica de Sensibilidad, (3) Métricas de Mercado &
 * Entorno, (4) Entornos Estructurales.
 */
export default function AnalisisView() {
  return (
    <div className="space-y-10">
      {/* Doble Indicador: madurez del proyecto + solidez de la evidencia */}
      <DobleIndicador indiceMadurez={indiceMadurez} indiceSolidezEvidencia={indiceSolidezEvidencia} />

      {/* BLOQUE 1: Progreso y Riesgo */}
      <section className="space-y-4">
        <BloqueHeader
          numero={1}
          titulo="Progreso y Riesgo"
          subtitulo="Evolución del scoring de viabilidad y análisis DAFO"
        />
        <EvolucionScoringChart evolucionScoring={evolucionScoring} />
        <RiesgoDafoGauge riesgoDafo={riesgoDafo} />
      </section>

      {/* BLOQUE 2: Analítica de Sensibilidad */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={2}
          titulo="Analítica de Sensibilidad"
          subtitulo="Umbrales de tolerancia al riesgo del proyecto"
        />
        <AnalisisSensibilidadGrid analisisSensibilidad={analisisSensibilidad} />
      </section>

      {/* BLOQUE 3: Métricas de Mercado & Entorno */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={3}
          titulo="Métricas de Mercado & Entorno"
          subtitulo="Tamaño de mercado y benchmark sectorial, con su procedencia"
        />
        <AnalisisMercadoGrid metricasMercado={metricasMercado} />
        <BenchmarkSectorialBar benchmarkSectorial={benchmarkSectorial} />
      </section>

      {/* BLOQUE 4: Entornos Estructurales */}
      <section className="space-y-4 border-t border-card-border pt-8">
        <BloqueHeader
          numero={4}
          titulo="Entornos Estructurales"
          subtitulo="PESTEL y 5 Fuerzas de Porter"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RadarPestel ejesPestel={ejesPestel} />
          <RadarPorter fuerzasPorter={fuerzasPorter} />
        </div>
      </section>
    </div>
  )
}
