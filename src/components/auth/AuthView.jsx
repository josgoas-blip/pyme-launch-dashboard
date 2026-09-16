import { useState } from 'react'
import {
  Mail,
  Lock,
  Loader2,
  AlertTriangle,
  MailCheck,
  Eye,
  EyeOff,
  User,
  Users,
  Building2,
  IdCard,
  ArrowLeft,
} from 'lucide-react'
import {
  iniciarSesion,
  registrarse,
  solicitarRecuperacion,
  validarCredenciales,
  LONGITUD_MINIMA_PASSWORD,
} from '../../services/authService.js'
import {
  normalizarNif,
  SECTORES_SUGERIDOS,
  TAMANOS_EMPRESA,
  TAMANO_POR_DEFECTO,
} from '../../services/perfilEmpresaService.js'
import MarcoAcceso, {
  MensajeAcceso,
  VERDE,
  SUPERFICIE,
  BORDE,
  TEXTO,
  TEXTO_SUAVE,
  CLASE_INPUT,
  CLASE_ETIQUETA,
  CLASE_BOTON_PRINCIPAL,
  CLASE_ENLACE,
} from './MarcoAcceso.jsx'

/** Títulos de la cabecera según el modo. */
const CABECERAS = {
  login: {
    titulo: 'Bienvenido de nuevo',
    subtitulo: 'Accede a tu panel de control estratégico y financiero.',
  },
  registro: {
    titulo: 'Crea tu cuenta',
    subtitulo: 'Empieza tu diagnóstico de viabilidad en unos minutos.',
  },
  recuperar: {
    titulo: 'Recupera tu contraseña',
    subtitulo: 'Te enviaremos un enlace para crear una nueva.',
  },
}

/** Datos de empresa al abrir el formulario: vacíos salvo el tamaño. */
const EMPRESA_INICIAL = {
  nombre_empresa: '',
  actividad: '',
  sector: '',
  nif: '',
  tamano_empresa: TAMANO_POR_DEFECTO,
}

/**
 * Pantalla de acceso: inicio de sesión y creación de cuenta en el mismo
 * formulario, con un conmutador entre ambos modos.
 *
 * Es un único formulario y no dos pantallas porque los campos son los
 * mismos: duplicarlo obligaría a mantener dos veces la validación y los
 * mensajes de error.
 *
 * El tercer modo, `recuperar`, pide solo el correo y envía el enlace para
 * restablecer la contraseña. Se abre desde el enlace "¿Has olvidado tu
 * contraseña?" o directamente (`modoInicial`) cuando un enlace de
 * recuperación ha caducado y el usuario pide otro.
 *
 * @param {{ modoInicial?: 'login'|'registro'|'recuperar' }} props
 */
export default function AuthView({ modoInicial = 'login' }) {
  const [modo, setModo] = useState(modoInicial) // 'login' | 'registro' | 'recuperar'
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [empresa, setEmpresa] = useState(EMPRESA_INICIAL)
  const [verPassword, setVerPassword] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)

  const esRegistro = modo === 'registro'

  const actualizarEmpresa = (campo) => (e) => setEmpresa((d) => ({ ...d, [campo]: e.target.value }))

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
      ? await registrarse({ email, password, nombre, apellidos, empresa })
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

  const enviarRecuperacion = async (e) => {
    e.preventDefault()
    setError(null)
    setAviso(null)

    setEnviando(true)
    const resultado = await solicitarRecuperacion(email)
    setEnviando(false)

    if (!resultado.ok) {
      setError(resultado.motivo)
      return
    }

    setAviso('Te hemos enviado un enlace a tu correo para restablecer tu contraseña.')
  }

  const { titulo, subtitulo } = CABECERAS[modo] ?? CABECERAS.login

  // ── Recuperación de contraseña ──────────────────────────────────────
  if (modo === 'recuperar') {
    return (
      <MarcoAcceso titulo={titulo} subtitulo={subtitulo}>
        {aviso ? (
          // Tras enviar se retira el formulario: dejarlo invitaría a pulsar
          // otra vez y a toparse con el límite de correos de Supabase.
          <div className="space-y-4">
            <MensajeAcceso tipo="exito" icono={MailCheck}>
              {aviso}
            </MensajeAcceso>
            <p className="text-xs leading-relaxed" style={{ color: TEXTO_SUAVE }}>
              Si no lo ves en unos minutos, revisa la carpeta de correo no deseado. El enlace
              caduca pasado un tiempo y solo sirve una vez.
            </p>
            <button
              type="button"
              onClick={() => cambiarModo('login')}
              className={CLASE_BOTON_PRINCIPAL}
              style={{ backgroundColor: VERDE }}
            >
              Volver a iniciar sesión
            </button>
          </div>
        ) : (
          <form onSubmit={enviarRecuperacion} noValidate className="space-y-4">
            <p className="text-sm leading-relaxed" style={{ color: TEXTO_SUAVE }}>
              Escribe el correo con el que te registraste.
            </p>

            <div>
              <label htmlFor="recuperar-email" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                Correo electrónico
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: TEXTO_SUAVE }}
                  aria-hidden="true"
                />
                <input
                  id="recuperar-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={enviando}
                  placeholder="tu@empresa.com"
                  className={`${CLASE_INPUT} pl-9`}
                  style={{ borderColor: BORDE, color: TEXTO }}
                />
              </div>
            </div>

            {error && (
              <MensajeAcceso tipo="error" icono={AlertTriangle}>
                {error}
              </MensajeAcceso>
            )}

            <button type="submit" disabled={enviando} className={CLASE_BOTON_PRINCIPAL} style={{ backgroundColor: VERDE }}>
              {enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Enviando enlace…
                </>
              ) : (
                'Enviar enlace de recuperación'
              )}
            </button>

            <button
              type="button"
              onClick={() => cambiarModo('login')}
              disabled={enviando}
              className={`${CLASE_ENLACE} mx-auto flex items-center gap-1.5 text-xs`}
              style={{ color: VERDE }}
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Volver a iniciar sesión
            </button>
          </form>
        )}
      </MarcoAcceso>
    )
  }

  return (
    <MarcoAcceso titulo={titulo} subtitulo={subtitulo}>
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
          {esRegistro ? (
            <p className="mt-1.5 text-xs" style={{ color: TEXTO_SUAVE }}>
              Al menos {LONGITUD_MINIMA_PASSWORD} caracteres.
            </p>
          ) : (
            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => cambiarModo('recuperar')}
                disabled={enviando}
                className={`${CLASE_ENLACE} text-xs`}
                style={{ color: VERDE }}
              >
                ¿Has olvidado tu contraseña?
              </button>
            </div>
          )}
        </div>

        {/* Datos de la empresa, solo al crear cuenta. Van después de las
            credenciales: primero lo imprescindible para entrar, luego lo
            que completa la ficha. Son opcionales porque un proyecto en
            fase de idea puede no tener aún razón social ni NIF. */}
        {esRegistro && (
          <fieldset className="space-y-4 border-t pt-5" style={{ borderColor: BORDE }} disabled={enviando}>
            <legend className="float-left w-full">
              <span className="block text-sm font-bold" style={{ color: TEXTO }}>
                Datos de tu empresa
              </span>
              <span className="mt-0.5 block text-xs" style={{ color: TEXTO_SUAVE }}>
                Opcionales. Podrás completarlos o cambiarlos después desde Configuración.
              </span>
            </legend>

            <div className="clear-left">
              <label htmlFor="auth-empresa" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                Nombre comercial / Empresa
              </label>
              <div className="relative mt-1.5">
                <Building2
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: TEXTO_SUAVE }}
                  aria-hidden="true"
                />
                <input
                  id="auth-empresa"
                  type="text"
                  value={empresa.nombre_empresa}
                  onChange={actualizarEmpresa('nombre_empresa')}
                  autoComplete="organization"
                  maxLength={120}
                  placeholder="Nombre de tu empresa o proyecto"
                  className={`${CLASE_INPUT} pl-9`}
                  style={{ borderColor: BORDE, color: TEXTO }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="auth-actividad" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                Actividad / Descripción
              </label>
              <textarea
                id="auth-actividad"
                value={empresa.actividad}
                onChange={actualizarEmpresa('actividad')}
                rows={2}
                maxLength={280}
                placeholder="A qué se dedica tu negocio"
                className={`${CLASE_INPUT} mt-1.5 resize-none pl-3`}
                style={{ borderColor: BORDE, color: TEXTO }}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="auth-sector" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                  Sector
                </label>
                <input
                  id="auth-sector"
                  type="text"
                  list="auth-sectores"
                  value={empresa.sector}
                  onChange={actualizarEmpresa('sector')}
                  maxLength={80}
                  placeholder="Elige uno o escríbelo"
                  className={`${CLASE_INPUT} mt-1.5 pl-3`}
                  style={{ borderColor: BORDE, color: TEXTO }}
                />
                <datalist id="auth-sectores">
                  {SECTORES_SUGERIDOS.map((sector) => (
                    <option key={sector} value={sector} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="auth-nif" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                  NIF / CIF
                </label>
                <div className="relative mt-1.5">
                  <IdCard
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                    style={{ color: TEXTO_SUAVE }}
                    aria-hidden="true"
                  />
                  <input
                    id="auth-nif"
                    type="text"
                    value={empresa.nif}
                    // Se normaliza al escribir: el usuario ve ya el valor
                    // tal como quedará guardado.
                    onChange={(e) => setEmpresa((d) => ({ ...d, nif: normalizarNif(e.target.value) }))}
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={20}
                    placeholder="B12345678"
                    className={`${CLASE_INPUT} pl-9`}
                    style={{ borderColor: BORDE, color: TEXTO }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="auth-tamano" className={CLASE_ETIQUETA} style={{ color: TEXTO_SUAVE }}>
                Tamaño de la empresa
              </label>
              <select
                id="auth-tamano"
                value={empresa.tamano_empresa}
                onChange={actualizarEmpresa('tamano_empresa')}
                className={`${CLASE_INPUT} mt-1.5 bg-white pl-3`}
                style={{ borderColor: BORDE, color: TEXTO }}
              >
                {TAMANOS_EMPRESA.map((tamano) => (
                  <option key={tamano} value={tamano}>
                    {tamano}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>
        )}

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
    </MarcoAcceso>
  )
}
