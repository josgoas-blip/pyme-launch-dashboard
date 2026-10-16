/**
 * Rutas públicas de la aplicación.
 *
 * No hay router: Vercel reescribe cualquier ruta a `index.html` y el
 * enrutado decide qué pintar. Aquí se normalizan las dos rutas con nombre
 * y se cambia la barra de direcciones sin recargar.
 *
 *   - `/login`: pantalla de acceso. Lleva en `?next=` a dónde volver.
 *   - `/dashboard`: panel. Admite `?id=` con el expediente de
 *     `Entrepreneur_diagnostics` que se quiere ver.
 */

export const RUTA_LOGIN = '/login'
export const RUTA_DASHBOARD = '/dashboard'

const PARAM_DESTINO = 'next'

/** Forma razonable de un id de fila (uuid o numérico). */
const ID_VALIDO = /^[A-Za-z0-9-]{1,64}$/

/** @returns {{ pathname: string, search: string }} */
export function leerRuta() {
  if (typeof window === 'undefined') return { pathname: '/', search: '' }
  return { pathname: window.location.pathname, search: window.location.search }
}

/** ¿`pathname` es `ruta`? Tolera la barra final. */
export function esRuta(pathname, ruta) {
  return (String(pathname ?? '').replace(/\/+$/, '') || '/') === ruta
}

/**
 * Cambia la URL sin recargar ni añadir entrada al historial.
 *
 * @param {string} url - Ruta relativa con su query.
 * @returns {{ pathname: string, search: string }} La ruta resultante.
 */
export function reemplazarRuta(url) {
  if (typeof window !== 'undefined') window.history.replaceState(null, '', url)
  return leerRuta()
}

/** `?id=` del expediente, o `null` si falta o no tiene forma de id. */
export function idExpedienteDeRuta({ pathname, search }) {
  if (!esRuta(pathname, RUTA_DASHBOARD)) return null
  const id = new URLSearchParams(search).get('id')?.trim() ?? ''
  return ID_VALIDO.test(id) ? id : null
}

/**
 * URL de `/login` que recuerda la ruta de origen si era el panel, para
 * volver a ella (con su `?id=`) tras iniciar sesión.
 */
export function urlLogin({ pathname, search }) {
  if (!esRuta(pathname, RUTA_DASHBOARD)) return RUTA_LOGIN
  const destino = `${RUTA_DASHBOARD}${search}`
  return `${RUTA_LOGIN}?${PARAM_DESTINO}=${encodeURIComponent(destino)}`
}

/**
 * A dónde ir tras iniciar sesión: el `?next=` si apunta al panel y, si no,
 * el panel a secas. Solo se aceptan destinos del panel para que el
 * parámetro no sirva para redirigir a otro sitio.
 */
export function destinoTrasLogin({ search }) {
  const destino = new URLSearchParams(search).get(PARAM_DESTINO) ?? ''
  const [ruta] = destino.split('?')
  return destino.startsWith('/') && esRuta(ruta, RUTA_DASHBOARD) ? destino : RUTA_DASHBOARD
}
