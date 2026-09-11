import { useOnboarding } from '../../context/OnboardingContext.jsx'
import TarjetasEjecutivasFase from './TarjetasEjecutivasFase.jsx'
import CalidadEvidenciaBars from './CalidadEvidenciaBars.jsx'
import RecorridoProyecto from './RecorridoProyecto.jsx'
import SemaforoSupervivencia from '../SemaforoSupervivencia.jsx'

/**
 * Ensambla la pestaña "Inicio" — PMV Fase Semilla: "¿Dónde estoy y qué me
 * falta?". Los datos vienen del diagnóstico adaptado (OnboardingContext),
 * con los mocks de src/data/dashboardMock.js como respaldo.
 */
export default function InicioView() {
  const { datos } = useOnboarding()
  const { controlProyecto, calidadEvidencia, recorridoProyecto } = datos.inicio

  return (
    <div className="space-y-6">
      <TarjetasEjecutivasFase controlProyecto={controlProyecto} />

      {/* Ratio de supervivencia de tesorería: visible en todos los planes,
          porque una alerta de liquidez no debe quedar tras un paywall. */}
      <SemaforoSupervivencia />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CalidadEvidenciaBars calidadEvidencia={calidadEvidencia} />
        <RecorridoProyecto recorridoProyecto={recorridoProyecto} />
      </div>

      <p className="text-xs text-muted">
        Aviso del PMV: Los indicadores son demostrativos y dependen de la información aportada. No
        constituyen una certificación de viabilidad.
      </p>
    </div>
  )
}
