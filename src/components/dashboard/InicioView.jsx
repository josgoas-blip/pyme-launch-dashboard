import { controlProyecto, calidadEvidencia, recorridoProyecto } from '../../data/dashboardMock.js'
import TarjetasEjecutivasFase from './TarjetasEjecutivasFase.jsx'
import CalidadEvidenciaBars from './CalidadEvidenciaBars.jsx'
import RecorridoProyecto from './RecorridoProyecto.jsx'

/**
 * Ensambla la pestaña "Inicio" — PMV Fase Semilla: "¿Dónde estoy y qué me
 * falta?". Usa los datos simulados de src/data/dashboardMock.js.
 */
export default function InicioView() {
  return (
    <div className="space-y-6">
      <TarjetasEjecutivasFase controlProyecto={controlProyecto} />

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
