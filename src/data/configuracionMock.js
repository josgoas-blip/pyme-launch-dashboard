/**
 * Datos simulados (mock) de la pestaña "Configuración" — Pyme Launch Dashboard.
 * Tipado según src/types/configuracion.js.
 */

/**
 * 1. Perfil de la PYME / cliente + equipo de mentoría asignado.
 * @type {import('../types/configuracion.js').PerfilCliente}
 */
export const perfilCliente = {
  nombreEmpresa: 'Asequible Translation S.L.',
  nif: 'B87654321',
  sector: 'Servicios de traducción e interpretación',
  categoriaSector: 'B2B Servicios',
  tamano: '1-10 empleados',
  contactoNombre: 'Ana López',
  contactoEmail: 'asequible.translation@gmail.com',
}

/**
 * 2. Preferencias de Acompañamiento & Canales (valores por defecto, editables en UI).
 * @type {import('../types/configuracion.js').PreferenciasContacto}
 */
export const preferenciasContacto = {
  franjaHoraria: 'Mañanas (9:00 - 14:00)',
  canalPreferido: 'WhatsApp',
  frecuenciaMentoria: 'Quincenal',
}

/**
 * 3. Estado de la suscripción.
 * @type {import('../types/configuracion.js').Suscripcion}
 */
export const suscripcion = {
  plan: 'Pyme Launch Total',
  estado: 'Activa',
  fechaRenovacion: '15/09/2026',
  precioMensual: 490,
}

export default { perfilCliente, preferenciasContacto, suscripcion }
