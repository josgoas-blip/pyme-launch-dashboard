/**
 * Datos simulados (mock) de la pestaña "Configuración" — Pyme Launch Dashboard.
 * Tipado según src/types/configuracion.js.
 */

/**
 * 1. Preferencias de Acompañamiento & Canales (valores por defecto, editables en UI).
 * @type {import('../types/configuracion.js').PreferenciasContacto}
 */
export const preferenciasContacto = {
  franjaHoraria: 'Mañanas (9:00 - 14:00)',
  canalPreferido: 'WhatsApp',
  frecuenciaMentoria: 'Quincenal',
}

/**
 * 2. Estado de la suscripción.
 * @type {import('../types/configuracion.js').Suscripcion}
 */
export const suscripcion = {
  plan: 'Pyme Launch Total',
  estado: 'Activa',
  fechaRenovacion: '15/09/2026',
  precioMensual: 490,
}

export default { preferenciasContacto, suscripcion }
