/**
 * Persistencia local de la cita de mentoría.
 *
 * La fuente de verdad de la cita es `respuestas.cita` en Supabase, que
 * escribe n8n tras aprobar la solicitud. Pero entre que el usuario pulsa
 * "Solicitar" y n8n confirma pasan horas, y en ese hueco el panel tiene
 * que recordar que ya hay una solicitud en curso: si no, al recargar
 * volvería a ofrecer el formulario y el usuario pediría dos sesiones.
 *
 * Además, el visitante anónimo no puede leer su propia fila (la política
 * RLS de `diagnosticos` permite insertar pero no seleccionar), así que hoy
 * esta copia local es lo único que sostiene los estados 2 y 3.
 *
 * Mismo trato defensivo que el resto de la persistencia: nada lanza, se
 * valida antes de confiar en lo guardado y un contenido corrupto se
 * descarta en vez de romper la vista.
 */

/** Clave versionada, para poder ignorar formatos antiguos sin romper nada. */
export const CLAVE_CITA = 'pyme-launch:cita:v1'

/** Estados posibles de la cita, en orden de avance. */
export const ESTADOS_CITA = ['sin_solicitar', 'pendiente_aprobacion', 'solicitada', 'sesion_agendada']

/**
 * ¿Está disponible el almacenamiento? En navegación privada el objeto
 * existe pero `setItem` lanza, así que hay que intentar escribir.
 */
function hayAlmacenamiento() {
  try {
    const sonda = '__pyme_launch_sonda_cita__'
    localStorage.setItem(sonda, '1')
    localStorage.removeItem(sonda)
    return true
  } catch {
    return false
  }
}

/**
 * ¿El objeto recuperado describe una cita utilizable?
 *
 * Se exige un estado reconocido. Sin él la tarjeta no sabría qué pintar, y
 * es preferible volver al formulario que mostrar una tarjeta en blanco.
 *
 * @param {unknown} valor
 * @returns {boolean}
 */
export function esCitaValida(valor) {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return false
  return ESTADOS_CITA.includes(valor.estado)
}

/**
 * Cita guardada en este navegador.
 *
 * @returns {{ estado: string, fecha_propuesta?: string, meet_url?: string, solicitadaEn?: string } | null}
 */
export function cargarCitaLocal() {
  if (!hayAlmacenamiento()) return null

  try {
    const crudo = localStorage.getItem(CLAVE_CITA)
    if (!crudo) return null

    const analizado = JSON.parse(crudo)
    if (!esCitaValida(analizado)) {
      borrarCitaLocal()
      return null
    }
    return analizado
  } catch {
    // JSON malformado o almacenamiento bloqueado.
    borrarCitaLocal()
    return null
  }
}

/**
 * Guarda el estado de la cita.
 *
 * @param {{ estado: string }} cita
 * @returns {boolean} `true` si quedó guardada.
 */
export function guardarCitaLocal(cita) {
  if (!esCitaValida(cita) || !hayAlmacenamiento()) return false

  try {
    localStorage.setItem(CLAVE_CITA, JSON.stringify(cita))
    return true
  } catch {
    return false
  }
}

/** Borra la cita guardada. Lo usa el reinicio del diagnóstico. */
export function borrarCitaLocal() {
  try {
    localStorage.removeItem(CLAVE_CITA)
    return true
  } catch {
    return false
  }
}
