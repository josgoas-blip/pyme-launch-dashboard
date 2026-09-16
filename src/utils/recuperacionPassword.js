/**
 * Detección de la llegada desde el correo de recuperación de contraseña.
 *
 * El enlace del correo pasa por Supabase y vuelve a la aplicación en
 * `/reset-password` con los tokens en el fragmento (`#access_token=…
 * &type=recovery`) o, si el enlace ya no vale, con el error
 * (`#error=access_denied&error_code=otp_expired…`).
 *
 * Por qué se lee la URL al cargar el módulo y no al pintar la vista:
 * el cliente de Supabase (`detectSessionInUrl`) consume ese fragmento para
 * abrir la sesión y después lo borra de la barra de direcciones. Si la
 * vista lo buscara más tarde, podría encontrarlo ya vacío y no saber si
 * llegó por un enlace válido o caducado. La evaluación de los módulos es
 * síncrona y Supabase solo limpia la URL tras una petición de red, así que
 * aquí siempre se ve la URL original.
 *
 * Es puro salvo por esa lectura inicial y `salirDeRutaRecuperacion`.
 */

/** Ruta pública a la que apunta el enlace del correo. */
export const RUTA_RESET_PASSWORD = '/reset-password'

const RUTA_AL_CARGAR = typeof window !== 'undefined' ? window.location.pathname : ''
const HASH_AL_CARGAR = typeof window !== 'undefined' ? window.location.hash : ''

/**
 * Datos de autenticación que viajan en el fragmento de la URL.
 *
 * @param {string} hash - `window.location.hash`, con o sin `#`.
 * @returns {{ tipo: string|null, codigoError: string|null, descripcionError: string|null }}
 */
export function parsearFragmentoAuth(hash) {
  const parametros = new URLSearchParams(String(hash ?? '').replace(/^#/, ''))
  return {
    tipo: parametros.get('type'),
    codigoError: parametros.get('error_code') ?? parametros.get('error'),
    descripcionError: parametros.get('error_description'),
  }
}

/**
 * ¿La ruta es la de restablecer contraseña? Tolera la barra final.
 *
 * @param {string} ruta
 * @returns {boolean}
 */
export function esRutaRecuperacion(ruta) {
  return String(ruta ?? '').replace(/\/+$/, '') === RUTA_RESET_PASSWORD
}

/**
 * ¿Se abrió la aplicación desde el enlace de recuperación?
 *
 * Basta con cualquiera de las dos señales: la ruta, o el `type=recovery`
 * del fragmento. La segunda cubre el caso de que la dirección de
 * redirección no esté autorizada en Supabase y el usuario aterrice en la
 * raíz con los tokens: sin ella entraría directo al panel sin poder
 * cambiar la contraseña que ha olvidado.
 *
 * @returns {boolean}
 */
export function llegoDesdeEnlaceRecuperacion() {
  return esRutaRecuperacion(RUTA_AL_CARGAR) || parsearFragmentoAuth(HASH_AL_CARGAR).tipo === 'recovery'
}

/**
 * Mensaje para el usuario si el enlace llegó con error.
 *
 * @param {string} [hash] - Por defecto, el fragmento con el que se cargó la página.
 * @returns {string|null} `null` si el enlace no trae error.
 */
export function errorDelEnlaceRecuperacion(hash = HASH_AL_CARGAR) {
  const { codigoError, descripcionError } = parsearFragmentoAuth(hash)
  if (!codigoError && !descripcionError) return null

  const clave = `${codigoError ?? ''} ${descripcionError ?? ''}`.toLowerCase()
  if (clave.includes('expired') || clave.includes('invalid')) {
    return 'El enlace de recuperación ha caducado o ya se ha usado. Solicita uno nuevo.'
  }
  return 'No se ha podido validar el enlace de recuperación. Solicita uno nuevo.'
}

/**
 * Deja la barra de direcciones en la raíz sin recargar la página.
 *
 * Se usa al terminar: si el usuario recargara con `/reset-password` aún
 * en la URL, volvería a ver el formulario de cambio de contraseña.
 */
export function salirDeRutaRecuperacion() {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', '/')
}
