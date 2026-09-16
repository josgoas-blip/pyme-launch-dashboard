import { useState } from 'react'
import { Lock, Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import {
  actualizarPassword,
  validarNuevaPassword,
  LONGITUD_MINIMA_PASSWORD,
} from '../../services/authService.js'
import MarcoAcceso, {
  MensajeAcceso,
  VERDE,
  BORDE,
  TEXTO,
  TEXTO_SUAVE,
  CLASE_INPUT,
  CLASE_ETIQUETA,
  CLASE_BOTON_PRINCIPAL,
} from './MarcoAcceso.jsx'

/**
 * Pantalla de `/reset-password`: el usuario llega desde el correo de
 * recuperación y escribe su nueva contraseña.
 *
 * Supabase abre la sesión a partir de los tokens del enlace antes de que
 * esta vista se pinte (App espera a que termine de cargar la sesión), así
 * que aquí solo hay tres situaciones:
 *   - Hay sesión: se muestra el formulario y se guarda con `updateUser`.
 *   - No hay sesión, o el enlace trajo error: el enlace caducó o ya se usó;
 *     se ofrece pedir otro en lugar de un formulario que fallaría.
 *   - Contraseña cambiada: confirmación y acceso al panel.
 *
 * @param {{
 *   haySesion: boolean,
 *   errorEnlace: string|null,
 *   onTerminar: () => void,
 *   onSolicitarOtroEnlace: () => void,
 * }} props
 */
export default function RestablecerPasswordView({ haySesion, errorEnlace, onTerminar, onSolicitarOtroEnlace }) {
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [hecho, setHecho] = useState(false)

  const guardar = async (e) => {
    e.preventDefault()
    setError(null)

    const problema = validarNuevaPassword(password, confirmacion)
    if (problema) {
      setError(problema)
      return
    }

    setGuardando(true)
    const resultado = await actualizarPassword(password)
    setGuardando(false)

    if (!resultado.ok) {
      setError(resultado.motivo)
      return
    }

    // Se vacían los campos: la contraseña no debe quedarse en memoria del
    // componente más de lo imprescindible.
    setPassword('')
    setConfirmacion('')
    setHecho(true)
  }

  // ── Contraseña cambiada ─────────────────────────────────────────────
  if (hecho) {
    return (
      <MarcoAcceso titulo="Contraseña actualizada" subtitulo="Ya puedes seguir con tu diagnóstico.">
        <div className="space-y-4">
          <MensajeAcceso tipo="exito" icono={CheckCircle2}>
            Tu contraseña se ha cambiado correctamente. La próxima vez que inicies sesión, usa la nueva.
          </MensajeAcceso>
          <button type="button" onClick={onTerminar} className={CLASE_BOTON_PRINCIPAL} style={{ backgroundColor: VERDE }}>
            Ir a mi panel
          </button>
        </div>
      </MarcoAcceso>
    )
  }

  // ── Enlace no válido ────────────────────────────────────────────────
  // Un error explícito del enlace manda aunque hubiera una sesión previa en
  // el navegador: el usuario ha pulsado un enlace de recuperación y debe
  // saber que ese enlace no ha funcionado.
  if (errorEnlace || !haySesion) {
    return (
      <MarcoAcceso titulo="Enlace no válido" subtitulo="No hemos podido verificar tu solicitud.">
        <div className="space-y-4">
          <MensajeAcceso tipo="error" icono={AlertTriangle}>
            {errorEnlace ?? 'El enlace de recuperación ha caducado o ya se ha usado. Solicita uno nuevo.'}
          </MensajeAcceso>
          <button
            type="button"
            onClick={onSolicitarOtroEnlace}
            className={CLASE_BOTON_PRINCIPAL}
            style={{ backgroundColor: VERDE }}
          >
            Solicitar un enlace nuevo
          </button>
        </div>
      </MarcoAcceso>
    )
  }

  // ── Formulario ──────────────────────────────────────────────────────
  const campo = (id, etiqueta, valor, setValor, autoComplete) => (
    <div>
      <label htmlFor={id} className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
        {etiqueta}
      </label>
      <div className="relative mt-1.5">
        <Lock
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
          style={{ color: TEXTO_SUAVE }}
          aria-hidden="true"
        />
        <input
          id={id}
          type={verPassword ? 'text' : 'password'}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          autoComplete={autoComplete}
          disabled={guardando}
          placeholder={`Mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres`}
          className={`${CLASE_INPUT} pl-9 pr-10`}
          style={{ borderColor: BORDE, color: TEXTO }}
        />
      </div>
    </div>
  )

  return (
    <MarcoAcceso titulo="Crea una nueva contraseña" subtitulo="Elige una contraseña que no uses en otros servicios.">
      <form onSubmit={guardar} noValidate className="space-y-4">
        {campo('nueva-password', 'Nueva contraseña', password, setPassword, 'new-password')}
        {campo('confirmar-password', 'Repite la contraseña', confirmacion, setConfirmacion, 'new-password')}

        <button
          type="button"
          onClick={() => setVerPassword((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: TEXTO_SUAVE }}
        >
          {verPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {verPassword ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
        </button>

        {error && (
          <MensajeAcceso tipo="error" icono={AlertTriangle}>
            {error}
          </MensajeAcceso>
        )}

        <button type="submit" disabled={guardando} className={CLASE_BOTON_PRINCIPAL} style={{ backgroundColor: VERDE }}>
          {guardando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            'Guardar nueva contraseña'
          )}
        </button>
      </form>
    </MarcoAcceso>
  )
}
