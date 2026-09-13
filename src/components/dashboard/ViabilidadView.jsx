import { useOnboarding } from '../../context/OnboardingContext.jsx'
import IndicadoresViabilidad from './IndicadoresViabilidad.jsx'
import LineChartEscenarios from './LineChartEscenarios.jsx'
import SupuestosClave from './SupuestosClave.jsx'
import SemaforoSupervivencia from '../SemaforoSupervivencia.jsx'
import PaywallCard from './PaywallCard.jsx'
import { usePlan } from '../../context/PlanContext.jsx'
import { tieneAcceso } from '../../utils/planes.js'
import {
  derivarMetricasViabilidad,
  derivarEscenariosCaja,
  derivarSupuestosViabilidad,
  derivarAlertasFinancieras,
} from '../../utils/viabilidadDiagnostico.js'

/**
 * Ensambla la pestaña "Viabilidad" — "¿Qué muestran los números bajo los
 * supuestos utilizados?" (PMV, Fase Semilla): título, fila de métricas
 * derivadas del diagnóstico y un bloque principal de dos columnas
 * (escenarios de saldo de caja + panel de Supuestos Clave).
 *
 * Todas las cifras salen del bloque financiero del cuestionario (p16-p20);
 * no hay datos simulados. Lo que el diagnóstico no sostiene (Punto Muerto,
 * VAN, TIR) se declara pendiente en lugar de rellenarse.
 *
 * Gating: pestaña bloqueada por completo con los planes 'report' y
 * 'assist'. Accesible exclusivamente con 'total'.
 */
export default function ViabilidadView() {
  const { plan } = usePlan()
  const { respuestas } = useOnboarding()

  // Derivaciones del diagnóstico real. Devuelven `null` o listas vacías sin
  // diagnóstico cargado; cada componente muestra entonces su placeholder.
  const metricas = derivarMetricasViabilidad(respuestas)
  const escenarios = derivarEscenariosCaja(respuestas)
  const supuestos = derivarSupuestosViabilidad(respuestas)
  const alertas = derivarAlertasFinancieras(respuestas)

  if (!tieneAcceso(plan, 'total')) {
    // El semáforo queda exento del paywall: es un indicador de riesgo
    // construido con datos que el propio usuario ha declarado.
    return (
      <div className="space-y-8">
        <SemaforoSupervivencia />

        <div className="flex min-h-[320px] items-center justify-center">
          <PaywallCard
            planRequerido="total"
            titulo="La Viabilidad financiera se desbloquea con Launch Total"
            mensaje="Accede a las proyecciones financieras completas y agenda una sesión con un mentor sénior con Launch Total."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Título principal de la pestaña */}
      <div>
        <h1 className="text-2xl font-bold text-[#1F2937]">
          ¿Qué muestran los números bajo los supuestos utilizados?
        </h1>
        <p className="mt-1 text-sm text-[#4B5563]">
          Las cifras de esta pestaña se construyen con las variables financieras que has declarado en
          el diagnóstico; no son un resultado garantizado.
        </p>
      </div>

      {/* Fila superior: métricas derivadas + indicadores pendientes de datos */}
      <IndicadoresViabilidad metricas={metricas} />

      {/* Semáforo de supervivencia: tesorería y estructura de capital declaradas */}
      <SemaforoSupervivencia />

      {/* Bloque principal: escenarios de caja + panel de Supuestos Clave */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        <LineChartEscenarios escenarios={escenarios} />
        <SupuestosClave supuestosClave={supuestos} alertas={alertas} />
      </div>

      {/* Aviso Legal */}
      <p className="border-t border-card-border pt-4 text-xs text-[#4B5563]">
        Prediagnóstico asistido por IA. No constituye certificación de viabilidad, garantía de
        financiación ni asesoramiento jurídico, fiscal o financiero.
      </p>
    </div>
  )
}
