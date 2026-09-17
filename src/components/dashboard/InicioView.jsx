import { useOnboarding } from '../../context/OnboardingContext.jsx'
import PanelEstadoProyecto from './PanelEstadoProyecto.jsx'
import RiesgosActivos from './RiesgosActivos.jsx'
import DimensionesDiagnostico from './DimensionesDiagnostico.jsx'
import CalidadEvidenciaBars from './CalidadEvidenciaBars.jsx'
import RecorridoProyecto from './RecorridoProyecto.jsx'
import HojaRutaHitos from './HojaRutaHitos.jsx'
import MetricasOperativasCard from './MetricasOperativasCard.jsx'
import { useProjectDashboard } from '../../hooks/useProjectDashboard.js'
import SemaforoSupervivencia from '../SemaforoSupervivencia.jsx'
import {
  derivarResumenGlobal,
  derivarCalidadEvidencia,
  derivarRecorrido,
} from '../../utils/resumenDiagnostico.js'
import { derivarRiesgosActivos } from '../../utils/riesgosDiagnostico.js'
import { derivarPlanAccion } from '../../utils/planAccionDiagnostico.js'

/**
 * Ensambla el Resumen General — pestaña "Inicio", donde aterriza el usuario
 * al salir del cuestionario: "¿Dónde estoy y qué me falta?".
 *
 * Cuadrícula asimétrica al estilo de un panel analítico. La columna
 * estrecha de la izquierda responde a "¿cómo estoy y qué me puede matar?"
 * —score, fase, próxima acción y riesgos activos—; la ancha de la derecha,
 * a "¿en qué me baso?" —dimensiones y solidez de la validación—. Debajo, a
 * todo lo ancho, la tesorería, el recorrido y la hoja de ruta a 30 días.
 *
 * Todo sale del diagnóstico real (`respuestas`), sin mocks, y esta vista
 * solo compone: las cifras llegan ya derivadas de los módulos puros.
 *
 * Aparte del diagnóstico, el seguimiento del proyecto activo en Supabase
 * (`useProjectDashboard`): sus métricas operativas y, si los tiene, sus
 * hitos, que sustituyen a los derivados del cuestionario en la hoja de
 * ruta. Se consulta una sola vez aquí y se reparte a las dos tarjetas.
 */
export default function InicioView() {
  const { respuestas } = useOnboarding()

  const resumen = derivarResumenGlobal(respuestas)
  const calidadEvidencia = derivarCalidadEvidencia(respuestas)
  const recorridoProyecto = derivarRecorrido(respuestas)
  const riesgos = derivarRiesgosActivos(respuestas)
  const plan = derivarPlanAccion(respuestas)
  const proyecto = useProjectDashboard()

  return (
    <div className="space-y-6">
      {/* Cuadrícula asimétrica 35 / 65 a partir de `lg`. Por debajo, las
          dos columnas se apilan y el estado del proyecto queda arriba. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
        <div className="space-y-6">
          <PanelEstadoProyecto resumen={resumen} />
          <RiesgosActivos riesgos={riesgos} />
        </div>

        <div className="space-y-6">
          <DimensionesDiagnostico resumen={resumen} />
          <CalidadEvidenciaBars calidadEvidencia={calidadEvidencia} />
        </div>
      </div>

      {/* Métricas de seguimiento del proyecto: lo que pasa en el negocio
          después del diagnóstico. */}
      <MetricasOperativasCard datos={proyecto} />

      {/* Hoja de ruta: hitos del proyecto o, sin ellos, los del diagnóstico. */}
      <HojaRutaHitos plan={plan} proyecto={proyecto} />

      {/* Tesorería y recorrido. El semáforo es visible en todos los planes:
          una alerta de liquidez no debe quedar tras un paywall. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
        <SemaforoSupervivencia />
        <RecorridoProyecto recorridoProyecto={recorridoProyecto} />
      </div>

      <p className="text-xs text-[#4B5563]">
        Aviso del PMV: Los indicadores son demostrativos y dependen de la información aportada. No
        constituyen una certificación de viabilidad.
      </p>
    </div>
  )
}
