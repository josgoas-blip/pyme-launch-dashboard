/**
 * Tipos (JSDoc) de la pestaña "Configuración" — Pyme Launch Dashboard.
 * Contrato entre los mocks (src/data/configuracionMock.js) y los componentes
 * visuales de src/components/dashboard/.
 *
 * El perfil del emprendedor y el equipo de mentoría ya no se tipan aquí: llegan
 * de Supabase y los describen `FichaEmpresa` (src/services/perfilEmpresaService.js)
 * y `Mentor` (src/services/expedienteService.js).
 */

/**
 * Preferencias de Acompañamiento & Canales de contacto del emprendedor.
 * @typedef {Object} PreferenciasContacto
 * @property {'Mañanas (9:00 - 14:00)'|'Tardes (16:00 - 19:00)'|'Indiferente'} franjaHoraria
 * @property {'WhatsApp'|'Correo Electrónico'|'Llamada de Voz'} canalPreferido
 * @property {'Semanal'|'Quincenal'|'Mensual'} frecuenciaMentoria
 */

/**
 * Estado de la suscripción al SaaS.
 * @typedef {Object} Suscripcion
 * @property {string} plan
 * @property {'Activa'|'Pendiente de pago'|'Cancelada'} estado
 * @property {string} fechaRenovacion
 * @property {number} precioMensual - €/mes.
 */

export {}
