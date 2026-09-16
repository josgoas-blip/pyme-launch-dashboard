import { AlertTriangle, RotateCw } from 'lucide-react'
import MarcoAcceso, { MensajeAcceso, VERDE, TEXTO_SUAVE, CLASE_BOTON_PRINCIPAL, CLASE_ENLACE } from './MarcoAcceso.jsx'

/**
 * Pantalla para cuando no se puede saber si el usuario ya tiene diagnóstico.
 *
 * Existe para no llevarle al cuestionario por defecto: si la consulta falla
 * y se le manda a repetirlo, quien ya lo hizo pierde el camino a su panel.
 *
 * Dos causas, con salidas distintas:
 *   - `error`: no se pudo consultar. Se ofrece reintentar.
 *   - `ilegible`: hay diagnósticos guardados pero ninguno utilizable. Ahí
 *     reintentar no cambiaría nada, así que se ofrece empezar uno nuevo.
 *
 * @param {{
 *   motivo: 'error'|'ilegible',
 *   onReintentar: () => void,
 *   onNuevoDiagnostico: () => void,
 *   onCerrarSesion: () => void,
 * }} props
 */
export default function HistorialNoDisponible({ motivo, onReintentar, onNuevoDiagnostico, onCerrarSesion }) {
  const ilegible = motivo === 'ilegible'

  return (
    <MarcoAcceso titulo="No hemos podido abrir tu panel" subtitulo="Tu cuenta está bien; el problema es al leer tus datos.">
      <div className="space-y-4">
        <MensajeAcceso tipo="error" icono={AlertTriangle}>
          {ilegible
            ? 'Encontramos diagnósticos guardados en tu cuenta, pero ninguno se puede leer correctamente.'
            : 'No hemos podido comprobar si ya tienes un diagnóstico. Revisa tu conexión e inténtalo de nuevo.'}
        </MensajeAcceso>

        {ilegible ? (
          <button type="button" onClick={onNuevoDiagnostico} className={CLASE_BOTON_PRINCIPAL} style={{ backgroundColor: VERDE }}>
            Empezar un diagnóstico nuevo
          </button>
        ) : (
          <button type="button" onClick={onReintentar} className={CLASE_BOTON_PRINCIPAL} style={{ backgroundColor: VERDE }}>
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </button>
        )}

        <p className="text-center text-xs" style={{ color: TEXTO_SUAVE }}>
          <button type="button" onClick={onCerrarSesion} className={CLASE_ENLACE} style={{ color: VERDE }}>
            Cerrar sesión
          </button>
        </p>
      </div>
    </MarcoAcceso>
  )
}
