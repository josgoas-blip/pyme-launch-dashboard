import { useOnboarding } from '../../context/OnboardingContext.jsx'
import IndicadoresViabilidad from './IndicadoresViabilidad.jsx'
import LineChartEscenarios from './LineChartEscenarios.jsx'
import SupuestosClave from './SupuestosClave.jsx'
import SemaforoSupervivencia from '../SemaforoSupervivencia.jsx'
import PaywallCard from './PaywallCard.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { tieneAcceso } from '../../utils/planes.js'

/**
 * Ensambla la pestaña "Viabilidad" — "¿Qué muestran los números bajo los
 * supuestos utilizados?" (PMV, Fase Semilla): título, fila de 4 métricas
 * proyectadas y un bloque principal de dos columnas (escenarios de flujo de
 * caja + panel de Supuestos Clave). Las cifras son proyecciones
 * condicionadas, no datos de una empresa operativa.
 *
 * Gating: pestaña bloqueada por completo con los planes 'report' y
 * 'assist'. Accesible exclusivamente con 'total'.
 */
export default function ViabilidadView() {
  const { plan } = usePlan()
  const { datos } = useOnboarding()
  const { metricasProyectadas, escenariosVan, supuestosClave } = datos.viabilidad

  if (!tieneAcceso(plan, 'total')) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <PaywallCard
          planRequerido="total"
          titulo="La Viabilidad financiera se desbloquea con Launch Total"
          mensaje="Accede a las proyecciones financieras completas y agenda una sesión con un mentor sénior con Launch Total."
        />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Título principal de la pestaña */}
      <div>
        <h1 className="text-2xl font-bold text-main">
          ¿Qué muestran los números bajo los supuestos utilizados?
        </h1>
        <p className="mt-1 text-sm text-muted">
          Las cifras de esta pestaña son una simulación construida a partir de los supuestos clave
          indicados; no son un resultado garantizado.
        </p>
      </div>

      {/* Fila superior: 4 métricas principales proyectadas */}
      <IndicadoresViabilidad metricasProyectadas={metricasProyectadas} />

      {/* Semáforo de supervivencia: tesorería y estructura de capital declaradas */}
      <SemaforoSupervivencia />

      {/* Bloque principal: gráfico de escenarios + panel de Supuestos Clave */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        <LineChartEscenarios escenariosVan={escenariosVan} />
        <SupuestosClave supuestosClave={supuestosClave} />
      </div>

      {/* Aviso Legal */}
      <p className="border-t border-card-border pt-4 text-xs text-muted">
        Prediagnóstico asistido por IA. No constituye certificación de viabilidad, garantía de
        financiación ni asesoramiento jurídico, fiscal o financiero.
      </p>
    </div>
  )
}
