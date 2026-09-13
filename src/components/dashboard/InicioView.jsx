import { useOnboarding } from '../../context/OnboardingContext.jsx'
import TarjetasEjecutivasFase from './TarjetasEjecutivasFase.jsx'
import DimensionesDiagnostico from './DimensionesDiagnostico.jsx'
import CalidadEvidenciaBars from './CalidadEvidenciaBars.jsx'
import RecorridoProyecto from './RecorridoProyecto.jsx'
import SemaforoSupervivencia from '../SemaforoSupervivencia.jsx'
import {
  derivarResumenGlobal,
  derivarCalidadEvidencia,
  derivarRecorrido,
} from '../../utils/resumenDiagnostico.js'

/**
 * Ensambla el Resumen General — pestaña "Inicio", donde aterriza el usuario
 * al salir del cuestionario: "¿Dónde estoy y qué me falta?".
 *
 * Todo lo que muestra sale del diagnóstico real (`respuestas`), sin mocks:
 * el score y la fase son los mismos que vio en la pantalla final del
 * onboarding, y las cuatro dimensiones, las alertas y el recorrido se
 * derivan del mismo `calcularDiagnostico` que produce ese score.
 */
export default function InicioView() {
  const { respuestas } = useOnboarding()

  const resumen = derivarResumenGlobal(respuestas)
  const calidadEvidencia = derivarCalidadEvidencia(respuestas)
  const recorridoProyecto = derivarRecorrido(respuestas)

  return (
    <div className="space-y-6">
      {/* Cabecera: score global, fase del embudo y próxima acción */}
      <TarjetasEjecutivasFase resumen={resumen} />

      {/* Desglose por dimensión + alertas que penalizan el score */}
      <DimensionesDiagnostico resumen={resumen} />

      {/* Ratio de supervivencia de tesorería: visible en todos los planes,
          porque una alerta de liquidez no debe quedar tras un paywall. */}
      <SemaforoSupervivencia />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CalidadEvidenciaBars calidadEvidencia={calidadEvidencia} />
        <RecorridoProyecto recorridoProyecto={recorridoProyecto} />
      </div>

      <p className="text-xs text-[#4B5563]">
        Aviso del PMV: Los indicadores son demostrativos y dependen de la información aportada. No
        constituyen una certificación de viabilidad.
      </p>
    </div>
  )
}
