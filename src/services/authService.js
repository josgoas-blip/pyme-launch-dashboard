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
]

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
export function validarCredenciales({ email, password }) {
  if (!email?.trim()) return 'Escribe tu correo electrónico.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'El correo no tiene un formato válido.'
  if (!password) return 'Escribe tu contraseña.'
  if (password.length < LONGITUD_MINIMA_PASSWORD) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`
  }
  return null
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
 * @param {{ email: string, password: string }} credenciales
 * @returns {Promise<{ ok: boolean, sesion?: object, requiereConfirmacion?: boolean, motivo?: string }>}
 */
export async function registrarse({ email, password }) {
  if (!haySupabase) return { ok: false, motivo: 'La autenticación no está configurada en esta instalación.' }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
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
