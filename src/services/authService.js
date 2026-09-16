/**
 * Servicio de autenticación (Supabase Auth, email + contraseña).
 *
 * Igual que el resto de servicios del proyecto, ninguna función lanza:
 * todas devuelven un resultado describiendo qué ha pasado, para que un
 * fallo de red no deje el formulario colgado.
 *
 * Los mensajes de error de Supabase llegan en inglés y con jerga de API
 * ("Invalid login credentials"). Se traducen aquí, en un único sitio, para
 * que el formulario solo tenga que pintarlos.
 */
import { supabase, haySupabase } from '../lib/supabaseClient.js'
import { CAMPOS_EDITABLES, normalizarCambiosPerfil } from './perfilEmpresaService.js'

/** Longitud mínima que exige Supabase por defecto. */
export const LONGITUD_MINIMA_PASSWORD = 6

/**
 * Traducción de los errores habituales de Supabase Auth.
 *
 * Se compara por fragmento y en minúsculas porque el texto exacto ha
 * cambiado entre versiones de la API; buscar la coincidencia completa
 * dejaría al usuario ante un mensaje en inglés en cuanto Supabase reescriba
 * una cadena.
 */
const TRADUCCIONES = [
  {
    fragmento: 'invalid login credentials',
    mensaje: 'El correo o la contraseña no son correctos.',
  },
  {
    fragmento: 'email not confirmed',
    mensaje: 'Aún no has confirmado tu correo. Revisa tu bandeja de entrada.',
  },
  {
    fragmento: 'user already registered',
    mensaje: 'Ya existe una cuenta con este correo. Inicia sesión.',
  },
  {
    fragmento: 'password should be at least',
    mensaje: `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`,
  },
  {
    fragmento: 'unable to validate email address',
    mensaje: 'El correo no tiene un formato válido.',
  },
  {
    fragmento: 'email rate limit exceeded',
    mensaje: 'Demasiados intentos. Espera unos minutos antes de volver a probar.',
  },
  {
    fragmento: 'for security purposes',
    mensaje: 'Demasiados intentos seguidos. Espera unos segundos e inténtalo de nuevo.',
  },
  {
    fragmento: 'signups not allowed',
    mensaje: 'El registro está desactivado en este momento. Contacta con el equipo.',
  },
  {
    fragmento: 'failed to fetch',
    mensaje: 'No hay conexión con el servidor. Comprueba tu red e inténtalo de nuevo.',
  },
  {
    fragmento: 'should be different from the old password',
    mensaje: 'La nueva contraseña debe ser distinta de la anterior.',
  },
  {
    fragmento: 'auth session missing',
    mensaje: 'El enlace de recuperación ha caducado o ya se ha usado. Solicita uno nuevo.',
  },
  {
    fragmento: 'weak',
    mensaje: 'Esa contraseña es demasiado débil o muy común. Elige otra.',
  },
]

/**
 * Dirección a la que Supabase envía al usuario desde el correo de
 * recuperación.
 *
 * Se puede cambiar por entorno (regla 3 de CLAUDE.md) para apuntar a otro
 * despliegue. Sea cual sea, debe figurar en Supabase → Authentication →
 * URL Configuration → Redirect URLs: si no, Supabase ignora `redirectTo`
 * y manda al usuario a la Site URL.
 */
export const URL_RESET_PASSWORD =
  import.meta.env.VITE_URL_RESET_PASSWORD || 'https://demo.pymelaunch.com/reset-password'

/**
 * Convierte un error de Supabase en un mensaje legible en español.
 *
 * @param {{ message?: string }|null} error
 * @returns {string}
 */
export function traducirErrorAuth(error) {
  const original = String(error?.message ?? '').toLowerCase()
  if (!original) return 'No se ha podido completar la operación. Inténtalo de nuevo.'

  const conocido = TRADUCCIONES.find((t) => original.includes(t.fragmento))
  if (conocido) return conocido.mensaje

  // Sin traducción conocida se devuelve el original: es más útil para
  // depurar que un "error desconocido" genérico.
  return error.message
}

/**
 * Validación local antes de llamar a la API.
 *
 * Ahorra un viaje de red en los errores más frecuentes y responde al
 * instante, que es lo que el usuario espera de un formulario.
 *
 * @param {{ email: string, password: string }} credenciales
 * @returns {string|null} Mensaje de error, o `null` si es válido.
 */
export function validarCredenciales({ email, password, nombre, apellidos, esRegistro = false }) {
  // Nombre y apellidos se validan primero porque son los primeros campos
  // del formulario: señalar un error de correo por encima de un nombre
  // vacío haría al usuario corregir en orden inverso al que lee.
  if (esRegistro) {
    if (!nombre?.trim()) return 'Escribe tu nombre.'
    if (!apellidos?.trim()) return 'Escribe tus apellidos.'
  }
  if (!email?.trim()) return 'Escribe tu correo electrónico.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'El correo no tiene un formato válido.'
  if (!password) return 'Escribe tu contraseña.'
  if (password.length < LONGITUD_MINIMA_PASSWORD) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`
  }
  return null
}

/**
 * Nombre completo legible a partir de las dos fuentes posibles.
 *
 * Prioridad: la fila de `profiles`, que es el dato editable del producto, y
 * después `user_metadata`, que es lo que quedó grabado en el registro. Si
 * no hubiera ninguno se devuelve el correo: es preferible a un saludo
 * vacío o a un "undefined".
 *
 * @param {{ nombre?: string, apellidos?: string }|null} perfil
 * @param {{ user_metadata?: Record<string, unknown>, email?: string }|null} usuario
 * @returns {string}
 */
export function componerNombreCompleto(perfil, usuario) {
  const meta = usuario?.user_metadata ?? {}

  const nombre = (perfil?.nombre ?? meta.nombre ?? '').trim()
  const apellidos = (perfil?.apellidos ?? meta.apellidos ?? '').trim()

  const completo = [nombre, apellidos].filter(Boolean).join(' ')
  return completo || usuario?.email || 'Invitado'
}

/**
 * Perfil del usuario en la tabla `profiles`.
 *
 * Devuelve `null` ante cualquier problema —tabla sin fila, RLS, red— para
 * que quien lo llame caiga en `user_metadata` sin tener que distinguir
 * entre "no hay perfil" y "no se pudo leer".
 *
 * @param {string|null} userId
 * @returns {Promise<{ nombre: string|null, apellidos: string|null, email: string|null }|null>}
 */
export async function leerPerfil(userId) {
  if (!haySupabase || !userId) return null

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, apellidos, email')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

/**
 * Inicia sesión con correo y contraseña.
 *
 * @param {{ email: string, password: string }} credenciales
 * @returns {Promise<{ ok: boolean, sesion?: object, motivo?: string }>}
 */
export async function iniciarSesion({ email, password }) {
  if (!haySupabase) return { ok: false, motivo: 'La autenticación no está configurada en esta instalación.' }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) return { ok: false, motivo: traducirErrorAuth(error) }
    return { ok: true, sesion: data.session }
  } catch (e) {
    return { ok: false, motivo: traducirErrorAuth(e) }
  }
}

/**
 * Crea una cuenta nueva.
 *
 * Si el proyecto exige confirmar el correo, Supabase responde sin sesión:
 * se avisa de ello en vez de dejar al usuario esperando un panel que no va
 * a aparecer.
 *
 * Los datos de empresa son opcionales: se piden aquí para que la ficha
 * salga completa desde el primer inicio de sesión, pero un emprendedor en
 * fase de idea puede no tener todavía razón social ni NIF, y exigirlos le
 * cerraría la puerta. Lo que deje vacío se envía como `null`.
 *
 * @param {{
 *   email: string,
 *   password: string,
 *   nombre: string,
 *   apellidos: string,
 *   empresa?: {
 *     nombre_empresa?: string,
 *     actividad?: string,
 *     sector?: string,
 *     nif?: string,
 *     tamano_empresa?: string,
 *   },
 * }} datos
 * @returns {Promise<{ ok: boolean, sesion?: object, requiereConfirmacion?: boolean, motivo?: string }>}
 */
export async function registrarse({ email, password, nombre, apellidos, empresa = {} }) {
  if (!haySupabase) return { ok: false, motivo: 'La autenticación no está configurada en esta instalación.' }

  // Mismas reglas que la edición de la ficha (recorte, NIF en mayúsculas
  // sin espacios, longitudes máximas), para que un dato no quede distinto
  // según se escribiera al registrarse o después.
  const vacia = Object.fromEntries(CAMPOS_EDITABLES.map((campo) => [campo, '']))
  const limpia = normalizarCambiosPerfil({ ...vacia, ...empresa })
  if (!limpia.ok) return { ok: false, motivo: limpia.motivo }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      // Viajan en `options.data`, que Supabase guarda en
      // `raw_user_meta_data`, no en `profiles`. Por eso la ficha lee también
      // de ahí: así los datos están disponibles desde el primer render
      // aunque la fila de `profiles` aún no exista, o el disparador que la
      // rellena no copie estos campos.
      options: {
        data: {
          nombre: nombre?.trim() ?? '',
          apellidos: apellidos?.trim() ?? '',
          ...limpia.datos,
        },
      },
    })

    if (error) return { ok: false, motivo: traducirErrorAuth(error) }

    return {
      ok: true,
      sesion: data.session,
      requiereConfirmacion: !data.session,
    }
  } catch (e) {
    return { ok: false, motivo: traducirErrorAuth(e) }
  }
}

/** Formato mínimo de correo, el mismo que usa el formulario de acceso. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Envía el correo con el enlace para restablecer la contraseña.
 *
 * Supabase responde igual exista o no la cuenta —no revela qué correos
 * están registrados—, así que un éxito aquí significa "solicitud
 * aceptada", no "la cuenta existe".
 *
 * @param {string} email
 * @returns {Promise<{ ok: boolean, motivo?: string }>}
 */
export async function solicitarRecuperacion(email) {
  if (!haySupabase) return { ok: false, motivo: 'La autenticación no está configurada en esta instalación.' }

  const limpio = email?.trim() ?? ''
  if (!limpio) return { ok: false, motivo: 'Escribe tu correo electrónico.' }
  if (!FORMATO_EMAIL.test(limpio)) return { ok: false, motivo: 'El correo no tiene un formato válido.' }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(limpio, { redirectTo: URL_RESET_PASSWORD })
    if (error) return { ok: false, motivo: traducirErrorAuth(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, motivo: traducirErrorAuth(e) }
  }
}

/**
 * Comprueba la nueva contraseña antes de enviarla.
 *
 * @param {string} password
 * @param {string} confirmacion
 * @returns {string|null} Mensaje de error, o `null` si es válida.
 */
export function validarNuevaPassword(password, confirmacion) {
  if (!password) return 'Escribe tu nueva contraseña.'
  if (password.length < LONGITUD_MINIMA_PASSWORD) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`
  }
  if (password !== confirmacion) return 'Las dos contraseñas no coinciden.'
  return null
}

/**
 * Guarda la nueva contraseña del usuario.
 *
 * Funciona con la sesión que Supabase abre al entrar por el enlace de
 * recuperación. Sin esa sesión (enlace caducado o ya usado) Supabase
 * responde "Auth session missing", que se traduce a un mensaje útil.
 *
 * @param {string} password
 * @returns {Promise<{ ok: boolean, motivo?: string }>}
 */
export async function actualizarPassword(password) {
  if (!haySupabase) return { ok: false, motivo: 'La autenticación no está configurada en esta instalación.' }

  try {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { ok: false, motivo: traducirErrorAuth(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, motivo: traducirErrorAuth(e) }
  }
}

/**
 * Cierra la sesión activa.
 *
 * @returns {Promise<{ ok: boolean, motivo?: string }>}
 */
export async function cerrarSesion() {
  if (!haySupabase) return { ok: true }

  try {
    const { error } = await supabase.auth.signOut()
    if (error) return { ok: false, motivo: traducirErrorAuth(error) }
    return { ok: true }
  } catch (e) {
    return { ok: false, motivo: traducirErrorAuth(e) }
  }
}
