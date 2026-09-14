import { useOnboarding } from '../../context/OnboardingContext.jsx'
import PanelEstadoProyecto from './PanelEstadoProyecto.jsx'
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
 * Cuadrícula asimétrica al estilo de un panel analítico: una columna
 * estrecha a la izquierda con el estado del proyecto (score en donut, fase
 * y próxima acción) y una ancha a la derecha con el detalle que lo
 * sustenta (dimensiones y calidad de la evidencia). Debajo, a todo lo
 * ancho, la tesorería y el recorrido.
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
      {/* Cuadrícula asimétrica 35 / 65 a partir de `lg`. Por debajo, las
          dos columnas se apilan y el estado del proyecto queda arriba. */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)]">
        <PanelEstadoProyecto resumen={resumen} />

        <div className="space-y-6">
          <DimensionesDiagnostico resumen={resumen} />
          <CalidadEvidenciaBars calidadEvidencia={calidadEvidencia} />
        </div>
      </div>

      {/* Tesorería y recorrido, a todo lo ancho. El semáforo es visible en
          todos los planes: una alerta de liquidez no debe quedar tras un
          paywall. */}
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
