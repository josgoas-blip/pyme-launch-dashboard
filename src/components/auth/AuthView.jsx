import { useState } from 'react'
import { Mail, Lock, Loader2, AlertTriangle, MailCheck, Eye, EyeOff, User, Users } from 'lucide-react'
import {
  iniciarSesion,
  registrarse,
  validarCredenciales,
  LONGITUD_MINIMA_PASSWORD,
} from '../../services/authService.js'

/* Paleta corporativa, en literales por el mismo motivo que el wizard: esta
   pantalla se pinta antes que nada y no puede quedarse sin contraste si un
   navegador reinterpreta los tokens del tema. */
const VERDE = '#1B4D3E'
const SUPERFICIE = '#FAF9F5'
const BORDE = '#E0DCD3'
const TEXTO = '#1F2937'
const TEXTO_SUAVE = '#4B5563'

/**
 * Pantalla de acceso: inicio de sesión y creación de cuenta en el mismo
 * formulario, con un conmutador entre ambos modos.
 *
 * Es un único formulario y no dos pantallas porque los campos son los
 * mismos: duplicarlo obligaría a mantener dos veces la validación y los
 * mensajes de error.
 */
export default function AuthView() {
  const [modo, setModo] = useState('login') // 'login' | 'registro'
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const esRegistro = modo === 'registro'

  const cambiarModo = (nuevo) => {
    setModo(nuevo)
    // Los mensajes pertenecen al intento anterior: arrastrarlos al otro
    // modo confundiría ("ya existe una cuenta" bajo el formulario de login).
    setError(null)
    setAviso(null)
  }

  const enviar = async (e) => {
    e.preventDefault()
    setError(null)
    setAviso(null)

    // Validación local primero: responde al instante y ahorra el viaje.
    const problema = validarCredenciales({ email, password, nombre, apellidos, esRegistro })
    if (problema) {
      setError(problema)
      return
    }

    setEnviando(true)
    const resultado = esRegistro
      ? await registrarse({ email, password, nombre, apellidos })
      : await iniciarSesion({ email, password })
    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.motivo)
      return
    }

    if (resultado.requiereConfirmacion) {
      // Sin sesión no hay redirección posible: hay que decirlo, o el
      // usuario se queda esperando un panel que no va a aparecer.
      setAviso(
        'Cuenta creada. Te hemos enviado un correo de confirmación: ábrelo para activar tu acceso.',
      )
      setPassword('')
      return
    }

    // Con sesión, `onAuthStateChange` actualiza el contexto y App decide a
    // dónde llevar al usuario. Aquí no hace falta navegar a mano.
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10" style={{ backgroundColor: SUPERFICIE }}>
      <div className="w-full max-w-md">
        {/* Marca */}
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo-pymelaunch.png" alt="Pyme Launch" className="h-10 w-auto object-contain" />
          <h1 className="mt-4 text-2xl font-bold" style={{ color: TEXTO }}>
            {esRegistro ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: TEXTO_SUAVE }}>
            {esRegistro
              ? 'Empieza tu diagnóstico de viabilidad en unos minutos.'
              : 'Accede a tu panel de control estratégico y financiero.'}
          </p>
        </div>

        <div
          className="rounded-xl border p-6 shadow-sm"
          style={{ backgroundColor: '#FFFFFF', borderColor: BORDE }}
        >
          {/* Conmutador de modo */}
          <div
            role="tablist"
            aria-label="Modo de acceso"
            className="mb-6 flex rounded-lg p-1"
            style={{ backgroundColor: SUPERFICIE }}
          >
            {[
              { id: 'login', etiqueta: 'Iniciar sesión' },
              { id: 'registro', etiqueta: 'Crear cuenta' },
            ].map((opcion) => {
              const activo = modo === opcion.id
              return (
                <button
                  key={opcion.id}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => cambiarModo(opcion.id)}
                  className="flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60"
                  style={
                    activo
                      ? { backgroundColor: VERDE, color: '#FFFFFF' }
                      : { color: TEXTO_SUAVE }
                  }
                >
                  {opcion.etiqueta}
                </button>
              )
            })}
          </div>

          <form onSubmit={enviar} noValidate className="space-y-4">
            {/* Nombre y apellidos solo al crear cuenta: en el inicio de
                sesión sobran y alargarían el formulario sin aportar nada. */}
            {esRegistro && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="auth-nombre" className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXTO_SUAVE }}>
                    Nombre
                  </label>
                  <div className="relative mt-1.5">
                    <User
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: TEXTO_SUAVE }}
                      aria-hidden="true"
                    />
                    <input
                      id="auth-nombre"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      autoComplete="given-name"
                      disabled={enviando}
                      placeholder="Ana"
                      className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#1B4D3E] disabled:opacity-60"
                      style={{ borderColor: BORDE, color: TEXTO }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-apellidos" className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXTO_SUAVE }}>
                    Apellidos
                  </label>
                  <div className="relative mt-1.5">
                    <Users
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                      style={{ color: TEXTO_SUAVE }}
                      aria-hidden="true"
                    />
                    <input
                      id="auth-apellidos"
                      type="text"
                      value={apellidos}
                      onChange={(e) => setApellidos(e.target.value)}
                      autoComplete="family-name"
                      disabled={enviando}
                      placeholder="López García"
                      className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#1B4D3E] disabled:opacity-60"
                      style={{ borderColor: BORDE, color: TEXTO }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXTO_SUAVE }}>
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: TEXTO_SUAVE }}
                  aria-hidden="true"
                />
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={enviando}
                  placeholder="tu@empresa.com"
                  className="w-full rounded-lg border py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#1B4D3E] disabled:opacity-60"
                  style={{ borderColor: BORDE, color: TEXTO }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-password" className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEXTO_SUAVE }}>
                Contraseña
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: TEXTO_SUAVE }}
                  aria-hidden="true"
                />
                <input
                  id="auth-password"
                  type={verPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={esRegistro ? 'new-password' : 'current-password'}
                  disabled={enviando}
                  placeholder={esRegistro ? `Mínimo ${LONGITUD_MINIMA_PASSWORD} caracteres` : '••••••••'}
                  className="w-full rounded-lg border py-2.5 pl-9 pr-10 text-sm outline-none transition-colors focus:border-[#1B4D3E] disabled:opacity-60"
                  style={{ borderColor: BORDE, color: TEXTO }}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60"
                  style={{ color: TEXTO_SUAVE }}
                >
                  {verPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {esRegistro && (
                <p className="mt-1.5 text-xs" style={{ color: TEXTO_SUAVE }}>
                  Al menos {LONGITUD_MINIMA_PASSWORD} caracteres.
                </p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold leading-snug"
                style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', color: '#B91C1C' }}
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            {aviso && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold leading-snug"
                style={{ borderColor: `${VERDE}55`, backgroundColor: '#EBF3EF', color: VERDE }}
              >
                <MailCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ backgroundColor: VERDE }}
            >
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {esRegistro ? 'Creando cuenta…' : 'Accediendo…'}
                </>
              ) : esRegistro ? (
                'Crear cuenta'
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: TEXTO_SUAVE }}>
            {esRegistro ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => cambiarModo(esRegistro ? 'login' : 'registro')}
              className="font-bold underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E]/60"
              style={{ color: VERDE }}
            >
              {esRegistro ? 'Inicia sesión' : 'Créala aquí'}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
          Prediagnóstico asistido por IA. No constituye certificación de viabilidad, garantía de
          financiación ni asesoramiento jurídico, fiscal o financiero.
        </p>
      </div>
    </div>
  )
}
